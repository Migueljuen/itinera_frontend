import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import API_URL from '../../../constants/api';

// Types matching your API response
interface ItineraryItem {
    item_id: number;
    experience_id: number;
    day_number: number;
    start_time: string;
    end_time: string;
    custom_note: string;
    created_at: string;
    updated_at: string;
    experience_name: string;
    experience_description: string;
    destination_name: string;
    destination_city: string;
    images: string[];
    primary_image: string;
}

interface Itinerary {
    itinerary_id: number;
    traveler_id: number;
    start_date: string;
    end_date: string;
    title: string;
    notes: string;
    created_at: string;
    status: 'upcoming' | 'ongoing' | 'completed';
    items: ItineraryItem[];
}

export default function ItineraryDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [itinerary, setItinerary] = useState<Itinerary | null>(null);

    console.log('Activity ID from params:', id);


    useEffect(() => {
        if (id) {
            fetchItineraryDetails();
        }
    }, [id]);

    const fetchItineraryDetails = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Error", "Authentication token not found");
                router.back();
                return;
            }

            const response = await fetch(`${API_URL}/itinerary/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setItinerary(data.itinerary || data);
        } catch (error) {
            console.error("Error fetching itinerary details:", error);
            Alert.alert("Error", "Failed to load itinerary details");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const formatTimeRange = (startTime: string, endTime: string) => {
        return `${formatTime(startTime)} - ${formatTime(endTime)}`;
    };

    const getDayRange = () => {
        if (!itinerary) return 0;
        const start = new Date(itinerary.start_date);
        const end = new Date(itinerary.end_date);
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
    };

    const groupItemsByDay = () => {
        if (!itinerary?.items) return {};

        return itinerary.items.reduce((acc, item) => {
            if (!acc[item.day_number]) {
                acc[item.day_number] = [];
            }
            acc[item.day_number].push(item);
            return acc;
        }, {} as Record<number, ItineraryItem[]>);
    };

    const getImageUri = (imagePath: string) => {
        if (imagePath.startsWith('http')) {
            return imagePath;
        }
        return `${API_URL}${imagePath}`;
    };

    const getDateForDay = (dayNumber: number) => {
        if (!itinerary) return '';
        const startDate = new Date(itinerary.start_date);
        const targetDate = new Date(startDate);
        targetDate.setDate(startDate.getDate() + dayNumber - 1);
        return targetDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    // Smart edit logic functions
    const getCurrentDay = () => {
        if (!itinerary) return 0;

        const today = new Date();
        const startDate = new Date(itinerary.start_date);

        // Reset time for accurate day comparison
        today.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);

        const timeDiff = today.getTime() - startDate.getTime();
        const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1;

        return Math.max(1, dayDiff); // Day 1 minimum
    };

    const getEditCapabilities = () => {
        if (!itinerary) return { canEdit: false, editType: 'none' };

        switch (itinerary.status) {
            case 'upcoming':
                return {
                    canEdit: true,
                    editType: 'full',
                    message: 'Edit your upcoming trip'
                };

            case 'ongoing':
                const currentDay = getCurrentDay();
                const totalDays = getDayRange();

                return {
                    canEdit: true,
                    editType: 'current_and_future',
                    message: `Edit today and future days (Day ${currentDay}+)`,
                    currentDay,
                    editableDays: Array.from(
                        { length: totalDays - currentDay + 1 },
                        (_, i) => currentDay + i
                    )
                };

            case 'completed':
                return {
                    canEdit: false,
                    editType: 'completed',
                    message: 'Completed trips cannot be edited'
                };

            default:
                return { canEdit: false, editType: 'none' };
        }
    };

    const getEditButtonConfig = () => {
        const capabilities = getEditCapabilities();

        if (!capabilities.canEdit) {
            return {
                disabled: true,
                style: 'bg-gray-300', // Disabled style
                textStyle: 'text-gray-500',
                iconColor: '#9CA3AF',
                text: capabilities.editType === 'completed' ? 'Trip Completed' : 'Cannot Edit'
            };
        }

        return {
            disabled: false,
            style: 'bg-primary', // Active style
            textStyle: 'text-gray-300',
            iconColor: '#E5E7EB',
            text: capabilities.editType === 'full' ? 'Edit Trip' : 'Edit Schedule'
        };
    };

    const handleEditPress = () => {
        const capabilities = getEditCapabilities();

        if (!capabilities.canEdit) {
            // Show informative alert for disabled states
            let alertMessage = '';
            let alertTitle = 'Cannot Edit';

            switch (capabilities.editType) {
                case 'completed':
                    alertTitle = 'Trip Completed';
                    alertMessage = 'Completed trips cannot be modified. You can create a new trip based on this one if needed.';
                    break;
                case 'trip_ending':
                    alertTitle = 'Trip Ending';
                    alertMessage = 'Your trip is ending today. Future trip modifications are not available.';
                    break;
                default:
                    alertMessage = 'This trip cannot be edited at this time.';
            }

            Alert.alert(alertTitle, alertMessage, [
                { text: 'OK', style: 'default' as const },
                ...(capabilities.editType === 'completed' ? [{
                    text: 'Create Similar Trip',
                    style: 'default' as const,
                    onPress: () => router.push(`/(createItinerary)/duplicate/${itinerary!.itinerary_id}` as any)
                }] : [])
            ]);
            return;
        }

        // Navigate to edit screen with capabilities info using router.navigate
        router.navigate({
            pathname: `/(traveler)/(itinerary)/edit/[id]`,
            params: {
                id: itinerary!.itinerary_id.toString(),
                editType: capabilities.editType,
                ...(capabilities.editType === 'current_and_future' && {
                    currentDay: capabilities.currentDay?.toString(),
                    editableDays: capabilities.editableDays?.join(',')
                })
            }
        });
    };

    // Enhanced status indicator with edit hints
    const getStatusIndicatorWithHint = (status: string) => {
        const baseConfig = {
            upcoming: { bg: 'bg-indigo-50', text: 'text-primary', icon: '📅' },
            ongoing: { bg: 'bg-green-50', text: 'text-green-600', icon: '✈️' },
            completed: { bg: 'bg-gray-100', text: 'text-gray-600', icon: '✅' }
        };

        const config = baseConfig[status as keyof typeof baseConfig];
        const capabilities = getEditCapabilities();

        return (
            <View className="items-end">
                <View className={`px-3 py-1 rounded-md ${config.bg}`}>
                    <View className="flex-row items-center">
                        <Text className={`text-xs font-onest-medium capitalize ${config.text}`}>
                            {status}
                        </Text>
                    </View>
                </View>

            </View>
        );
    };

    // Visual indicator for editable vs non-editable days (ongoing trips)
    const getDayHeaderStyle = (dayNumber: number) => {
        const capabilities = getEditCapabilities();

        if (capabilities.editType === 'current_and_future') {
            const isEditable = capabilities.editableDays?.includes(dayNumber);
            const isPast = dayNumber < capabilities.currentDay!;
            const isCurrent = dayNumber === capabilities.currentDay!;

            if (isPast) {
                return {
                    container: 'bg-gray-50 border-l-4 border-gray-300',
                    text: 'text-gray-500',
                    indicator: '✓ Completed'
                };
            } else if (isCurrent) {
                return {
                    container: 'bg-blue-50 border-l-4 border-blue-400',
                    text: 'text-blue-700',
                    indicator: '📍 Today - Editable'
                };
            } else if (isEditable) {
                return {
                    container: 'bg-white border-l-4 border-green-400',
                    text: 'text-gray-800',
                    indicator: '✏️ Editable'
                };
            }
        }

        return {
            container: 'bg-white',
            text: 'text-gray-800',
            indicator: ''
        };
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#4F46E5" />
                    <Text className="mt-4 text-gray-600 font-onest">Loading itinerary...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!itinerary) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="flex-1 justify-center items-center">
                    <Text className="text-center text-gray-500 py-10 font-onest">Itinerary not found</Text>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-primary rounded-lg px-6 py-3"
                        activeOpacity={0.7}
                    >
                        <Text className="text-white font-onest-medium">Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const groupedItems = groupItemsByDay();
    const dayCount = getDayRange();

    return (
        <SafeAreaView className="bg-gray-50">
            <View className="w-full h-screen">
                {/* Header - Consistent with main UI */}
                <View className="p-4 ">
                    <Text className="text-normal text-xl font-onest-semibold text-center">Trip Details</Text>
                </View>

                <View className="w-6 mt-4" />

                <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 142 }}>
                    {/* Trip Header Card - Consistent styling */}
                    <View className="mx-4 mb-6 rounded-lg overflow-hidden border border-gray-200">
                        <View className="p-6 bg-white">
                            <View className="flex-row justify-between items-start mb-4">
                                <View className="flex-1 mr-4">
                                    <Text className="text-2xl font-onest-semibold text-gray-800 mb-2">
                                        {itinerary.title}
                                    </Text>
                                    <View className="flex-row items-center mb-2">
                                        <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                                        <Text className="text-sm text-gray-600 font-onest ml-2">
                                            {formatDate(itinerary.start_date)} - {formatDate(itinerary.end_date)}
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center">
                                        <Ionicons name="globe-outline" size={16} color="#6B7280" />
                                        <Text className="text-sm text-gray-600 font-onest ml-2">
                                            {dayCount} day{dayCount > 1 ? 's' : ''} • {itinerary.items.length} {itinerary.items.length > 1 ? 'activities' : 'activity'}
                                        </Text>
                                    </View>
                                </View>
                                {getStatusIndicatorWithHint(itinerary.status)}
                            </View>

                            {itinerary.notes && (
                                <View className="bg-indigo-50 rounded-md p-3 mt-4">
                                    <Text className="text-sm font-onest-medium text-primary mb-1">Notes</Text>
                                    <Text className="text-sm text-gray-600 font-onest">{itinerary.notes}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Daily Itinerary Section */}
                    <View className="px-6">
                        <Text className="text-normal text-xl font-onest-medium mb-4">Daily Itinerary</Text>

                        {Object.entries(groupedItems)
                            .sort(([a], [b]) => parseInt(a) - parseInt(b))
                            .map(([day, items]) => {
                                const dayStyles = getDayHeaderStyle(parseInt(day));
                                return (
                                    <View key={day} className="mb-6 rounded-lg overflow-hidden border border-gray-200">
                                        {/* Enhanced Day Header */}
                                        <View className={`p-4 border-b border-gray-100 ${dayStyles.container}`}>
                                            <View className="flex-row justify-between items-center">
                                                <View>
                                                    <Text className={`text-lg font-onest-semibold ${dayStyles.text}`}>
                                                        Day {day}
                                                    </Text>
                                                    <Text className="text-sm text-gray-500 font-onest">
                                                        {getDateForDay(parseInt(day))}
                                                    </Text>
                                                </View>
                                                {dayStyles.indicator && (
                                                    <View className="flex-row items-center">
                                                        <Text className="text-xs text-gray-500 font-onest">
                                                            {dayStyles.indicator}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>

                                        {/* Day Items */}
                                        {items
                                            .sort((a, b) => a.start_time.localeCompare(b.start_time))
                                            .map((item, index) => (
                                                <TouchableOpacity
                                                    key={item.item_id}
                                                    className={`bg-white p-4 ${index !== items.length - 1 ? 'border-b border-gray-100' : ''}`}
                                                    activeOpacity={0.7}
                                                    onPress={() => router.push(`/(traveler)/(itinerary)/activity/${item.item_id}`)}
                                                >
                                                    <View className="flex-row">
                                                        {/* Time Column */}
                                                        <View className="w-20 items-center mr-4">
                                                            <View className="bg-indigo-50 rounded-md p-2 items-center">
                                                                <Ionicons name="time-outline" size={14} color="#4F46E5" />
                                                                <Text className="text-xs font-onest-medium text-primary mt-1">
                                                                    {formatTime(item.start_time)}
                                                                </Text>
                                                                <Text className="text-xs text-gray-500 font-onest">
                                                                    {formatTime(item.end_time)}
                                                                </Text>
                                                            </View>
                                                        </View>

                                                        {/* Content Column */}
                                                        <View className="flex-1">
                                                            {/* Experience Image */}
                                                            {item.primary_image ? (
                                                                <Image
                                                                    source={{ uri: getImageUri(item.primary_image) }}
                                                                    className="w-full h-32 rounded-md mb-3"
                                                                    resizeMode="cover"
                                                                />
                                                            ) : (
                                                                <View className="w-full h-32 bg-gray-200 items-center justify-center rounded-md mb-3">
                                                                    <Ionicons name="image-outline" size={40} color="#A0AEC0" />
                                                                </View>
                                                            )}

                                                            {/* Experience Details */}
                                                            <Text className="text-lg font-onest-semibold text-gray-800 mb-1">
                                                                {item.experience_name}
                                                            </Text>
                                                            <Text className="text-sm text-gray-600 font-onest mb-2">
                                                                {item.experience_description}
                                                            </Text>

                                                            {/* Location */}
                                                            <View className="flex-row items-center mb-2">
                                                                <Ionicons name="location-outline" size={16} color="#4F46E5" />
                                                                <Text className="text-sm text-gray-600 font-onest ml-1">
                                                                    {item.destination_name}, {item.destination_city}
                                                                </Text>
                                                            </View>

                                                            {/* Duration */}
                                                            <View className="bg-gray-50 rounded-md p-2 mb-2">
                                                                <Text className="text-xs text-gray-500 font-onest">
                                                                    Duration: {formatTimeRange(item.start_time, item.end_time)}
                                                                </Text>
                                                            </View>

                                                            {/* Custom Note */}
                                                            {item.custom_note && (
                                                                <View className="bg-indigo-50 rounded-md p-2 mt-2">
                                                                    <Text className="text-xs font-onest-medium text-primary mb-1">Note</Text>
                                                                    <Text className="text-xs text-primary font-onest">
                                                                        {item.custom_note}
                                                                    </Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                            ))}
                                    </View>
                                );
                            })}
                    </View>
                </ScrollView>

                {/* Smart Floating Edit Button */}
                {(() => {
                    const editConfig = getEditButtonConfig();
                    return (
                        <TouchableOpacity
                            className={`absolute bottom-48 right-6 rounded-full p-4 shadow-md flex-row items-center ${editConfig.style}`}
                            activeOpacity={editConfig.disabled ? 1 : 0.7}
                            onPress={editConfig.disabled ? undefined : handleEditPress}
                            disabled={editConfig.disabled}
                        >
                            <View className="flex-row items-center">
                                <Ionicons
                                    name={editConfig.disabled ? "lock-closed-outline" : "create-outline"}
                                    size={20}
                                    color={editConfig.iconColor}
                                />
                                <Text className={`font-onest ml-2 ${editConfig.textStyle}`}>
                                    {editConfig.text}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })()}
            </View>
        </SafeAreaView>
    );
}