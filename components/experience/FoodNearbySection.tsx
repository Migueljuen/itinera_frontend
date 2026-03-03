// components/experience/FoodNearbySection.tsx

import { haversineKm, resolveImageUri, formatPriceText } from "@/components/itinerary/FoodSuggestionCard";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { NearbyFoodItem } from "@/hooks/useNearbyFood";

/* ---------------- Types ---------------- */

interface FoodNearbySectionProps {
    /** Food items returned from useNearbyFood */
    items: NearbyFoodItem[];
    loading: boolean;
    /** Coordinates of the anchor experience (for computing distance) */
    anchorLat?: number | null;
    anchorLng?: number | null;
    /** Name of the anchor experience shown in distance label */
    anchorName?: string;
    /** Max items to display */
    maxItems?: number;
    /** Card width */
    cardWidth?: number;
}

/* ---------------- Sub-component: Food Card ---------------- */

interface NearbyFoodCardProps {
    item: NearbyFoodItem;
    anchorLat?: number | null;
    anchorLng?: number | null;
    anchorName?: string;
    width: number;
    onPress: (experienceId: number) => void;
}

function NearbyFoodCard({
    item,
    anchorLat,
    anchorLng,
    anchorName,
    width,
    onPress,
}: NearbyFoodCardProps) {
    const imageUri = resolveImageUri(item.primary_image ?? item.images?.[0] ?? null);

    // Prefer backend-computed distance, fall back to client-side haversine
    const distanceKm: number | null =
        item.distance_km != null
            ? item.distance_km
            : anchorLat != null &&
                anchorLng != null &&
                item.destination_latitude != null &&
                item.destination_longitude != null
                ? haversineKm(
                    Number(anchorLat),
                    Number(anchorLng),
                    Number(item.destination_latitude),
                    Number(item.destination_longitude)
                )
                : null;

    const priceText = formatPriceText(item.price, item.price_estimate, item.unit);

    return (
        <Pressable
            style={{ width }}
            className="mr-3"
            onPress={() => onPress(item.experience_id)}
        >
            {/* Image */}
            {imageUri ? (
                <Image
                    source={{ uri: imageUri }}
                    style={{ width, height: 162 }}
                    className="rounded-xl"
                    resizeMode="cover"
                />
            ) : (
                <View
                    style={{ width, height: 162 }}
                    className="rounded-xl bg-gray-100 items-center justify-center"
                >
                    <Ionicons name="restaurant-outline" size={28} color="#9CA3AF" />
                </View>
            )}

            {/* Name */}
            <Text
                className="text-black/90 mt-2 font-onest-semibold"
                numberOfLines={1}
            >
                {item.title}
            </Text>

            {/* Distance */}
            {distanceKm != null && (
                <Text
                    className="text-sm font-onest mt-0.5 text-black/60 w-11/12"
                    numberOfLines={1}
                >
                    <Text className="font-onest-semibold text-black/80">
                        {distanceKm.toFixed(1)} km
                    </Text>
                    {anchorName ? ` from here` : " away"}
                </Text>
            )}

            {/* Price */}
            <Text className="text-sm font-onest mt-0.5 text-black/50" numberOfLines={1}>
                {priceText}
            </Text>
        </Pressable>
    );
}

/* ---------------- Empty State ---------------- */

function FoodNearbyEmptyState() {
    return (
        <View className="py-10 items-center bg-gray-50 border border-gray-200 rounded-2xl">
            <Ionicons name="restaurant-outline" size={26} color="#9CA3AF" />
            <Text className="text-black/90 font-onest-medium mt-2">
                No food spots nearby
            </Text>
            <Text className="text-black/50 font-onest text-sm mt-1 text-center px-6">
                We couldn't find any dining options within 5 km of this activity.
            </Text>
        </View>
    );
}

/* ---------------- Main Section ---------------- */

export function FoodNearbySection({
    items,
    loading,
    anchorLat,
    anchorLng,
    anchorName,
    maxItems = 10,
    cardWidth = 200,
}: FoodNearbySectionProps) {
    const router = useRouter();

    const handlePress = (experienceId: number) => {
        router.push({
            pathname: "/(traveler)/(experience)/[id]",
            params: { id: String(experienceId) },
        });
    };

    return (
        <View className="border-t border-gray-200 py-12">
            {/* Header */}
            <View className="mb-4">
                <Text className="font-onest-semibold text-2xl text-black/90">
                    Food nearby
                </Text>
                <Text className="text-black/50 font-onest text-sm mt-0.5">
                    Dining options within 5 km of this activity
                </Text>
            </View>

            {/* Content */}
            {loading ? (
                <View className="py-10 items-center">
                    <ActivityIndicator size="small" color="#1f2937" />
                    <Text className="text-black/40 font-onest mt-2">
                        Finding food nearby…
                    </Text>
                </View>
            ) : items.length > 0 ? (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 16 }}
                >
                    {items.slice(0, maxItems).map((item, idx) => (
                        <NearbyFoodCard
                            key={`nearby-food-${item.experience_id}-${idx}`}
                            item={item}
                            anchorLat={anchorLat}
                            anchorLng={anchorLng}
                            anchorName={anchorName}
                            width={cardWidth}
                            onPress={handlePress}
                        />
                    ))}
                </ScrollView>
            ) : (
                <FoodNearbyEmptyState />
            )}
        </View>
    );
}
