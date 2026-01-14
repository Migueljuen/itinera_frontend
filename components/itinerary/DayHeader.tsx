// components/itinerary/DayHeader.tsx

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface DayStyles {
    container: string;
    text: string;
    indicator?: string;
}

interface Props {
    dayNumber: number;
    dateString: string;
    itemCount: number;
    isCollapsed: boolean;
    dayStyles: DayStyles;
    hasMultipleStops: boolean;
    hasCoordinates: boolean;
    onToggleCollapse: () => void;
    onNavigateAll: () => void;
    onShowFoodStops: () => void;
}

export function DayHeader({
    dayNumber,
    dateString,
    itemCount,
    isCollapsed,
    dayStyles,
    hasMultipleStops,
    hasCoordinates,
    onToggleCollapse,
    onNavigateAll,
    onShowFoodStops,
}: Props) {
    const showNavigationButtons = hasMultipleStops && hasCoordinates && !isCollapsed;

    return (
        <Pressable
            className={`border-b border-gray-100 ${dayStyles.container}`}
            onPress={onToggleCollapse}
        >
            <View className="bg-[#fff] p-4">
                {/* First Row: Day info and chevron */}
                <View className="flex-row justify-between items-center">
                    <View className="flex-1 flex-row items-center">
                        <Ionicons
                            name={isCollapsed ? 'chevron-forward' : 'chevron-down'}
                            size={20}
                            color="#6B7280"
                            style={{ marginRight: 8 }}
                        />
                        <View className="flex-1">
                            <View className="flex-row items-center flex-wrap justify-between">
                                <Text className={`text-lg font-onest-semibold ${dayStyles.text} mr-2`}>
                                    Day {dayNumber}
                                </Text>
                                {dayStyles.indicator && (
                                    <Text className="text-xs text-black/50 font-onest">
                                        {dayStyles.indicator}
                                    </Text>
                                )}
                            </View>
                            <Text className="text-sm text-black/50 font-onest">
                                {dateString} • {itemCount} {itemCount > 1 ? 'activities' : 'activity'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Navigation Buttons */}
                {showNavigationButtons && (
                    <View className="flex-row items-center mt-3 gap-2">
                        <Pressable
                            className="bg-primary rounded-full px-4 py-2 flex-row items-center"
                            onPress={(e) => {
                                e.stopPropagation();
                                onNavigateAll();
                            }}
                        >
                            <Ionicons name="navigate" size={16} color="#E5E7EB" />
                            <Text className="text-gray-200 font-onest-medium ml-2 text-sm">
                                Navigate All
                            </Text>
                        </Pressable>

                        <Pressable
                            className="bg-blue-500 rounded-full px-4 py-2 flex-row items-center"
                            onPress={(e) => {
                                e.stopPropagation();
                                onShowFoodStops();
                            }}
                        >
                            <Ionicons name="restaurant" size={16} color="#FFF" />
                            <Text className="text-white font-onest-medium ml-2 text-sm">
                                Food Stops
                            </Text>
                        </Pressable>
                    </View>
                )}
            </View>
        </Pressable>
    );
}