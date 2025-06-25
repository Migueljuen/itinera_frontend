import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import API_URL from '../../../../constants/api';

// Types from your existing code
type Experience = 'Adventure' | 'Cultural' | 'Food' | 'Nature' | 'Relaxation' | 'Nightlife';
type TravelCompanion = 'Solo' | 'Partner' | 'Friends' | 'Family' | 'Any';
type ExploreTime = 'Daytime' | 'Nighttime' | 'Both';
type Budget = 'Free' | 'Budget-friendly' | 'Mid-range' | 'Premium';
type ActivityIntensity = 'Low' | 'Moderate' | 'High';
type TravelDistance = 'Nearby' | 'Moderate' | 'Far';

export interface ItineraryFormData {
    traveler_id: number;
    start_date: string;
    end_date: string;
    title: string;
    notes?: string;
    city: string;
    items: ItineraryItem[];
    preferences?: {
        experiences: Experience[];
        travelCompanion: TravelCompanion;
        exploreTime: ExploreTime;
        budget: Budget;
        activityIntensity: ActivityIntensity;
        travelDistance: TravelDistance;
    };
}

export interface ItineraryItem {
    experience_id: number;
    day_number: number;
    start_time: string;
    end_time: string;
    custom_note?: string;
    experience_name?: string;
    experience_description?: string;
    destination_name?: string;
    destination_city?: string;
    images?: string[];
    primary_image?: string;
    price?: number;
    unit?: string;
}

interface GeneratedItinerary {
    itinerary_id: number;
    traveler_id: number;
    start_date: string;
    end_date: string;
    title: string;
    notes: string;
    created_at: string;
    status: string;
    items: ItineraryItem[];
}

interface GenerateItineraryResponse {
    message: string;
    itinerary_id: number;
    itineraries: GeneratedItinerary[];
    total_experiences: number;
    selected_experiences: number;
    activity_intensity: string;
}

// Enhanced error interface
interface EnhancedError {
    error: string;
    message: string;
    details?: {
        total_experiences_in_city: number;
        filter_breakdown: {
            after_travel_companion: number;
            after_budget: number;
            after_distance: number;
            after_availability: number;
        };
        suggestions: string[];
        conflicting_preferences: string[];
        alternative_options: {
            nearby_cities: Array<{ city: string; experience_count: number }>;
            popular_experiences: Array<{
                title: string;
                price: number;
                travel_companion: string;
                popularity: number;
            }>;
        };
    };
}

interface StepProps {
    formData: ItineraryFormData;
    setFormData: React.Dispatch<React.SetStateAction<ItineraryFormData>>;
    onNext: () => void;
    onBack: () => void;
}

