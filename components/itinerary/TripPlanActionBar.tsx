// components/itinerary/TripPlanActionBar.tsx

import { ItineraryItem } from '@/types/itineraryDetails';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TripPlanActionBarProps {
    items: ItineraryItem[];
    dayNumber: number;
    isCompleted: boolean;
    onNavigateAll: (items: ItineraryItem[]) => void;
    onNavigateSingle: (item: ItineraryItem) => void;
    onShowFoodStops: (dayNumber: number, items: ItineraryItem[]) => void;
}

export function TripPlanActionBar({
    items,
    dayNumber,
    isCompleted,
    onNavigateAll,
    onNavigateSingle,
    onShowFoodStops,
}: TripPlanActionBarProps) {
    const insets = useSafeAreaInsets();

    // Don't show action bar for completed days or if no items
    if (isCompleted || items.length === 0) {
        return null;
    }

    const hasMultipleStops = items.length > 1;
    const hasCoordinates = items.some(
        (item) => item.destination_latitude && item.destination_longitude
    );

    // Get the first item with coordinates for single navigation
    const navigableItem = items.find(
        (item) => item.destination_latitude && item.destination_longitude
    );

    // Don't show if no navigable items
    if (!hasCoordinates || !navigableItem) {
        return null;
    }

    const handleNavigate = () => {
        console.log('All waypoints:');
        if (hasMultipleStops) {
            onNavigateAll(items);
        } else {
            onNavigateSingle(navigableItem);
        }
    };

    const handleFoodStops = () => {
        console.log('0. Button pressed');
        onShowFoodStops(dayNumber, items);
    };

    return (
        <View
            className="absolute bg-[#fff] bottom-0 left-0 right-0"
            style={{
                paddingBottom: insets.bottom || 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -12 },  // Shadow goes upward
                shadowOpacity: 0.04,                      // Very subtle
                shadowRadius: 8,                          // Soft blur
                elevation: 4,                             // Android shadow
            }}
        >
            <View className="flex flex-row  justify-between  pt-8">
                {/* Navigate Button */}
                <Pressable
                    onPress={handleNavigate}
                    className="flex-1 flex-row items-center justify-center "
                >
                    <Ionicons name="navigate" size={18} color="#000000cc" />
                    <Text className="text-black/90 font-onest-medium ml-2 text-base">
                        {hasMultipleStops ? 'Navigate All' : 'Navigate'}
                    </Text>
                </Pressable>

                {/* Food Stops Button */}
                <Pressable
                    onPress={handleFoodStops}
                    className="flex-1 flex-row items-center justify-center"
                >
                    <Ionicons name="restaurant-outline" size={18} color="#000000cc" />
                    <Text className="text-black/90 font-onest-medium ml-2 text-base">
                        {hasMultipleStops ? 'Food Stops' : 'Food on Route'}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}