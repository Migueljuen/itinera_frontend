import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AvailabilityCalendar from '../../../components/AvailablityCalendar';
import API_URL from '../../../constants/api';

// Updated Experience type to match your API response
type Experience = {
    experience_id: number;
    creator_id: number;
    title: string;
    description: string;
    price: string;
    unit: string;
    destination_name: string;
    destination_id: number;
    status: string;
    travel_companion: string;
    created_at: string;
    tags: string[];
    images: string[];
    destination: {
        destination_id: number;
        name: string;
        city: string;
        longitude: number;
        latitude: number;
        description: string;
    };
};

import { ItineraryItem } from '../../../types/itineraryTypes';

export default function ExperienceDetail() {
    const router = useRouter();
    const { id, tripStartDate: paramTripStart, tripEndDate: paramTripEnd } = useLocalSearchParams();
    const experienceId = Number(id);
    const [experience, setExperience] = useState<Experience | null>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [activeTab, setActiveTab] = useState('details');
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    const getCurrentDateString = () => new Date().toISOString().split('T')[0];
    const getNextWeekDateString = () => {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        return nextWeek.toISOString().split('T')[0];
    };

    const [tripStartDate, setTripStartDate] = useState<string>(
        (paramTripStart as string) || getCurrentDateString()
    );
    const [tripEndDate, setTripEndDate] = useState<string>(
        (paramTripEnd as string) || getNextWeekDateString()
    );
    const [selectedItems, setSelectedItems] = useState<ItineraryItem[]>([]);

    // Get current user ID to check if they can edit
    useEffect(() => {
        const getCurrentUser = async () => {
            try {
                const user = await AsyncStorage.getItem('user');
                if (user) {
                    const parsedUser = JSON.parse(user);
                    setCurrentUserId(parsedUser.user_id);
                }
            } catch (error) {
                console.error('Error getting current user:', error);
            }
        };
        getCurrentUser();
    }, []);

    // Fetch experience data
    useEffect(() => {
        const fetchExperience = async () => {
            try {
                const response = await fetch(`${API_URL}/experience/${experienceId}`);
                const data = await response.json();
                console.log('Experience data:', data); // Debug log
                setExperience(data);

                if (data && data.destination) {
                    console.log('Destination coordinates:', {
                        latitude: data.destination.latitude,
                        longitude: data.destination.longitude,
                        name: data.destination.name
                    });
                }
            } catch (error) {
                console.error('Error fetching experience data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchExperience();
    }, [experienceId]);

    // Handle opening maps
    const handleOpenMap = async () => {
        if (!experience?.destination) {
            Alert.alert('Error', 'Location not available');
            return;
        }

        const { latitude, longitude, name } = experience.destination;
        const label = encodeURIComponent(`${experience.title} - ${name}`);

        let url = '';

        if (Platform.OS === 'ios') {
            url = `maps:0,0?q=${label}@${latitude},${longitude}`;
        } else {
            url = `geo:0,0?q=${latitude},${longitude}(${label})`;
        }

        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&query_place_id=${label}`;
                await Linking.openURL(webUrl);
            }
        } catch (error) {
            console.error('Error opening map:', error);
            Alert.alert('Error', 'Unable to open map application');
        }
    };

    // Handle edit navigation
    const handleEdit = () => {
        if (experience) {
            router.push(`/(updateExperience)/${experience.experience_id}`);
            console.log('itot');

        }
    };

    // Check if current user can edit this experience
    const canEdit = currentUserId && experience && currentUserId === experience.creator_id;

    const handleTimeSlotSelect = (item: ItineraryItem) => {
        setSelectedItems(prev => [...prev, item]);
    };

    const handleTimeSlotDeselect = (item: ItineraryItem) => {
        setSelectedItems(prev => prev.filter(selected =>
            !(selected.experience_id === item.experience_id &&
                selected.day_number === item.day_number &&
                selected.start_time === item.start_time &&
                selected.end_time === item.end_time)
        ));
    };

    const getFormattedImageUrl = (imageUrl: string) => {
        if (!imageUrl) return null;
        if (imageUrl.startsWith('http')) {
            return imageUrl;
        }
        const formattedPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
        return `${API_URL}${formattedPath}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#0000ff" />
            </SafeAreaView>
        );
    }

    if (!experience) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center">
                <Text>Experience not found.</Text>
            </SafeAreaView>
        );
    }

    return (
        <ScrollView className='flex-1'>


            {/* Image section */}
            <View className="w-full h-80 overflow-hidden bg-gray-200">
                {experience.images && experience.images.length > 0 && !imageError ? (
                    <Image
                        source={{ uri: getFormattedImageUrl(experience.images[0])! }}
                        className="w-full h-full"
                        resizeMode="cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <View className="w-full h-full justify-center items-center">
                        <Ionicons name="image-outline" size={60} color="#9CA3AF" />
                        <Text className="text-gray-500 mt-2">
                            {imageError ? 'Failed to load image' : 'No image available'}
                        </Text>
                    </View>
                )}
            </View>

            <View className='px-6 pt-2 -mt-5 rounded-3xl bg-white'>
                {/* Title and basic info */}
                <View className='flex-row justify-between items-start'>
                    <View className="flex-row items-center">
                        <Text className="text-2xl font-semibold mt-4">{experience.title}</Text>
                        {canEdit && (
                            <TouchableOpacity
                                className="bg-white/80 p-2 rounded-full ml-2"
                                onPress={handleEdit}
                            >
                                <Ionicons name="pencil" size={24} color="#4F46E5" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <View className="flex-row items-center mt-2">
                        <Ionicons name="location-outline" size={16} color="#6B7280" />
                        <Text className="text-gray-600 ml-1">{experience.destination_name}</Text>
                    </View>

                    <View className="mt-4">
                        <Text className="text-lg font-bold text-blue-500">
                            {experience.price && experience.price !== "0" ? `₱${experience.price}` : 'Free'}
                        </Text>
                        <Text className="text-gray-500 text-center">{experience.unit}</Text>
                    </View>
                </View>

                {/* Status and travel companion */}
                <View className="flex-row mt-4 space-x-2">
                    <View className={`px-3 py-1 rounded-full ${experience.status === 'active' ? 'bg-green-100' :
                        experience.status === 'draft' ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                        <Text className={`text-xs font-medium ${experience.status === 'active' ? 'text-green-700' :
                            experience.status === 'draft' ? 'text-yellow-700' : 'text-red-700'
                            }`}>
                            {experience.status.charAt(0).toUpperCase() + experience.status.slice(1)}
                        </Text>
                    </View>
                </View>

                {/* Created date */}
                <Text className="text-gray-500 text-xs mt-2">
                    Created on {formatDate(experience.created_at)}
                </Text>

                {/* Tab navigation */}
                <View className="flex-row border-b border-gray-200 mt-6">
                    <TouchableOpacity
                        className={`px-4 py-2 ${activeTab === 'details' ? 'border-b-2 border-blue-500' : ''}`}
                        onPress={() => setActiveTab('details')}
                    >
                        <Text className={`${activeTab === 'details' ? 'text-blue-500 font-medium' : 'text-gray-600'}`}>
                            Details
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`px-4 py-2 ${activeTab === 'availability' ? 'border-b-2 border-blue-500' : ''}`}
                        onPress={() => setActiveTab('availability')}
                    >
                        <Text className={`${activeTab === 'availability' ? 'text-blue-500 font-medium' : 'text-gray-600'}`}>
                            Availability
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Content based on active tab */}
                {activeTab === 'details' ? (
                    <View className="py-4">
                        {/* Tags */}
                        <View className="flex-row flex-wrap mb-4">
                            {experience.tags && experience.tags.map((tag, index) => (
                                <Text key={index} className="bg-blue-100 text-blue-600 text-xs rounded-full px-3 py-1 mr-2 mb-2">
                                    {tag}
                                </Text>
                            ))}
                        </View>

                        {/* Description */}
                        <Text className="text-lg font-semibold mb-2">Description</Text>
                        <Text className="text-gray-600 leading-6">
                            {expanded
                                ? experience.description
                                : (experience.description?.length > 150
                                    ? `${experience.description.substring(0, 150)}...`
                                    : experience.description)
                            }
                        </Text>

                        {experience.description?.length > 150 && (
                            <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                                <Text className="text-blue-500 mt-2 font-medium">
                                    {expanded ? 'Read Less' : 'Read More'}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* Additional images */}
                        {experience.images && experience.images.length > 1 && (
                            <View className="mt-6">
                                <Text className="text-lg font-semibold mb-3">Gallery</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {experience.images.slice(1).map((image, index) => (
                                        <Image
                                            key={index}
                                            source={{ uri: getFormattedImageUrl(image)! }}
                                            className="w-24 h-24 rounded-lg mr-3"
                                            resizeMode="cover"
                                        />
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Location Button */}
                        <TouchableOpacity
                            className={`mt-6 py-3 px-4 rounded-lg items-center flex-row justify-center ${experience.destination ? 'bg-blue-500' : 'bg-gray-400'
                                }`}
                            onPress={handleOpenMap}
                            disabled={!experience.destination}
                        >
                            <Ionicons name="location" size={20} color="white" />
                            <Text className="text-white font-semibold ml-2">
                                {experience.destination
                                    ? 'Open Location on Map'
                                    : 'Location Not Available'
                                }
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View className="py-4">
                        <AvailabilityCalendar
                            experienceId={experienceId}
                            tripStartDate={tripStartDate}
                            tripEndDate={tripEndDate}
                            selectedItems={selectedItems}
                            onTimeSlotSelect={handleTimeSlotSelect}
                            onTimeSlotDeselect={handleTimeSlotDeselect}
                        />
                    </View>
                )}
            </View>
        </ScrollView>
    );
}