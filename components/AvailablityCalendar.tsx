import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import API_URL from '../constants/api'; // Your API base URL

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

const AvailabilityCalendar = ({ experienceId }: { experienceId: number }) => {
    // State for availability data
    const [availabilityData, setAvailabilityData] = useState<AvailabilityData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedDay, setExpandedDay] = useState<string | null>(null);

    // Current date for display context
    const [currentDate] = useState(new Date());

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

    // Find the current week's dates
    const getWeekDates = () => {
        const dates = [];
        const currentDay = currentDate.getDay(); // 0 is Sunday, 1 is Monday, etc.
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Calculate days to Monday

        const monday = new Date(currentDate);
        monday.setDate(currentDate.getDate() + mondayOffset);

        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            dates.push(date);
        }

        return dates;
    };

    const weekDates = getWeekDates();

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
            <View className="bg-blue-600 py-4 px-4 rounded-t-xl ">
                <View className="flex-row items-center justify-between">
                    <Text className="text-normal text-xl font-semibold">Availability</Text>
                    <Text className="text-blue-100">
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </Text>
                </View>
            </View>

            {/* Calendar Week View */}
            <View className="bg-white rounded-b-xl shadow-md overflow-hidden">
                {weekDates.map((date, index) => {
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                    const dayAvailability = sortedAvailability.find(item => item.day_of_week === dayName);
                    const hasAvailability = !!dayAvailability;
                    const isExpanded = expandedDay === dayName;

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
                                            {dayName}
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
                                    {dayAvailability.time_slots.map((slot, idx) => (
                                        <View key={idx} className="bg-blue-50 rounded-lg p-3 mb-1 border border-gray-100">
                                            <Text className="text-normal font-medium">
                                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                            </Text>
                                        </View>
                                    ))}
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