const Step3GeneratedItinerary: React.FC<StepProps> = ({ formData, setFormData, onNext, onBack }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [generatedItinerary, setGeneratedItinerary] = useState<GeneratedItinerary | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [enhancedError, setEnhancedError] = useState<EnhancedError | null>(null);
    const [isPreview, setIsPreview] = useState(true);

    useEffect(() => {
        generateItinerary();
    }, []);

    const generateItinerary = async () => {
        setLoading(true);
        setError(null);
        setEnhancedError(null);

        try {
            // Prepare the request payload based on your backend expectations
            const requestBody = {
                traveler_id: formData.traveler_id,
                city: formData.city,
                start_date: formData.start_date,
                end_date: formData.end_date,
                experience_types: formData.preferences?.experiences || [],
                travel_companion: formData.preferences?.travelCompanion || '',
                explore_time: formData.preferences?.exploreTime || '',
                budget: formData.preferences?.budget || '',
                activity_intensity: formData.preferences?.activityIntensity || '',
                travel_distance: formData.preferences?.travelDistance || '',
                title: formData.title,
                notes: formData.notes || 'Auto-generated itinerary'
            };

            console.log('Generating itinerary with data:', requestBody);
            console.log('Travel distance preference:', formData.preferences?.travelDistance);

            const response = await fetch(`${API_URL}/itinerary/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            console.log('Full API Response:', JSON.stringify(data, null, 2));

            if (!response.ok) {
                // Check if it's an enhanced error response
                if (data.error === 'no_experiences_found' && data.details) {
                    setEnhancedError(data);
                    return;
                }
                throw new Error(data.message || 'Failed to generate itinerary');
            }

            if (data.itineraries && data.itineraries.length > 0) {
                setGeneratedItinerary(data.itineraries[0]);
                setFormData({
                    ...formData,
                    items: data.itineraries[0].items
                });
            } else {
                throw new Error('No itinerary generated');
            }

        } catch (err) {
            console.error('Error generating itinerary:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate itinerary');
        } finally {
            setLoading(false);
        }
    };

    // Remove item functionality
    const removeItem = (itemToRemove: ItineraryItem) => {
        Alert.alert(
            'Remove Experience',
            `Are you sure you want to remove "${itemToRemove.experience_name}" from your itinerary?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        if (generatedItinerary) {
                            // Filter out the item to remove
                            const updatedItems = generatedItinerary.items.filter(
                                item => !(
                                    item.experience_id === itemToRemove.experience_id &&
                                    item.day_number === itemToRemove.day_number &&
                                    item.start_time === itemToRemove.start_time
                                )
                            );

                            // Update the generated itinerary
                            const updatedItinerary = {
                                ...generatedItinerary,
                                items: updatedItems
                            };

                            setGeneratedItinerary(updatedItinerary);

                            // Update formData as well
                            setFormData({
                                ...formData,
                                items: updatedItems
                            });

                            console.log(`✅ Removed: ${itemToRemove.experience_name} from Day ${itemToRemove.day_number}`);
                        }
                    }
                }
            ]
        );
    };

    const saveItinerary = async () => {
        console.log('saveItinerary called');
        console.log('Current state - saving:', saving, 'generatedItinerary:', !!generatedItinerary);

        if (!generatedItinerary || saving) {
            console.log('Early return - conditions not met');
            return;
        }

        console.log('Proceeding with save...');
        setSaving(true);
        setError(null);

        try {
            const savePayload = {
                traveler_id: generatedItinerary.traveler_id,
                start_date: generatedItinerary.start_date,
                end_date: generatedItinerary.end_date,
                title: generatedItinerary.title,
                notes: generatedItinerary.notes,
                items: generatedItinerary.items
            };

            console.log('Saving itinerary payload:', savePayload);

            const response = await fetch(`${API_URL}/itinerary/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(savePayload)
            });

            const data = await response.json();
            console.log('Save response:', data);

            if (!response.ok) {
                throw new Error(data.message || 'Failed to save itinerary');
            }

            setGeneratedItinerary({
                ...generatedItinerary,
                itinerary_id: data.itinerary_id,
                status: 'upcoming'
            });

            setIsPreview(false);
            console.log('Save completed successfully');

            setTimeout(() => {
                console.log('Calling onNext()');
                onNext();
            }, 1000);

        } catch (err) {
            console.error('Error saving itinerary:', err);
            setError(err instanceof Error ? err.message : 'Failed to save itinerary');
        } finally {
            console.log('Setting saving to false');
            setSaving(false);
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

    const formatTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const groupItemsByDay = (items: ItineraryItem[]) => {
        const groupedItems: { [key: number]: ItineraryItem[] } = {};
        items.forEach(item => {
            if (!groupedItems[item.day_number]) {
                groupedItems[item.day_number] = [];
            }
            groupedItems[item.day_number].push(item);
        });
        return groupedItems;
    };

    const getActivityIntensityColor = (intensity: string) => {
        switch (intensity.toLowerCase()) {
            case 'low': return 'text-green-600';
            case 'moderate': return 'text-yellow-600';
            case 'high': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    const handleRetry = () => {
        generateItinerary();
    };

    // Helper component for filter steps
    const FilterStep = ({
        label,
        count,
        previousCount,
        icon
    }: {
        label: string;
        count: number;
        previousCount?: number;
        icon: string;
    }) => {
        const dropped = previousCount ? previousCount - count : 0;
        const dropPercentage = previousCount ? Math.round((dropped / previousCount) * 100) : 0;

        return (
            <View className="flex-row items-center justify-between py-2">
                <View className="flex-row items-center flex-1">
                    <Ionicons name={icon as any} size={16} color="#6B7280" />
                    <Text className="ml-2 text-sm font-onest text-gray-700">{label}</Text>
                </View>
                <View className="flex-row items-center">
                    <Text className="font-onest-semibold text-gray-900">{count}</Text>
                    {dropped > 0 && (
                        <Text className="ml-2 text-xs font-onest text-red-600">
                            (-{dropped}, {dropPercentage}%)
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center p-4">
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text className="text-center text-lg font-onest-medium mt-4 mb-2">
                    Generating your perfect itinerary...
                </Text>
                <Text className="text-center text-sm text-gray-500 font-onest">
                    This may take a few moments while we find the best activities for you.
                </Text>
            </View>
        );
    }

    // Enhanced error UI with detailed information
    if (enhancedError && enhancedError.details) {
        const details = enhancedError.details;
        const breakdown = details.filter_breakdown;

        return (
            <ScrollView className="flex-1 bg-gray-50">
                {/* Header Section */}
                <View className="bg-white px-4 py-6 border-b border-gray-200">
                    <View className="items-center">
                        <View className="bg-orange-100 rounded-full p-4 mb-4">
                            <Ionicons name="search-outline" size={40} color="#F97316" />
                        </View>
                        <Text className="text-xl font-onest-semibold text-gray-900 text-center mb-2">
                            No Matching Activities Found
                        </Text>
                        <Text className="text-gray-600 font-onest text-center">
                            We couldn't find activities that match all your preferences
                        </Text>
                    </View>
                </View>

                {/* Filter Analysis Section */}
                <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-200">
                    <Text className="font-onest-semibold text-gray-900 mb-3">
                        Where activities were filtered out:
                    </Text>

                    <View className="space-y-2">
                        <FilterStep
                            label={`Total experiences in ${formData.city}`}
                            count={details.total_experiences_in_city}
                            icon="location"
                        />

                        <FilterStep
                            label="After travel companion filter"
                            count={breakdown.after_travel_companion}
                            previousCount={details.total_experiences_in_city}
                            icon="people"
                        />

                        <FilterStep
                            label="After budget filter"
                            count={breakdown.after_budget}
                            previousCount={breakdown.after_travel_companion}
                            icon="cash"
                        />

                        <FilterStep
                            label="After availability filter"
                            count={breakdown.after_availability}
                            previousCount={breakdown.after_budget}
                            icon="calendar"
                        />
                    </View>
                </View>

                {/* Conflicts Section */}
                {details.conflicting_preferences.length > 0 && (
                    <View className="bg-yellow-50 mx-4 mt-4 rounded-xl p-4 border border-yellow-200">
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="warning" size={20} color="#F59E0B" />
                            <Text className="ml-2 font-onest-semibold text-yellow-800">
                                Potential Conflicts
                            </Text>
                        </View>
                        {details.conflicting_preferences.map((conflict, index) => (
                            <Text key={index} className="text-sm text-yellow-700 font-onest ml-6 mb-1">
                                • {conflict}
                            </Text>
                        ))}
                    </View>
                )}

                {/* Suggestions Section */}
                <View className="bg-blue-50 mx-4 mt-4 rounded-xl p-4 border border-blue-200">
                    <View className="flex-row items-center mb-2">
                        <Ionicons name="bulb" size={20} color="#3B82F6" />
                        <Text className="ml-2 font-onest-semibold text-blue-800">
                            Suggestions
                        </Text>
                    </View>
                    {details.suggestions.map((suggestion, index) => (
                        <Text key={index} className="text-sm text-blue-700 font-onest ml-6 mb-1">
                            • {suggestion}
                        </Text>
                    ))}
                </View>

                {/* Popular Experiences Section */}
                {details.alternative_options.popular_experiences.length > 0 && (
                    <View className="mx-4 mt-4">
                        <Text className="font-onest-semibold text-gray-900 mb-3">
                            Popular activities in {formData.city}:
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {details.alternative_options.popular_experiences.map((exp, index) => (
                                <View key={index} className="bg-white rounded-lg p-3 mr-3 border border-gray-200 min-w-[200]">
                                    <Text className="font-onest-medium text-sm text-gray-900" numberOfLines={2}>
                                        {exp.title}
                                    </Text>
                                    <Text className="text-xs text-gray-600 font-onest mt-1">
                                        ₱{exp.price} • {exp.travel_companion}
                                    </Text>
                                    <View className="flex-row items-center mt-1">
                                        <Ionicons name="star" size={12} color="#F59E0B" />
                                        <Text className="text-xs text-gray-500 ml-1">
                                            {exp.popularity} bookings
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Action Buttons */}
                <View className="p-4 mt-4">
                    <TouchableOpacity
                        onPress={onBack}
                        className="bg-primary py-4 rounded-xl mb-3"
                        activeOpacity={0.7}
                    >
                        <Text className="text-center font-onest-semibold text-white">
                            Adjust Preferences
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            // Relax the most restrictive filter
                            const relaxedFormData = { ...formData };
                            if (breakdown.after_travel_companion === 0) {
                                relaxedFormData.preferences = {
                                    ...relaxedFormData.preferences!,
                                    travelCompanion: 'Any' as TravelCompanion
                                };
                            }
                            setFormData(relaxedFormData);
                            generateItinerary();
                        }}
                        className="py-4 rounded-xl border border-primary"
                        activeOpacity={0.7}
                    >
                        <Text className="text-center font-onest-medium text-primary">
                            Try with Relaxed Filters
                        </Text>
                    </TouchableOpacity>

                    {details.alternative_options.nearby_cities.length > 0 && (
                        <TouchableOpacity
                            onPress={() => {
                                // Change city to the most popular nearby city
                                const newCity = details.alternative_options.nearby_cities[0].city;
                                setFormData({
                                    ...formData,
                                    city: newCity
                                });
                                generateItinerary();
                            }}
                            className="py-4 rounded-xl border border-gray-300 mt-3"
                            activeOpacity={0.7}
                        >
                            <Text className="text-center font-onest-medium text-gray-700">
                                Try {details.alternative_options.nearby_cities[0].city} instead
                            </Text>
                            <Text className="text-center text-xs text-gray-500 font-onest">
                                ({details.alternative_options.nearby_cities[0].experience_count} experiences available)
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        );
    }

    // Simple error UI (fallback)
    if (error) {
        return (
            <View className="flex-1 justify-center items-center p-4">
                <Ionicons name="alert-circle" size={64} color="#EF4444" />
                <Text className="text-center text-lg font-onest-medium mt-4 mb-2">
                    Oops! Something went wrong
                </Text>
                <Text className="text-center text-sm text-gray-500 font-onest mb-6">
                    {error}
                </Text>
                <TouchableOpacity
                    onPress={handleRetry}
                    className="bg-primary py-3 px-6 rounded-xl"
                    activeOpacity={0.7}
                >
                    <Text className="text-white font-onest-medium">Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!generatedItinerary) {
        return (
            <View className="flex-1 justify-center items-center p-4">
                <Text className="text-center text-lg font-onest-medium">
                    No itinerary available
                </Text>
            </View>
        );
    }

    const groupedItems = groupItemsByDay(generatedItinerary.items);
    const totalDays = Object.keys(groupedItems).length;

    return (
        <View className="flex-1 p-4">
            {isPreview && (
                <View className="bg-blue-50 border-b border-blue-200 px-4 py-3">
                    <View className="flex-row items-center justify-center">
                        <Ionicons name="eye-outline" size={16} color="#3B82F6" />
                        <Text className="ml-2 text-sm text-blue-700 font-onest-medium">
                            Preview Mode - You can remove activities you don't want
                        </Text>
                    </View>
                </View>
            )}
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                {/* Header */}
                <View className="mb-6">
                    {/* Stats */}
                    <View className="bg-gray-50 rounded-xl p-4 mb-4">
                        <View className="flex-row justify-between items-center">
                            <View className="items-center">
                                <Text className="text-2xl font-onest-bold text-primary">
                                    {totalDays}
                                </Text>
                                <Text className="text-xs text-gray-600 font-onest">
                                    Days
                                </Text>
                            </View>
                            <View className="items-center">
                                <Text className="text-2xl font-onest-bold text-primary">
                                    {generatedItinerary.items.length}
                                </Text>
                                <Text className="text-xs text-gray-600 font-onest">
                                    Activities
                                </Text>
                            </View>
                            <View className="items-center">
                                <Text className={`text-sm font-onest-medium capitalize ${getActivityIntensityColor(formData.preferences?.activityIntensity || '')}`}>
                                    {formData.preferences?.activityIntensity || ''}
                                </Text>
                                <Text className="text-xs text-gray-600 font-onest">
                                    Intensity
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Itinerary Days */}
                {Object.keys(groupedItems).map((dayNumber) => {
                    const dayItems = groupedItems[parseInt(dayNumber)];
                    const dayDate = new Date(generatedItinerary.start_date);
                    dayDate.setDate(dayDate.getDate() + parseInt(dayNumber) - 1);

                    return (
                        <View key={dayNumber} className="mb-6">
                            {/* Day Header */}
                            <View className="flex-row items-center mb-3">
                                <View className="bg-primary rounded-full w-8 h-8 items-center justify-center mr-3">
                                    <Text className="text-white font-onest-bold text-sm">
                                        {dayNumber}
                                    </Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="font-onest-semibold text-lg">
                                        Day {dayNumber}
                                    </Text>
                                    <Text className="text-gray-600 font-onest text-sm">
                                        {formatDate(dayDate.toISOString())}
                                    </Text>
                                </View>
                                <Text className="text-gray-500 font-onest text-xs">
                                    {dayItems.length} {dayItems.length !== 1 ? 'activities' : 'activity'}
                                </Text>
                            </View>

                            {/* Day Items */}
                            {dayItems.map((item, index) => (
                                <View key={`${dayNumber}-${index}`} className="mb-4">
                                    <View className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                        {/* Image */}
                                        {item.primary_image && (
                                            <Image
                                                source={{ uri: `${API_URL}/${item.primary_image}` }}
                                                className="w-full h-32"
                                                resizeMode="cover"
                                            />
                                        )}

                                        {/* Content */}
                                        <View className="p-4">
                                            <View className="flex-row justify-between items-start mb-2">
                                                <View className="flex-1 mr-3">
                                                    <Text className="font-onest-semibold text-base mb-1">
                                                        {item.experience_name || 'Experience'}
                                                    </Text>
                                                    <Text className="text-gray-600 font-onest text-sm">
                                                        {item.destination_name}
                                                    </Text>
                                                </View>
                                                <View className="items-end">
                                                    <Text className="font-onest-bold text-primary">
                                                        {formatTime(item.start_time)} - {formatTime(item.end_time)}
                                                    </Text>
                                                    {item.price && item.price > 0 && (
                                                        <Text className="text-gray-600 font-onest text-sm">
                                                            ₱{item.price} {item.unit && `/ ${item.unit}`}
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>

                                            {item.experience_description && (
                                                <Text className="text-gray-700 font-onest text-sm mb-2">
                                                    {item.experience_description}
                                                </Text>
                                            )}

                                            {item.custom_note && (
                                                <View className="bg-blue-50 rounded-lg p-2 mt-2">
                                                    <Text className="text-blue-800 font-onest text-xs">
                                                        {item.custom_note}
                                                    </Text>
                                                </View>
                                            )}

                                            {/* Remove button - only show in preview mode */}
                                            {isPreview && (
                                                <View className="flex-row justify-end mt-3 pt-3 border-t border-gray-100">
                                                    <TouchableOpacity
                                                        onPress={() => removeItem(item)}
                                                        className="flex-row items-center px-3 py-2 rounded-lg border border-red-200 bg-red-50"
                                                        activeOpacity={0.7}
                                                    >
                                                        <Ionicons name="trash-outline" size={16} color="#DC2626" />
                                                        <Text className="ml-2 text-red-600 font-onest text-sm">
                                                            Remove
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            ))}

                            {/* Show message if day has no experiences */}
                            {dayItems.length === 0 && (
                                <View className="bg-gray-50 rounded-xl p-6 items-center">
                                    <Ionicons name="calendar-outline" size={32} color="#9CA3AF" />
                                    <Text className="text-gray-500 font-onest text-sm mt-2">
                                        No activities scheduled for this day
                                    </Text>
                                </View>
                            )}
                        </View>
                    );
                })}
            </ScrollView>

            {/* Navigation Buttons */}
            <View className="px-4">
                {isPreview ? (
                    <View className="flex-row justify-between mt-4 pt-2 border-t border-gray-200">
                        <TouchableOpacity
                            onPress={onBack}
                            className="py-4 px-6 rounded-xl border border-gray-300"
                            activeOpacity={0.7}
                            disabled={saving}
                        >
                            <Text className="text-center font-onest-medium text-base text-gray-700">
                                Back
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleRetry}
                            className="py-4 px-6 rounded-xl border border-primary"
                            activeOpacity={0.7}
                            disabled={saving}
                        >
                            <Text className="text-center font-onest-medium text-base text-primary">
                                Regenerate
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={saveItinerary}
                            className="py-4 px-8 rounded-xl bg-primary"
                            activeOpacity={0.7}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text className="text-center font-onest-medium text-base text-white">
                                    Continue
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View className="items-center mt-4 pt-2 border-t border-gray-200">
                        <View className="flex-row items-center mb-3">
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text className="ml-2 text-green-600 font-onest-medium">
                                Itinerary saved successfully!
                            </Text>
                        </View>
                        <Text className="text-sm text-gray-500 font-onest text-center">
                            Proceeding to next step...
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};

export default Step3GeneratedItinerary;