import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import API_URL from '../../../constants/api'; // Your API base URL

// Update Experience type to match the API data structure
type Experience = {
    id: string; // ← Changed to string to match your card component
    title: string;
    description: string;
    price: string;
    unit: string;
    destination_name: string;
    location: string;
    tags: string[]; // ✅ this must be an array of strings
    images: string[];
};

export default function ExperienceDetail() {
    const { id } = useLocalSearchParams();
    // Handle both string and array cases from useLocalSearchParams
    const experienceId = Array.isArray(id) ? id[0] : id;
    const [experience, setExperience] = useState<Experience | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [activeTab, setActiveTab] = useState('details'); // 'details' or 'availability'

    // Add debugging logs
    console.log('Raw ID from params:', id);
    console.log('Parsed experience ID:', experienceId);
    console.log('API URL:', API_URL);
    console.log('Full API endpoint:', `${API_URL}/experience/${experienceId}`);

    // Fetch experience data
    useEffect(() => {
        const fetchExperience = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const apiEndpoint = `${API_URL}/experience/${experienceId}`;
                console.log('Fetching from:', apiEndpoint);
                
                const response = await fetch(apiEndpoint);
                console.log('Response status:', response.status);
                console.log('Response ok:', response.ok);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('API Response data:', data);
                
                setExperience(data);

                // Log image data for debugging
       
            } catch (error) {
                console.error('Error fetching experience data:', error);
                setError(error instanceof Error ? error.message : 'Unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        // Only fetch if we have a valid ID
        if (experienceId && experienceId.length > 0) {
            fetchExperience();
        } else {
            console.error('Invalid experience ID:', id);
            setError('Invalid experience ID');
            setLoading(false);
        }
    }, [experienceId]);

    // Handle image URL formatting
    const getFormattedImageUrl = (imageUrl: string) => {
        if (!imageUrl) return null;

        // If it already starts with http, use as is
        if (imageUrl.startsWith('http')) {
            return imageUrl;
        }

        // Make sure path starts with '/'
        const formattedPath = imageUrl.startsWith('/')
            ? imageUrl
            : `/${imageUrl}`;

        return `${API_URL}${formattedPath}`;
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#0000ff" />
                <Text className="mt-2">Loading experience {experienceId}...</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center p-4">
                <Text className="text-red-500 text-center mb-4">Error: {error}</Text>
                <Text className="text-gray-600 text-center">
                    Tried to fetch: {API_URL}/experience/{experienceId}
                </Text>
            </SafeAreaView>
        );
    }

    if (!experience) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center">
                <Text>Experience not found.</Text>
                <Text className="text-gray-600 mt-2">ID: {experienceId}</Text>
            </SafeAreaView>
        );
    }

    return (
        <ScrollView className='flex-1'>
            {/* Debug info - remove this in production */}
            <View className="bg-yellow-100 p-2 m-2 rounded">
                <Text className="text-xs">Debug - ID: {experienceId}, Title: {experience.title}</Text>
            </View>
            
            {/* Display image */}
            <View className="w-full h-80 overflow-hidden bg-gray-200">
                {experience.images && experience.images.length > 0 && !imageError ? (
                    <Image
                        source={{ uri: getFormattedImageUrl(experience.images[0])! }}
                        className="w-full h-full"
                        resizeMode="cover"
                        onError={(e) => {
                            console.log('Image load error:', e.nativeEvent.error);
                            setImageError(true);
                        }}
                    />
                ) : (
                    <View className="w-full h-full justify-center items-center">
                        <Text>{imageError ? 'Failed to load image' : 'No image available'}</Text>
                        {experience.images && experience.images.length > 0 && (
                            <Text className="text-xs text-gray-500 mt-2">
                                URL: {getFormattedImageUrl(experience.images[0])}
                            </Text>
                        )}
                    </View>
                )}
            </View>

            <View className='px-6 pt-2 -mt-5 rounded-3xl bg-white'>
                <View className='flex-row justify-between'>
                    <Text className="text-2xl font-semibold mt-4 w-9/12">{experience.title || 'No title'}</Text>
                    <Text className="my-4 text-gray-600">{experience.unit || 'No unit'}</Text>
                </View>

                <Text className="text-lg font-bold text-blue-500 my-2">
                    {experience.price ? `$${experience.price}` : 'Price not available'}
                </Text>

                {/* Tab navigation */}
                <View className="flex-row border-b border-gray-200 mt-4">
                    <TouchableOpacity
                        className={`px-4 py-2 ${activeTab === 'details' ? 'border-b-2 border-blue-500' : ''}`}
                        onPress={() => setActiveTab('details')}
                    >
                        <Text className={`${activeTab === 'details' ? 'text-blue-500 font-medium' : 'text-gray-600'}`}>Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`px-4 py-2 ${activeTab === 'availability' ? 'border-b-2 border-blue-500' : ''}`}
                        onPress={() => setActiveTab('availability')}
                    >
                        <Text className={`${activeTab === 'availability' ? 'text-blue-500 font-medium' : 'text-gray-600'}`}>Availability</Text>
                    </TouchableOpacity>
                </View>

                {/* Content based on active tab */}
                {activeTab === 'details' ? (
                    // Details content
                    <View className="py-4">
                        <View className="flex-row flex-wrap">
                            {experience.tags && experience.tags.length > 0 ? (
                                experience.tags.map((tag, index) => (
                                    <Text key={index} className="bg-blue-100 text-blue-600 text-xs rounded-full px-3 py-1 mr-2 mb-2">
                                        {tag}
                                    </Text>
                                ))
                            ) : (
                                <Text className="text-gray-500 text-sm">No tags available</Text>
                            )}
                        </View>
                        <Text className="text-lg font-semibold mt-4 mb-2">Description</Text>
                        <Text className="text-gray-600">
                            {experience.description ? (
                                expanded
                                    ? experience.description
                                    : (experience.description.length > 150
                                        ? `${experience.description.substring(0, 150)}...`
                                        : experience.description)
                            ) : 'No description available'}
                        </Text>

                        {experience.description && experience.description.length > 150 && (
                            <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                                <Text className="text-blue-500 mt-2">{expanded ? 'Read Less' : 'Read More'}</Text>
                            </TouchableOpacity>
                        )}

                        {/* Location Button */}
                        <TouchableOpacity
                            className="mt-6 bg-blue-500 py-3 rounded-lg items-center"
                            onPress={() => {/* Open map */ }}
                        >
                            <Text className="text-white font-semibold">Open Location on Map</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    // Availability calendar
                    <View className="py-4">
                        {/* <AvailabilityCalendar experienceId={experienceId} /> */}
                        <Text>Availability calendar would go here</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}