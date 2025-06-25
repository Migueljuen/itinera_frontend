// /(itinerary)/activity/[id].tsx
// Fixed version with proper data structure handling

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import API_URL from '../../../../constants/api';

// Updated interface to match the API response structure
interface ItineraryActivity {
    item_id: number;
    itinerary_id: number;
    day_number: number;
    start_time: string;
    end_time: string;
    custom_note: string;
    created_at: string;
    updated_at: string;

    // Nested experience object
    experience: {
        id: number;
        name: string;
        description: string;
        price: string;
        unit: string;
        creator_id: number;
        travel_companion: string;
        images: string[];
        primary_image: string | null;
        tags: string[];
    } | null;

    // Nested destination object
    destination: {
        id: number;
        name: string;
        city: string;
        description: string;
        latitude: number;
        longitude: number;
    } | null;

    // Nested itinerary object
    itinerary: {
        id: number;
        title: string;
        start_date: string;
        end_date: string;
        status: string;
        notes: string;
    };
}

export default function ItineraryActivityDetail() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [activity, setActivity] = useState<ItineraryActivity | null>(null);
    const [loading, setLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const [isGettingDirections, setIsGettingDirections] = useState(false);

    useEffect(() => {
        if (id) {
            fetchActivityDetails();
        }
    }, [id]);

    const fetchActivityDetails = async () => {
        try {
            const token = await AsyncStorage.getItem('token');

            if (!token) {
                console.error('No auth token found');
                Alert.alert('Authentication Error', 'Please log in again');
                router.replace('/login');
                return;
            }

            console.log('Fetching activity with ID:', id);

            const response = await fetch(`${API_URL}/itinerary/item/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error response:', errorData);

                switch (response.status) {
                    case 401:
                        Alert.alert('Authentication Error', 'Your session has expired. Please log in again.');
                        router.replace('/login');
                        return;
                    case 403:
                        Alert.alert('Access Denied', errorData.message || 'You do not have permission to view this activity.');
                        router.back();
                        return;
                    case 404:
                        Alert.alert('Not Found', errorData.message || 'This activity could not be found.');
                        router.back();
                        return;
                    default:
                        Alert.alert('Error', errorData.message || 'Failed to load activity details');
                }
                return;
            }

            const result = await response.json();
            console.log('API Response:', result);

            if (result.success && result.data) {
                setActivity(result.data);
                console.log('Activity set:', result.data);
                console.log('Destination:', result.data.destination);
                console.log('Experience:', result.data.experience);
            } else {
                console.error('Unexpected response structure:', result);
                Alert.alert('Error', 'Received invalid data from server');
            }

        } catch (error: unknown) {
            console.error('Fetch error:', error);

            let errorMessage = 'An unexpected error occurred';

            if (error instanceof Error) {
                if (error.message.includes('Network request failed')) {
                    Alert.alert(
                        'Network Error',
                        'Unable to connect to the server. Please check your internet connection.',
                        [
                            { text: 'Retry', onPress: fetchActivityDetails },
                            { text: 'Cancel', style: 'cancel' }
                        ]
                    );
                    return;
                }
                errorMessage = error.message;
            }

            Alert.alert(
                'Error',
                errorMessage,
                [
                    { text: 'Retry', onPress: fetchActivityDetails },
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
        } finally {
            setLoading(false);
        }
    };

    const getFormattedImageUrl = (imageUrl: string) => {
        if (!imageUrl) return null;
        if (imageUrl.startsWith('http')) return imageUrl;
        const formattedPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
        return `${API_URL}${formattedPath}`;
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

    const handleGetDirections = async () => {
        if (!activity?.destination?.latitude || !activity?.destination?.longitude) {
            Alert.alert('Error', 'Location coordinates not available');
            return;
        }

        setIsGettingDirections(true);

        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                openMapsWithoutOrigin();
                return;
            }

            const userLocation = await Location.getCurrentPositionAsync({});

            const origin = `${userLocation.coords.latitude},${userLocation.coords.longitude}`;
            const destination = `${activity.destination.latitude},${activity.destination.longitude}`;
            const label = encodeURIComponent(activity.experience?.name || 'Destination');

            const url = Platform.select({
                ios: `maps://app?saddr=${origin}&daddr=${destination}&q=${label}`,
                android: `google.navigation:q=${destination}&mode=d`
            });

            const fallbackUrl = Platform.select({
                ios: `https://maps.apple.com/?saddr=${origin}&daddr=${destination}&q=${label}`,
                android: `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`
            });

            const supported = await Linking.canOpenURL(url!);
            if (supported) {
                await Linking.openURL(url!);
            } else {
                await Linking.openURL(fallbackUrl!);
            }
        } catch (error) {
            console.error('Error getting directions:', error);
            Alert.alert('Error', 'Unable to get directions. Please try again.');
        } finally {
            setIsGettingDirections(false);
        }
    };

    const openMapsWithoutOrigin = async () => {
        if (!activity?.destination) return;

        const destination = `${activity.destination.latitude},${activity.destination.longitude}`;
        const label = encodeURIComponent(activity.experience?.name || 'Destination');

        const url = Platform.select({
            ios: `maps://app?daddr=${destination}&q=${label}`,
            android: `geo:0,0?q=${destination}(${label})`
        });

        const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${destination}&query_place_id=${label}`;

        try {
            const supported = await Linking.canOpenURL(url!);
            if (supported) {
                await Linking.openURL(url!);
            } else {
                await Linking.openURL(fallbackUrl);
            }
        } catch (error) {
            Alert.alert('Error', 'Unable to open maps');
        } finally {
            setIsGettingDirections(false);
        }
    };

    const handleViewInMap = async () => {
        if (!activity?.destination?.latitude || !activity?.destination?.longitude) {
            Alert.alert('Error', 'Location not available');
            return;
        }

        const { latitude, longitude } = activity.destination;
        const label = encodeURIComponent(activity.experience?.name || 'Location');

        const url = Platform.select({
            ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
            android: `geo:0,0?q=${latitude},${longitude}(${label})`
        });

        const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&query_place_id=${label}`;

        try {
            const supported = await Linking.canOpenURL(url!);
            if (supported) {
                await Linking.openURL(url!);
            } else {
                await Linking.openURL(webUrl);
            }
        } catch (error) {
            Alert.alert('Error', 'Unable to open map');
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#1f2937" />
                <Text className="mt-4 text-gray-600 font-onest">Loading activity details...</Text>
            </SafeAreaView>
        );
    }

    if (!activity) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
                <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                <Text className="text-red-500 font-onest-medium text-lg mt-4">Activity not found</Text>
                <TouchableOpacity
                    className="mt-6 bg-primary rounded-full px-8 py-3"
                    onPress={() => router.back()}
                >
                    <Text className="text-white font-onest-medium">Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // Get image from nested structure
    const activityImage = activity.experience?.primary_image ||
        (activity.experience?.images && activity.experience.images[0]);

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Header with Back Button */}
                <View className="px-6 py-4">
                    <Text className="text-lg font-onest-semibold text-center text-gray-800">
                        Day {activity.day_number} Activity
                    </Text>
                </View>

                {/* Image */}
                <View className="px-6 mb-4">
                    <View className="w-full h-64 rounded-2xl overflow-hidden bg-gray-200">
                        {activityImage && !imageError ? (
                            <Image
                                source={{ uri: getFormattedImageUrl(activityImage)! }}
                                className="w-full h-full"
                                resizeMode="cover"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <View className="w-full h-full justify-center items-center bg-gray-100">
                                <Ionicons name="image-outline" size={48} color="#9CA3AF" />
                            </View>
                        )}
                    </View>
                </View>

                {/* Content */}
                <View className="px-6">
                    {/* Title and Time */}
                    <View className="mb-4">
                        <Text className="text-2xl font-onest-semibold text-gray-800 mb-2">
                            {activity.experience?.name || 'Experience Name Not Available'}
                        </Text>

                        <View className="flex-row items-center mb-2">
                            <Ionicons name="time-outline" size={20} color="#6B7280" />
                            <Text className="ml-2 text-gray-600 font-onest">
                                {formatTimeRange(activity.start_time, activity.end_time)}
                            </Text>
                        </View>

                        {activity.destination && (
                            <View className="flex-row items-center">
                                <Ionicons name="location-outline" size={20} color="#6B7280" />
                                <Text className="ml-2 text-gray-600 font-onest">
                                    {activity.destination.name}, {activity.destination.city}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Custom Note */}
                    {activity.custom_note && (
                        <View className="bg-blue-50 rounded-xl p-4 mb-4">
                            <View className="flex-row items-start">
                                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                                <View className="ml-2 flex-1">
                                    <Text className="text-blue-800 font-onest-medium mb-1">Your Note</Text>
                                    <Text className="text-blue-700 font-onest">{activity.custom_note}</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Description */}
                    {activity.experience?.description && (
                        <View className="mb-4">
                            <Text className="text-lg font-onest-semibold text-gray-800 mb-2">About</Text>
                            <Text className="text-gray-600 font-onest leading-6">
                                {activity.experience.description}
                            </Text>
                        </View>
                    )}

                    {/* Tags */}
                    {activity.experience?.tags && activity.experience.tags.length > 0 && (
                        <View className="flex-row flex-wrap mb-4">
                            {activity.experience.tags.map((tag) => (
                                <View key={tag} className="bg-indigo-50 px-3 py-1 rounded-full mr-2 mb-2">
                                    <Text className="text-primary text-xs font-onest-medium">{tag}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Price Info */}
                    {activity.experience?.price && (
                        <View className="bg-gray-50 rounded-xl p-4 mb-4">
                            <Text className="text-gray-600 font-onest mb-1">Price</Text>
                            <Text className="text-2xl font-onest-bold text-primary">
                                ₱{activity.experience.price}
                            </Text>
                            <Text className="text-gray-500 font-onest text-sm">{activity.experience.unit}</Text>
                        </View>
                    )}

                    {/* Action Buttons */}
                    <View className="mt-6 mb-8 space-y-3">
                        {/* Get Directions Button */}
                        <TouchableOpacity
                            className="bg-primary rounded-2xl py-4 flex-row items-center justify-center mb-3"
                            onPress={handleGetDirections}
                            disabled={isGettingDirections || !activity.destination?.latitude || !activity.destination?.longitude}
                            style={{
                                shadowColor: '#4F46E5',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.2,
                                shadowRadius: 8,
                                elevation: 6,
                            }}
                        >
                            {isGettingDirections ? (
                                <ActivityIndicator size="small" color="#E5E7EB" />
                            ) : (
                                <>
                                    <Ionicons name="navigate" size={20} color="#E5E7EB" />
                                    <Text className="ml-2 text-gray-200 font-onest-semibold">
                                        Get Directions
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* View on Map Button */}
                        <TouchableOpacity
                            className="border border-gray-300 rounded-2xl py-4 flex-row items-center justify-center mb-3"
                            onPress={handleViewInMap}
                            disabled={!activity.destination?.latitude || !activity.destination?.longitude}
                        >
                            <Ionicons name="map-outline" size={20} color="#6B7280" />
                            <Text className="ml-2 text-gray-700 font-onest-medium">
                                View on Map
                            </Text>
                        </TouchableOpacity>

                        {/* View Full Experience Button */}
                        <TouchableOpacity
                            className="py-4 flex-row items-center justify-center"
                            onPress={() => {
                                if (activity.experience?.id) {
                                    console.log('Navigating to experience:', activity.experience.id);
                                    router.push(`/(traveler)/(experience)/${activity.experience.id}`);
                                } else {
                                    Alert.alert('Error', 'Experience ID not available');
                                }
                            }}
                        >
                            <Text className="text-primary font-onest-medium">
                                View Full Experience Details
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color="#4F46E5" style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}