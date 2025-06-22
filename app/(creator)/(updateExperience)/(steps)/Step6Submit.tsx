import { useRouter } from "expo-router";
import React from 'react';
import { Text, View } from 'react-native';
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

interface ReviewEditSubmitProps {
    formData: ExperienceFormData;
    experience: Experience;
    onBack: () => void;
    onSubmit: (status: string) => void;
    isSubmitting: boolean;
}

const ReviewEditSubmit: React.FC<ReviewEditSubmitProps> = ({
    formData,
    experience,
    onBack,
    onSubmit,
    isSubmitting
}) => {
    const router = useRouter();

    // Helper function to detect changes
    const hasBasicDetailsChanges = () => {
        return (
            formData.title !== experience.title ||
            formData.description !== experience.description ||
            formData.price !== experience.price ||
            formData.unit !== experience.unit
        );
    };

    const hasTravelCompanionChanges = () => {
        return formData.travel_companion !== experience.travel_companion;
    };

    const hasTagChanges = () => {
        // Compare tag arrays (assuming formData.tags contains tag names)
        const originalTags = experience.tags || [];
        const currentTags = formData.tags || [];
        return JSON.stringify(originalTags.sort()) !== JSON.stringify(currentTags.sort());
    };

    const hasDestinationChanges = () => {
        return (
            formData.destination_name !== experience.destination?.name ||
            formData.city !== experience.destination?.city ||
            formData.destination_description !== experience.destination?.description ||
            formData.latitude !== experience.destination?.latitude?.toString() ||
            formData.longitude !== experience.destination?.longitude?.toString()
        );
    };

    const hasImageChanges = () => {
        const originalImages = experience.images || [];
        const currentImages = formData.images || [];

        if (currentImages.length !== originalImages.length) return true;

        // Check if any original images are missing or new ones added
        const currentImageUris = currentImages.map(img =>
            typeof img === 'string' ? img : img.uri
        );

        return !originalImages.every(originalImg =>
            currentImageUris.some(currentUri =>
                currentUri === originalImg || currentUri === getFormattedImageUrl(originalImg)
            )
        );
    };

    const hasAvailabilityChanges = () => {
        // This would require comparing with original availability data
        // For now, we'll assume there are changes if availability exists
        return formData.availability && formData.availability.length > 0;
    };

    const getFormattedImageUrl = (imageUrl: string) => {
        if (!imageUrl) return null;
        if (imageUrl.startsWith('http')) {
            return imageUrl;
        }
        const formattedPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
        return `${API_URL}${formattedPath}`;
    };

    const formatTimeForDisplay = (time: string): string => {
        return time.length === 8 ? time.substring(0, 5) : time;
    };

    const renderChangeIndicator = (hasChanges: boolean) => {
        if (!hasChanges) return null;
        return (
            <View className="bg-blue-100 px-2 py-1 rounded-full ml-2">
                <Text className="text-blue-600 text-xs font-onest-medium">Modified</Text>
            </View>
        );
    };

    const renderOriginalValue = (label: string, originalValue: string, currentValue: string) => {
        if (originalValue === currentValue) return null;
        return (
            <View className="bg-yellow-50 p-2 rounded-lg mt-1">
                <Text className="text-xs text-yellow-700 font-onest">
                    Original {label}: {originalValue}
                </Text>
            </View>
        );
    };

    return (
        <View>
            step 6 test
        </View>
        // <ScrollView className="text-center py-2">
        //     <Text className="text-center text-xl font-onest-semibold mb-2">Review Changes</Text>
        //     <Text className="text-center text-sm text-gray-500 font-onest mb-6 w-3/4 m-auto">
        //         Review your changes before updating the experience. Modified sections are highlighted.
        //     </Text>

        //     <View className="flex justify-evenly gap-4 border-t pt-12 border-gray-200">
        //         {/* Changes Summary */}
        //         <View className="bg-blue-50 rounded-xl p-4 mb-4">
        //             <Text className="font-onest-semibold text-blue-800 mb-2">Changes Summary</Text>
        //             <View className="flex-row flex-wrap gap-2">
        //                 {hasBasicDetailsChanges() && (
        //                     <View className="bg-blue-600 px-3 py-1 rounded-full">
        //                         <Text className="text-white text-xs">Basic Details</Text>
        //                     </View>
        //                 )}
        //                 {hasAvailabilityChanges() && (
        //                     <View className="bg-blue-600 px-3 py-1 rounded-full">
        //                         <Text className="text-white text-xs">Availability</Text>
        //                     </View>
        //                 )}
        //                 {hasTagChanges() && (
        //                     <View className="bg-blue-600 px-3 py-1 rounded-full">
        //                         <Text className="text-white text-xs">Tags</Text>
        //                     </View>
        //                 )}
        //                 {hasTravelCompanionChanges() && (
        //                     <View className="bg-blue-600 px-3 py-1 rounded-full">
        //                         <Text className="text-white text-xs">Travel Companion</Text>
        //                     </View>
        //                 )}
        //                 {hasDestinationChanges() && (
        //                     <View className="bg-blue-600 px-3 py-1 rounded-full">
        //                         <Text className="text-white text-xs">Destination</Text>
        //                     </View>
        //                 )}
        //                 {hasImageChanges() && (
        //                     <View className="bg-blue-600 px-3 py-1 rounded-full">
        //                         <Text className="text-white text-xs">Images</Text>
        //                     </View>
        //                 )}
        //             </View>
        //             {!hasBasicDetailsChanges() && !hasAvailabilityChanges() && !hasTagChanges() &&
        //                 !hasTravelCompanionChanges() && !hasDestinationChanges() && !hasImageChanges() && (
        //                     <Text className="text-blue-600 text-sm">No changes detected</Text>
        //                 )}
        //         </View>

        //         {/* Basic Details Section */}
        //         <View className="bg-white pb-4">
        //             <View className="flex-row items-center">
        //                 <Text className="font-onest-medium py-2 text-gray-800">Basic Details</Text>
        //                 {renderChangeIndicator(hasBasicDetailsChanges())}
        //             </View>
        //             <View className="rounded-xl border border-gray-200 p-4">
        //                 <View className="border-b border-gray-100 pb-2 mb-2">
        //                     <Text className="text-sm text-gray-500 font-onest">Title</Text>
        //                     <Text className="text-gray-800">{formData.title}</Text>
        //                     {renderOriginalValue("title", experience.title, formData.title)}
        //                 </View>
        //                 <View className="border-b border-gray-100 pb-2 mb-2">
        //                     <Text className="text-sm text-gray-500 font-onest">Description</Text>
        //                     <Text className="text-gray-800">{formData.description}</Text>
        //                     {renderOriginalValue("description", experience.description, formData.description)}
        //                 </View>
        //                 <View>
        //                     <Text className="text-sm text-gray-500 font-onest">Price</Text>
        //                     <Text className="text-gray-800">₱{formData.price} per {formData.unit}</Text>
        //                     {(formData.price !== experience.price || formData.unit !== experience.unit) && (
        //                         <View className="bg-yellow-50 p-2 rounded-lg mt-1">
        //                             <Text className="text-xs text-yellow-700 font-onest">
        //                                 Original: ₱{experience.price} per {experience.unit}
        //                             </Text>
        //                         </View>
        //                     )}
        //                 </View>
        //             </View>
        //         </View>

        //         {/* Availability Section */}
        //         <View className="bg-white pb-4">
        //             <View className="flex-row items-center">
        //                 <Text className="font-onest-medium py-2 text-gray-800">Availability</Text>
        //                 {renderChangeIndicator(hasAvailabilityChanges())}
        //             </View>
        //             <View className="rounded-xl border border-gray-200 p-4">
        //                 {formData.availability && formData.availability.length > 0 ? (
        //                     formData.availability.map((day, dayIndex) => (
        //                         <View key={dayIndex} className="mb-3">
        //                             <Text className="text-gray-900 font-medium mb-1">{day.day_of_week}</Text>
        //                             {day.time_slots.map((slot, slotIndex) => (
        //                                 <View
        //                                     key={slotIndex}
        //                                     className="flex-row justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
        //                                 >
        //                                     <Text className="text-gray-800">
        //                                         {formatTimeForDisplay(slot.start_time)} - {formatTimeForDisplay(slot.end_time)}
        //                                     </Text>
        //                                 </View>
        //                             ))}
        //                         </View>
        //                     ))
        //                 ) : (
        //                     <Text className="text-gray-500 text-center py-2">No availability set</Text>
        //                 )}
        //             </View>
        //         </View>

        //         {/* Tags Section */}
        //         <View className="bg-white pb-4">
        //             <View className="flex-row items-center">
        //                 <Text className="font-onest-medium py-2 text-gray-800">Tags</Text>
        //                 {renderChangeIndicator(hasTagChanges())}
        //             </View>
        //             <View className="rounded-xl border border-gray-200 p-4">
        //                 {formData.tags && formData.tags.length > 0 ? (
        //                     <View className="flex-row flex-wrap gap-2">
        //                         {formData.tags.map((tag, index) => (
        //                             <View key={index} className="bg-blue-100 px-3 py-1 rounded-full">
        //                                 <Text className="text-blue-600 text-sm">{tag}</Text>
        //                             </View>
        //                         ))}
        //                     </View>
        //                 ) : (
        //                     <Text className="text-gray-500 text-center py-2">No tags selected</Text>
        //                 )}

        //                 {hasTagChanges() && (
        //                     <View className="bg-yellow-50 p-2 rounded-lg mt-2">
        //                         <Text className="text-xs text-yellow-700 font-onest mb-1">Original tags:</Text>
        //                         <View className="flex-row flex-wrap gap-1">
        //                             {experience.tags?.map((tag, index) => (
        //                                 <Text key={index} className="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
        //                                     {tag}
        //                                 </Text>
        //                             ))}
        //                         </View>
        //                     </View>
        //                 )}
        //             </View>
        //         </View>

        //         {/* Travel Companion Section */}
        //         <View className="bg-white pb-4">
        //             <View className="flex-row items-center">
        //                 <Text className="font-onest-medium py-2 text-gray-800">Travel Companion</Text>
        //                 {renderChangeIndicator(hasTravelCompanionChanges())}
        //             </View>
        //             <View className="rounded-xl border border-gray-200 p-4">
        //                 {formData.travel_companion ? (
        //                     <View className="bg-gray-100 px-4 py-2 rounded-full self-start">
        //                         <Text className="text-gray-800">
        //                             {formData.travel_companion}
        //                         </Text>
        //                     </View>
        //                 ) : (
        //                     <Text className="text-gray-500 text-center py-2">No companion selected</Text>
        //                 )}
        //                 {renderOriginalValue("travel companion", experience.travel_companion, formData.travel_companion)}
        //             </View>
        //         </View>

        //         {/* Destination Section */}
        //         <View className="bg-white pb-4">
        //             <View className="flex-row items-center">
        //                 <Text className="font-onest-medium py-2 text-gray-800">Destination</Text>
        //                 {renderChangeIndicator(hasDestinationChanges())}
        //             </View>
        //             <View className="rounded-xl border border-gray-200 p-4">
        //                 <View className="border-b border-gray-100 pb-2 mb-2">
        //                     <Text className="text-sm text-gray-500 font-onest">Name</Text>
        //                     <Text className="text-gray-800">{formData.destination_name}</Text>
        //                     {renderOriginalValue("name", experience.destination?.name || "", formData.destination_name)}
        //                 </View>
        //                 <View className="border-b border-gray-100 pb-2 mb-2">
        //                     <Text className="text-sm text-gray-500 font-onest">City</Text>
        //                     <Text className="text-gray-800">{formData.city}</Text>
        //                     {renderOriginalValue("city", experience.destination?.city || "", formData.city)}
        //                 </View>
        //                 <View className="border-b border-gray-100 pb-2 mb-2">
        //                     <Text className="text-sm text-gray-500 font-onest">Description</Text>
        //                     <Text className="text-gray-800">{formData.destination_description}</Text>
        //                     {renderOriginalValue("description", experience.destination?.description || "", formData.destination_description)}
        //                 </View>
        //                 <View>
        //                     <Text className="text-sm text-gray-500 font-onest">Coordinates</Text>
        //                     <Text className="text-gray-800">{formData.latitude}, {formData.longitude}</Text>
        //                     {(formData.latitude !== experience.destination?.latitude?.toString() ||
        //                         formData.longitude !== experience.destination?.longitude?.toString()) && (
        //                             <View className="bg-yellow-50 p-2 rounded-lg mt-1">
        //                                 <Text className="text-xs text-yellow-700 font-onest">
        //                                     Original: {experience.destination?.latitude}, {experience.destination?.longitude}
        //                                 </Text>
        //                             </View>
        //                         )}
        //                 </View>
        //             </View>
        //         </View>

        //         {/* Images Section */}
        //         <View className="bg-white pb-4">
        //             <View className="flex-row items-center">
        //                 <Text className="font-onest-medium py-2 text-gray-800">Images</Text>
        //                 {renderChangeIndicator(hasImageChanges())}
        //             </View>
        //             <View className="rounded-xl border border-gray-200 p-4">
        //                 {formData.images && formData.images.length > 0 ? (
        //                     <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
        //                         {formData.images.map((img, index) => {
        //                             const uri = typeof img === 'string' ? img : img.uri;
        //                             const displayUri = typeof img === 'string' ? getFormattedImageUrl(img) : uri;
        //                             return (
        //                                 <View key={index} className="mr-3 last:mr-0">
        //                                     <Image source={{ uri: displayUri || uri }} className="w-24 h-24 rounded-xl" />
        //                                 </View>
        //                             );
        //                         })}
        //                     </ScrollView>
        //                 ) : (
        //                     <Text className="text-gray-500 text-center py-2">No images uploaded</Text>
        //                 )}

        //                 {hasImageChanges() && (
        //                     <View className="bg-yellow-50 p-2 rounded-lg mt-2">
        //                         <Text className="text-xs text-yellow-700 font-onest">
        //                             Original images: {experience.images?.length || 0} • Current: {formData.images?.length || 0}
        //                         </Text>
        //                     </View>
        //                 )}
        //             </View>
        //         </View>

        //         {/* Navigation Buttons */}
        //         <View className="flex-row justify-between mt-4">
        //             <Pressable
        //                 onPress={onBack}
        //                 className="border border-primary p-4 rounded-xl"
        //                 disabled={isSubmitting}
        //             >
        //                 <Text className="text-gray-800 font-onest-medium">Previous step</Text>
        //             </Pressable>

        //             <View className="flex-row gap-3">
        //                 <Pressable
        //                     onPress={() => { onSubmit('draft'); router.replace("/dashboard") }}
        //                     disabled={isSubmitting}
        //                     className={`p-4 px-6 rounded-xl border border-primary ${isSubmitting ? 'bg-gray-100' : 'bg-white'}`}
        //                 >
        //                     {isSubmitting ? (
        //                         <ActivityIndicator color="#666" size="small" />
        //                     ) : (
        //                         <Text className="text-center font-onest-medium text-base text-primary">Save as Draft</Text>
        //                     )}
        //                 </Pressable>

        //                 <Pressable
        //                     onPress={() => { onSubmit('active'); router.replace("/dashboard") }}
        //                     disabled={isSubmitting}
        //                     className={`p-4 px-6 rounded-xl ${isSubmitting ? 'bg-gray-400' : 'bg-primary'}`}
        //                 >
        //                     {isSubmitting ? (
        //                         <ActivityIndicator color="white" size="small" />
        //                     ) : (
        //                         <Text className="text-center font-onest-medium text-base text-gray-300">Update & Publish</Text>
        //                     )}
        //                 </Pressable>
        //             </View>
        //         </View>
        //     </View>
        // </ScrollView>
    );
};

export default ReviewEditSubmit;