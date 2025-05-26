import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import API_URL from '../constants/api'; // Your API base URL
import { ItineraryItem } from '../types/itineraryTypes'; // Import your types

// Type definitions
type TimeSlot = {
  slot_id?: number;
  availability_id?: number;
  start_time: string;
  end_time: string;
};

type AvailabilityDay = {
  availability_id?: number;
  experience_id?: number;
  day_of_week: string;
  time_slots: TimeSlot[];
};


type AvailabilityData = {
    availability: AvailabilityDay[];
};

type SelectedTimeSlot = {
    day_of_week: string;
    date: Date;
    day_number: number;
    start_time: string;
    end_time: string;
};

interface AvailabilityCalendarProps {
    experienceId: number;
    tripStartDate: string; // Format: 'YYYY-MM-DD'
    tripEndDate: string;   // Format: 'YYYY-MM-DD'
    selectedItems: ItineraryItem[]; // Currently selected items for this experience
    onTimeSlotSelect: (item: ItineraryItem) => void;
    onTimeSlotDeselect: (item: ItineraryItem) => void;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ 
    experienceId, 
    tripStartDate, 
    tripEndDate,
    selectedItems,
    onTimeSlotSelect,
    onTimeSlotDeselect
}) => {
    console.log('AvailabilityCalendar rendered with:', {
        experienceId,
        tripStartDate,
        tripEndDate,
        selectedItemsCount: selectedItems?.length
    });
    // State for availability data
    const [availabilityData, setAvailabilityData] = useState<AvailabilityData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedDay, setExpandedDay] = useState<string | null>(null);

    // Parse trip dates
    const tripStart = new Date(tripStartDate);
    const tripEnd = new Date(tripEndDate);

    // Fetch availability data
    useEffect(() => {
        const fetchAvailability = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_URL}/experience/availability/${experienceId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch availability data');
                }
                const data = await response.json();
                setAvailabilityData(data);
            } catch (error) {
                console.error('Error fetching availability data:', error);
                setError('Could not load availability information');
            } finally {
                setLoading(false);
            }
        };

        fetchAvailability();
    }, [experienceId]);

    // Format time function (converts "10:24:00" to "10:24 AM")
    const formatTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minutes} ${ampm}`;
    };

    // Convert time to HH:mm format for form data
    const convertToFormTimeFormat = (timeString: string) => {
        const [hours, minutes] = timeString.split(':');
        return `${hours}:${minutes}`;
    };

    // Get dates within the trip period
    const getTripDates = () => {
        const dates = [];
        const currentDate = new Date(tripStart);
        
        while (currentDate <= tripEnd) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return dates;
    };

    const tripDates = getTripDates();

    // Calculate day number relative to trip start
    const getDayNumber = (date: Date) => {
        const diffTime = date.getTime() - tripStart.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1; // 1-based indexing
    };

    // Order days of week correctly
    const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    // Toggle expanded day
    const toggleDayExpansion = (day: string) => {
        if (expandedDay === day) {
            setExpandedDay(null);
        } else {
            setExpandedDay(day);
        }
    };

    // Check if a time slot is selected
    const isTimeSlotSelected = (date: Date, startTime: string, endTime: string) => {
        const dayNumber = getDayNumber(date);
        const formattedStartTime = convertToFormTimeFormat(startTime);
        const formattedEndTime = convertToFormTimeFormat(endTime);
        
        return selectedItems.some(item => 
            item.experience_id === experienceId &&
            item.day_number === dayNumber &&
            item.start_time === formattedStartTime &&
            item.end_time === formattedEndTime
        );
    };

    // Handle time slot selection/deselection
    const handleTimeSlotPress = (date: Date, startTime: string, endTime: string) => {
        const dayNumber = getDayNumber(date);
        const formattedStartTime = convertToFormTimeFormat(startTime);
        const formattedEndTime = convertToFormTimeFormat(endTime);
        
        const newItem: ItineraryItem = {
            experience_id: experienceId,
            day_number: dayNumber,
            start_time: formattedStartTime,
            end_time: formattedEndTime
        };

        if (isTimeSlotSelected(date, startTime, endTime)) {
            // Deselect
            onTimeSlotDeselect(newItem);
        } else {
            // Select
            onTimeSlotSelect(newItem);
        }
    };

    if (loading) {
        return (
            <View className="py-8 items-center justify-center">
                <ActivityIndicator size="large" color="#0000ff" />
                <Text className="mt-2 text-gray-600">Loading availability...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View className="py-8 items-center justify-center">
                <Text className="text-red-500">{error}</Text>
            </View>
        );
    }

    // If no availability data or empty array
    if (!availabilityData || !availabilityData.availability || availabilityData.availability.length === 0) {
        return (
            <View className="py-8 bg-gray-50 rounded-lg items-center justify-center">
                <Text className="text-gray-600">No availability information found for this experience.</Text>
            </View>
        );
    }

    // Sort availability by day of week
    const sortedAvailability = [...availabilityData.availability].sort(
        (a, b) => daysOrder.indexOf(a.day_of_week) - daysOrder.indexOf(b.day_of_week)
    );

    return (
        <View className="mb-6">
            <View className="bg-blue-600 py-4 px-4 rounded-t-xl">
                <View className="flex-row items-center justify-between">
                    <Text className="text-white text-xl font-semibold">Availability</Text>
                    <Text className="text-blue-100">
                        {tripStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </Text>
                </View>
            </View>

            {/* Calendar Trip Dates View */}
            <View className="bg-white rounded-b-xl shadow-md overflow-hidden">
                {tripDates.map((date, index) => {
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                    const dayAvailability = sortedAvailability.find(item => item.day_of_week === dayName);
                    const hasAvailability = !!dayAvailability;
                    const isExpanded = expandedDay === dayName;
                    const dayNumber = getDayNumber(date);

                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={() => hasAvailability && toggleDayExpansion(dayName)}
                            activeOpacity={hasAvailability ? 0.7 : 1}
                            className={`border-b border-gray-100 ${hasAvailability ? 'bg-white' : 'bg-gray-50'}`}
                        >
                            <View className="flex-row items-center justify-between p-4">
                                <View className="flex-row items-center">
                                    <View className={`w-10 h-10 rounded-full ${hasAvailability ? 'bg-blue-100' : 'bg-gray-200'} items-center justify-center mr-3`}>
                                        <Text className={`font-bold ${hasAvailability ? 'text-blue-800' : 'text-gray-500'}`}>
                                            {date.getDate()}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text className={`font-medium ${hasAvailability ? 'text-gray-800' : 'text-gray-400'}`}>
                                            {dayName} (Day {dayNumber})
                                        </Text>
                                        <Text className={`text-xs ${hasAvailability ? 'text-gray-600' : 'text-gray-400'}`}>
                                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </Text>
                                    </View>
                                </View>

                                {hasAvailability && (
                                    <View className="flex-row items-center">
                                        <View className="bg-green-100 px-3 py-1 rounded-full mr-2">
                                            <Text className="text-green-800 text-xs font-medium">Available</Text>
                                        </View>
                                        <Text className="text-gray-400 text-xs">
                                            {isExpanded ? '▼' : '▶'}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Expanded view with all time slots */}
                            {hasAvailability && isExpanded && (
                                <View className="p-4 space-y-2">
                                    {dayAvailability.time_slots.map((slot, idx) => {
                                        const isSelected = isTimeSlotSelected(date, slot.start_time, slot.end_time);
                                        
                                        return (
                                            <TouchableOpacity
                                                key={idx}
                                                onPress={() => handleTimeSlotPress(date, slot.start_time, slot.end_time)}
                                                className={`rounded-lg p-3 mb-1 border ${
                                                    isSelected 
                                                        ? 'bg-blue-100 border-blue-500' 
                                                        : 'bg-blue-50 border-gray-100'
                                                }`}
                                                activeOpacity={0.7}
                                            >
                                                <View className="flex-row items-center justify-between">
                                                    <Text className={`font-medium ${
                                                        isSelected ? 'text-blue-800' : 'text-gray-800'
                                                    }`}>
                                                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                                    </Text>
                                                    {isSelected && (
                                                        <View className="bg-blue-500 w-6 h-6 rounded-full items-center justify-center">
                                                            <Text className="text-white text-xs font-bold">✓</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

export default AvailabilityCalendar;