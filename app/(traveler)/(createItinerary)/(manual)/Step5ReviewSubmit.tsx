import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

// Import your types
interface ItineraryItem {
    experience_id: number;
    day_number: number;
    start_time: string;
    end_time: string;
    custom_note?: string;
}

interface ItineraryFormData {
    traveler_id: number;
    start_date: string;
    end_date: string;
    title: string;
    notes?: string;
    city: string;
    items: ItineraryItem[];
    preferences?: {
        experiences: any[];
        travelCompanion: any;
        exploreTime: any;
        budget: any;
    };
}

interface ReviewSubmitProps {
    formData: ItineraryFormData;
    onBack: () => void;
    onSubmit: (status?: string) => void;
    isSubmitting: boolean;
}

const Step5ReviewSubmit: React.FC<ReviewSubmitProps> = ({ formData, onBack, onSubmit, isSubmitting }) => {
    const router = useRouter();

   useEffect(() => {
    console.log('=== Scheduled Experiences ===');
    
    // Log all scheduled items
    if (formData.items && formData.items.length > 0) {
        formData.items.forEach((item, index) => {
            console.log(`Experience ${index + 1}:`);
            console.log(`  - Experience ID: ${item.experience_id}`);
            console.log(`  - Day Number: ${item.day_number}`);
            console.log(`  - Start Time: ${item.start_time}`);
            console.log(`  - End Time: ${item.end_time}`);
            console.log(`  - Custom Note: ${item.custom_note || 'None'}`);
            console.log('---');
        });
        
        // Summary
        const scheduledItems = formData.items.filter(item => item.day_number > 0 && item.start_time && item.end_time);
        const unscheduledItems = formData.items.filter(item => item.day_number === 0 || !item.start_time || !item.end_time);
        
        console.log(`Total experiences: ${formData.items.length}`);
        console.log(`Scheduled: ${scheduledItems.length}`);
        console.log(`Unscheduled: ${unscheduledItems.length}`);
    } else {
        console.log('No experiences found in formData.items');
    }
    
    console.log('=========================');

       console.log('Complete form data:', formData);
}, [formData.items]);
    // Helper function to format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Helper function to format time
    const formatTime = (timeString: string) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minutes} ${ampm}`;
    };

    // Calculate trip duration
    const getTripDuration = () => {
        const start = new Date(formData.start_date);
        const end = new Date(formData.end_date);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    // Group items by day
    const getItemsByDay = () => {
        const itemsByDay: { [key: number]: ItineraryItem[] } = {};
        
        formData.items.forEach(item => {
            if (!itemsByDay[item.day_number]) {
                itemsByDay[item.day_number] = [];
            }
            itemsByDay[item.day_number].push(item);
        });

        // Sort items within each day by start time
        Object.keys(itemsByDay).forEach(day => {
            itemsByDay[parseInt(day)].sort((a, b) => a.start_time.localeCompare(b.start_time));
        });

        return itemsByDay;
    };

    // Get date for specific day number
    const getDateForDay = (dayNumber: number) => {
        const startDate = new Date(formData.start_date);
        const targetDate = new Date(startDate);
        targetDate.setDate(startDate.getDate() + (dayNumber - 1));
        return targetDate;
    };

    const itemsByDay = getItemsByDay();
    const tripDuration = getTripDuration();

    return (
        <ScrollView className="flex-1 py-2">
            <Text className="text-center text-xl font-onest-semibold mb-2">Review Your Itinerary</Text>
            <Text className="text-center text-sm text-gray-500 font-onest mb-6 w-3/4 mx-auto">
                Please review your itinerary details before finalizing.
            </Text>

            <View className="flex-1 gap-4 border-t pt-8 border-gray-200">
                {/* Trip Overview Section */}
                <View className="bg-white pb-4">
                    <Text className="font-onest-medium py-2 text-gray-800">Trip Overview</Text>
                    <View className="rounded-xl border border-gray-200 p-4">
                        <View className="border-b border-gray-100 pb-2 mb-2">
                            <Text className="text-sm text-gray-500 font-onest">Title</Text>
                            <Text className="text-gray-800 font-onest-medium">{formData.title}</Text>
                        </View>
                        <View className="border-b border-gray-100 pb-2 mb-2">
                            <Text className="text-sm text-gray-500 font-onest">Destination</Text>
                            <Text className="text-gray-800">{formData.city}</Text>
                        </View>
                        <View className="border-b border-gray-100 pb-2 mb-2">
                            <Text className="text-sm text-gray-500 font-onest">Duration</Text>
                            <Text className="text-gray-800">{tripDuration} days</Text>
                        </View>
                        <View className="border-b border-gray-100 pb-2 mb-2">
                            <Text className="text-sm text-gray-500 font-onest">Start Date</Text>
                            <Text className="text-gray-800">{formatDate(formData.start_date)}</Text>
                        </View>
                        <View className="border-b border-gray-100 pb-2 mb-2">
                            <Text className="text-sm text-gray-500 font-onest">End Date</Text>
                            <Text className="text-gray-800">{formatDate(formData.end_date)}</Text>
                        </View>
                        {formData.notes && (
                            <View>
                                <Text className="text-sm text-gray-500 font-onest">Notes</Text>
                                <Text className="text-gray-800">{formData.notes}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Daily Schedule Section */}
                <View className="bg-white pb-4">
                    <Text className="font-onest-medium py-2 text-gray-800">Daily Schedule</Text>
                    <View className="rounded-xl border border-gray-200 p-4">
                        {Object.keys(itemsByDay).length > 0 ? (
                            Object.keys(itemsByDay)
                                .map(day => parseInt(day))
                                .sort((a, b) => a - b)
                                .map((dayNumber) => {
                                    const dayDate = getDateForDay(dayNumber);
                                    const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'long' });
                                    const items = itemsByDay[dayNumber];

                                    return (
                                        <View key={dayNumber} className="mb-4 last:mb-0">
                                            {/* Day Header */}
                                            <View className="bg-gray-50 p-3 rounded-lg mb-2">
                                                <Text className="font-onest-semibold text-base text-gray-800">
                                                    Day {dayNumber} - {dayName}
                                                </Text>
                                                <Text className="text-sm text-gray-600 font-onest">
                                                    {dayDate.toLocaleDateString('en-US', { 
                                                        month: 'short', 
                                                        day: 'numeric',
                                                        year: 'numeric' 
                                                    })}
                                                </Text>
                                            </View>

                                            {/* Day Items */}
                                            {items.map((item, index) => (
                                                <View 
                                                    key={`${item.experience_id}-${index}`}
                                                    className="flex-row items-center p-3 border-l-4 border-primary bg-blue-50 rounded-r-lg mb-2 last:mb-0"
                                                >
                                                    <View className="mr-3">
                                                        <Ionicons name="location" size={20} color="#4F46E5" />
                                                    </View>
                                                    <View className="flex-1">
                                                        <Text className="font-onest-semibold text-gray-800">
                                                            Experience {item.experience_id}
                                                        </Text>
                                                        <View className="flex-row items-center mt-1">
                                                            <Ionicons name="time-outline" size={16} color="#6B7280" />
                                                            <Text className="text-sm text-gray-600 ml-1 font-onest">
                                                                {formatTime(item.start_time)} - {formatTime(item.end_time)}
                                                            </Text>
                                                        </View>
                                                        {item.custom_note && (
                                                            <Text className="text-xs text-gray-500 mt-1 font-onest italic">
                                                                Note: {item.custom_note}
                                                            </Text>
                                                        )}
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    );
                                })
                        ) : (
                            <View className="items-center py-8">
                                <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
                                <Text className="text-gray-500 text-center mt-2 font-onest">
                                    No experiences scheduled
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Experience Summary */}
                <View className="bg-white pb-4">
                    <Text className="font-onest-medium py-2 text-gray-800">Experience Summary</Text>
                    <View className="rounded-xl border border-gray-200 p-4">
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-gray-600 font-onest">Total Experiences:</Text>
                            <Text className="font-onest-semibold text-gray-800">{formData.items.length}</Text>
                        </View>
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-gray-600 font-onest">Scheduled Experiences:</Text>
                            <Text className="font-onest-semibold text-gray-800">
                                {formData.items.filter(item => item.start_time && item.end_time).length}
                            </Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                            <Text className="text-gray-600 font-onest">Days with Activities:</Text>
                            <Text className="font-onest-semibold text-gray-800">
                                {Object.keys(itemsByDay).length}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Preferences Section (if available) */}
                {formData.preferences && (
                    <View className="bg-white pb-4">
                        <Text className="font-onest-medium py-2 text-gray-800">Preferences</Text>
                        <View className="rounded-xl border border-gray-200 p-4">
                            <Text className="text-gray-600 font-onest text-sm">
                                Travel preferences and selected experiences have been considered in your itinerary.
                            </Text>
                        </View>
                    </View>
                )}

                {/* Action Buttons */}
                <View className="flex-row justify-between mt-6 pb-4">
                    <Pressable
                        onPress={onBack}
                        className="border border-primary p-4 rounded-xl"
                        disabled={isSubmitting}
                    >
                        <Text className="text-primary font-onest-medium">Previous Step</Text>
                    </Pressable>

                    <Pressable
                        onPress={() => { 
                            onSubmit(); 
                            router.replace("/"); 
                        }}
                        disabled={isSubmitting}
                        className={`p-4 px-8 rounded-xl ${isSubmitting ? 'bg-gray-400' : 'bg-primary'}`}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <Text className="text-center font-onest-medium text-base text-white">
                                Create Itinerary
                            </Text>
                        )}
                    </Pressable>
                </View>
            </View>
        </ScrollView>
    );
};

export default Step5ReviewSubmit;