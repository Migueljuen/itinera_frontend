import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import API_URL from '../../../../constants/api';
import { ExperienceFormData } from '../../../../types/types';

// Experience type for the original data
type Experience = {
    experience_id: number;
    creator_id: number;
    title: string;
    description: string;
    price: string;
    unit: string;
    destination_name: string;
    destination_id: number;
    status: string;
    travel_companion: string;
    created_at: string;
    tags: string[];
    images: string[];
    destination: {
        destination_id: number;
        name: string;
        city: string;
        longitude: number;
        latitude: number;
        description: string;
    };
};

interface StepProps {
    formData: ExperienceFormData;
    setFormData: React.Dispatch<React.SetStateAction<ExperienceFormData>>;
    onNext: () => void;
    onBack: () => void;
    experience: Experience;
    deletedImages: string[];
    setDeletedImages: React.Dispatch<React.SetStateAction<string[]>>;
}

// Extended image type to include file info
interface ImageInfo {
    uri: string;
    name?: string;
    type?: string;
    size?: number;
    isOriginal?: boolean; // Track if this is an existing image
}

// Union type for images in formData
type ImageItem = string | ImageInfo;

const Step5EditImages: React.FC<StepProps> = ({
    formData,
    setFormData,
    onNext,
    onBack,
    experience,
    deletedImages,
    setDeletedImages
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [originalImages, setOriginalImages] = useState<string[]>([]);

    // Store original images on mount
    useEffect(() => {
        setOriginalImages([...experience.images]);

        // Initialize formData images if not already done
        if (!formData.images || formData.images.length === 0) {
            // Keep original images as strings (they're already URLs)
            setFormData({
                ...formData,
                images: [...experience.images]
            });
        }
    }, [experience.images]);

    const getFormattedImageUrl = (imageUrl: string) => {
        if (!imageUrl) return null;
        if (imageUrl.startsWith('http')) {
            return imageUrl;
        }
        const formattedPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
        return `${API_URL}${formattedPath}`;
    };

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
                        isOriginal: false
                    } as ImageInfo;
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
            Alert.alert('Error', 'Failed to select images. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const isValid = (): boolean => !!formData.images && formData.images.length > 0;

    const removeImage = (uri: string) => {
        const imageToRemove = (formData.images || []).find(img =>
            typeof img === 'string' ? img === uri : img.uri === uri
        );

        // Check if it's an original image
        const isOriginalImage = typeof imageToRemove === 'string' ||
            (typeof imageToRemove === 'object' && imageToRemove !== null && (imageToRemove as ImageInfo).isOriginal === true);

        if (isOriginalImage) {
            Alert.alert(
                'Remove Original Image',
                'This is an existing image from your experience. Are you sure you want to remove it? This action cannot be undone after saving.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: () => {
                            // If it's an original image (string URL), add to deletion list
                            if (typeof imageToRemove === 'string') {
                                console.log('Adding to deleted images:', imageToRemove);
                                setDeletedImages([...deletedImages, imageToRemove]);
                            }

                            // Remove from current images
                            setFormData({
                                ...formData,
                                images: (formData.images || []).filter((img) =>
                                    typeof img === 'string' ? img !== uri : img.uri !== uri
                                ),
                            });
                        }
                    }
                ]
            );
        } else {
            // New image, remove directly
            setFormData({
                ...formData,
                images: (formData.images || []).filter((img) =>
                    typeof img === 'string' ? img !== uri : img.uri !== uri
                ),
            });
        }
    };

    // Check if there are changes from original
    const hasChanges = () => {
        if (!formData.images) return originalImages.length > 0;

        // Check if any images are marked for deletion
        if (deletedImages.length > 0) {
            return true;
        }

        // Get current image URIs (handling both string and object formats)
        const currentImageUris = formData.images.map(img =>
            typeof img === 'string' ? img : img.uri
        );

        // Check for new images
        const hasNewImages = formData.images.some(img => {
            if (typeof img === 'object' && img !== null) {
                const imageInfo = img as ImageInfo;
                return !imageInfo.isOriginal;
            }
            return false;
        });

        if (hasNewImages) return true;

        // Simple check: different lengths or different images
        if (currentImageUris.length !== originalImages.length) return true;

        // Check if any original images are missing
        return !originalImages.every(originalImg =>
            currentImageUris.some(currentUri =>
                currentUri === originalImg || currentUri === getFormattedImageUrl(originalImg)
            )
        );
    };

    // Reset to original images
    const resetToOriginal = () => {
        Alert.alert(
            'Reset Images',
            'Are you sure you want to reset to the original images? All new additions and removals will be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: () => {
                        // Clear the images to delete list
                        setDeletedImages([]);

                        // Reset formData to original images
                        setFormData({
                            ...formData,
                            images: [...originalImages]
                        });
                    }
                }
            ]
        );
    };

    // Count original vs new images
    const getImageCounts = () => {
        if (!formData.images) return { original: 0, new: 0, total: 0, deleted: 0 };

        let originalCount = 0;
        let newCount = 0;

        formData.images.forEach(img => {
            if (typeof img === 'string') {
                // String images are original
                originalCount++;
            } else if (img !== null && typeof img === 'object') {
                const imageInfo = img as ImageInfo;
                if (imageInfo.isOriginal) {
                    originalCount++;
                } else {
                    newCount++;
                }
            }
        });

        const deletedCount = deletedImages.length;

        return {
            original: originalCount,
            new: newCount,
            total: formData.images.length,
            deleted: deletedCount
        };
    };

    const imageCounts = getImageCounts();

    // Debug logging
    useEffect(() => {
        console.log('Current deletedImages:', deletedImages);
        console.log('Current formData.images:', formData.images);
    }, [deletedImages, formData.images]);

    return (
        <ScrollView className='text-center py-2'>
            <Text className="text-center text-xl font-onest-semibold mb-2">Edit Images</Text>
            <Text className="text-center text-sm text-gray-500 font-onest mb-6 w-3/4 m-auto">
                Manage your experience images. You can add new photos or remove existing ones.
            </Text>

            <View className="flex justify-evenly gap-4 border-t pt-12 border-gray-200">
                {/* Changes indicator */}
                {hasChanges() && (
                    <View className="bg-blue-50 p-3 rounded-xl mb-4">
                        <Text className="text-blue-600 text-sm text-center font-onest-medium">
                            ✓ Image changes detected
                        </Text>
                        <Text className="text-blue-500 text-xs text-center mt-1">
                            {imageCounts.original} original • {imageCounts.new} new • {imageCounts.total} total
                            {imageCounts.deleted > 0 && ` • ${imageCounts.deleted} to delete`}
                        </Text>
                    </View>
                )}

                <View className="bg-white pb-4">
                    <Text className="font-onest-medium py-2">Current Images ({imageCounts.total})</Text>

                    <View className="min-h-[120px]">
                        <ScrollView horizontal className="flex-row gap-2" showsHorizontalScrollIndicator={false}>
                            {(formData.images || []).length > 0 ? (
                                (formData.images || []).map((img, index) => {
                                    const uri = typeof img === 'string' ? img : img.uri;
                                    const displayUri = typeof img === 'string' ? getFormattedImageUrl(img) : uri;

                                    return (
                                        <View key={index} className="relative mr-3">
                                            <Image source={{ uri: displayUri || uri }} className="w-28 h-28 rounded-lg" />



                                            {/* Improved Remove button */}
                                            <TouchableOpacity
                                                onPress={() => removeImage(uri)}
                                                className="absolute  -right-2 bg-red-500 w-7 h-7 rounded-full items-center justify-center"
                                                style={{
                                                    shadowColor: '#000',
                                                    shadowOffset: { width: 0, height: 2 },
                                                    shadowOpacity: 0.25,
                                                    shadowRadius: 3.84,
                                                    elevation: 5,
                                                }}
                                            >
                                                <Ionicons name="close" size={18} color="white" />
                                            </TouchableOpacity>
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

                    {/* Image count summary */}
                    <Text className="text-xs text-gray-500 font-onest text-center mt-2">
                        {originalImages.length > 0 && (
                            <>Original: {originalImages.length} • </>
                        )}
                        Current: {imageCounts.total}
                        {imageCounts.new > 0 && (
                            <> • New: {imageCounts.new}</>
                        )}
                        {imageCounts.deleted > 0 && (
                            <Text className="text-red-500"> • To delete: {imageCounts.deleted}</Text>
                        )}
                    </Text>
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
                            <Text className="text-center font-onest-medium text-white">Add More Images</Text>
                        )}
                    </Pressable>

                    <Text className="text-xs text-gray-500 font-onest text-center mt-2 italic">
                        {formData.images?.length === 0
                            ? "Please select at least one image"
                            : "You can add more images or remove existing ones"}
                    </Text>
                </View>

                {/* Reset button */}
                {hasChanges() && (
                    <Pressable
                        onPress={resetToOriginal}
                        className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50"
                    >
                        <Text className="text-center font-onest-medium text-sm text-red-600">
                            Reset to Original Images
                        </Text>
                    </Pressable>
                )}

                {/* Original vs Current Comparison */}
                {hasChanges() && (
                    <View className="bg-gray-50 p-4 rounded-xl mb-4">
                        <Text className="font-onest-semibold text-gray-700 mb-2">Changes Summary:</Text>
                        <Text className="text-sm text-gray-600">
                            Original images: {originalImages.length}
                        </Text>
                        <Text className="text-sm text-gray-600">
                            Current images: {imageCounts.total}
                        </Text>
                        {imageCounts.new > 0 && (
                            <Text className="text-sm text-green-600">
                                + {imageCounts.new} new image{imageCounts.new > 1 ? 's' : ''} added
                            </Text>
                        )}
                        {imageCounts.deleted > 0 && (
                            <Text className="text-sm text-red-600">
                                - {imageCounts.deleted} original image{imageCounts.deleted > 1 ? 's' : ''} marked for deletion
                            </Text>
                        )}
                    </View>
                )}

                <View className="flex-row justify-between mt-4">
                    <Pressable onPress={onBack} className="border border-primary p-4 rounded-xl">
                        <Text className="text-gray-800 font-onest-medium">Previous step</Text>
                    </Pressable>
                    <Pressable
                        onPress={isValid() ? onNext : undefined}
                        className={`p-4 px-6 rounded-xl ${isValid() ? 'bg-primary' : 'bg-gray-200'
                            }`}
                        disabled={!isValid()}
                    >
                        <Text className="text-center font-onest-medium text-base text-gray-300">
                            {hasChanges() ? 'Continue with changes' : 'Next step'}
                        </Text>
                    </Pressable>
                </View>
            </View>
        </ScrollView>
    );
};

export default Step5EditImages;