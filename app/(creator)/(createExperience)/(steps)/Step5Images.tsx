import React from 'react';
import { View, Text, Pressable, Image, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ExperienceFormData } from '../../../../types/types';

interface StepProps {
    formData: ExperienceFormData;
    setFormData: React.Dispatch<React.SetStateAction<ExperienceFormData>>;
    onNext: () => void;
    onBack: () => void;
}

const Step5ImageUpload: React.FC<StepProps> = ({ formData, setFormData, onNext, onBack }) => {
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            const newImages = result.assets.map((asset) => asset.uri);
            setFormData({
                ...formData,
                images: [...(formData.images || []), ...newImages],
            });
        }
    };

    const isValid = (): boolean => !!formData.images && formData.images.length > 0;

    const removeImage = (uri: string) => {
        setFormData({
            ...formData,
            images: (formData.images || []).filter((img) => img !== uri),
        });
    };

    return (
        <View className="gap-4">
            <Text className="text-xl font-bold">Upload Images</Text>

            <ScrollView horizontal className="flex-row gap-2">
                {(formData.images || []).map((uri, index) => (
                    <View key={index} className="relative mr-3">
                        <Image source={{ uri }} className="w-24 h-24 rounded-lg" />
                        <Pressable
                            onPress={() => removeImage(uri)}
                            className="absolute top-0 right-0 bg-red-500 p-1 rounded-full"
                        >
                            <Text className="text-white text-xs">✕</Text>
                        </Pressable>
                    </View>
                ))}
            </ScrollView>

            <Pressable onPress={pickImage} className="bg-blue-600 p-3 rounded-xl mt-2">
                <Text className="text-white text-center font-semibold">Select Images</Text>
            </Pressable>

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

export default Step5ImageUpload;
