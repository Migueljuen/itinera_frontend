import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

type MapPreviewProps = {
    destination: {
        name: string;
        city: string;
        latitude: number;
        longitude: number;
    } | null;
    onPress: () => void;
};

export const MapPreview: React.FC<MapPreviewProps> = ({ destination, onPress }) => {
    if (!destination) {
        return (
            <View className="my-6">
                <View className="bg-gray-100 rounded-2xl h-48 items-center justify-center">
                    <Ionicons name="location-outline" size={32} color="#9CA3AF" />
                    <Text className="text-gray-400 font-onest mt-2">
                        Location Not Available
                    </Text>
                </View>
            </View>
        );
    }

    const { latitude, longitude, name, city } = destination;

    return (
        <View className="border-t mt-12 border-gray-200 py-12">
            <Text className="text-2xl font-onest-semibold mb-4 text-black/90">
                Where it takes places
            </Text>
            <View className=" flex-1 mb-4">
                <Text className="font-onest text-black/90 mb-1">
                    {destination.name}
                </Text>
                <Text className="text-black/40 font-onest">{destination.city}, Negros Occidental, Philippines</Text>
            </View>
            {/* Map Preview */}
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={onPress}
                className="rounded-2xl overflow-hidden"
                style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 4,
                }}
            >
                <MapView
                    style={{ width: "100%", height: 280 }}
                    provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
                    userInterfaceStyle="light"
                    initialRegion={{
                        latitude,
                        longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    rotateEnabled={false}
                    pitchEnabled={false}
                    pointerEvents="none"
                >
                    <Marker
                        coordinate={{ latitude, longitude }}
                        title={name}
                        description={city}
                    >
                        {/* Custom Marker */}
                        <View className="items-center">
                            <View
                                className="bg-primary rounded-full p-2"
                                style={{
                                    shadowColor: "#4F46E5",
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 4,
                                    elevation: 4,
                                }}
                            >
                                <Ionicons name="location" size={20} color="#FFFFFF" />
                            </View>
                            <View
                                style={{
                                    width: 0,
                                    height: 0,
                                    borderLeftWidth: 8,
                                    borderRightWidth: 8,
                                    borderTopWidth: 8,
                                    borderLeftColor: "transparent",
                                    borderRightColor: "transparent",
                                    borderTopColor: "#4F46E5",
                                    marginTop: -2,
                                }}
                            />
                        </View>
                    </Marker>
                </MapView>

                {/* Overlay with location info and button */}
                <View className="absolute bottom-0 left-0 right-0 bg-white/95 px-4 py-3 flex-row items-center justify-between">
                    <View className="flex-1 mr-3">
                        <Text className="font-onest-semibold text-black/90" numberOfLines={1}>
                            {name}
                        </Text>
                        <Text className="text-gray-500 font-onest text-sm" numberOfLines={1}>
                            {city}
                        </Text>
                    </View>
                    <View className="bg-primary rounded-full px-4 py-2 flex-row items-center">
                        <Ionicons name="navigate" size={14} color="#FFFFFF" />
                        <Text className="text-white font-onest-medium text-sm ml-1">
                            Directions
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
};

export default MapPreview;