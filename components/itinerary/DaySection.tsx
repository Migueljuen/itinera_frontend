// 8. DaySection component (components/itinerary/DaySection.tsx)
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Image, Text, TouchableOpacity, View } from 'react-native';
import type { Itinerary, ItineraryItem } from '../../types/itineraryTypes';
import { getItemWarningStatus } from '../../utils/conflictChecker';
import {
    formatTime,
    getDateForDay,
    getImageUri,
    isDayPast,
    isItemOngoing,
    isItemPast
} from '../../utils/itineraryUtils';

interface Props {
    day: number;
    items: ItineraryItem[];
    itinerary: Itinerary;
    allItems: ItineraryItem[];
    onEditTime: (item: ItineraryItem) => void;
    onRemoveItem: (itemId: number) => void;
}

export const DaySection: React.FC<Props> = ({
    day,
    items,
    itinerary,
    allItems,
    onEditTime,
    onRemoveItem
}) => {
    const dayIsPast = isDayPast(day, itinerary);

    const handleRemoveExperience = (item: ItineraryItem) => {
        if (isItemPast(item, itinerary)) {
            const now = new Date();
            const startDate = new Date(itinerary.start_date);
            const itemDate = new Date(startDate);
            itemDate.setDate(startDate.getDate() + item.day_number - 1);

            const itemEndDate = new Date(itemDate);
            const [endHours, endMinutes] = item.end_time.split(':').map(Number);
            itemEndDate.setHours(endHours, endMinutes, 0, 0);

            const message = now < itemEndDate
                ? "This activity is currently in progress and cannot be removed."
                : "This activity has already occurred and cannot be removed.";

            Alert.alert("Cannot Remove Activity", message, [{ text: "OK" }]);
            return;
        }

        Alert.alert(
            "Remove Experience",
            "Are you sure you want to remove this experience from your itinerary?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => onRemoveItem(item.item_id)
                }
            ]
        );
    };

    return (
        <View className="mb-6 rounded-lg overflow-hidden border border-gray-200">
            {/* Day Header */}
            <View className={`p-4 border-b border-gray-100 ${dayIsPast ? 'bg-gray-100' : 'bg-white'}`}>
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-lg font-onest-semibold text-gray-800">Day {day}</Text>
                        <Text className="text-sm text-gray-500 font-onest">
                            {getDateForDay(day, itinerary)}
                        </Text>
                    </View>
                    {dayIsPast && (
                        <View className="bg-gray-200 px-2 py-1 rounded">
                            <Text className="text-xs font-onest-medium text-gray-600">Completed</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Day Items */}
            {items
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map((item, index) => {
                    const itemIsPast = isItemPast(item, itinerary);
                    const warning = !itemIsPast ? getItemWarningStatus(item, allItems) : null;

                    return (
                        <View
                            key={`${day}-${item.item_id}-${index}`}
                            className={`p-4 ${index !== items.length - 1 ? 'border-b border-gray-100' : ''} ${itemIsPast ? 'bg-gray-50' : 'bg-white'
                                }`}
                        >
                            <View className="flex-row">
                                {/* Time Column */}
                                <TouchableOpacity
                                    className="w-20 items-center mr-4"
                                    onPress={() => onEditTime(item)}
                                    disabled={itemIsPast}
                                >
                                    <View className={`rounded-md p-2 items-center ${itemIsPast ? 'bg-gray-100' : 'bg-indigo-50'
                                        }`}>
                                        <Ionicons
                                            name="time-outline"
                                            size={14}
                                            color={itemIsPast ? "#9CA3AF" : "#4F46E5"}
                                        />
                                        <Text className={`text-xs font-onest-medium mt-1 ${itemIsPast ? 'text-gray-500' : 'text-primary'
                                            }`}>
                                            {formatTime(item.start_time)}
                                        </Text>
                                        <Text className="text-xs text-gray-500 font-onest">
                                            {formatTime(item.end_time)}
                                        </Text>
                                    </View>

                                    {/* Warning Indicator */}
                                    {warning && (
                                        <View className={`mt-1 px-2 py-1 rounded ${warning.type === 'error' ? 'bg-red-100' : 'bg-orange-100'
                                            }`}>
                                            <Text className={`text-xs font-onest-medium ${warning.type === 'error' ? 'text-red-600' : 'text-orange-600'
                                                }`}>
                                                {warning.message}
                                            </Text>
                                        </View>
                                    )}

                                    {!itemIsPast && (
                                        <Text className="text-xs text-primary font-onest mt-1">Change time</Text>
                                    )}
                                    {itemIsPast && !isItemOngoing(item, itinerary) && (
                                        <Text className="text-xs text-gray-400 font-onest mt-1">Past activity</Text>
                                    )}
                                    {isItemOngoing(item, itinerary) && (
                                        <Text className="text-xs text-orange-500 font-onest mt-1">Ongoing</Text>
                                    )}
                                </TouchableOpacity>

                                {/* Content Column */}
                                <View className="flex-1">
                                    {/* Experience Image */}
                                    {item.primary_image ? (
                                        <Image
                                            source={{ uri: getImageUri(item.primary_image) }}
                                            className="w-full h-32 rounded-md mb-3"
                                            resizeMode="cover"
                                            style={itemIsPast ? { opacity: 0.7 } : {}}
                                        />
                                    ) : (
                                        <View className="w-full h-32 bg-gray-200 items-center justify-center rounded-md mb-3">
                                            <Ionicons name="image-outline" size={40} color="#A0AEC0" />
                                        </View>
                                    )}

                                    {/* Experience Details */}
                                    <View className="flex-row justify-between items-start mb-2">
                                        <View className="flex-1 mr-2">
                                            <Text className={`text-lg font-onest-semibold mb-1 ${itemIsPast ? 'text-gray-600' : 'text-gray-800'
                                                }`}>
                                                {item.experience_name}
                                            </Text>
                                            <Text className={`text-sm font-onest mb-2 ${itemIsPast ? 'text-gray-500' : 'text-gray-600'
                                                }`}>
                                                {item.experience_description}
                                            </Text>
                                        </View>

                                        {/* Remove Button */}
                                        <TouchableOpacity
                                            onPress={() => handleRemoveExperience(item)}
                                            className={`p-2 rounded-md ${itemIsPast ? 'bg-gray-100' : 'bg-red-50'
                                                }`}
                                            disabled={itemIsPast}
                                        >
                                            <Ionicons
                                                name="trash-outline"
                                                size={16}
                                                color={itemIsPast ? "#9CA3AF" : "#EF4444"}
                                            />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Location */}
                                    <View className="flex-row items-center mb-2">
                                        <Ionicons
                                            name="location-outline"
                                            size={16}
                                            color={itemIsPast ? "#9CA3AF" : "#4F46E5"}
                                        />
                                        <Text className={`text-sm font-onest ml-1 ${itemIsPast ? 'text-gray-500' : 'text-gray-600'
                                            }`}>
                                            {item.destination_name}, {item.destination_city}
                                        </Text>
                                    </View>

                                    {/* Custom Note */}
                                    {item.custom_note && (
                                        <View className={`rounded-md p-2 mt-2 ${itemIsPast ? 'bg-gray-100' : 'bg-indigo-50'
                                            }`}>
                                            <Text className={`text-xs font-onest-medium mb-1 ${itemIsPast ? 'text-gray-600' : 'text-primary'
                                                }`}>
                                                Note
                                            </Text>
                                            <Text className={`text-xs font-onest ${itemIsPast ? 'text-gray-600' : 'text-primary'
                                                }`}>
                                                {item.custom_note}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Status Badges */}
                                    {itemIsPast && !isItemOngoing(item, itinerary) && (
                                        <View className="bg-gray-200 self-start px-2 py-1 rounded mt-2">
                                            <Text className="text-xs font-onest-medium text-gray-600">Completed</Text>
                                        </View>
                                    )}
                                    {isItemOngoing(item, itinerary) && (
                                        <View className="bg-orange-100 self-start px-2 py-1 rounded mt-2">
                                            <Text className="text-xs font-onest-medium text-orange-600">In Progress</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    );
                })}
        </View>
    );
};