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

    const isValid = (): boolean => !!formData.images && formData.images.length >= 0;

    const removeImage = (uri: string) => {
        setFormData({
            ...formData,
            images: (formData.images || []).filter((img) =>
                typeof img === 'string' ? img !== uri : img.uri !== uri
            ),
        });
    };

    return (
        <View className='text-center py-2'>
            <Text className="text-center text-xl font-onest-semibold mb-2">Upload Images</Text>
            <Text className="text-center text-sm text-gray-500 font-onest mb-6 w-3/4 m-auto">
                Select images that showcase your experience. High-quality photos will attract more visitors.
            </Text>

            <View className="flex justify-evenly gap-4 border-t pt-12 border-gray-200">
                <View className="bg-white pb-4">
                    <Text className="font-onest-medium py-2">Selected Images</Text>

                    <View className="h-96">
                        <ScrollView horizontal className="flex-row gap-2">
                            {(formData.images || []).length > 0 ? (
                                (formData.images || []).map((img, index) => {
                                    const uri = typeof img === 'string' ? img : img.uri;
                                    return (
                                        <View key={index} className="relative mr-3">
                                            <Image source={{ uri }} className="w-28 h-28 rounded-lg" />
                                            <Pressable
                                                onPress={() => removeImage(uri)}
                                                className="absolute top-1 right-1 bg-gray-700 p-1 rounded-full"
                                            >
                                                <Text className="text-white text-xs">×</Text>
                                            </Pressable>
                                        </View>
                                    );
                                })
                            ) : (
                                <View className="flex justify-center items-center h-28 w-64 bg-gray-100 rounded-lg">
                                    <Text className="text-gray-500 font-onest">No images selected</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>

                <View className="bg-white pb-4">
                    <Pressable
                        onPress={pickImage}
                        className={`p-4 rounded-xl ${isLoading ? 'bg-gray-400' : 'bg-gray-700'}`}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-center font-onest-medium text-white">Select Images</Text>
                        )}
                    </Pressable>

                    <Text className="text-xs text-gray-500 font-onest text-center mt-2 italic">
                        {formData.images?.length > 0
                            ? `${formData.images.length} image${formData.images.length > 1 ? 's' : ''} selected`
                            : "Please select at least one image"}
                    </Text>
                </View>

                <View className="flex-row justify-between mt-11">
                    <Pressable onPress={onBack} className="border border-primary p-4 rounded-xl">
                        <Text className="text-gray-800">Previous step</Text>
                    </Pressable>
                    <Pressable
                        onPress={isValid() ? onNext : undefined}
                        className={`p-4 px-6 rounded-xl ${isValid() ? 'bg-primary' : 'bg-gray-200'
                            }`}
                    >
                        <Text className="text-center font-onest-medium text-base text-gray-300">Next step</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
};

export default Step5ImageUpload;