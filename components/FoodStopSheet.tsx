// components/FoodStopsSheet.tsx

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Linking,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

import { FoodStop, RouteWithFoodStops } from "@/hooks/useFoodStopsAlongRoutes";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;

interface FoodStopsSheetProps {
    visible: boolean;
    onClose: () => void;
    routeData: RouteWithFoodStops | null;
    loading: boolean;
    dayNumber: number;
}

// Food type icons and colors
const FOOD_TYPE_CONFIG: Record<
    FoodStop["type"],
    { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }
> = {
    restaurant: { icon: "restaurant", color: "#E53E3E", label: "Restaurant" },
    cafe: { icon: "cafe", color: "#805AD5", label: "Café" },
    fast_food: { icon: "fast-food", color: "#DD6B20", label: "Fast Food" },
    food_court: { icon: "grid", color: "#3182CE", label: "Food Court" },
    bakery: { icon: "nutrition", color: "#D69E2E", label: "Bakery" },
    bar: { icon: "beer", color: "#38A169", label: "Bar & Food" },
};

export const FoodStopsSheet: React.FC<FoodStopsSheetProps> = ({
    visible,
    onClose,
    routeData,
    loading,
    dayNumber,
}) => {
    const mapRef = useRef<MapView>(null);
    const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
    const [selectedStop, setSelectedStop] = useState<FoodStop | null>(null);
    const [activeFilter, setActiveFilter] = useState<FoodStop["type"] | "all">("all");

    // Animate sheet in/out
    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 65,
                friction: 11,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: SHEET_HEIGHT,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    // Fit map to show entire route when data loads
    useEffect(() => {
        if (routeData && mapRef.current) {
            const allCoords = [
                routeData.origin,
                ...routeData.waypoints,
                routeData.destination,
                ...routeData.foodStops.map((s) => ({
                    latitude: s.latitude,
                    longitude: s.longitude,
                })),
            ];

            setTimeout(() => {
                mapRef.current?.fitToCoordinates(allCoords, {
                    edgePadding: { top: 60, right: 60, bottom: 200, left: 60 },
                    animated: true,
                });
            }, 300);
        }
    }, [routeData]);

    // Filter food stops
    const filteredStops =
        routeData?.foodStops.filter(
            (stop) => activeFilter === "all" || stop.type === activeFilter
        ) || [];

    // Get unique food types for filter chips
    const availableTypes = Array.from(
        new Set(routeData?.foodStops.map((s) => s.type) || [])
    );

    // Navigate to selected food stop
    const handleNavigateToStop = (stop: FoodStop) => {
        const destination = `${stop.latitude},${stop.longitude}`;
        const label = encodeURIComponent(stop.name);

        const url = Platform.select({
            ios: `maps://app?daddr=${destination}&q=${label}`,
            android: `google.navigation:q=${destination}&mode=d`,
        });

        const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${destination}`;

        if (url) {
            Linking.canOpenURL(url).then((supported) => {
                if (supported) {
                    Linking.openURL(url);
                } else {
                    Linking.openURL(fallbackUrl);
                }
            });
        }
    };

    // Handle marker press
    const handleMarkerPress = (stop: FoodStop) => {
        setSelectedStop(stop);
        mapRef.current?.animateToRegion(
            {
                latitude: stop.latitude,
                longitude: stop.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            },
            300
        );
    };

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <View className="flex-1 bg-black/50">
                {/* Backdrop */}
                <Pressable className="flex-1" onPress={onClose} />

                {/* Sheet */}
                <Animated.View
                    style={{
                        transform: [{ translateY: slideAnim }],
                        height: SHEET_HEIGHT,
                    }}
                    className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl overflow-hidden"
                >
                    {/* Handle */}
                    <View className="items-center pt-3 pb-2">
                        <View className="w-10 h-1 bg-gray-300 rounded-full" />
                    </View>

                    {/* Header */}
                    <View className="flex-row items-center justify-between px-5 pb-3">
                        <View>
                            <Text className="text-xl font-onest-semibold text-gray-800">
                                Food Stops
                            </Text>
                            <Text className="text-sm font-onest text-gray-500">
                                Day {dayNumber} • {filteredStops.length} places found
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
                        >
                            <Ionicons name="close" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View className="flex-1 items-center justify-center">
                            <ActivityIndicator size="large" color="#4F46E5" />
                            <Text className="mt-3 text-gray-500 font-onest">
                                Finding food stops along your route...
                            </Text>
                        </View>
                    ) : routeData ? (
                        <>
                            {/* Map */}
                            <View className="h-64 mx-4 rounded-2xl overflow-hidden border border-gray-200">
                                <MapView
                                    ref={mapRef}
                                    style={{ flex: 1 }}
                                    provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
                                    showsUserLocation
                                    showsMyLocationButton={false}
                                >
                                    {/* Route polyline */}
                                    <Polyline
                                        coordinates={routeData.polyline}
                                        strokeColor="#4F46E5"
                                        strokeWidth={4}
                                    />

                                    {/* Origin marker */}
                                    <Marker
                                        coordinate={routeData.origin}
                                        title="Start"
                                        pinColor="#10B981"
                                    />

                                    {/* Waypoint markers */}
                                    {routeData.waypoints.map((wp, index) => (
                                        <Marker
                                            key={`waypoint-${index}`}
                                            coordinate={wp}
                                            title={`Stop ${index + 1}`}
                                            pinColor="#4F46E5"
                                        />
                                    ))}

                                    {/* Destination marker */}
                                    <Marker
                                        coordinate={routeData.destination}
                                        title="End"
                                        pinColor="#EF4444"
                                    />

                                    {/* Food stop markers */}
                                    {filteredStops.map((stop) => {
                                        const config = FOOD_TYPE_CONFIG[stop.type];
                                        return (
                                            <Marker
                                                key={stop.id}
                                                coordinate={{
                                                    latitude: stop.latitude,
                                                    longitude: stop.longitude,
                                                }}
                                                onPress={() => handleMarkerPress(stop)}
                                            >
                                                <View
                                                    className="items-center justify-center rounded-full p-2"
                                                    style={{ backgroundColor: config.color }}
                                                >
                                                    <Ionicons name={config.icon} size={16} color="white" />
                                                </View>
                                            </Marker>
                                        );
                                    })}
                                </MapView>
                            </View>

                            {/* Filter chips */}
                            {availableTypes.length > 1 && (
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    className="px-4 py-3"
                                    contentContainerStyle={{ gap: 8 }}
                                >
                                    <TouchableOpacity
                                        className={`px-4 py-2 rounded-full flex-row items-center ${activeFilter === "all" ? "bg-primary" : "bg-gray-100"
                                            }`}
                                        onPress={() => setActiveFilter("all")}
                                    >
                                        <Text
                                            className={`font-onest-medium text-sm ${activeFilter === "all" ? "text-white" : "text-gray-600"
                                                }`}
                                        >
                                            All ({routeData.foodStops.length})
                                        </Text>
                                    </TouchableOpacity>

                                    {availableTypes.map((type) => {
                                        const config = FOOD_TYPE_CONFIG[type];
                                        const count = routeData.foodStops.filter(
                                            (s) => s.type === type
                                        ).length;
                                        const isActive = activeFilter === type;

                                        return (
                                            <TouchableOpacity
                                                key={type}
                                                className={`px-4 py-2 rounded-full flex-row items-center ${isActive ? "bg-primary" : "bg-gray-100"
                                                    }`}
                                                onPress={() => setActiveFilter(type)}
                                            >
                                                <Ionicons
                                                    name={config.icon}
                                                    size={14}
                                                    color={isActive ? "white" : config.color}
                                                    style={{ marginRight: 6 }}
                                                />
                                                <Text
                                                    className={`font-onest-medium text-sm ${isActive ? "text-white" : "text-gray-600"
                                                        }`}
                                                >
                                                    {config.label} ({count})
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            )}

                            {/* Food stops list */}
                            <ScrollView
                                className="flex-1 px-4"
                                contentContainerStyle={{ paddingBottom: 40 }}
                            >
                                {filteredStops.length === 0 ? (
                                    <View className="items-center py-8">
                                        <Ionicons name="restaurant-outline" size={48} color="#D1D5DB" />
                                        <Text className="mt-3 text-gray-400 font-onest text-center">
                                            No food stops found along this route.{"\n"}
                                            Try a different filter.
                                        </Text>
                                    </View>
                                ) : (
                                    filteredStops.map((stop) => {
                                        const config = FOOD_TYPE_CONFIG[stop.type];
                                        const isSelected = selectedStop?.id === stop.id;

                                        return (
                                            <TouchableOpacity
                                                key={stop.id}
                                                className={`mb-3 p-4 rounded-2xl border ${isSelected
                                                        ? "border-primary bg-indigo-50"
                                                        : "border-gray-100 bg-white"
                                                    }`}
                                                onPress={() => handleMarkerPress(stop)}
                                                activeOpacity={0.7}
                                            >
                                                <View className="flex-row items-start">
                                                    {/* Icon */}
                                                    <View
                                                        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                                                        style={{ backgroundColor: `${config.color}15` }}
                                                    >
                                                        <Ionicons
                                                            name={config.icon}
                                                            size={20}
                                                            color={config.color}
                                                        />
                                                    </View>

                                                    {/* Info */}
                                                    <View className="flex-1">
                                                        <Text
                                                            className="text-base font-onest-semibold text-gray-800"
                                                            numberOfLines={1}
                                                        >
                                                            {stop.name}
                                                        </Text>
                                                        <View className="flex-row items-center mt-1">
                                                            <View
                                                                className="px-2 py-0.5 rounded-md mr-2"
                                                                style={{ backgroundColor: `${config.color}15` }}
                                                            >
                                                                <Text
                                                                    className="text-xs font-onest-medium"
                                                                    style={{ color: config.color }}
                                                                >
                                                                    {config.label}
                                                                </Text>
                                                            </View>
                                                            {stop.cuisine && (
                                                                <Text className="text-xs text-gray-500 font-onest">
                                                                    {stop.cuisine}
                                                                </Text>
                                                            )}
                                                        </View>
                                                        {stop.address && (
                                                            <Text
                                                                className="text-xs text-gray-400 font-onest mt-1"
                                                                numberOfLines={1}
                                                            >
                                                                {stop.address}
                                                            </Text>
                                                        )}
                                                    </View>

                                                    {/* Navigate button */}
                                                    <TouchableOpacity
                                                        className="w-10 h-10 rounded-xl bg-primary items-center justify-center"
                                                        onPress={() => handleNavigateToStop(stop)}
                                                    >
                                                        <Ionicons name="navigate" size={18} color="white" />
                                                    </TouchableOpacity>
                                                </View>

                                                {/* Opening hours if available */}
                                                {stop.openingHours && (
                                                    <View className="mt-3 pt-3 border-t border-gray-100 flex-row items-center">
                                                        <Ionicons
                                                            name="time-outline"
                                                            size={14}
                                                            color="#9CA3AF"
                                                        />
                                                        <Text className="text-xs text-gray-500 font-onest ml-1.5">
                                                            {stop.openingHours}
                                                        </Text>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })
                                )}
                            </ScrollView>
                        </>
                    ) : (
                        <View className="flex-1 items-center justify-center px-6">
                            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                            <Text className="mt-3 text-gray-600 font-onest text-center">
                                Could not load food stops.{"\n"}Please try again.
                            </Text>
                            <TouchableOpacity
                                className="mt-4 bg-primary px-6 py-3 rounded-xl"
                                onPress={onClose}
                            >
                                <Text className="text-white font-onest-medium">Close</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
};