// CHILD ELEMENT / SUBMIT SCREEN / STEP 6

import { useRouter } from "expo-router";
import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { ExperienceFormData } from '../../../../types/types';

interface ReviewSubmitProps {
    formData: ExperienceFormData;
    onBack: () => void;
    // onSubmit: () => void;
    onSubmit: (status: string) => void;
    isSubmitting: boolean;
}

const ReviewSubmit: React.FC<ReviewSubmitProps> = ({ formData, onBack, onSubmit, isSubmitting }) => {
    const router = useRouter();

    // Get travel companions array
    const companions = formData.travel_companions || [];

    return (
        <ScrollView className="text-center py-2">
            <Text className="text-center text-xl font-onest-semibold mb-2">Review and Submit</Text>
            <Text className="text-center text-sm text-gray-500 font-onest mb-6 w-3/4 m-auto">
                Please review your experience details before submitting.
            </Text>

            <View className="flex justify-evenly gap-4 border-t pt-12 border-gray-200">
                {/* Basic Details Section */}
                <View className="bg-white pb-4">
                    <Text className="font-onest-medium py-2 text-gray-800">Basic Details</Text>
                    <View className="rounded-xl border border-gray-200 p-4">
                        <View className="border-b border-gray-100 pb-2 mb-2">
                            <Text className="text-sm text-gray-500 font-onest">Title</Text>
                            <Text className="text-gray-800">{formData.title}</Text>
                        </View>
                        <View className="border-b border-gray-100 pb-2 mb-2">
                            <Text className="text-sm text-gray-500 font-onest">Description</Text>
                            <Text className="text-gray-800">{formData.description}</Text>
                        </View>
                        <View>
                            <Text className="text-sm text-gray-500 font-onest">Price</Text>
                            <Text className="text-gray-800">₱{formData.price} per {formData.unit}</Text>
                        </View>
                    </View>
                </View>

                {/* Availability Section */}
                <View className="bg-white pb-4">
                    <Text className="font-onest-medium py-2 text-gray-800">Availability</Text>
                    <View className="rounded-xl border border-gray-200 p-4">
                        {formData.availability.length > 0 ? (
                            formData.availability.map((day, dayIndex) => (
                                <View key={dayIndex} className="mb-3">
                                    <Text className="text-gray-900 font-medium mb-1">{day.day_of_week}</Text>
                                    {day.time_slots.map((slot, slotIndex) => (
                                        <View
                                            key={slotIndex}
                                            className="flex-row justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                                        >
                                            <Text className="text-gray-800">{slot.start_time} - {slot.end_time}</Text>
                                        </View>
                                    ))}
                                </View>
                            ))
                        ) : (
                            <Text className="text-gray-500 text-center py-2">No availability set</Text>
                        )}
                    </View>
                </View>

                {/* Travel Companions Section */}
                <View className="bg-white pb-4">
                    <Text className="font-onest-medium py-2 text-gray-800">Travel Companions</Text>
                    <View className="rounded-xl border border-gray-200 p-4">
                        {companions.length > 0 ? (
                            <View className="flex-row flex-wrap gap-2">
                                {companions.map((companion, index) => (
                                    <View key={index} className="bg-gray-100 px-4 py-2 rounded-full">
                                        <Text className="text-gray-800">{companion}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <Text className="text-gray-500 text-center py-2">No companions selected</Text>
                        )}
                    </View>
                </View>

                {/* Tags Section */}
                <View className="bg-white pb-4">
                    <Text className="font-onest-medium py-2 text-gray-800">Tags</Text>
                    <View className="rounded-xl border border-gray-200 p-4">
                        {formData.tags.length > 0 ? (
                            <View className="flex-row flex-wrap gap-2">
                                {formData.tags.map((tagId, index) => (
                                    <View key={index} className="bg-gray-100 px-4 py-2 rounded-full">
                                        <Text className="text-gray-800">Tag {tagId}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <Text className="text-gray-500 text-center py-2">No tags selected</Text>
                        )}
                    </View>
                </View>

                {/* Destination Section */}
                <View className="bg-white pb-4">
                    <Text className="font-onest-medium py-2 text-gray-800">Destination</Text>
                    <View className="rounded-xl border border-gray-200 p-4">
                        {formData.useExistingDestination && formData.destination_id ? (
                            <Text className="text-gray-800">Using existing destination (ID: {formData.destination_id})</Text>
                        ) : (
                            <>
                                <View className="border-b border-gray-100 pb-2 mb-2">
                                    <Text className="text-sm text-gray-500 font-onest">Name</Text>
                                    <Text className="text-gray-800">{formData.destination_name}</Text>
                                </View>
                                <View className="border-b border-gray-100 pb-2 mb-2">
                                    <Text className="text-sm text-gray-500 font-onest">City</Text>
                                    <Text className="text-gray-800">{formData.city}</Text>
                                </View>
                                <View className="border-b border-gray-100 pb-2 mb-2">
                                    <Text className="text-sm text-gray-500 font-onest">Description</Text>
                                    <Text className="text-gray-800">{formData.destination_description}</Text>
                                </View>
                                <View>
                                    <Text className="text-sm text-gray-500 font-onest">Coordinates</Text>
                                    <Text className="text-gray-800">{formData.latitude}, {formData.longitude}</Text>
                                </View>
                            </>
                        )}
                    </View>
                </View>

                {/* Images Section */}
                <View className="bg-white pb-4">
                    <Text className="font-onest-medium py-2 text-gray-800">Images</Text>
                    <View className="rounded-xl border border-gray-200 p-4">
                        {formData.images.length > 0 ? (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
                                {formData.images.map((img, index) => {
                                    const uri = typeof img === 'string' ? img : img.uri;
                                    return (
                                        <View key={index} className="mr-3 last:mr-0">
                                            <Image source={{ uri }} className="w-24 h-24 rounded-xl" />
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        ) : (
                            <Text className="text-gray-500 text-center py-2">No images uploaded</Text>
                        )}
                    </View>
                </View>

                <View className="flex-row justify-between mt-4">
                    <Pressable
                        onPress={onBack}
                        className="border border-primary p-4 rounded-xl"
                        disabled={isSubmitting}
                    >
                        <Text className="text-gray-800 font-onest-medium">Previous step</Text>
                    </Pressable>

                    <View className="flex-row gap-3">
                        <Pressable
                            onPress={() => { onSubmit('draft'); router.replace("/dashboard") }}
                            disabled={isSubmitting}
                            className={`p-4 px-6 rounded-xl border border-primary ${isSubmitting ? 'bg-gray-100' : 'bg-white'}`}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#666" size="small" />
                            ) : (
                                <Text className="text-center font-onest-medium text-base text-primary">Save as Draft</Text>
                            )}
                        </Pressable>

                        <Pressable
                            onPress={() => { onSubmit('active'); router.replace("/dashboard") }}
                            disabled={isSubmitting}
                            className={`p-4 px-6 rounded-xl ${isSubmitting ? 'bg-gray-400' : 'bg-primary'}`}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <Text className="text-center font-onest-medium text-base text-gray-300">Publish</Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

export default ReviewSubmit;