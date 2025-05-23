import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Image,
    FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ItineraryFormData, ItineraryItem } from './Step2Preference';
import API_URL from '../../../../constants/api'

interface Experience {
    id: number;  // matches experience_id in your schema
    title: string;
    description: string;
    price: number;
    unit: string;
    destination_name: string;
    location: string;  // city from the destination table
    tags: string[];  // from the tags table via experience_tags
    images: string[];  // from experience_images table
    availability: AvailabilityInfo[];  // from experience_availability joined with availability_time_slots
    budget_category: 'Free' | 'Budget-friendly' | 'Mid-range' | 'Premium';  // calculated based on price
    type?: 'recommended' | 'other';
}

interface AvailabilityInfo {
    availability_id: number;
    experience_id: number;
    day_of_week: string;  // matches day_of_week in your schema
    time_slots: TimeSlot[];
}

interface TimeSlot {
    slot_id: number;  // matches slot_id in your schema
    availability_id: number;
    start_time: string;  // matches start_time in your schema
    end_time: string;  // matches end_time in your schema
}

interface StepProps {
    formData: ItineraryFormData;
    setFormData: React.Dispatch<React.SetStateAction<ItineraryFormData>>;
    onNext: () => void;
    onBack: () => void;
}

const Step3AddItems: React.FC<StepProps> = ({ formData, setFormData, onNext, onBack }) => {
    const [experiences, setExperiences] = useState<Experience[]>([]);
    const [filteredExperiences, setFilteredExperiences] = useState<Experience[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedExperiences, setSelectedExperiences] = useState<Record<number, boolean>>({});

    useEffect(() => {
        console.log('=== User selections from previous steps ===');

        // Step 1 data
        console.log('From Step 1:');
        console.log('  City:', formData.city);
        console.log('  Start date:', formData.start_date);
        console.log('  End date:', formData.end_date);

        // Step 2 preferences data
        if (formData.preferences) {
            console.log('From Step 2:');
            console.log('  Experiences:', formData.preferences.experiences);
            console.log('  Travel companion:', formData.preferences.travelCompanion);
            console.log('  Explore time:', formData.preferences.exploreTime);
            console.log('  Budget:', formData.preferences.budget);
        }

        // Complete form data
        console.log('Complete form data:', formData);
        console.log('==========================================');
    }, []);


    useEffect(() => {
        const fetchExperiences = async () => {
            try {
                setLoading(true);

                // ========== 1. Fetch recommended experiences (with preferences) ==========
                const fullParams = new URLSearchParams();
                fullParams.append('location', formData.city);
                fullParams.append('start_date', formData.start_date);
                fullParams.append('end_date', formData.end_date);

                if (formData.preferences) {
                    if (formData.preferences.experiences?.length) {
                        fullParams.append('tags', formData.preferences.experiences.join(','));
                    }
                    if (formData.preferences.budget) {
                        fullParams.append('budget', formData.preferences.budget);
                    }
                    if (formData.preferences.exploreTime) {
                        fullParams.append('explore_time', formData.preferences.exploreTime);
                    }
                    if (formData.preferences.travelCompanion) {
                        fullParams.append('travel_companion', formData.preferences.travelCompanion);
                    }
                }

                const recommendedUrl = `${API_URL}/experience?${fullParams.toString()}`;
                const recommendedResponse = await fetch(recommendedUrl);

                if (!recommendedResponse.ok) {
                    throw new Error('Failed to fetch recommended experiences');
                }

                const recommendedData = await recommendedResponse.json();
                const recommendedExperiences = recommendedData.map((exp: any) => ({
                    ...exp,
                    type: 'recommended',
                }));

                // ========== 2. Fetch other experiences (only by date) ==========
                const fallbackParams = new URLSearchParams();
                fallbackParams.append('start_date', formData.start_date);
                fallbackParams.append('end_date', formData.end_date);

                if (formData.preferences?.experiences?.length) {
                    fallbackParams.append('tags', formData.preferences.experiences.join(','));
                }

                const otherUrl = `${API_URL}/experience?${fallbackParams.toString()}`;
                const otherResponse = await fetch(otherUrl);

                if (!otherResponse.ok) {
                    throw new Error('Failed to fetch fallback experiences');
                }

                const otherData = await otherResponse.json();

                // Filter out duplicates (experiences already in recommended)
                const recommendedIds = new Set(recommendedData.map((exp: any) => exp.id));
                const otherExperiences = otherData
                    .filter((exp: any) => !recommendedIds.has(exp.id))
                    .map((exp: any) => ({
                        ...exp,
                        type: 'other',
                    }));

                // ========== Final merge ==========
                const allExperiences = [...recommendedExperiences, ...otherExperiences];

                setExperiences(allExperiences);
                setFilteredExperiences(allExperiences);
                setLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
                setLoading(false);
            }
        };

        fetchExperiences();
    }, [formData.city, formData.start_date, formData.end_date, formData.preferences]);




    // Toggle experience selection
    const toggleExperienceSelection = (experienceId: number) => {
        setSelectedExperiences(prev => ({
            ...prev,
            [experienceId]: !prev[experienceId]
        }));
    };

    // Check if Next button should be enabled
    const isNextEnabled = () => {
        const selectedIds = Object.keys(selectedExperiences).filter(id => selectedExperiences[Number(id)]);
        return selectedIds.length > 0;
    };

    // Handle Next button click
    const handleNext = () => {
        // Get all selected experience IDs
        const selectedIds = Object.keys(selectedExperiences)
            .filter(id => selectedExperiences[Number(id)])
            .map(id => Number(id));

        // Find the selected experience objects
        const selectedExperienceObjects = experiences.filter(exp => selectedIds.includes(exp.id));

        // Calculate trip duration in days
        const startDate = new Date(formData.start_date);
        const endDate = new Date(formData.end_date);
        const tripDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        // Create itinerary items from selected experiences
        const itineraryItems: ItineraryItem[] = selectedExperienceObjects.map((exp, index) => {
            // Distribute experiences across trip days
            const dayNumber = (index % tripDays) + 1;

            // Calculate the actual date for this day number
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + dayNumber - 1);

            // Get day of week name for this date
            const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDate.getDay()];

            // Default times in case we can't find availability
            let startTime = "10:00";
            let endTime = "12:00";

            // Try to find matching availability for this day and experience
            const dayAvailability = exp.availability.find(a => a.day_of_week === dayName);
            if (dayAvailability && dayAvailability.time_slots.length > 0) {
                // Use the first available time slot for this day
                const slot = dayAvailability.time_slots[0];
                startTime = slot.start_time.substring(0, 5); // Extract HH:MM from HH:MM:SS
                endTime = slot.end_time.substring(0, 5); // Extract HH:MM from HH:MM:SS
            }

            return {
                experience_id: exp.id,
                day_number: dayNumber,
                start_time: startTime,
                end_time: endTime,
                custom_note: `Experience at ${exp.destination_name}`
            };
        });

        // Update form data with selected experiences
        setFormData({
            ...formData,
            items: [...(formData.items || []), ...itineraryItems]
        });

        onNext();
    };

    // Retry fetch function
    const retryFetch = () => {
        setError(null);
        // Re-trigger the useEffect by updating a dependency
        setLoading(true);
        // The useEffect will handle the actual fetching
    };

    // Render experience card
    const renderExperienceCard = ({ item }: { item: Experience }) => {
        const isSelected = selectedExperiences[item.id] || false;

        return (
            <TouchableOpacity
                className={`mb-4 rounded-lg overflow-hidden border ${isSelected ? 'border-primary' : 'border-gray-200'}`}
                onPress={() => toggleExperienceSelection(item.id)}
                activeOpacity={0.7}
            >
                <View className="relative">
                    {/* Image */}
                    {item.images && item.images.length > 0 ? (
                        <Image
                            source={{ uri: `${API_URL}/${item.images[0]}` }}
                            className="w-full h-40"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="w-full h-40 bg-gray-200 items-center justify-center">
                            <Ionicons name="image-outline" size={40} color="#A0AEC0" />
                        </View>
                    )}

                    {/* Price Badge */}
                    <View className="absolute top-2 right-2 bg-white/80 px-2 py-1 rounded-md">
                        <Text className="font-onest-medium">
                            {item.price === 0 ? 'Free' : `${item.price} ${item.unit}`}
                        </Text>
                    </View>

                    {/* Selection Indicator */}
                    {isSelected && (
                        <View className="absolute top-2 left-2 bg-primary p-1 rounded-full">
                            <Ionicons name="checkmark" size={20} color="white" />
                        </View>
                    )}
                </View>

                <View className="p-3">
                    {/* Title */}
                    <Text className="text-lg font-onest-semibold mb-1">{item.title}</Text>

                    {/* Location */}
                    <View className="flex-row items-center mb-2">
                        <Ionicons name="location-outline" size={16} color="#4F46E5" />
                        <Text className="text-sm text-gray-600 ml-1">{item.destination_name}</Text>
                    </View>

                    {/* Tags */}
                    <View className="flex-row flex-wrap">
                        {item.tags.slice(0, 3).map((tag, index) => (
                            <View key={index} className="bg-indigo-50 px-2 py-1 rounded-md mr-2 mb-2 ">
                                <Text className="text-xs text-primary font-onest-medium">{tag}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Budget Category */}
                    {/* <View className="flex-row items-center mt-1">
                        <Ionicons name="cash-outline" size={16} color="#4F46E5" />
                        <Text className="text-xs text-gray-600 ml-1">{item.budget_category}</Text>
                    </View> */}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
        >
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
            >
                <View className="p-4 flex-1">
                    {/* Header */}
                    <View className="text-center py-2">
                        <Text className="text-center text-xl font-onest-semibold mb-2">
                            Select Experiences
                        </Text>
                        <Text className="text-center text-sm text-gray-500 font-onest mb-6 w-11/12 m-auto">
                            Choose the experiences you'd like to add to your itinerary for {formData.city}.
                        </Text>
                    </View>

                    {/* Loading/Error/Content */}
                    {loading ? (
                        <View className="flex-1 justify-center items-center">
                            <ActivityIndicator size="large" color="#4F46E5" />
                        </View>
                    ) : error ? (
                        <View className="flex-1 justify-center items-center">
                            <Text className="text-red-500 font-onest-medium">{error}</Text>
                            <TouchableOpacity
                                onPress={retryFetch}
                                className="mt-4 bg-primary px-4 py-2 rounded-lg"
                            >
                                <Text className="text-white font-onest-medium">Try Again</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            {filteredExperiences.filter(exp => exp.type === 'recommended').length > 0 && (
                                <>
                                    <Text className="text-xl font-onest-bold mb-2">Recommended for You</Text>
                                    <FlatList
                                        data={filteredExperiences.filter(exp => exp.type === 'recommended')}
                                        renderItem={renderExperienceCard}
                                        keyExtractor={(item) => item.id.toString()}
                                        scrollEnabled={false} // prevent inner scroll
                                        showsVerticalScrollIndicator={false}
                                        className="mb-4"
                                    />
                                </>
                            )}

                            {filteredExperiences.filter(exp => exp.type === 'other').length > 0 && (
                                <>
                                    <Text className="text-xl font-onest-bold mb-2">Other Experiences</Text>
                                    <FlatList
                                        data={filteredExperiences.filter(exp => exp.type === 'other')}
                                        renderItem={renderExperienceCard}
                                        keyExtractor={(item) => item.id.toString()}
                                        scrollEnabled={false} // prevent inner scroll
                                        showsVerticalScrollIndicator={false}
                                    />
                                </>
                            )}
                        </>
                    )}

                    {/* Selected Count Indicator */}
                    {Object.values(selectedExperiences).filter(Boolean).length > 0 && (
                        <View className="bg-indigo-50 p-2 rounded-lg mt-2 mb-2 flex-row justify-between items-center">
                            <Text className="font-onest-medium text-primary">
                                {Object.values(selectedExperiences).filter(Boolean).length} experiences selected
                            </Text>
                            <TouchableOpacity
                                onPress={() => setSelectedExperiences({})}
                                className="px-2 py-1"
                            >
                                <Text className="text-gray-500 font-onest-medium">Clear</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Navigation Buttons */}
                    <View className="flex-row justify-between mt-2 pt-2 border-t border-gray-200">
                        <TouchableOpacity
                            onPress={onBack}
                            className="py-4 px-6 rounded-xl border border-gray-300"
                            activeOpacity={0.7}
                        >
                            <Text className="text-center font-onest-medium text-base text-gray-700">
                                Back
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleNext}
                            className={`py-4 px-8 rounded-xl ${isNextEnabled() ? 'bg-primary' : 'bg-gray-200'}`}
                            disabled={!isNextEnabled()}
                            activeOpacity={0.7}
                        >
                            <Text className="text-center font-onest-medium text-base text-white">
                                Next step
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default Step3AddItems;