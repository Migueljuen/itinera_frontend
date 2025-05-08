import React, { useState } from 'react';
import { View, Text, Pressable, Image, ScrollView, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { ExperienceFormData } from '../../../../types/types';

interface StepProps {
    formData: ExperienceFormData;
    setFormData: React.Dispatch<React.SetStateAction<ExperienceFormData>>;
    onNext: () => void;
    onBack: () => void;
}

// Extended image type to include file info
interface ImageInfo {
    uri: string;
    name?: string;
    type?: string;
    size?: number;
}

const Step5ImageUpload: React.FC<StepProps> = ({ formData, setFormData, onNext, onBack }) => {
    const [isLoading, setIsLoading] = useState(false);

    const pickImage = async () => {
        try {
            setIsLoading(true);
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                quality: 0.8,
            });

            if (!result.canceled) {
                // Get detailed info about each image
                const imageInfoPromises = result.assets.map(async (asset) => {
                    // Get file info
                    const fileInfo = await FileSystem.getInfoAsync(asset.uri);

                    // Get filename from URI
                    const uriParts = asset.uri.split('/');
                    const filename = uriParts[uriParts.length - 1];

                    // Determine file type (mime type)
                    const fileExtension = filename.split('.').pop() || '';
                    const mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;

                    return {
                        uri: asset.uri,
                        name: filename,
                        type: mimeType,

                    };
                });

                const imageInfoArray = await Promise.all(imageInfoPromises);

                // Update form data with complete image info
                setFormData({
                    ...formData,
                    images: [...(formData.images || []), ...imageInfoArray],
                });
            }
        } catch (error) {
            console.error("Error picking images:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const isValid = (): boolean => !!formData.images && formData.images.length > 0;

    const removeImage = (uri: string) => {
        setFormData({
            ...formData,
            images: (formData.images || []).filter((img) =>
                typeof img === 'string' ? img !== uri : img.uri !== uri
            ),
        });
    };

    return (
        <View className="gap-4">
            <Text className="text-xl font-bold">Upload Images</Text>
            <Text className="text-gray-600">
                Please select at least one image for your experience.
                Images should be clear and represent your experience well.
            </Text>

            <ScrollView horizontal className="flex-row gap-2 min-h-24">
                {(formData.images || []).length > 0 ? (
                    (formData.images || []).map((img, index) => {
                        const uri = typeof img === 'string' ? img : img.uri;
                        return (
                            <View key={index} className="relative mr-3">
                                <Image source={{ uri }} className="w-24 h-24 rounded-lg" />
                                <Pressable
                                    onPress={() => removeImage(uri)}
                                    className="absolute top-0 right-0 bg-red-500 p-1 rounded-full"
                                >
                                    <Text className="text-white text-xs">✕</Text>
                                </Pressable>
                            </View>
                        );
                    })
                ) : (
                    <View className="flex justify-center items-center h-24 w-full bg-gray-100 rounded-lg">
                        <Text className="text-gray-500">No images selected</Text>
                    </View>
                )}
            </ScrollView>

            <Pressable
                onPress={pickImage}
                className="bg-blue-600 p-3 rounded-xl mt-2"
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text className="text-white text-center font-semibold">Select Images</Text>
                )}
            </Pressable>

            <View className="flex-row justify-between mt-6">
                <Pressable onPress={onBack} className="bg-gray-300 p-4 rounded-xl flex-1 mr-2">
                    <Text className="text-center font-semibold">Back</Text>
                </Pressable>

                <Pressable
                    onPress={isValid() ? onNext : undefined}
                    className={`p-4 rounded-xl flex-1 ml-2 ${isValid() ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                    <Text className={`text-center font-semibold ${isValid() ? 'text-white' : 'text-gray-500'}`}>
                        Next
                    </Text>
                </Pressable>
            </View>
        </View>
    );
};

export default Step5ImageUpload;