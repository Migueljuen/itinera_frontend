// components/itinerary/PlacesToEatSection.tsx

import { FoodSuggestionCard, haversineKm } from "@/components/itinerary/FoodSuggestionCard";
import { ItineraryFoodSuggestion, ItineraryItem } from "@/types/itineraryDetails";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";

/* ---------------- Types ---------------- */

interface PlacesToEatSectionProps {
    /** All food suggestions from the itinerary */
    allFoodSuggestions: ItineraryFoodSuggestion[];
    /** Items for the currently selected day */
    dayItems: ItineraryItem[];
    /** Handler when a food place is pressed */
    onFoodPress: (experienceId: number) => void;
    /** Maximum number of suggestions to display */
    maxSuggestions?: number;
    /** Card width */
    cardWidth?: number;
}

/* ---------------- Component ---------------- */

export function PlacesToEatSection({
    allFoodSuggestions,
    dayItems,
    onFoodPress,
    maxSuggestions = 10,
    cardWidth = 240,
}: PlacesToEatSectionProps) {
    // Filter suggestions relevant to the current day's activities
    const filteredSuggestions = useMemo(() => {
        const dayExpIds = new Set(dayItems.map((i) => i.experience_id));

        const filtered = allFoodSuggestions.filter((fs) => {
            if (!fs) return false;
            // Show if near_experience_id is null (general suggestion) or matches a day activity
            if (fs.near_experience_id == null) return true;
            return dayExpIds.has(fs.near_experience_id);
        });

        // Sort by sort_order
        return filtered
            .slice()
            .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
    }, [allFoodSuggestions, dayItems]);

    // Find the closest activity to this food suggestion by distance
    const getClosestItem = (suggestion: ItineraryFoodSuggestion): { item: ItineraryItem; distance: number } | null => {
        if (suggestion.destination_latitude == null || suggestion.destination_longitude == null) {
            return null;
        }

        let closestItem: ItineraryItem | null = null;
        let closestDistance = Infinity;

        for (const item of dayItems) {
            if (item.destination_latitude == null || item.destination_longitude == null) {
                continue;
            }

            const distance = haversineKm(
                Number(suggestion.destination_latitude),
                Number(suggestion.destination_longitude),
                Number(item.destination_latitude),
                Number(item.destination_longitude)
            );

            if (distance < closestDistance) {
                closestDistance = distance;
                closestItem = item;
            }
        }

        if (!closestItem) return null;
        return { item: closestItem, distance: closestDistance };
    };

    // Filter suggestions within max distance
    const MAX_DISTANCE_KM = 5;

    const suggestionsWithDistance = useMemo(() => {
        return filteredSuggestions
            .map((suggestion) => {
                const closest = getClosestItem(suggestion);
                return { suggestion, closest };
            })
            .filter(({ closest }) => closest !== null && closest.distance <= MAX_DISTANCE_KM);
    }, [filteredSuggestions, dayItems]);

    const hasSuggestions = suggestionsWithDistance.length > 0;

    return (
        <View className="mt-8">
            {/* Header */}
            <View className="mb-3">
                <Text className="font-onest-semibold text-xl text-black/90">
                    Places to eat
                </Text>
                <Text className="text-black/50 font-onest text-sm mt-0.5">
                    Suggestions near your trip
                </Text>
            </View>

            {/* Content */}
            {hasSuggestions ? (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="flex-row"
                    contentContainerStyle={{ paddingRight: 16 }}
                >
                    {suggestionsWithDistance.slice(0, maxSuggestions).map(({ suggestion, closest }, idx) => (
                        <FoodSuggestionCard
                            key={`food-${suggestion.experience_id}-${idx}`}
                            suggestion={suggestion}
                            nearItem={closest?.item || null}
                            onPress={onFoodPress}
                            width={cardWidth}
                        />
                    ))}
                </ScrollView>
            ) : (
                <PlacesToEatEmptyState />
            )}
        </View>
    );
}

/* ---------------- Empty State ---------------- */

function PlacesToEatEmptyState() {
    return (
        <View className="py-10 items-center bg-gray-50 border border-gray-200 rounded-2xl">
            <Ionicons name="restaurant-outline" size={26} color="#9CA3AF" />
            <Text className="text-black/90 font-onest-medium mt-2">
                No dining suggestions
            </Text>
            <Text className="text-black/50 font-onest text-sm mt-1 text-center px-6">
                We couldn't find suggested places to eat for this trip yet.
            </Text>
        </View>
    );
}

export { PlacesToEatEmptyState };

