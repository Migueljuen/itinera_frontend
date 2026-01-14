// hooks/useFoodStopsAlongRoute.ts

import { ItineraryItem } from "@/types/itineraryDetails";
import * as Location from "expo-location";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

// Types
export interface Coordinate {
    latitude: number;
    longitude: number;
}

export interface FoodStop {
    id: string;
    name: string;
    type: "restaurant" | "cafe" | "fast_food" | "food_court" | "bakery" | "bar";
    cuisine?: string;
    latitude: number;
    longitude: number;
    address?: string;
    openingHours?: string;
}

export interface RouteWithFoodStops {
    polyline: Coordinate[];
    foodStops: FoodStop[];
    origin: Coordinate;
    destination: Coordinate;
    waypoints: Coordinate[];
}

// OpenRouteService API key - replace with your env variable setup
const ORS_API_KEY = process.env.EXPO_PUBLIC_OPENROUTE_API_KEY || "";

/**
 * Decode OpenRouteService polyline (uses Google's polyline encoding)
 */
const decodePolyline = (encoded: string): Coordinate[] => {
    const coordinates: Coordinate[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
        let shift = 0;
        let result = 0;
        let byte: number;

        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
        lat += deltaLat;

        shift = 0;
        result = 0;

        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
        lng += deltaLng;

        coordinates.push({
            latitude: lat / 1e5,
            longitude: lng / 1e5,
        });
    }

    return coordinates;
};

/**
 * Sample points along the route at regular intervals
 * to use for querying food stops
 */
const sampleRoutePoints = (
    polyline: Coordinate[],
    maxPoints: number = 10
): Coordinate[] => {
    if (polyline.length <= maxPoints) return polyline;

    const sampled: Coordinate[] = [];
    const step = Math.floor(polyline.length / maxPoints);

    for (let i = 0; i < polyline.length; i += step) {
        sampled.push(polyline[i]);
        if (sampled.length >= maxPoints) break;
    }

    return sampled;
};

/**
 * Build Overpass API query for food establishments
 * within a certain radius of multiple points
 */
const buildOverpassQuery = (
    points: Coordinate[],
    radiusMeters: number = 1000
): string => {
    // Build individual queries for each point and food type
    const queries: string[] = [];

    // Expanded list of food-related amenities
    const amenities = [
        "restaurant",
        "cafe",
        "fast_food",
        "food_court",
        "bakery",
        "ice_cream",
        "pub",
        "bar",
        "biergarten",
        "canteen",
    ];

    // Also search for shops that sell food
    const shops = [
        "bakery",
        "pastry",
        "coffee",
        "deli",
        "confectionery",
    ];

    for (const point of points) {
        // Amenities
        for (const amenity of amenities) {
            queries.push(
                `node["amenity"="${amenity}"](around:${radiusMeters},${point.latitude},${point.longitude});`
            );
            // Also check "way" (buildings) not just nodes
            queries.push(
                `way["amenity"="${amenity}"](around:${radiusMeters},${point.latitude},${point.longitude});`
            );
        }

        // Food shops
        for (const shop of shops) {
            queries.push(
                `node["shop"="${shop}"](around:${radiusMeters},${point.latitude},${point.longitude});`
            );
        }

        // Cuisine-tagged places (catches more restaurants)
        queries.push(
            `node["cuisine"](around:${radiusMeters},${point.latitude},${point.longitude});`
        );
        queries.push(
            `way["cuisine"](around:${radiusMeters},${point.latitude},${point.longitude});`
        );
    }

    const query = `
[out:json][timeout:30];
(
  ${queries.join("\n  ")}
);
out center body;
`;

    return query;
};

/**
 * Parse Overpass API response into FoodStop objects
 */
const parseOverpassResponse = (data: any): FoodStop[] => {
    if (!data.elements) return [];

    return data.elements
        .filter((el: any) => {
            // Must have coordinates (nodes have lat/lon, ways have center.lat/center.lon)
            const hasCoords = (el.lat && el.lon) || (el.center?.lat && el.center?.lon);
            // Must have a name
            const hasName = el.tags?.name;
            return hasCoords && hasName;
        })
        .map((el: any) => {
            // Get coordinates (handle both nodes and ways)
            const latitude = el.lat || el.center?.lat;
            const longitude = el.lon || el.center?.lon;

            // Determine food type
            let type: FoodStop["type"] = "restaurant"; // default
            const amenity = el.tags?.amenity;
            const shop = el.tags?.shop;

            if (amenity === "cafe" || shop === "coffee") {
                type = "cafe";
            } else if (amenity === "fast_food") {
                type = "fast_food";
            } else if (amenity === "food_court" || amenity === "canteen") {
                type = "food_court";
            } else if (amenity === "bakery" || shop === "bakery" || shop === "pastry" || shop === "confectionery") {
                type = "bakery";
            } else if (amenity === "bar" || amenity === "pub" || amenity === "biergarten") {
                type = "bar";
            } else if (amenity === "ice_cream") {
                type = "cafe"; // group ice cream with cafes
            }

            return {
                id: el.id.toString(),
                name: el.tags.name,
                type,
                cuisine: el.tags.cuisine,
                latitude,
                longitude,
                address: [el.tags["addr:street"], el.tags["addr:housenumber"]]
                    .filter(Boolean)
                    .join(" "),
                openingHours: el.tags.opening_hours,
            };
        });
};

