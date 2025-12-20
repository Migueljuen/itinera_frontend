import { ItineraryFormData } from '@/types/itineraryTypes';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Step5Props {
    formData: ItineraryFormData;
    onBack: () => void;
    onSubmit: (status?: string) => void;
    isSubmitting: boolean;
}

const Step5ReviewSubmit: React.FC<Step5Props> = ({
    formData,
    onBack,
    onSubmit,
    isSubmitting,
}) => {
    // Calculate total cost based on traveler count
    const totalCost = useMemo(() => {
        if (!formData.items || formData.items.length === 0) return 0;

        const travelerCount = formData.preferences?.travelerCount || 1;

        return formData.items.reduce((sum, item) => {
            const price = Number(item.price || 0);
            if (price <= 0) return sum;

            // Multiply by traveler count for per-person pricing
            if (
                item.unit?.toLowerCase() === 'entry' ||
                item.unit?.toLowerCase() === 'person'
            ) {
                return sum + price * travelerCount;
            }

            // Flat rate for packages, day, hour, etc.
            return sum + price;
        }, 0);
    }, [formData.items, formData.preferences?.travelerCount]);

    // Calculate per-person cost
    const perPersonCost = useMemo(() => {
        const count = formData.preferences?.travelerCount || 1;
        return count > 1 ? Math.round(totalCost / count) : totalCost;
    }, [totalCost, formData.preferences?.travelerCount]);

    // Group items by day
    const groupedItems = useMemo(() => {
        return formData.items.reduce((acc, item) => {
            if (!acc[item.day_number]) acc[item.day_number] = [];
            acc[item.day_number].push(item);
            return acc;
        }, {} as { [key: number]: typeof formData.items });
    }, [formData.items]);

    const handleSubmit = () => {
        if (formData.items.length === 0) {
            Alert.alert('No Activities', 'Please add at least one activity to your itinerary.');
            return;
        }

        // You can pass the totalCost to the backend here
        // The parent component's handleSubmit should include this data
        onSubmit('active');
    };

    return (
        <View className="flex-1 bg-gray-50">
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                <View className="px-4 py-6">
                    {/* Header */}
                    <View className="mb-6">
                        <Text className="text-2xl font-onest-bold text-gray-900 mb-2">
                            Review Your Itinerary
                        </Text>
                        <Text className="text-sm text-gray-600 font-onest">
                            Make sure everything looks good before saving
                        </Text>
                    </View>

                    {/* Total Cost Card */}
                    <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
                        <View className="flex-row justify-between items-start mb-2">
                            <View className="flex-1">
                                <Text className="text-gray-700 font-onest-medium text-sm mb-1">
                                    Estimated Total Cost
                                </Text>
                                <Text className="text-2xl font-onest-bold text-primary">
                                    ₱{totalCost.toLocaleString()}
                                </Text>
                            </View>
                            {formData.preferences?.travelerCount &&
                                formData.preferences.travelerCount > 1 && (
                                    <View className="bg-indigo-50 rounded-lg px-3 py-2">
                                        <Text className="text-indigo-700 font-onest-semibold text-xs">
                                            {formData.preferences.travelerCount} people
                                        </Text>
                                    </View>
                                )}
                        </View>
                        <Text className="text-gray-500 font-onest text-xs mt-1">
                            {formData.preferences?.travelerCount &&
                                formData.preferences.travelerCount > 1
                                ? `≈ ₱${perPersonCost.toLocaleString()} per person • This is an estimate`
                                : 'This is an estimate based on your selected activities'}
                        </Text>
                    </View>

                    {/* Trip Details */}
                    <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
                        <Text className="font-onest-semibold text-base mb-3">Trip Details</Text>

                        <View className="space-y-3">
                            <View className="flex-row">
                                <Ionicons name="location" size={16} color="#6B7280" />
                                <Text className="ml-2 text-gray-700 font-onest flex-1">
                                    {formData.city}
                                </Text>
                            </View>

                            <View className="flex-row">
                                <Ionicons name="calendar" size={16} color="#6B7280" />
                                <Text className="ml-2 text-gray-700 font-onest flex-1">
                                    {new Date(formData.start_date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                    })}{' '}
                                    -{' '}
                                    {new Date(formData.end_date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </Text>
                            </View>

                            {formData.title && (
                                <View className="flex-row">
                                    <Ionicons name="text" size={16} color="#6B7280" />
                                    <Text className="ml-2 text-gray-700 font-onest flex-1">
                                        {formData.title}
                                    </Text>
                                </View>
                            )}

                            <View className="flex-row">
                                <Ionicons name="list" size={16} color="#6B7280" />
                                <Text className="ml-2 text-gray-700 font-onest flex-1">
                                    {formData.items.length} {formData.items.length === 1 ? 'activity' : 'activities'}
                                </Text>
                            </View>

                            {formData.preferences?.travelerCount && (
                                <View className="flex-row">
                                    <Ionicons name="people" size={16} color="#6B7280" />
                                    <Text className="ml-2 text-gray-700 font-onest flex-1">
                                        {formData.preferences.travelerCount}{' '}
                                        {formData.preferences.travelerCount === 1 ? 'traveler' : 'travelers'}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Activities by Day */}
                    <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
                        <Text className="font-onest-semibold text-base mb-3">Activities</Text>

                        {Object.entries(groupedItems).map(([dayNumber, dayItems]) => {
                            const dayDate = new Date(formData.start_date);
                            dayDate.setDate(dayDate.getDate() + parseInt(dayNumber) - 1);

                            return (
                                <View key={dayNumber} className="mb-4 last:mb-0">
                                    <View className="flex-row items-center mb-2">
                                        <View className="bg-primary rounded-full w-6 h-6 items-center justify-center mr-2">
                                            <Text className="text-white font-onest-bold text-xs">
                                                {dayNumber}
                                            </Text>
                                        </View>
                                        <Text className="font-onest-medium text-sm">
                                            Day {dayNumber} •{' '}
                                            {dayDate.toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </Text>
                                    </View>

                                    {dayItems.map((item, index) => (
                                        <View
                                            key={`${dayNumber}-${index}`}
                                            className="ml-8 mb-2 pb-2 border-b border-gray-100 last:border-b-0"
                                        >
                                            <Text className="font-onest-medium text-sm text-gray-900">
                                                {item.experience_name || `Experience ${item.experience_id}`}
                                            </Text>
                                            <View className="flex-row items-center mt-1">
                                                <Ionicons name="time" size={12} color="#9CA3AF" />
                                                <Text className="ml-1 text-xs text-gray-500 font-onest">
                                                    {item.start_time} - {item.end_time}
                                                </Text>
                                                {item.price && item.price > 0 && (
                                                    <>
                                                        <Text className="mx-2 text-gray-300">•</Text>
                                                        <Text className="text-xs text-gray-500 font-onest">
                                                            ₱{Number(item.price).toLocaleString()}
                                                            {item.unit && ` / ${item.unit}`}
                                                        </Text>
                                                    </>
                                                )}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            );
                        })}
                    </View>

                    {/* Cost Breakdown (optional - show if multiple items) */}
                    {formData.items.length > 1 && formData.items.some(item => item.price && item.price > 0) && (
                        <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
                            <Text className="font-onest-semibold text-base mb-3">Cost Breakdown</Text>

                            {formData.items
                                .filter(item => item.price && item.price > 0)
                                .map((item, index) => {
                                    const price = Number(item.price || 0);
                                    const travelerCount = formData.preferences?.travelerCount || 1;
                                    const isPerPerson =
                                        item.unit?.toLowerCase() === 'entry' ||
                                        item.unit?.toLowerCase() === 'person';
                                    const itemTotal = isPerPerson ? price * travelerCount : price;

                                    return (
                                        <View
                                            key={index}
                                            className="flex-row justify-between items-start mb-2 pb-2 border-b border-gray-100 last:border-b-0"
                                        >
                                            <View className="flex-1 mr-2">
                                                <Text className="text-sm text-gray-700 font-onest">
                                                    {item.experience_name || `Experience ${item.experience_id}`}
                                                </Text>
                                                {isPerPerson && travelerCount > 1 && (
                                                    <Text className="text-xs text-gray-500 font-onest mt-0.5">
                                                        ₱{price.toLocaleString()} × {travelerCount} people
                                                    </Text>
                                                )}
                                            </View>
                                            <Text className="text-sm text-gray-900 font-onest-medium">
                                                ₱{itemTotal.toLocaleString()}
                                            </Text>
                                        </View>
                                    );
                                })}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Action Buttons */}
            <View className="px-4 py-4 bg-white border-t border-gray-200">
                <View className="flex-row justify-between">
                    <TouchableOpacity
                        onPress={onBack}
                        className="py-3 px-6 rounded-xl border border-gray-300"
                        activeOpacity={0.7}
                        disabled={isSubmitting}
                    >
                        <Text className="text-center font-onest-medium text-base text-gray-700">
                            Back
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleSubmit}
                        className="py-3 px-8 rounded-xl bg-primary flex-1 ml-3"
                        activeOpacity={0.7}
                        disabled={isSubmitting || formData.items.length === 0}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Text className="text-center font-onest-medium text-base text-white">
                                Save Itinerary
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default Step5ReviewSubmit;