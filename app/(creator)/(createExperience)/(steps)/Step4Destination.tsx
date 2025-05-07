import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList } from 'react-native';
import { ExperienceFormData } from '../../../../types/types';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import type { LocationObjectCoords } from 'expo-location';
import { MapPressEvent } from 'react-native-maps';

interface Destination {
    destination_id: number;
    name: string;
    city: string;
}

interface StepProps {
    formData: ExperienceFormData;
    setFormData: React.Dispatch<React.SetStateAction<ExperienceFormData>>;
    existingDestinations?: Destination[];
    onNext: () => void;
    onBack: () => void;
}

const Step4Destination: React.FC<StepProps> = ({
    formData,
    setFormData,
    existingDestinations = [],
    onNext,
    onBack,
}) => {
    const [useExisting, setUseExisting] = useState(true);

    const handleChange = (field: keyof ExperienceFormData, value: any) => {
        setFormData({ ...formData, [field]: value });
    };

    const isValid = (): boolean => {
        if (useExisting) {
            return !!formData.destination_id;
        } else {
            return (
                !!formData.destination_name &&
                !!formData.city &&
                !!formData.destination_description &&
                !!formData.latitude &&
                !!formData.longitude
            );
        }
    };

    return (
        <View className="gap-4">
            <Text className="text-xl font-bold">Destination</Text>

            <View className="flex-row gap-2">
                <Pressable
                    onPress={() => setUseExisting(true)}
                    className={`flex-1 p-2 rounded-xl text-center border ${useExisting ? 'bg-blue-600' : 'border-gray-300'
                        }`}
                >
                    <Text className={useExisting ? 'text-white text-center' : 'text-center'}>Use Existing</Text>
                </Pressable>

                <Pressable
                    onPress={() => setUseExisting(false)}
                    className={`flex-1 p-2 rounded-xl text-center border ${!useExisting ? 'bg-blue-600' : 'border-gray-300'
                        }`}
                >
                    <Text className={!useExisting ? 'text-white text-center' : 'text-center'}>Create New</Text>
                </Pressable>
            </View>

            {useExisting ? (
                <View className="gap-2">
                    <Text className="text-base">Choose Destination</Text>
                    <FlatList
                        data={existingDestinations}
                        keyExtractor={(item) => item.destination_id.toString()}
                        renderItem={({ item }) => (
                            <Pressable
                                onPress={() => handleChange('destination_id', item.destination_id)}
                                className={`p-3 rounded-xl border ${formData.destination_id === item.destination_id ? 'bg-blue-600' : 'border-gray-300'
                                    }`}
                            >
                                <Text className={formData.destination_id === item.destination_id ? 'text-white' : 'text-black'}>
                                    {item.name} ({item.city})
                                </Text>
                            </Pressable>
                        )}
                    />
                </View>
            ) : (
                <View className="gap-3">
                    <TextInput
                        placeholder="Destination Name"
                        value={formData.destination_name}
                        onChangeText={(text) => handleChange('destination_name', text)}
                        className="border border-gray-300 p-3 rounded-xl"
                    />
                    <TextInput
                        placeholder="City"
                        value={formData.city}
                        onChangeText={(text) => handleChange('city', text)}
                        className="border border-gray-300 p-3 rounded-xl"
                    />
                    <TextInput
                        placeholder="Description"
                        value={formData.destination_description}
                        onChangeText={(text) => handleChange('destination_description', text)}
                        className="border border-gray-300 p-3 rounded-xl h-24"
                        multiline
                    />
                    <TextInput
                        placeholder="Latitude"
                        keyboardType="numeric"
                        value={formData.latitude}
                        onChangeText={(text) => handleChange('latitude', text)}
                        className="border border-gray-300 p-3 rounded-xl"
                    />
                    <TextInput
                        placeholder="Longitude"
                        keyboardType="numeric"
                        value={formData.longitude}
                        onChangeText={(text) => handleChange('longitude', text)}
                        className="border border-gray-300 p-3 rounded-xl"
                    />
                </View>
            )}

            <View className="flex-row justify-between mt-6">
                <Pressable onPress={onBack} className="bg-gray-300 p-4 rounded-xl flex-1 mr-2">
                    <Text className="text-center font-semibold">Back</Text>
                </Pressable>

                <Pressable
                    onPress={isValid() ? onNext : undefined}
                    className={`p-4 rounded-xl flex-1 ml-2 ${isValid() ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                    <Text className="text-white text-center font-semibold">Next</Text>
                </Pressable>
            </View>
        </View>
    );
};

export default Step4Destination;
