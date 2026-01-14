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
        <Pressable

            onPress={onPress}
        >
            <View className="flex-row ">
                {/* Time Column */}
                <View className="w-16 hidden items-center mr-3">
                    <View className={`rounded-lg p-2 items-center ${isCompleted ? 'bg-gray-100' : 'bg-indigo-50'}`}>
                        <Ionicons
                            name={isCompleted ? 'checkmark-circle' : 'time-outline'}
                            size={14}
                            color={isCompleted ? '#10B981' : '#4F46E5'}
                        />
                        <Text
                            className={`text-xs font-onest-medium mt-1 ${isCompleted ? 'text-gray-500' : 'text-primary'
                                }`}
                        >
                            {startTimeDisplay}
                        </Text>
                        <Text className="text-xs text-gray-400 font-onest">{endTimeDisplay}</Text>
                    </View>

                    {/* Quick Navigation Button */}
                    {hasCoordinates && !isCompleted && (
                        <Pressable
                            className="mt-2 bg-primary/10 p-2 rounded-lg"
                            onPress={(e) => {
                                e.stopPropagation();
                                onNavigate();
                            }}
                        >
                            <Ionicons name="navigate" size={14} color="#4F46E5" />
                        </Pressable>
                    )}
                </View>

                {/* Content Column */}
                <View className="flex-1 mt-6">
                    {/* Experience Image */}
                    {/* {item.primary_image ? (
                        <View className="relative">
                            <Image
                                source={{ uri: getImageUri(item.primary_image, API_URL) }}
                                className={`w-full h-28 rounded-lg mb-2 ${isCompleted ? 'opacity-70' : ''}`}
                                resizeMode="cover"
                            />
                            {isCompleted && (
                                <View className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                                    <Ionicons name="checkmark" size={12} color="white" />
                                </View>
                            )}
                        </View>
                    ) : (
                        <View
                            className={`w-full h-28 rounded-lg mb-2 items-center justify-center ${isCompleted ? 'bg-gray-100' : 'bg-gray-200'
                                }`}
                        >
                            <Ionicons name="image-outline" size={32} color="#9CA3AF" />
                        </View>
                    )} */}

                    {/* Experience Details */}
                    <Text
                        className={`text-2xl font-onest mb-1 ${isCompleted ? 'text-gray-500' : 'text-gray-900'
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
                            className={`text-sm font-onest ml-1 ${isCompleted ? 'text-gray-400' : 'text-gray-500'
                                }`}
                            numberOfLines={1}
                        >
                            {`${item.destination_name}, ${item.destination_city}`}
                        </Text>
                    </View>


                    {/* time Details */}

                    <View className='mt-8 flex flex-row items-baseline justify-between'>
                        <Text
                            className={`text-2xl  font-onest mb-1 ${isCompleted ? 'text-gray-500' : 'text-gray-900'}`}
                            numberOfLines={1}
                        >
                            {startTimeDisplay} - {endTimeDisplay}
                        </Text>
                        <View style={{ backgroundColor: '#000000cc' }} className=' rounded-2xl px-4 py-3'>
                            <Ionicons name="arrow-forward-outline" size={24} color="#ffffffcc" />
                        </View>
                    </View>

                </View>
            </View>
        </Pressable>
    );
}