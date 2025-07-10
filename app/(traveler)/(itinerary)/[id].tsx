import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import API_URL from '../../../constants/api';

// Updated interface to include coordinates
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
    destination_latitude?: number;
    destination_longitude?: number;
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
    const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
    const [collapsedDays, setCollapsedDays] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (id) {
            fetchItineraryDetails();
            requestLocationPermission();
        }
    }, [id]);

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                setUserLocation(location);
            }
        } catch (error) {
            console.log('Location permission denied');
        }
    };

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
            // console.log('Fetched itinerary:', data);
            setItinerary(data.itinerary || data);
        } catch (error) {
            console.error("Error fetching itinerary details:", error);
            Alert.alert("Error", "Failed to load itinerary details");
        } finally {
            setLoading(false);
        }
    };

    // Toggle collapse state for a day
    const toggleDayCollapse = (dayNumber: number) => {
        setCollapsedDays(prev => {
            const newSet = new Set(prev);
            if (newSet.has(dayNumber)) {
                newSet.delete(dayNumber);
            } else {
                newSet.add(dayNumber);
            }
            return newSet;
        });
    };

    // Multi-stop navigation handler
    const handleMultiStopNavigation = async (dayItems: ItineraryItem[]) => {
        const itemsWithCoordinates = dayItems.filter(
            item => item.destination_latitude && item.destination_longitude
        );

        if (itemsWithCoordinates.length === 0) {
            Alert.alert('No Coordinates', 'Location data is not available for these activities.');
            return;
        }

        if (itemsWithCoordinates.length === 1) {
            handleSingleNavigation(itemsWithCoordinates[0]);
            return;
        }

        try {
            let origin = '';

            if (!userLocation) {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const location = await Location.getCurrentPositionAsync({});
                    origin = `${location.coords.latitude},${location.coords.longitude}`;
                }
            } else {
                origin = `${userLocation.coords.latitude},${userLocation.coords.longitude}`;
            }

            if (!origin) {
                origin = `${itemsWithCoordinates[0].destination_latitude},${itemsWithCoordinates[0].destination_longitude}`;
                itemsWithCoordinates.shift();
            }

            const destination = `${itemsWithCoordinates[itemsWithCoordinates.length - 1].destination_latitude},${itemsWithCoordinates[itemsWithCoordinates.length - 1].destination_longitude}`;

            const waypoints = itemsWithCoordinates.slice(0, -1).map(item =>
                `${item.destination_latitude},${item.destination_longitude}`
            ).join('|');

            const url = Platform.select({
                ios: waypoints
                    ? `https://maps.apple.com/?saddr=${origin}&daddr=${waypoints}+to:${destination}`
                    : `https://maps.apple.com/?saddr=${origin}&daddr=${destination}`,
                android: `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=driving`
            });

            if (url) {
                const supported = await Linking.canOpenURL(url);
                if (supported) {
                    await Linking.openURL(url);
                } else {
                    const webUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=driving`;
                    await Linking.openURL(webUrl);
                }
            }
        } catch (error) {
            console.error('Error opening maps:', error);
            Alert.alert('Error', 'Unable to open navigation. Please try again.');
        }
    };

    // Single navigation handler
    const handleSingleNavigation = async (item: ItineraryItem) => {
        if (!item.destination_latitude || !item.destination_longitude) {
            Alert.alert('No Coordinates', 'Location data is not available for this activity.');
            return;
        }

        try {
            const destination = `${item.destination_latitude},${item.destination_longitude}`;
            const label = encodeURIComponent(item.experience_name);

            const url = Platform.select({
                ios: `maps://app?daddr=${destination}&q=${label}`,
                android: `google.navigation:q=${destination}&mode=d`
            });

            const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${destination}&query_place_id=${label}`;

            if (url) {
                const supported = await Linking.canOpenURL(url);
                if (supported) {
                    await Linking.openURL(url);
                } else {
                    await Linking.openURL(fallbackUrl);
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Unable to open maps');
        }
    };

    // Calculate travel time between activities
    const estimateTravelTime = (item1: ItineraryItem, item2: ItineraryItem) => {
        if (!item1.destination_latitude || !item1.destination_longitude ||
            !item2.destination_latitude || !item2.destination_longitude) {
            return null;
        }

        const R = 6371;
        const dLat = (item2.destination_latitude - item1.destination_latitude) * Math.PI / 180;
        const dLon = (item2.destination_longitude - item1.destination_longitude) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(item1.destination_latitude * Math.PI / 180) *
            Math.cos(item2.destination_latitude * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        const timeInHours = distance / 30;
        const timeInMinutes = Math.round(timeInHours * 60);

        return timeInMinutes;
    };

    // Check if there's enough time between activities
    const hasEnoughTimeBetween = (item1: ItineraryItem, item2: ItineraryItem) => {
        const travelTime = estimateTravelTime(item1, item2);
        if (!travelTime) return { hasTime: true, message: '' };

        const end1 = new Date(`2000-01-01T${item1.end_time}`);
        const start2 = new Date(`2000-01-01T${item2.start_time}`);
        const gapMinutes = (start2.getTime() - end1.getTime()) / (1000 * 60);

        if (gapMinutes < travelTime) {
            return {
                hasTime: false,
                message: `⚠️ Only ${Math.round(gapMinutes)} min gap, ~${travelTime} min travel time`
            };
        }

        return { hasTime: true, message: `~${travelTime} min travel` };
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

    const getCurrentDay = () => {
        if (!itinerary) return 0;

        const today = new Date();
        const startDate = new Date(itinerary.start_date);

        today.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);

        const timeDiff = today.getTime() - startDate.getTime();
        const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1;

        return Math.max(1, dayDiff);
    };

    // NEW FUNCTION: Check if all activities for a given day have passed
    const areAllDayActivitiesPast = (dayNumber: number) => {
        if (!itinerary) return false;

        const dayItems = itinerary.items.filter(item => item.day_number === dayNumber);
        if (dayItems.length === 0) return true; // No activities for this day

        const now = new Date();
        const startDate = new Date(itinerary.start_date);
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + dayNumber - 1);

        // Check if all activities for this day have ended
        return dayItems.every(item => {
            const itemEndDateTime = new Date(dayDate);
            const [hours, minutes] = item.end_time.split(':').map(Number);
            itemEndDateTime.setHours(hours, minutes, 0, 0);

            return now > itemEndDateTime;
        });
    };

    // UPDATED FUNCTION: Get edit capabilities considering time
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

                // Check if all activities for today have passed
                const todayActivitiesComplete = areAllDayActivitiesPast(currentDay);

                // If today's activities are complete, only future days are editable
                const firstEditableDay = todayActivitiesComplete ? currentDay + 1 : currentDay;

                // Check if there are any editable days left
                if (firstEditableDay > totalDays) {
                    return {
                        canEdit: false,
                        editType: 'all_activities_complete',
                        message: 'All activities have been completed'
                    };
                }

                return {
                    canEdit: true,
                    editType: 'current_and_future',
                    message: todayActivitiesComplete
                        ? `Edit future days only (Day ${firstEditableDay}+)`
                        : `Edit today and future days (Day ${currentDay}+)`,
                    currentDay,
                    firstEditableDay,
                    todayComplete: todayActivitiesComplete,
                    editableDays: Array.from(
                        { length: totalDays - firstEditableDay + 1 },
                        (_, i) => firstEditableDay + i
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
            let buttonText = 'Cannot Edit';
            if (capabilities.editType === 'completed') {
                buttonText = 'Trip Completed';
            } else if (capabilities.editType === 'all_activities_complete') {
                buttonText = 'All Activities Done';
            }

            return {
                disabled: true,
                style: 'bg-gray-300',
                textStyle: 'text-gray-500',
                iconColor: '#9CA3AF',
                text: buttonText
            };
        }

        return {
            disabled: false,
            style: 'bg-primary',
            textStyle: 'text-gray-300',
            iconColor: '#E5E7EB',
            text: capabilities.editType === 'full' ? 'Edit Trip' : 'Edit Schedule'
        };
    };

    const handleEditPress = () => {
        const capabilities = getEditCapabilities();

        if (!capabilities.canEdit) {
            let alertMessage = '';
            let alertTitle = 'Cannot Edit';

            switch (capabilities.editType) {
                case 'completed':
                    alertTitle = 'Trip Completed';
                    alertMessage = 'Completed trips cannot be modified. You can create a new trip based on this one if needed.';
                    break;
                case 'all_activities_complete':
                    alertTitle = 'All Activities Complete';
                    alertMessage = 'All activities in this itinerary have already occurred and cannot be modified.';
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

    const getStatusIndicatorWithHint = (status: string) => {
        const baseConfig = {
            upcoming: { bg: 'bg-indigo-50', text: 'text-primary', icon: '📅' },
            ongoing: { bg: 'bg-green-50', text: 'text-green-600', icon: '✈️' },
            completed: { bg: 'bg-gray-100', text: 'text-gray-600', icon: '✅' }
        };

        const config = baseConfig[status as keyof typeof baseConfig];

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

    const getDayHeaderStyle = (dayNumber: number) => {
        const capabilities = getEditCapabilities();

        if (capabilities.editType === 'current_and_future') {
            const isEditable = capabilities.editableDays?.includes(dayNumber);
            const isPast = dayNumber < capabilities.currentDay!;
            const isCurrent = dayNumber === capabilities.currentDay!;
            const isCurrentButComplete = isCurrent && capabilities.todayComplete;

            if (isPast || isCurrentButComplete) {
                return {
                    container: 'bg-gray-50 border-l-4 border-gray-300',
                    text: 'text-gray-500',
                    indicator: '✓ Completed'
                };
            } else if (isCurrent && !isCurrentButComplete) {
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
                {/* Header */}
                <View className="p-4">
                    <Text className="text-normal text-xl font-onest-semibold text-center">Trip Details</Text>
                </View>

                <View className="w-6 mt-4" />

                <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 142 }}>
                    {/* Trip Header Card */}
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
                                const sortedItems = items.sort((a, b) => a.start_time.localeCompare(b.start_time));
                                const hasMultipleStops = sortedItems.length > 1;
                                const hasCoordinates = sortedItems.some(item => item.destination_latitude && item.destination_longitude);
                                const isCollapsed = collapsedDays.has(parseInt(day));

                                return (
                                    <View key={day} className="mb-6 rounded-lg overflow-hidden border border-gray-200">
                                        {/* Enhanced Day Header with Multi-stop Navigation Button */}
                                        <TouchableOpacity
                                            className={`p-4 border-b border-gray-100 ${dayStyles.container}`}
                                            onPress={() => toggleDayCollapse(parseInt(day))}
                                            activeOpacity={0.7}
                                        >
                                            <View>
                                                {/* First Row: Day info and chevron */}
                                                <View className="flex-row justify-between items-center">
                                                    <View className="flex-1 flex-row items-center">
                                                        <Ionicons
                                                            name={isCollapsed ? "chevron-forward" : "chevron-down"}
                                                            size={20}
                                                            color="#6B7280"
                                                            style={{ marginRight: 8 }}
                                                        />
                                                        <View className="flex-1">
                                                            <View className="flex-row items-center flex-wrap justify-between">
                                                                <Text className={`text-lg font-onest-semibold ${dayStyles.text} mr-2`}>
                                                                    Day {day}
                                                                </Text>
                                                                {dayStyles.indicator && (
                                                                    <Text className="text-xs text-gray-500 font-onest">
                                                                        {dayStyles.indicator}
                                                                    </Text>
                                                                )}
                                                            </View>
                                                            <Text className="text-sm text-gray-500 font-onest">
                                                                {getDateForDay(parseInt(day))} • {sortedItems.length} {sortedItems.length > 1 ? 'activities' : 'activity'}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </View>

                                                {/* Second Row: Navigation button when expanded */}
                                                {hasMultipleStops && hasCoordinates && !isCollapsed && (
                                                    <TouchableOpacity
                                                        className="bg-primary rounded-full px-4 py-2 flex-row items-center self-start mt-3"
                                                        onPress={(e) => {
                                                            e.stopPropagation();
                                                            handleMultiStopNavigation(sortedItems);
                                                        }}
                                                        activeOpacity={0.7}
                                                    >
                                                        <Ionicons name="navigate" size={16} color="#E5E7EB" />
                                                        <Text className="text-gray-200 font-onest-medium ml-2 text-sm">
                                                            Navigate All ({sortedItems.length} stops)
                                                        </Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </TouchableOpacity>

                                        {/* Day Items with Navigation Links - Only show when not collapsed */}
                                        {!isCollapsed && sortedItems.map((item, index) => {
                                            const nextItem = sortedItems[index + 1];
                                            const timeCheck = nextItem ? hasEnoughTimeBetween(item, nextItem) : null;

                                            return (
                                                <React.Fragment key={item.item_id}>
                                                    <TouchableOpacity
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

                                                                {/* Quick Navigation Button */}
                                                                {item.destination_latitude && item.destination_longitude && (
                                                                    <TouchableOpacity
                                                                        className="mt-2 bg-primary/10 p-2 rounded-lg"
                                                                        onPress={(e) => {
                                                                            e.stopPropagation();
                                                                            handleSingleNavigation(item);
                                                                        }}
                                                                    >
                                                                        <Ionicons name="navigate" size={16} color="#4F46E5" />
                                                                    </TouchableOpacity>
                                                                )}
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

                                                    {/* Travel Time Indicator Between Activities */}
                                                    {nextItem && index < sortedItems.length - 1 && (
                                                        <View className="bg-gray-50 px-4 py-3 flex-row items-center justify-between">
                                                            <View className="flex-row items-center flex-1">
                                                                <View className="w-20 items-center mr-4">
                                                                    <View className="w-0.5 h-8 bg-gray-300" />
                                                                    <Ionicons name="car-outline" size={16} color="#6B7280" className="mt-1" />
                                                                </View>
                                                                <Text className={`text-sm font-onest ${timeCheck && !timeCheck.hasTime ? 'text-orange-600' : 'text-gray-600'}`}>
                                                                    {timeCheck?.message || 'Travel to next activity'}
                                                                </Text>
                                                            </View>

                                                            {/* Navigate to Next Button */}
                                                            {item.destination_latitude && item.destination_longitude &&
                                                                nextItem.destination_latitude && nextItem.destination_longitude && (
                                                                    <TouchableOpacity
                                                                        className="bg-white border border-gray-300 rounded-full px-3 py-1.5 flex-row items-center"
                                                                        onPress={() => {
                                                                            const origin = `${item.destination_latitude},${item.destination_longitude}`;
                                                                            const destination = `${nextItem.destination_latitude},${nextItem.destination_longitude}`;
                                                                            const url = Platform.select({
                                                                                ios: `https://maps.apple.com/?saddr=${origin}&daddr=${destination}`,
                                                                                android: `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`
                                                                            });
                                                                            if (url) Linking.openURL(url);
                                                                        }}
                                                                    >
                                                                        <Ionicons name="navigate-outline" size={14} color="#4F46E5" />
                                                                        <Text className="text-xs text-primary font-onest-medium ml-1">
                                                                            Directions
                                                                        </Text>
                                                                    </TouchableOpacity>
                                                                )}
                                                        </View>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
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