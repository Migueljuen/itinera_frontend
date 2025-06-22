import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Calendar from '../../../assets/icons/calendar.svg';
import Globe from '../../../assets/icons/globe.svg';
import API_URL from '../../../constants/api';
import { useRefresh } from '../../../contexts/RefreshContext';

// Updated types to match your API response
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
    destination_name?: string;
    destination_city?: string;
    images?: string[];
    primary_image?: string;
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

interface ApiResponse {
    itineraries: Itinerary[];
}

export default function TripScreen() {
    const router = useRouter();
    const { isRefreshing, refreshData } = useRefresh();
    const [loading, setLoading] = useState(true);
    const [itineraries, setItineraries] = useState<Itinerary[]>([]);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'ongoing' | 'completed'>('upcoming');
    const [userName, setUserName] = useState('');

    useEffect(() => {
        fetchItineraries();
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const user = await AsyncStorage.getItem("user");
            if (user) {
                const parsedUser = JSON.parse(user);
                setUserName(parsedUser.first_name);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    const fetchItineraries = async () => {
        setLoading(true);
        try {
            // Get user ID and token
            const user = await AsyncStorage.getItem("user");
            const token = await AsyncStorage.getItem("token");

            if (!user || !token) {
                console.error("User or token not found");
                setLoading(false);
                return;
            }

            const parsedUser = JSON.parse(user);
            const travelerId = parsedUser.user_id;

            // Fetch user's itineraries
            const response = await fetch(`${API_URL}/itinerary/traveler/${travelerId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ApiResponse = await response.json();

            setItineraries(data.itineraries || []);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching itineraries:", error);
            setLoading(false);

            // You can remove this fallback mock data once your API is working
            setItineraries([]);
        }
    };

    const filteredItineraries = itineraries.filter(item => item.status === activeTab);

    const handleRefresh = async () => {
        await refreshData();
        fetchItineraries();
    };

    const formatDateRange = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);

        const startMonth = start.toLocaleString('default', { month: 'short' });
        const endMonth = end.toLocaleString('default', { month: 'short' });

        if (startMonth === endMonth) {
            return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
        } else {
            return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${start.getFullYear()}`;
        }
    };

    // Updated to work with items and use actual API images
    const getItineraryImage = (itinerary: Itinerary) => {
        // Use the primary_image from the first item if available
        if (itinerary.items && itinerary.items.length > 0) {
            const firstItem = itinerary.items[0];
            if (firstItem.primary_image) {
                // Construct full URL for your API
                return { uri: `${API_URL}${firstItem.primary_image}` };
            }
            // If no primary_image, check if images array exists and has items
            if (firstItem.images && firstItem.images.length > 0) {
                return { uri: `${API_URL}${firstItem.images[0]}` };
            }
        }

        // Fallback to default image
        return require('../../../assets/images/balay.jpg');
    };

    // Updated to work with items and use actual destination data from API
    const getItineraryDestination = (itinerary: Itinerary) => {
        if (itinerary.items && itinerary.items.length > 0) {
            // Get unique cities from the items
            const cities = new Set(
                itinerary.items
                    .map(item => item.destination_city)
                    .filter(city => city) // Remove null/undefined values
            );

            if (cities.size === 1) {
                return Array.from(cities)[0];
            } else if (cities.size > 1) {
                return Array.from(cities).slice(0, 2).join(' & ') + (cities.size > 2 ? ' +' : '');
            }
        }

        return 'Philippines'; // Default fallback
    };

    // Helper function to get unique experiences count
    const getExperiencesCount = (itinerary: Itinerary) => {
        if (!itinerary.items) return 0;

        // Count unique experiences
        const uniqueExperiences = new Set(itinerary.items.map(item => item.experience_id));
        return uniqueExperiences.size;
    };

    // Helper function to format time display
    const formatTimeRange = (startTime: string, endTime: string) => {
        const formatTime = (time: string) => {
            const [hours, minutes] = time.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minutes} ${ampm}`;
        };

        return `${formatTime(startTime)} - ${formatTime(endTime)}`;
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#1f2937" />
                <Text className="mt-4 text-gray-600 font-onest">Loading your trips...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="w-full h-full">
                <ScrollView
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            colors={['#1f2937']}
                            tintColor={'#1f2937'}
                        />
                    }
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 140 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Section */}
                    <View className="px-6 pt-4 pb-6">
                        <Text className="text-3xl font-onest-semibold text-gray-800">My Trips</Text>
                        <Text className="text-gray-400 font-onest mt-1">Manage your travel itineraries</Text>
                    </View>

                    {/* Tab Navigation with improved shadow */}
                    <View className="mx-6 mb-6">
                        <View
                            className="flex-row bg-white rounded-2xl p-1"
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.06,
                                shadowRadius: 8,
                                elevation: 3,
                            }}
                        >
                            {['upcoming', 'ongoing', 'completed'].map((tab) => (
                                <TouchableOpacity
                                    key={tab}
                                    onPress={() => setActiveTab(tab as 'upcoming' | 'ongoing' | 'completed')}
                                    className={`flex-1 py-3 px-3 rounded-xl ${activeTab === tab ? 'bg-gray-800' : 'bg-transparent'}`}
                                    style={activeTab === tab ? {
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 1 },
                                        shadowOpacity: 0.1,
                                        shadowRadius: 3,
                                        elevation: 2,
                                    } : {}}
                                >
                                    <Text
                                        className={`text-center font-onest-medium capitalize text-sm ${activeTab === tab ? 'text-white' : 'text-gray-500'
                                            }`}
                                    >
                                        {tab}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Itineraries List */}
                    <View className="px-6 ">
                        {filteredItineraries.length === 0 ? (
                            <View className="py-16 items-center">
                                <Text className="text-center text-gray-500 font-onest-medium text-lg">
                                    No {activeTab} trips
                                </Text>
                                <Text className="text-center text-gray-400 px-8 mt-3 font-onest leading-5">
                                    {activeTab === 'upcoming' ? 'Plan your next adventure!' :
                                        activeTab === 'ongoing' ? "You don't have any active trips" :
                                            "You haven't completed any trips yet"}
                                </Text>

                                {activeTab === 'upcoming' && (
                                    <TouchableOpacity
                                        className="mt-8 bg-primary rounded-full px-8 py-4 flex-row items-center"
                                        style={{
                                            shadowColor: '#4F46E5',
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.2,
                                            shadowRadius: 12,
                                            elevation: 6,
                                        }}
                                        onPress={() => router.push('/(itineraryFlow)/create/')}
                                    >
                                        <Image
                                            source={require('../../../assets/icons/plus.png')}
                                            className="w-4 h-4 mr-3 opacity-80"
                                            resizeMode="contain"
                                        />
                                        <Text className="text-gray-300 font-onest-medium">Create New Trip</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : (
                            filteredItineraries.map((itinerary, index) => (
                                <TouchableOpacity
                                    key={itinerary.itinerary_id}
                                    onPress={() => router.push(`/(itinerary)/${itinerary.itinerary_id}`)}
                                    className="bg-white rounded-2xl overflow-hidden mb-4  border border-gray-200"
                                    style={{
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.08,
                                        shadowRadius: 12,
                                        elevation: 4,
                                    }}
                                >
                                    <Image
                                        source={getItineraryImage(itinerary)}
                                        className="w-full h-44"
                                        resizeMode="cover"
                                    />
                                    <View className="p-5">
                                        <Text className="text-lg font-onest-semibold text-gray-800 mb-2">
                                            {itinerary.title}
                                        </Text>

                                        <View className="flex-row items-center mb-4">
                                            <Globe />
                                            <Text className="text-sm text-gray-600 font-onest ml-2">
                                                {getItineraryDestination(itinerary)}
                                            </Text>
                                        </View>

                                        <View className="flex-row justify-between items-center mb-4">
                                            <View className="flex-row items-center flex-1">
                                                <Calendar />
                                                <Text className="text-sm text-gray-500 font-onest ml-2 flex-1">
                                                    {formatDateRange(itinerary.start_date, itinerary.end_date)}
                                                </Text>
                                            </View>
                                            <View
                                                className={`px-3 py-1.5 rounded-full ml-3 ${itinerary.status === 'upcoming' ? 'bg-blue-50' :
                                                    itinerary.status === 'ongoing' ? 'bg-green-50' : 'bg-gray-50'
                                                    }`}
                                            >
                                                <Text
                                                    className={`text-xs font-onest-medium capitalize ${itinerary.status === 'upcoming' ? 'text-blue-600' :
                                                        itinerary.status === 'ongoing' ? 'text-green-600' : 'text-gray-600'
                                                        }`}
                                                >
                                                    {itinerary.status}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Show itinerary items preview */}
                                        {itinerary.items && itinerary.items.length > 0 && (
                                            <View className="pt-4 border-t border-gray-100">
                                                <Text className="text-sm text-gray-700 font-onest-medium mb-1">
                                                    Next: {itinerary.items[0].experience_name}
                                                </Text>
                                                <Text className="text-xs text-gray-500 font-onest">
                                                    Day {itinerary.items[0].day_number} • {formatTimeRange(itinerary.items[0].start_time, itinerary.items[0].end_time)}
                                                </Text>
                                            </View>
                                        )}

                                        {/* Show number of experiences */}
                                        <View className="pt-4 border-t border-gray-100 flex-row justify-between items-center">
                                            <Text className="text-sm text-gray-500 font-onest">
                                                {getExperiencesCount(itinerary)} {getExperiencesCount(itinerary) !== 1 ? 'activities' : 'activity'}
                                            </Text>
                                            <Text className="text-sm text-primary font-onest-medium">
                                                View details →
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                </ScrollView>

                {/* Floating Action Button with improved shadow */}
                <TouchableOpacity
                    className="absolute bottom-[90px] right-6 bg-primary rounded-full p-4 shadow-md flex-row items-center"
                    onPress={() => router.push('/(createItinerary)/selectionScreen')}
                >
                    <View className="flex-row items-center">
                        <Image
                            source={require('../../../assets/icons/plus.png')}
                            className="w-5 h-5 mr-2 opacity-80"
                            resizeMode="contain"
                        />
                        <Text className="text-gray-300 font-onest">Build My Trip</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}