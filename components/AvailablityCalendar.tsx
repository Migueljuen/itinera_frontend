import { Ionicons } from '@expo/vector-icons';
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

    // Convert time string to minutes for sorting
    const timeToMinutes = (timeString: string) => {
        const [hours, minutes] = timeString.split(':').map(num => parseInt(num, 10));
        return hours * 60 + minutes;
    };

    // Sort time slots by start time
    const sortTimeSlots = (slots: TimeSlot[]) => {
        return [...slots].sort((a, b) => {
            return timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
        });
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
            <View className="py-16 items-center justify-center">
                <ActivityIndicator size="large" color="#1f2937" />
                <Text className="mt-4 text-gray-600 font-onest">Loading availability...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View className="py-16 items-center justify-center bg-white rounded-2xl mx-4">
                <Ionicons name="warning-outline" size={48} color="#EF4444" />
                <Text className="text-red-500 font-onest-medium text-center mt-4 px-8">{error}</Text>
                <Text className="text-gray-400 font-onest text-center mt-2">Please try again later</Text>
            </View>
        );
    }

    // If no availability data or empty array
    if (!availabilityData || !availabilityData.availability || availabilityData.availability.length === 0) {
        return (
            <View className="py-16 bg-white rounded-2xl mx-4 items-center justify-center">
                <Ionicons name="calendar-outline" size={48

                } color="#9CA3AF" />
                <Text className="text-gray-600 font-onest-medium text-center mt-4">No availability found</Text>
                <Text className="text-gray-400 font-onest text-center mt-2 px-8">This experience has no available time slots for your trip dates.</Text>
            </View>
        );
    }

    // Sort availability by day of week
    const sortedAvailability = [...availabilityData.availability].sort(
        (a, b) => daysOrder.indexOf(a.day_of_week) - daysOrder.indexOf(b.day_of_week)
    );

    // Count total selected slots for this experience
    const selectedSlotsCount = selectedItems.filter(item => item.experience_id === experienceId).length;

    return (
        <View className=" mb-6">
            {/* Header */}
            <View className="bg-white  rounded-2xl  overflow-hidden"
                style={{

                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                    elevation: 4,
                }}
            >
                {/* <View className="bg-primary py-5 px-6">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <Ionicons name="calendar" size={18} color="#E5E7EB" />

                        </View>
                        <View className=" px-3 py-1.5 rounded-full">
                            <Text className="text-white font-onest-medium text-sm">
                                {tripStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </Text>
                        </View>
                    </View>


                </View> */}

                {/* Calendar Trip Dates View */}
                <View className="bg-white">
                    {tripDates.map((date, index) => {
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                        const dayAvailability = sortedAvailability.find(item => item.day_of_week === dayName);
                        const hasAvailability = !!dayAvailability;
                        const isExpanded = expandedDay === dayName;
                        const dayNumber = getDayNumber(date);
                        const daySelectedCount = selectedItems.filter(item =>
                            item.experience_id === experienceId && item.day_number === dayNumber
                        ).length;

                        // Sort the time slots for this day
                        const sortedTimeSlots = dayAvailability ? sortTimeSlots(dayAvailability.time_slots) : [];

                        return (
                            <View key={index}>
                                <TouchableOpacity
                                    onPress={() => hasAvailability && toggleDayExpansion(dayName)}
                                    activeOpacity={hasAvailability ? 0.7 : 1}
                                    className={`${index !== tripDates.length - 1 ? 'border-b border-gray-100' : ''} ${hasAvailability ? 'bg-white' : 'bg-gray-50'
                                        }`}
                                >
                                    <View className="flex-row items-center justify-between  py-6">
                                        <View className="flex-row items-center flex-1">
                                            {/* <View className={`w-16 rounded-2xl ${hasAvailability ? 'bg-indigo-50' : 'bg-gray-100'
                                                } items-center justify-center mr-4`}>
                                                <Text className={`font-onest-semibold text-lg ${hasAvailability ? 'text-primary' : 'text-gray-400'
                                                    }`}>
                                                    {date.getDate()}
                                                </Text>
                                            </View> */}
                                            <View className="flex-1">
                                                <Text className={`font-onest-medium text-base ${hasAvailability ? 'text-gray-800' : 'text-gray-400'
                                                    }`}>
                                                    {dayName}
                                                </Text>
                                                <Text className={`text-sm font-onest ${hasAvailability ? 'text-gray-500' : 'text-gray-400'
                                                    }`}>
                                                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} •
                                                </Text>
                                            </View>
                                        </View>

                                        <View className="flex-row items-center">
                                            {hasAvailability ? (
                                                <>

                                                    <View className="bg-green-100 px-3 py-1.5 rounded-full mr-3">
                                                        <Text className="text-green-700 text-xs font-onest-medium">
                                                            {sortedTimeSlots.length || 0} slots
                                                        </Text>
                                                    </View>
                                                    <Ionicons
                                                        name={isExpanded ? "chevron-up" : "chevron-down"}
                                                        size={20}
                                                        color="#6B7280"
                                                    />
                                                </>
                                            ) : (
                                                <View className="bg-gray-100 px-3 py-1.5 rounded-full">
                                                    <Text className="text-gray-500 text-xs font-onest-medium">Unavailable</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    {/* Expanded view with all time slots */}
                                    {hasAvailability && isExpanded && (
                                        <View className=" pb-6 pt-2">
                                            <View className=" rounded-xl p-4">
                                                <Text className="text-gray-700 font-onest mb-3">
                                                    Available Time Slots
                                                </Text>
                                                <View className="space-y-2">
                                                    {sortedTimeSlots.map((slot, idx) => {
                                                        return (
                                                            <TouchableOpacity
                                                                key={idx}
                                                                onPress={() => handleTimeSlotPress(date, slot.start_time, slot.end_time)}
                                                                className="rounded-xl p-4 mb-2 bg-indigo-50 border border-gray-300"
                                                                activeOpacity={0.7}
                                                            >
                                                                <View className="flex-row items-center">
                                                                    <Ionicons
                                                                        name="time-outline"
                                                                        size={18}
                                                                        color="#1f2937"
                                                                    />
                                                                    <Text className="font-onest-medium text-sm ml-3 text-black/80">
                                                                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                                                    </Text>
                                                                </View>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>
                                            </View>
                                        </View>
                                    )}

                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>
            </View>
        </View>
    );
};

export default AvailabilityCalendar;