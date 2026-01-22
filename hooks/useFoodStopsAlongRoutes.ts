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
    skippedPoints?: string[]; // Track which points were skipped
}

interface CachedRouteData {
    routeData: RouteWithFoodStops;
    timestamp: number;
}

interface PointWithName extends Coordinate {
    name: string;
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
    maxPoints: number = 8
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
 * Build Overpass API query for food establishments - OPTIMIZED
 */
const buildOverpassQuery = (
    points: Coordinate[],
    radiusMeters: number = 500
): string => {
    const aroundFilter = points
        .map((p) => `${p.latitude},${p.longitude}`)
        .join(",");

    const query = `
[out:json][timeout:25];
(
  node["amenity"~"restaurant|cafe|fast_food|food_court|bakery"](around:${radiusMeters},${aroundFilter});
  node["shop"~"bakery|pastry|coffee"](around:${radiusMeters},${aroundFilter});
);
out body 50;
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

/**
 * Try to fetch route from OpenRouteService
 */
const fetchORSRoute = async (
    coordinates: number[][]
): Promise<{ success: boolean; polyline?: Coordinate[]; error?: string }> => {
    try {
        const response = await fetch(
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

        if (response.ok) {
            const json = await response.json();
            if (json.routes?.[0]?.geometry) {
                return {
                    success: true,
                    polyline: decodePolyline(json.routes[0].geometry),
                };
            }
        }

        const errorData = await response.json().catch(() => ({}));
        return {
            success: false,
            error: errorData.error?.message || `Route API error: ${response.status}`,
        };
    } catch (err: any) {
        return {
            success: false,
            error: err.message || "Network error",
        };
    }
};

/**
 * Parse which coordinate index failed from ORS error message
 */
const parseFailedCoordinateIndex = (errorMessage: string): number | null => {
    const match = errorMessage.match(/coordinate (\d+)/);
    return match ? parseInt(match[1], 10) : null;
};

/**
 * Try routing with progressively fewer points, removing unroutable ones
 */
const fetchRouteWithRetry = async (
    origin: Coordinate,
    allPoints: PointWithName[]
): Promise<{
    polyline: Coordinate[];
    skippedPoints: string[];
    routeSuccess: boolean;
}> => {
    const skippedPoints: string[] = [];
    let remainingPoints = [...allPoints];
    let attempts = 0;
    const maxAttempts = allPoints.length + 1; // Don't try more than we have points

    while (attempts < maxAttempts) {
        attempts++;

        // Build coordinates array: origin + remaining points
        const coordinates = [
            [origin.longitude, origin.latitude],
            ...remainingPoints.map((p) => [p.longitude, p.latitude]),
        ];

        console.log(`>>> Route attempt ${attempts} with ${coordinates.length} points`);

        const result = await fetchORSRoute(coordinates);

        if (result.success && result.polyline) {
            console.log(">>> Route succeeded!");
            return {
                polyline: result.polyline,
                skippedPoints,
                routeSuccess: true,
            };
        }

        // Parse which coordinate failed
        const failedIndex = parseFailedCoordinateIndex(result.error || "");

        if (failedIndex !== null) {
            // Index 0 is origin
            if (failedIndex === 0) {
                console.warn(">>> Origin location is not routable");
                // Can't skip origin, try using first destination as origin
                if (remainingPoints.length > 1) {
                    const newOrigin = remainingPoints[0];
                    skippedPoints.push("Your current location");
                    console.log(`>>> Using "${newOrigin.name}" as new origin`);

                    // Recursively try with new origin
                    const retryResult = await fetchRouteWithRetry(
                        { latitude: newOrigin.latitude, longitude: newOrigin.longitude },
                        remainingPoints.slice(1)
                    );
                    return {
                        polyline: retryResult.polyline,
                        skippedPoints: [...skippedPoints, ...retryResult.skippedPoints],
                        routeSuccess: retryResult.routeSuccess,
                    };
                }
                break;
            }

            // Failed index > 0 means one of our waypoints/destination
            const pointIndex = failedIndex - 1; // Adjust for origin
            if (pointIndex < remainingPoints.length) {
                const failedPoint = remainingPoints[pointIndex];
                console.log(`>>> Skipping unroutable point: "${failedPoint.name}"`);
                skippedPoints.push(failedPoint.name);

                // Remove the failed point and retry
                remainingPoints = [
                    ...remainingPoints.slice(0, pointIndex),
                    ...remainingPoints.slice(pointIndex + 1),
                ];

                // If no points left, we can't route
                if (remainingPoints.length === 0) {
                    console.warn(">>> No routable points remaining");
                    break;
                }

                continue; // Try again with remaining points
            }
        }

        // Unknown error or no coordinate index - try simplified route
        console.warn(">>> Unknown routing error, trying direct route");
        break;
    }

    // Final fallback: just origin to last destination
    if (remainingPoints.length > 0) {
        const lastPoint = remainingPoints[remainingPoints.length - 1];
        console.log(`>>> Final attempt: direct route to "${lastPoint.name}"`);

        const directResult = await fetchORSRoute([
            [origin.longitude, origin.latitude],
            [lastPoint.longitude, lastPoint.latitude],
        ]);

        if (directResult.success && directResult.polyline) {
            // Mark all intermediate points as skipped
            const intermediateSkipped = remainingPoints
                .slice(0, -1)
                .map((p) => p.name);

            return {
                polyline: directResult.polyline,
                skippedPoints: [...skippedPoints, ...intermediateSkipped],
                routeSuccess: true,
            };
        }
    }

    // Complete failure - return straight line path for food search
    console.log(">>> All routing failed, using straight-line path");
    const straightLinePath: Coordinate[] = [
        origin,
        ...remainingPoints.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
    ];

    // If even that's empty, just use origin
    if (straightLinePath.length < 2 && allPoints.length > 0) {
        straightLinePath.push({
            latitude: allPoints[0].latitude,
            longitude: allPoints[0].longitude,
        });
    }

    return {
        polyline: straightLinePath,
        skippedPoints,
        routeSuccess: false,
    };
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

                // Get origin (user location or first destination)
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

                // Build points with names for better error messages
                const allPoints: PointWithName[] = itemsWithCoords.map((item) => ({
                    latitude: item.destination_latitude!,
                    longitude: item.destination_longitude!,
                    name: item.destination_name || "Unknown stop",
                }));

                console.log(">>> Fetching route from OpenRouteService...");
                console.log(`>>> Origin: ${origin.latitude}, ${origin.longitude}`);
                console.log(`>>> Destinations: ${allPoints.map((p) => p.name).join(" → ")}`);

                // Fetch route with automatic retry for unroutable points
                const routeResult = await fetchRouteWithRetry(origin, allPoints);

                // Show alert if points were skipped
                if (routeResult.skippedPoints.length > 0) {
                    const skippedList = routeResult.skippedPoints.join(", ");
                    console.log(`>>> Skipped unroutable points: ${skippedList}`);

                    Alert.alert(
                        "Route Note",
                        `Some stops are in remote areas without road access and were skipped: ${skippedList}.\n\nFood stops are shown along the accessible route.`,
                        [{ text: "OK" }]
                    );
                }

                // Fetch food stops along the route
                const sampledPoints = sampleRoutePoints(routeResult.polyline, 8);
                const overpassQuery = buildOverpassQuery(sampledPoints, 500);

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

                // Build final result
                const destination = allPoints[allPoints.length - 1];
                const waypoints = allPoints.slice(0, -1);

                const result: RouteWithFoodStops = {
                    polyline: routeResult.polyline,
                    foodStops,
                    origin,
                    destination: {
                        latitude: destination.latitude,
                        longitude: destination.longitude,
                    },
                    waypoints: waypoints.map((wp) => ({
                        latitude: wp.latitude,
                        longitude: wp.longitude,
                    })),
                    skippedPoints: routeResult.skippedPoints,
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