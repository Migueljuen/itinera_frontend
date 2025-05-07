import React from 'react';
import { View, Text, ScrollView, Image, Pressable } from 'react-native';
import { ExperienceFormData } from '../../../../types/types';

interface StepProps {
    formData: ExperienceFormData;
    onBack: () => void;
    onSubmit: () => void;
}

const Step6Submit: React.FC<StepProps> = ({ formData, onBack, onSubmit }) => {
    return (
        <ScrollView className="gap-4">
            <Text className="text-xl font-bold mb-2">Review & Submit</Text>

            <View className="gap-1">
                <Text className="text-lg font-semibold">Experience</Text>
                <Text>Title: {formData.title}</Text>
                <Text>Description: {formData.description}</Text>
                <Text>Price: ${formData.price}</Text>
                <Text>Unit: {formData.unit}</Text>
            </View>

            <View className="gap-1 mt-4">
                <Text className="text-lg font-semibold">Availability</Text>
                {formData.availability?.map((slot, index) => (
                    <Text key={index}>
                        {slot.day_of_week}: {slot.start_time} - {slot.end_time}
                    </Text>
                ))}
            </View>

            <View className="gap-1 mt-4">
                <Text className="text-lg font-semibold">Tags</Text>
                <Text>{formData.tags?.join(', ')}</Text>
            </View>

            <View className="gap-1 mt-4">
                <Text className="text-lg font-semibold">Destination</Text>
                {formData.destination_id ? (
                    <Text>Using existing destination ID: {formData.destination_id}</Text>
                ) : (
                    <>
                        <Text>Name: {formData.destination_name}</Text>
                        <Text>City: {formData.city}</Text>
                        <Text>Description: {formData.destination_description}</Text>
                        <Text>Lat: {formData.latitude}</Text>
                        <Text>Lng: {formData.longitude}</Text>
                    </>
                )}
            </View>

            <View className="gap-1 mt-4">
                <Text className="text-lg font-semibold">Images</Text>
                <ScrollView horizontal className="flex-row gap-2 mt-2">
                    {formData.images?.map((uri, index) => (
                        <Image key={index} source={{ uri }} className="w-24 h-24 rounded-lg mr-2" />
                    ))}
                </ScrollView>
            </View>

            <View className="flex-row justify-between mt-6">
                <Pressable onPress={onBack} className="bg-gray-300 p-4 rounded-xl flex-1 mr-2">
                    <Text className="text-center font-semibold">Back</Text>
                </Pressable>

                <Pressable onPress={onSubmit} className="bg-green-600 p-4 rounded-xl flex-1 ml-2">
                    <Text className="text-white text-center font-semibold">Submit</Text>
                </Pressable>
            </View>
        </ScrollView>
    );
};

export default Step6Submit;
