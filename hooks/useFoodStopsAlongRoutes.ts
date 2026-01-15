// hooks/useFoodStopsAlongRoute.ts

import { ItineraryItem } from "@/types/itineraryDetails";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

interface CachedRouteData {
    routeData: RouteWithFoodStops;
    timestamp: number;
}

const ORS_API_KEY = process.env.EXPO_PUBLIC_OPENROUTE_API_KEY || "";
const CACHE_PREFIX = "food_stops_cache_";
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a cache key from itinerary items
 */
const generateCacheKey = (items: ItineraryItem[]): string => {
    const coordString = items
        .filter((item) => item.destination_latitude && item.destination_longitude)
        .map((item) => `${item.destination_latitude?.toFixed(4)},${item.destination_longitude?.toFixed(4)}`)
        .join("|");
    return `${CACHE_PREFIX}${coordString}`;
};

/**
 * Get cached route data if valid
 */
const getCachedRouteData = async (cacheKey: string): Promise<RouteWithFoodStops | null> => {
    try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (!cached) return null;

        const parsedCache: CachedRouteData = JSON.parse(cached);
        const now = Date.now();

        // Check if cache is expired
        if (now - parsedCache.timestamp > CACHE_EXPIRY_MS) {
            await AsyncStorage.removeItem(cacheKey);
            return null;
        }

        console.log(">>> Using cached food stops data");
        return parsedCache.routeData;
    } catch (error) {
        console.warn("Error reading cache:", error);
        return null;
    }
};

/**
 * Save route data to cache
 */
const setCachedRouteData = async (cacheKey: string, routeData: RouteWithFoodStops): Promise<void> => {
    try {
        const cacheData: CachedRouteData = {
            routeData,
            timestamp: Date.now(),
        };
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
        console.log(">>> Cached food stops data");
    } catch (error) {
        console.warn("Error saving to cache:", error);
    }
};

/**
 * Decode OpenRouteService polyline
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
 */
const buildOverpassQuery = (
    points: Coordinate[],
    radiusMeters: number = 1000
): string => {
    const queries: string[] = [];

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

    const shops = [
        "bakery",
        "pastry",
        "coffee",
        "deli",
        "confectionery",
    ];

    for (const point of points) {
        for (const amenity of amenities) {
            queries.push(
                `node["amenity"="${amenity}"](around:${radiusMeters},${point.latitude},${point.longitude});`
            );
            queries.push(
                `way["amenity"="${amenity}"](around:${radiusMeters},${point.latitude},${point.longitude});`
            );
        }

        for (const shop of shops) {
            queries.push(
                `node["shop"="${shop}"](around:${radiusMeters},${point.latitude},${point.longitude});`
            );
        }

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
            const hasCoords = (el.lat && el.lon) || (el.center?.lat && el.center?.lon);
            const hasName = el.tags?.name;
            return hasCoords && hasName;
        })
        .map((el: any) => {
            const latitude = el.lat || el.center?.lat;
            const longitude = el.lon || el.center?.lon;

            let type: FoodStop["type"] = "restaurant";
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
                type = "cafe";
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
 * Remove duplicate food stops
 */
const deduplicateFoodStops = (stops: FoodStop[]): FoodStop[] => {
    const seen = new Map<string, FoodStop>();

    for (const stop of stops) {
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
            console.log(">>> FETCH START");
            setLoading(true);
            setError(null);

            try {
                const itemsWithCoords = dayItems.filter(
                    (item) => item.destination_latitude && item.destination_longitude
                );

                if (itemsWithCoords.length === 0) {
                    throw new Error("No activities with location data");
                }

                // Check cache first
                const cacheKey = generateCacheKey(itemsWithCoords);
                const cachedData = await getCachedRouteData(cacheKey);

                if (cachedData) {
                    // Update origin with current user location if available
                    if (userLocation) {
                        cachedData.origin = {
                            latitude: userLocation.coords.latitude,
                            longitude: userLocation.coords.longitude,
                        };
                    }
                    setRouteData(cachedData);
                    setLoading(false);
                    return cachedData;
                }

                // No cache, fetch fresh data
                let origin: Coordinate;
                if (userLocation) {
                    origin = {
                        latitude: userLocation.coords.latitude,
                        longitude: userLocation.coords.longitude,
                    };
                } else {
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status === "granted") {
                        const location = await Location.getCurrentPositionAsync({});
                        origin = {
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                        };
                    } else {
                        origin = {
                            latitude: itemsWithCoords[0].destination_latitude!,
                            longitude: itemsWithCoords[0].destination_longitude!,
                        };
                    }
                }

                const allPoints = itemsWithCoords.map((item) => ({
                    latitude: item.destination_latitude!,
                    longitude: item.destination_longitude!,
                }));

                const destination = allPoints[allPoints.length - 1];
                const waypoints = allPoints.slice(0, -1);

                const coordinates = [
                    [origin.longitude, origin.latitude],
                    ...waypoints.map((wp) => [wp.longitude, wp.latitude]),
                    [destination.longitude, destination.latitude],
                ];

                console.log(">>> Fetching route from OpenRouteService...");
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
                console.log(">>> Route response received");

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

                const polyline = decodePolyline(routeJson.routes[0].geometry);
                const sampledPoints = sampleRoutePoints(polyline, 15);
                const overpassQuery = buildOverpassQuery(sampledPoints, 1000);

                let foodStops: FoodStop[] = [];

                try {
                    console.log(">>> Fetching food stops from Overpass...");
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
                    console.log(">>> Overpass response received");

                    if (!overpassResponse.ok) {
                        const errorText = await overpassResponse.text();
                        console.warn("Overpass API error:", overpassResponse.status, errorText);
                    } else {
                        const overpassJson = await overpassResponse.json();
                        foodStops = deduplicateFoodStops(parseOverpassResponse(overpassJson));
                        console.log(`>>> Found ${foodStops.length} food stops`);
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

                // Cache the result
                await setCachedRouteData(cacheKey, result);

                setRouteData(result);
                setLoading(false);
                console.log(">>> FETCH COMPLETE");
                return result;
            } catch (err: any) {
                const errorMessage = err.message || "Failed to fetch route";
                setError(errorMessage);
                setLoading(false);
                console.log(">>> FETCH ERROR:", errorMessage);
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

    // Optional: Clear all food stops cache
    const clearCache = useCallback(async () => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
            await AsyncStorage.multiRemove(cacheKeys);
            console.log(`>>> Cleared ${cacheKeys.length} cached routes`);
        } catch (error) {
            console.warn("Error clearing cache:", error);
        }
    }, []);

    return {
        loading,
        error,
        routeData,
        fetchRouteWithFoodStops,
        clearRouteData,
        clearCache,
    };
};