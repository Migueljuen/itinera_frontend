import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AvailabilityCalendar from '../../../components/AvailablityCalendar';
import API_URL from '../../../constants/api';

// Your existing Experience type and imports...
type Experience = {
    id: number;
    title: string;
    description: string;
    price: string;
    unit: string;
    destination_name: string;
    location: string;
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
    // ... all your existing state and useEffect code stays the same ...
    const { id, tripStartDate: paramTripStart, tripEndDate: paramTripEnd } = useLocalSearchParams();
    const experienceId = Number(id);
    const [experience, setExperience] = useState<Experience | null>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [activeTab, setActiveTab] = useState('details');
    
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

    // Your existing useEffect
    useEffect(() => {
        const fetchExperience = async () => {
            try {
                const response = await fetch(`${API_URL}/experience/${experienceId}`);
                const data = await response.json();
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

    // ADD THIS FUNCTION - Handle opening maps
    const handleOpenMap = async () => {
        if (!experience?.destination) {
            Alert.alert('Error', 'Location not available');
            return;
        }

        const { latitude, longitude, name } = experience.destination;
        const label = encodeURIComponent(`${experience.title} - ${name}`);
        
        let url = '';
        
        if (Platform.OS === 'ios') {
            // Try Apple Maps first
            url = `maps:0,0?q=${label}@${latitude},${longitude}`;
        } else {
            // Android - use geo URI
            url = `geo:0,0?q=${latitude},${longitude}(${label})`;
        }

        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                // Fallback to Google Maps web version
                const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&query_place_id=${label}`;
                await Linking.openURL(webUrl);
            }
        } catch (error) {
            console.error('Error opening map:', error);
            Alert.alert('Error', 'Unable to open map application');
        }
    };

    // Your existing handler functions...
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

    // Your existing loading and error states...
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
            {/* Your existing image section... */}
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
                        <Text>{imageError ? 'Failed to load image' : 'No image available'}</Text>
                    </View>
                )}
            </View>

            <View className='px-6 pt-2 -mt-5 rounded-3xl bg-white'>
                <View className='flex-row justify-between'>
                    <Text className="text-2xl font-semibold mt-4 w-9/12">{experience.title}</Text>
                    <Text className="my-4 text-gray-600">{experience.unit}</Text>
                </View>

                <Text className="text-lg font-bold text-blue-500 my-2">
                    {experience.price ? `$${experience.price}` : 'Price not available'}
                </Text>

                {/* Your existing tab navigation... */}
                <View className="flex-row border-b border-gray-200 mt-4">
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
                        <View className="flex-row flex-wrap">
                            {experience.tags && experience.tags.map((tag) => (
                                <Text key={tag} className="bg-blue-100 text-blue-600 text-xs rounded-full px-3 py-1 mr-2 mb-2">
                                    {tag}
                                </Text>
                            ))}
                        </View>
                        
                        <Text className="text-lg font-semibold mt-4 mb-2">Description</Text>
                        <Text className="text-gray-600">
                            {expanded
                                ? experience.description
                                : (experience.description?.length > 150
                                    ? `${experience.description.substring(0, 150)}...`
                                    : experience.description)
                            }
                        </Text>

                        {experience.description?.length > 150 && (
                            <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                                <Text className="text-blue-500 mt-2">
                                    {expanded ? 'Read Less' : 'Read More'}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* UPDATED Location Button  */}
                        <TouchableOpacity
                            className={`mt-6 py-3 rounded-lg items-center ${
                                experience.destination ? 'bg-blue-500' : 'bg-gray-400'
                            }`}
                            onPress={handleOpenMap}
                            disabled={!experience.destination}
                        >
                            <Text className="text-white font-semibold">
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