/**
 * Remove duplicate food stops (same location or very close)
 */
const deduplicateFoodStops = (stops: FoodStop[]): FoodStop[] => {
    const seen = new Map<string, FoodStop>();

    for (const stop of stops) {
        // Round coordinates to ~11m precision for deduplication
        const key = `${stop.latitude.toFixed(4)},${stop.longitude.toFixed(4)}`;
        if (!seen.has(key)) {
            seen.set(key, stop);
        }
    }

    return Array.from(seen.values());
};

export const useFoodStopsAlongRoute = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [routeData, setRouteData] = useState<RouteWithFoodStops | null>(null);

    const fetchRouteWithFoodStops = useCallback(
        async (
            dayItems: ItineraryItem[],
            userLocation?: Location.LocationObject | null
        ): Promise<RouteWithFoodStops | null> => {
            setLoading(true);
            setError(null);

            try {
                // Filter items with valid coordinates
                const itemsWithCoords = dayItems.filter(
                    (item) => item.destination_latitude && item.destination_longitude
                );

                if (itemsWithCoords.length === 0) {
                    throw new Error("No activities with location data");
                }

                // Determine origin (user location or first item)
                let origin: Coordinate;
                if (userLocation) {
                    origin = {
                        latitude: userLocation.coords.latitude,
                        longitude: userLocation.coords.longitude,
                    };
                } else {
                    // Try to get current location
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status === "granted") {
                        const location = await Location.getCurrentPositionAsync({});
                        origin = {
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                        };
                    } else {
                        // Fall back to first item as origin
                        origin = {
                            latitude: itemsWithCoords[0].destination_latitude!,
                            longitude: itemsWithCoords[0].destination_longitude!,
                        };
                    }
                }

                // Build waypoints and destination
                const allPoints = itemsWithCoords.map((item) => ({
                    latitude: item.destination_latitude!,
                    longitude: item.destination_longitude!,
                }));

                const destination = allPoints[allPoints.length - 1];
                const waypoints = allPoints.slice(0, -1);

                // Build coordinates array for OpenRouteService
                // Format: [[lng, lat], [lng, lat], ...]
                const coordinates = [
                    [origin.longitude, origin.latitude],
                    ...waypoints.map((wp) => [wp.longitude, wp.latitude]),
                    [destination.longitude, destination.latitude],
                ];

                // Fetch route from OpenRouteService
                const routeResponse = await fetch(
                    "https://api.openrouteservice.org/v2/directions/driving-car",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: ORS_API_KEY,
                        },
                        body: JSON.stringify({
                            coordinates,
                            instructions: false,
                        }),
                    }
                );

                if (!routeResponse.ok) {
                    const errorData = await routeResponse.json().catch(() => ({}));
                    throw new Error(
                        errorData.error?.message || `Route API error: ${routeResponse.status}`
                    );
                }

                const routeJson = await routeResponse.json();

                if (!routeJson.routes?.[0]?.geometry) {
                    throw new Error("No route found");
                }

                // Decode the polyline
                const polyline = decodePolyline(routeJson.routes[0].geometry);

                // Sample points along the route for food stop queries
                // More points = better coverage along the route
                const sampledPoints = sampleRoutePoints(polyline, 15);

                // Query Overpass API for food stops
                // 1000m radius = ~1km on each side of the route
                const overpassQuery = buildOverpassQuery(sampledPoints, 1000);

                let foodStops: FoodStop[] = [];

                try {
                    const overpassResponse = await fetch(
                        "https://overpass-api.de/api/interpreter",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded",
                            },
                            body: `data=${encodeURIComponent(overpassQuery)}`,
                        }
                    );

                    if (!overpassResponse.ok) {
                        const errorText = await overpassResponse.text();
                        console.warn("Overpass API error:", overpassResponse.status, errorText);
                    } else {
                        const overpassJson = await overpassResponse.json();
                        foodStops = deduplicateFoodStops(parseOverpassResponse(overpassJson));
                        console.log(`Found ${foodStops.length} food stops`);
                    }
                } catch (overpassError) {
                    console.warn("Overpass API request failed:", overpassError);
                }

                const result: RouteWithFoodStops = {
                    polyline,
                    foodStops,
                    origin,
                    destination,
                    waypoints,
                };

                setRouteData(result);
                setLoading(false);
                return result;
            } catch (err: any) {
                const errorMessage = err.message || "Failed to fetch route";
                setError(errorMessage);
                setLoading(false);
                Alert.alert("Error", errorMessage);
                return null;
            }
        },
        []
    );

    const clearRouteData = useCallback(() => {
        setRouteData(null);
        setError(null);
    }, []);

    return {
        loading,
        error,
        routeData,
        fetchRouteWithFoodStops,
        clearRouteData,
    };
};