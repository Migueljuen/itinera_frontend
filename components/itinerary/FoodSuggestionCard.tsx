// components/itinerary/FoodSuggestionCard.tsx

import API_URL from "@/constants/api";
import { ItineraryFoodSuggestion, ItineraryItem } from "@/types/itineraryDetails";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";

/* ---------------- Helpers ---------------- */

const resolveImageUri = (raw?: string | null): string | null => {
    if (!raw) return null;

    const s = String(raw).trim();
    if (!s) return null;

    if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:"))
        return s;

    if (s.startsWith("//")) return `https:${s}`;

    const base = String(API_URL || "").replace(/\/api\/?$/i, "");
    if (!base) return s;

    if (s.startsWith("/")) return `${base}${s}`;
    return `${base}/${s}`;
};

const formatPeso = (n: number): string => `₱${Math.round(n).toLocaleString()}`;

const parsePriceEstimateRange = (
    value: unknown
): { min: number; max: number } | null => {
    if (!value) return null;
    if (typeof value === "number") return { min: value, max: value };

    const s = String(value).trim();
    const nums = s.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
    if (!nums.length) return null;

    return { min: Math.min(...nums), max: Math.max(...nums) };
};

const formatPriceText = (
    price: unknown,
    priceEstimate: unknown,
    unit: unknown
): string => {
    const p = Number(price || 0);
    if (p > 0) {
        return `${formatPeso(p)}${unit ? ` / ${String(unit)}` : ""}`;
    }

    const range = parsePriceEstimateRange(priceEstimate);
    if (range) {
        if (Math.round(range.min) === Math.round(range.max)) return formatPeso(range.max);
        return `${formatPeso(range.min)} - ${formatPeso(range.max)}`;
    }

    return "Price not available";
};

const haversineKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/* ---------------- Types ---------------- */

interface FoodSuggestionCardProps {
    suggestion: ItineraryFoodSuggestion;
    nearItem: ItineraryItem | null;
    onPress: (experienceId: number) => void;
    width?: number;
}

/* ---------------- Component ---------------- */

export function FoodSuggestionCard({
    suggestion,
    nearItem,
    onPress,
    width = 160,
}: FoodSuggestionCardProps) {
    const name = suggestion.experience_name || suggestion.title || "Untitled";
    const imageUri = resolveImageUri(
        suggestion.primary_image || suggestion.images?.[0] || null
    );

    const nearLabel = nearItem?.experience_name || "";

    // Compute distance if coordinates are available
    const distanceKm =
        suggestion.destination_latitude != null &&
            suggestion.destination_longitude != null &&
            nearItem?.destination_latitude != null &&
            nearItem?.destination_longitude != null
            ? haversineKm(
                Number(suggestion.destination_latitude),
                Number(suggestion.destination_longitude),
                Number(nearItem.destination_latitude),
                Number(nearItem.destination_longitude)
            )
            : null;

    return (
        <Pressable
            style={{ width }}
            className="mr-3"
            onPress={() => onPress(suggestion.experience_id)}
        >
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
                    className="rounded-xl  items-center justify-center"
                >
                    <Ionicons name="restaurant-outline" size={20} color="#9CA3AF" />
                </View>
            )}
            <Text
                className="  text-black/90 mt-2 font-onest-medium"
                numberOfLines={1}
            >
                {name}
            </Text>
            {distanceKm != null && !!nearLabel && (
                <Text
                    className="text-xs font-onest mt-2 text-black/70"
                    numberOfLines={1}
                >
                    {distanceKm.toFixed(1)} km from {nearLabel}
                </Text>
            )}
        </Pressable>
    );
}

// Export helpers for reuse if needed
export { formatPeso, formatPriceText, haversineKm, resolveImageUri };

