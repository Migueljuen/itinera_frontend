// components/itinerary/ItineraryItemCard.tsx

import { ItineraryItem } from '@/types/itineraryDetails';
import { formatTime } from '@/utils/itinerary-utils';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface Props {
    item: ItineraryItem;
    isLast: boolean;
    onPress: () => void;
    onNavigate: () => void;
    isCompleted?: boolean;
}

export function ItineraryItemCard({
    item,
    isLast,
    onPress,
    onNavigate,
    isCompleted = false,
}: Props) {
    const hasCoordinates = item.destination_latitude && item.destination_longitude;
    const startTimeDisplay = formatTime(item.start_time);
    const endTimeDisplay = formatTime(item.end_time);

    return (
        <Pressable onPress={onPress}>
            <View className="flex-row">
                {/* Timeline Column */}
                <View className="w-6 items-center mr-3">
                    {/* Dot */}
                    <View
                        className={`
                            w-3 h-3 rounded-full mt-2 z-10
                            ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}
                        `}
                    />

                    {/* Connecting line - extends from dot to bottom */}
                    {!isLast && (
                        <View
                            style={{
                                flex: 1,
                                width: 1,
                                backgroundColor: '#d1d5db',
                                marginTop: 2,
                            }}
                        />
                    )}
                </View>

                {/* Content Column */}
                <View className="flex-1 pb-6">
                    {/* Experience Details */}
                    <Text
                        className={`text-2xl font-onest mb-1 ${isCompleted ? 'text-black/50' : 'text-black/90'
                            }`}
                        numberOfLines={1}
                    >
                        {item.experience_name}
                    </Text>

                    {/* Location */}
                    <View className="flex-row items-center">
                        <Ionicons
                            name="location-outline"
                            size={14}
                            color={isCompleted ? '#9CA3AF' : '#4F46E5'}
                        />
                        <Text
                            className={`text-sm font-onest ml-1 ${isCompleted ? 'text-black/50' : 'text-black/50'
                                }`}
                            numberOfLines={1}
                        >
                            {`${item.destination_name}, ${item.destination_city}`}
                        </Text>
                    </View>

                    {/* Time Details */}
                    <View className="mt-8 flex flex-row items-baseline justify-between">
                        <Text
                            className={`text-2xl font-onest mb-1 ${isCompleted ? 'text-black/50' : 'text-black/90'
                                }`}
                            numberOfLines={1}
                        >
                            {startTimeDisplay} - {endTimeDisplay}
                        </Text>
                        <View
                            style={{ backgroundColor: '#000000cc' }}
                            className="rounded-2xl px-4 py-3"
                        >
                            <Ionicons name="arrow-forward-outline" size={24} color="#ffffffcc" />
                        </View>
                    </View>
                </View>
            </View>
        </Pressable>
    );
}