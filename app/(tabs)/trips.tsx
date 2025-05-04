import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useRefresh } from '../../contexts/RefreshContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Globe from '../../assets/icons/globe.svg';
import Calendar from '../../assets/icons/calendar.svg';
import API_URL from '../../constants/api';
// Define types based on your database schema
interface Itinerary {
    itinerary_id: number;
    traveler_id: number;
    start_date: string;
    end_date: string;
    title: string;
    notes: string;
    created_at: string;
    status: 'upcoming' | 'ongoing' | 'completed';
    experiences: Experience[];
}

interface Experience {
    experience_id: number;
    title: string;
    description: string;
    price: number;
    unit: 'Entry' | 'Hour' | 'Day' | 'Package';
    destination: Destination;
    scheduled_date?: string;
    time_slot?: string;
}

interface Destination {
    destination_id: number;
    name: string;
    city: string;
    image?: string; // For displaying images
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
            const response = await fetch(`${API_URL}/itineraries/traveler/${travelerId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            setItineraries(data.itineraries || []);
            setLoading(false);
        } catch (error) {
            setLoading(false);

            // If API fails, load mock data for development
            setItineraries([
                {
                    itinerary_id: 1,
                    traveler_id: 9,
                    start_date: '2025-05-15',
                    end_date: '2025-05-22',
                    title: 'Paris Adventure',
                    notes: 'First trip to Europe',
                    created_at: '2025-03-01',
                    status: 'upcoming',
                    experiences: [
                        {
                            experience_id: 1,
                            title: 'Eiffel Tower Tour',
                            description: 'Visit the iconic Eiffel Tower',
                            price: 30,
                            unit: 'Entry',
                            scheduled_date: '2025-05-16',
                            time_slot: 'Morning',
                            destination: {
                                destination_id: 1,
                                name: 'Eiffel Tower',
                                city: 'Paris',
                                image: require('../../assets/images/siargao.jpg')
                            }
                        },
                        {
                            experience_id: 2,
                            title: 'Louvre Museum',
                            description: 'Explore the world-famous Louvre',
                            price: 17,
                            unit: 'Entry',
                            scheduled_date: '2025-05-17',
                            time_slot: 'Afternoon',
                            destination: {
                                destination_id: 2,
                                name: 'Louvre Museum',
                                city: 'Paris'
                            }
                        }
                    ]
                },
                {
                    itinerary_id: 2,
                    traveler_id: 9,
                    start_date: '2025-04-20',
                    end_date: '2025-04-29',
                    title: 'Barcelona Tour',
                    notes: 'Spanish exploration',
                    created_at: '2025-03-10',
                    status: 'ongoing',
                    experiences: [
                        {
                            experience_id: 3,
                            title: 'Sagrada Familia Visit',
                            description: 'Guided tour of Gaudí\'s masterpiece',
                            price: 45,
                            unit: 'Entry',
                            scheduled_date: '2025-04-22',
                            time_slot: 'Morning',
                            destination: {
                                destination_id: 3,
                                name: 'Sagrada Familia',
                                city: 'Barcelona',
                                image: require('../../assets/images/ruins.jpg')
                            }
                        }
                    ]
                },
                {
                    itinerary_id: 3,
                    traveler_id: 9,
                    start_date: '2025-03-12',
                    end_date: '2025-03-15',
                    title: 'Rome Weekend',
                    notes: 'Quick Italian getaway',
                    created_at: '2025-02-20',
                    status: 'completed',
                    experiences: [
                        {
                            experience_id: 4,
                            title: 'Colosseum Tour',
                            description: 'Guided tour of ancient Rome',
                            price: 35,
                            unit: 'Entry',
                            scheduled_date: '2025-03-13',
                            time_slot: 'Morning',
                            destination: {
                                destination_id: 4,
                                name: 'Colosseum',
                                city: 'Rome',
                                image: require('../../assets/images/balay.jpg')
                            }
                        }
                    ]
                }
            ]);
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

    // Get first experience image for the itinerary thumbnail
    const getItineraryImage = (itinerary: Itinerary) => {
        if (itinerary.experiences && itinerary.experiences.length > 0) {
            const firstExperience = itinerary.experiences[0];
            if (firstExperience.destination && firstExperience.destination.image) {
                return firstExperience.destination.image;
            }
        }
        // Default image if no experience image is available
        return require('../../assets/images/balay.jpg');
    };

    // Get primary destination for the itinerary
    const getItineraryDestination = (itinerary: Itinerary) => {
        if (itinerary.experiences && itinerary.experiences.length > 0) {
            const cities = new Set(itinerary.experiences.map(exp => exp.destination?.city).filter(Boolean));

            if (cities.size === 1) {
                return Array.from(cities)[0];
            } else if (cities.size > 1) {
                return Array.from(cities).slice(0, 2).join(' & ') + (cities.size > 2 ? ' +' : '');
            }
        }
        return 'Multiple destinations';
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center">
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
                    contentContainerStyle={{ paddingBottom: 120 }}
                >
                    <View className="flex items-start p-6">
                        <Text className="text-3xl font-onest-semibold text-gray-800">My Trips</Text>
                        <Text className="text-gray-400 font-onest">Manage your travel itineraries</Text>
                    </View>

                    {/* Tab Navigation */}
                    <View className="flex-row bg-white mx-4 rounded-xl p-1 shadow-sm">
                        {['upcoming', 'ongoing', 'completed'].map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                onPress={() => setActiveTab(tab as 'upcoming' | 'ongoing' | 'completed')}
                                className={`flex-1 py-3 px-2 rounded-lg ${activeTab === tab ? 'bg-gray-800' : 'bg-white'}`}
                            >
                                <Text
                                    className={`text-center font-onest-medium capitalize ${activeTab === tab ? 'text-white' : 'text-gray-400'
                                        }`}
                                >
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Itineraries List */}
                    <View className="px-4 py-6">
                        {filteredItineraries.length === 0 ? (
                            <View className="py-12 items-center">
                                <Image
                                    source={require('../../assets/images/siargao.jpg')}
                                    className="w-32 h-32 opacity-60 mb-4"
                                    resizeMode="contain"
                                />
                                <Text className="text-center text-gray-500 font-onest-medium text-lg">
                                    No {activeTab} trips
                                </Text>
                                <Text className="text-center text-gray-400 px-8 mt-2 font-onest">
                                    {activeTab === 'upcoming' ? 'Plan your next adventure!' :
                                        activeTab === 'ongoing' ? "You don't have any active trips" :
                                            "You haven't completed any trips yet"}
                                </Text>

                                {activeTab === 'upcoming' && (
                                    <TouchableOpacity
                                        className="mt-6 bg-primary rounded-full px-6 py-3 shadow-sm flex-row items-center"
                                        onPress={() => router.push('/(itineraryFlow)/create/')}
                                    >
                                        <Image
                                            source={require('../../assets/icons/plus.png')}
                                            className="w-4 h-4 mr-2 opacity-80"
                                            resizeMode="contain"
                                        />
                                        <Text className="text-gray-300 font-onest">Create New Trip</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : (
                            filteredItineraries.map((itinerary) => (
                                <TouchableOpacity
                                    key={itinerary.itinerary_id}
                                    onPress={() => router.push(`/(itineraryFlow)/${itinerary.itinerary_id}`)}
                                    className="bg-white rounded-xl overflow-hidden mb-5 shadow-sm"
                                >
                                    <Image
                                        source={getItineraryImage(itinerary)}
                                        className="w-full h-40"
                                        resizeMode="cover"
                                    />
                                    <View className="p-4">
                                        <Text className="text-lg font-onest-semibold">{itinerary.title}</Text>
                                        <View className="flex-row items-center mt-1">
                                            <Globe />
                                            <Text className="text-sm text-gray-600 font-onest">
                                                {getItineraryDestination(itinerary)}
                                            </Text>
                                        </View>
                                        <View className="flex-row justify-between items-center mt-3">
                                            <View className="flex-row items-center">
                                                <Calendar />
                                                <Text className="text-sm text-gray-500 font-onest">
                                                    {formatDateRange(itinerary.start_date, itinerary.end_date)}
                                                </Text>
                                            </View>
                                            <View className={`px-3 py-1 rounded-full ${itinerary.status === 'upcoming' ? 'bg-blue-100' :
                                                itinerary.status === 'ongoing' ? 'bg-green-100' : 'bg-gray-100'
                                                }`}>
                                                <Text className={`text-xs font-onest-medium capitalize ${itinerary.status === 'upcoming' ? 'text-blue-600' :
                                                    itinerary.status === 'ongoing' ? 'text-green-600' : 'text-gray-600'
                                                    }`}>
                                                    {itinerary.status}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Show number of experiences */}
                                        <View className="mt-3 pt-3 border-t border-gray-100 flex-row justify-between">
                                            <Text className="text-xs text-gray-500 font-onest">
                                                {itinerary.experiences?.length || 0} experience{itinerary.experiences?.length !== 1 ? 's' : ''}
                                            </Text>
                                            <Text className="text-xs text-primary font-onest-medium">
                                                View details
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                </ScrollView>

                <TouchableOpacity
                    style={{ position: 'absolute', right: 21, bottom: 90 }}
                    className="bg-primary rounded-full p-4 shadow-md"
                    onPress={() => router.push('/(itineraryFlow)/create/')}
                >
                    <View className="flex-row items-center">
                        <Image
                            source={require('../../assets/icons/plus.png')}
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