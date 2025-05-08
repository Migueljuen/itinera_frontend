import React from 'react';
import { View, Text, Pressable, ScrollView, Image, ActivityIndicator } from 'react-native';
import { ExperienceFormData } from '../../../../types/types';

interface ReviewSubmitProps {
    formData: ExperienceFormData;
    onBack: () => void;
    onSubmit: () => void;
    isSubmitting: boolean;
}

const ReviewSubmit: React.FC<ReviewSubmitProps> = ({ formData, onBack, onSubmit, isSubmitting }) => {
    const renderAvailability = () => {
        return formData.availability.map((slot, index) => (
            <Text key={index} className="text-gray-700">
                {slot.day_of_week}: {slot.start_time} - {slot.end_time}
            </Text>
        ));
    };

    const renderTags = () => {
        return (
            <View className="flex-row flex-wrap gap-2">
                {formData.tags.map((tagId, index) => (
                    <View key={index} className="bg-gray-200 px-2 py-1 rounded-lg">
                        <Text className="text-gray-700">Tag ID: {tagId}</Text>
                    </View>
                ))}
            </View>
        );
    };

    const renderDestination = () => {
        if (formData.useExistingDestination && formData.destination_id) {
            return <Text className="text-gray-700">Using existing destination (ID: {formData.destination_id})</Text>;
        } else {
            return (
                <View>
                    <Text className="text-gray-700">Name: {formData.destination_name}</Text>
                    <Text className="text-gray-700">City: {formData.city}</Text>
                    <Text className="text-gray-700">Description: {formData.destination_description}</Text>
                    <Text className="text-gray-700">
                        Coordinates: {formData.latitude}, {formData.longitude}
                    </Text>
                </View>
            );
        }
    };

    const renderImages = () => {
        return (
            <ScrollView horizontal className="flex-row gap-2">
                {formData.images.map((img, index) => {
                    const uri = typeof img === 'string' ? img : img.uri;
                    return (
                        <View key={index} className="mr-3">
                            <Image source={{ uri }} className="w-20 h-20 rounded-lg" />
                        </View>
                    );
                })}
            </ScrollView>
        );
    };

    return (
        <ScrollView className="gap-4">
            <Text className="text-xl font-bold">Review and Submit</Text>
            <Text className="text-gray-500 mb-4">
                Please review your experience details before submitting.
            </Text>

            <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
                <Text className="font-bold text-lg mb-1">Basic Details</Text>
                <Text className="text-gray-700">Title: {formData.title}</Text>
                <Text className="text-gray-700">Description: {formData.description}</Text>
                <Text className="text-gray-700">
                    Price: ${formData.price} per {formData.unit}
                </Text>
            </View>

            <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
                <Text className="font-bold text-lg mb-1">Availability</Text>
                {renderAvailability()}
            </View>

            <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
                <Text className="font-bold text-lg mb-1">Tags</Text>
                {renderTags()}
            </View>

            <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
                <Text className="font-bold text-lg mb-1">Destination</Text>
                {renderDestination()}
            </View>

            <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
                <Text className="font-bold text-lg mb-1">Images</Text>
                {formData.images.length > 0 ? (
                    renderImages()
                ) : (
                    <Text className="text-gray-500">No images uploaded</Text>
                )}
            </View>

            <View className="flex-row justify-between mt-6">
                <Pressable
                    onPress={onBack}
                    className="bg-gray-300 p-4 rounded-xl flex-1 mr-2"
                    disabled={isSubmitting}
                >
                    <Text className="text-center font-semibold">Back</Text>
                </Pressable>

                <Pressable
                    onPress={onSubmit}
                    disabled={isSubmitting}
                    className={`p-4 rounded-xl flex-1 ml-2 ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600'}`}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white text-center font-semibold">Submit</Text>
                    )}
                </Pressable>
            </View>
        </ScrollView>
    );
};

export default ReviewSubmit;