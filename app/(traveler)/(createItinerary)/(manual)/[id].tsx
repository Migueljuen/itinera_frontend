import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AvailabilityCalendar from '../../../../components/AvailablityCalendar';
import API_URL from '../../../../constants/api';
import { ItineraryFormData, ItineraryItem } from './Step2Preference';

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
};

export default function ExperienceDetail() {
    const { returnTo,from, id, formData: formDataParam } = useLocalSearchParams();
    const experienceId = Number(id);
    const [experience, setExperience] = useState<Experience | null>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [activeTab, setActiveTab] = useState('details');
    
    // Parse form data from params (if passed from Step3)
    const [formData, setFormData] = useState<ItineraryFormData | null>(null);

    useEffect(() => {
        if (formDataParam && typeof formDataParam === 'string') {
            try {
                const parsedFormData = JSON.parse(formDataParam);
                setFormData(parsedFormData);
            } catch (error) {
                console.error('Error parsing form data:', error);
            }
        }
    }, [formDataParam]);

    // Get selected items for this specific experience
    const selectedItemsForExperience = formData 
        ? formData.items.filter(item => item.experience_id === experienceId)
        : [];

    // Handle time slot selection
    const handleTimeSlotSelect = (newItem: ItineraryItem) => {
        if (!formData) return;
        
        const updatedFormData = {
            ...formData,
            items: [...formData.items, newItem]
        };
        setFormData(updatedFormData);
        
        // Store in a way that can be retrieved by Step3 (localStorage alternative)
        // Since we can't use localStorage, we'll pass it back through navigation
    };

    // Handle time slot deselection
    const handleTimeSlotDeselect = (itemToRemove: ItineraryItem) => {
        if (!formData) return;
        
        const updatedFormData = {
            ...formData,
            items: formData.items.filter(item => 
                !(item.experience_id === itemToRemove.experience_id &&
                  item.day_number === itemToRemove.day_number &&
                  item.start_time === itemToRemove.start_time &&
                  item.end_time === itemToRemove.end_time)
            )
        };
        setFormData(updatedFormData);
    };

    // Fetch experience data
    useEffect(() => {
        const fetchExperience = async () => {
            try {
                const response = await fetch(`${API_URL}/experience/${experienceId}`);
                const data = await response.json();
                setExperience(data);
            } catch (error) {
                console.error('Error fetching experience data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchExperience();
    }, [experienceId]);

    // Handle image URL formatting
    const getFormattedImageUrl = (imageUrl: string) => {
        if (!imageUrl) return null;
        if (imageUrl.startsWith('http')) {
            return imageUrl;
        }
        const formattedPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
        return `${API_URL}${formattedPath}`;
    };

const handleBack = () => {
  if (typeof returnTo === 'string') {
    router.push({
      pathname: returnTo as any, // optionally cast to `any` or a known valid route
      params: {
        updatedFormData: JSON.stringify(formData),
      },
    });
  } else {
    router.back();
  }
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
console.log('formData:', formData);

    return (
        <View className="flex-1 relative">
            {/* Back Button */}
            <Pressable onPress={handleBack} className="absolute top-12 left-4 z-10">
                <View
                    className="p-2 rounded-full bg-black/50"
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        elevation: 5,
                    }}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </View>
            </Pressable>

            <ScrollView className='flex-1'>
                {/* Display image */}
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

                    {/* Tab navigation */}
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
                                Availability {selectedItemsForExperience.length > 0 && `(${selectedItemsForExperience.length})`}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Content based on active tab */}
                    {activeTab === 'details' ? (
                        // Details content
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
                        // Availability calendar - only show if formData exists
                        <View className="py-4 bg-red-300">
                            {formData ? (
                                <AvailabilityCalendar 
                                    experienceId={experienceId}
                                    tripStartDate={formData.start_date}
                                    tripEndDate={formData.end_date}
                                    selectedItems={selectedItemsForExperience}
                                    onTimeSlotSelect={handleTimeSlotSelect}
                                    onTimeSlotDeselect={handleTimeSlotDeselect}
                                />
                            ) : (
                                <View className="py-8 bg-gray-50 rounded-lg items-center justify-center">
                                    <Text className="text-gray-600 text-center">
                                        Availability booking is only available when creating an itinerary.
                                    </Text>
                                    <TouchableOpacity 
                                        className="mt-4 bg-blue-500 py-2 px-4 rounded-lg"
                                        onPress={() => router.push('/create-itinerary')} // Navigate to your itinerary creation flow
                                    >
                                        <Text className="text-white font-medium">Create Itinerary</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}