// components/FoodStopsSheet.tsx

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

import { FoodStop, RouteWithFoodStops } from "@/hooks/useFoodStopsAlongRoutes";
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";

interface FoodStopsSheetProps {
    visible: boolean;
    onClose: () => void;
    routeData: RouteWithFoodStops | null;
    loading: boolean;
    dayNumber: number;
}

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
    const bottomSheetRef = useRef<BottomSheet>(null);
    const mapRef = useRef<MapView>(null);
    const [selectedStop, setSelectedStop] = useState<FoodStop | null>(null);
    const [activeFilter, setActiveFilter] = useState<FoodStop["type"] | "all">("all");
    const [shouldRenderMap, setShouldRenderMap] = useState(false);

    const snapPoints = useMemo(() => ["85%"], []);
    const focusHook = useCallback(() => { }, []);

    // Control sheet visibility
    useEffect(() => {
        if (visible) {
            bottomSheetRef.current?.snapToIndex(0);
        } else {
            bottomSheetRef.current?.close();
            setShouldRenderMap(false);
        }
    }, [visible]);


    // Render map after data loads
    useEffect(() => {
        if (visible && routeData && !loading) {
            const timer = setTimeout(() => {
                setShouldRenderMap(true);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [visible, routeData, loading]);

    // Fit map when ready
    useEffect(() => {
        if (shouldRenderMap && routeData && mapRef.current) {
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
    }, [shouldRenderMap, routeData]);

    const filteredStops =
        routeData?.foodStops.filter(
            (stop) => activeFilter === "all" || stop.type === activeFilter
        ) || [];

    const availableTypes = Array.from(
        new Set(routeData?.foodStops.map((s) => s.type) || [])
    );

    const handleNavigateToStop = (stop: FoodStop) => {
        const label = encodeURIComponent(stop.name);

        const url = Platform.select({
            ios: `maps://app?daddr=${label}@${stop.latitude},${stop.longitude}`,
            android: `geo:0,0?q=${stop.latitude},${stop.longitude}(${label})`,
        });

        const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${stop.latitude},${stop.longitude}`;

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

    const handleMarkerPress = (stop: FoodStop) => {
        setSelectedStop(stop);
        if (shouldRenderMap) {
            mapRef.current?.animateToRegion(
                {
                    latitude: stop.latitude,
                    longitude: stop.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                },
                300
            );
        }
    };

    const handleSheetChanges = useCallback((index: number) => {
        if (index === -1) {
            onClose();
        }
    }, [onClose]);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
                pressBehavior="close"
            />
        ),
        []
    );

    return (
        <BottomSheet
            ref={bottomSheetRef}
            index={-1}
            snapPoints={snapPoints}
            onChange={handleSheetChanges}
            enablePanDownToClose={false}
            enableDynamicSizing={false}
            enableContentPanningGesture={false}
            enableHandlePanningGesture={false}
            animateOnMount={false}
            backdropComponent={renderBackdrop}
            handleIndicatorStyle={{ backgroundColor: "#D1D5DB", width: 40 }}
            backgroundStyle={{ borderRadius: 24 }}
        >
            {/* Header - outside scrollable area */}
            <View className="flex-row items-center justify-between px-5 pb-3">
                <View>
                    <Text className="text-xl font-onest-semibold text-black/90">
                        Food Stops
                    </Text>
                    <Text className="text-sm font-onest text-black/50">
                        Day {dayNumber} • {filteredStops.length} places found
                    </Text>
                </View>
                <Pressable
                    onPress={onClose}
                    className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
                >
                    <Ionicons name="close" size={20} color="#6B7280" />
                </Pressable>
            </View>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                    <Text className="mt-3 text-black/50 font-onest">
                        Finding food stops along your route...
                    </Text>
                </View>
            ) : routeData ? (
                <BottomSheetScrollView
                    contentContainerStyle={{ paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                    focusHook={focusHook}
                >
                    {/* Map */}
                    <View className="h-64 mx-4 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100">
                        {shouldRenderMap ? (
                            <MapView
                                ref={mapRef}
                                style={{ flex: 1 }}
                                provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
                                showsUserLocation
                                showsMyLocationButton={false}
                            >
                                <Polyline
                                    coordinates={routeData.polyline}
                                    strokeColor="#4F46E5"
                                    strokeWidth={4}
                                />
                                <Marker
                                    coordinate={routeData.origin}
                                    title="Start"
                                    pinColor="#10B981"
                                />
                                {routeData.waypoints.map((wp, index) => (
                                    <Marker
                                        key={`waypoint-${index}`}
                                        coordinate={wp}
                                        title={`Stop ${index + 1}`}
                                        pinColor="#4F46E5"
                                    />
                                ))}
                                <Marker
                                    coordinate={routeData.destination}
                                    title="End"
                                    pinColor="#EF4444"
                                />
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
                        ) : (
                            <View className="flex-1 items-center justify-center">
                                <ActivityIndicator size="small" color="#4F46E5" />
                                <Text className="mt-2 text-black/50 font-onest text-sm">
                                    Loading map...
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Filter chips */}
                    {availableTypes.length > 1 && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="px-4 py-3"
                            contentContainerStyle={{ gap: 8 }}
                        >
                            <Pressable
                                className={`px-4 py-2 rounded-full flex-row items-center ${activeFilter === "all" ? "bg-gray-800" : "bg-gray-100"
                                    }`}
                                onPress={() => setActiveFilter("all")}
                            >
                                <Text
                                    className={`font-onest-medium text-sm ${activeFilter === "all" ? "text-white" : "text-black/50"
                                        }`}
                                >
                                    All
                                </Text>
                            </Pressable>

                            {availableTypes.map((type) => {
                                const config = FOOD_TYPE_CONFIG[type];
                                const count = routeData.foodStops.filter(
                                    (s) => s.type === type
                                ).length;
                                const isActive = activeFilter === type;

                                return (
                                    <Pressable
                                        key={type}
                                        className={`px-4 py-2 rounded-full flex-row items-center ${isActive ? "bg-gray-800" : "bg-gray-100"
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
                                            className={`font-onest-medium text-sm ${isActive ? "text-white" : "text-black/50"
                                                }`}
                                        >
                                            {config.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    )}

                    {/* Food stops list */}
                    <View className="px-4">
                        {filteredStops.length === 0 ? (
                            <View className="items-center py-8">
                                <Ionicons name="restaurant-outline" size={48} color="#D1D5DB" />
                                <Text className="mt-3 text-black/50 font-onest text-center">
                                    No food stops found along this route.{"\n"}
                                    Try a different filter.
                                </Text>
                            </View>
                        ) : (
                            filteredStops.map((stop) => {
                                const config = FOOD_TYPE_CONFIG[stop.type];
                                const isSelected = selectedStop?.id === stop.id;

                                return (
                                    <Pressable
                                        key={stop.id}
                                        className={`mb-3 py-4 rounded-2xl  ${isSelected
                                            ? "border-primary "
                                            : "border-gray-100"
                                            }`}
                                        onPress={() => handleMarkerPress(stop)}

                                    >
                                        <View className="flex-row items-start">
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

                                            <View className="flex-1">
                                                <Text
                                                    className="text-base font-onest-semibold text-black/90"
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

                                                </View>

                                            </View>

                                            <Pressable
                                                className="w-10 h-10 rounded-xl bg-gray-800 items-center justify-center"
                                                onPress={() => handleNavigateToStop(stop)}
                                            >
                                                <Ionicons name="navigate" size={18} color="#ffffffcc" />
                                            </Pressable>
                                        </View>


                                    </Pressable>
                                );
                            })
                        )}
                    </View>
                </BottomSheetScrollView>
            ) : (
                <BottomSheetView className="hidden" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
                    <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                    <Text className="mt-3 text-black/50 font-onest text-center">
                        Could not load food stops.{"\n"}Please try again.
                    </Text>
                    <Pressable
                        className="mt-4 bg-primary px-6 py-3 rounded-xl"
                        onPress={onClose}
                    >
                        <Text className="text-white font-onest-medium">Close</Text>
                    </Pressable>
                </BottomSheetView>
            )}
        </BottomSheet>
    );
};