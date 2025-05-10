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
    // const renderAvailability = () => {
    //     return formData.availability.map((slot, index) => (
    //         <Text key={index} className="text-gray-700">
    //             {slot.day_of_week}: {slot.start_time} - {slot.end_time}
    //         </Text>
    //     ));
    // };

    // const renderTags = () => {
    //     return (
    //         <View className="flex-row flex-wrap gap-2">
    //             {formData.tags.map((tagId, index) => (
    //                 <View key={index} className="bg-gray-200 px-2 py-1 rounded-lg">
    //                     <Text className="text-gray-700">Tag ID: {tagId}</Text>
    //                 </View>
    //             ))}
    //         </View>
    //     );
    // };

    // const renderDestination = () => {
    //     if (formData.useExistingDestination && formData.destination_id) {
    //         return <Text className="text-gray-700">Using existing destination (ID: {formData.destination_id})</Text>;
    //     } else {
    //         return (
    //             <View>
    //                 <Text className="text-gray-700">Name: {formData.destination_name}</Text>
    //                 <Text className="text-gray-700">City: {formData.city}</Text>
    //                 <Text className="text-gray-700">Description: {formData.destination_description}</Text>
    //                 <Text className="text-gray-700">
    //                     Coordinates: {formData.latitude}, {formData.longitude}
    //                 </Text>
    //             </View>
    //         );
    //     }
    // };

    // const renderImages = () => {
    //     return (
    //         <ScrollView horizontal className="flex-row gap-2">
    //             {formData.images.map((img, index) => {
    //                 const uri = typeof img === 'string' ? img : img.uri;
    //                 return (
    //                     <View key={index} className="mr-3">
    //                         <Image source={{ uri }} className="w-20 h-20 rounded-lg" />
    //                     </View>
    //                 );
    //             })}
    //         </ScrollView>
    //     );
    // };

    // return (
    //     <ScrollView className="gap-4">
    //         <Text className="text-xl font-bold">Review and Submit</Text>
    //         <Text className="text-gray-500 mb-4">
    //             Please review your experience details before submitting.
    //         </Text>

    //         <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
    //             <Text className="font-bold text-lg mb-1">Basic Details</Text>
    //             <Text className="text-gray-700">Title: {formData.title}</Text>
    //             <Text className="text-gray-700">Description: {formData.description}</Text>
    //             <Text className="text-gray-700">
    //                 Price: ${formData.price} per {formData.unit}
    //             </Text>
    //         </View>

    //         <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
    //             <Text className="font-bold text-lg mb-1">Availability</Text>
    //             {renderAvailability()}
    //         </View>

    //         <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
    //             <Text className="font-bold text-lg mb-1">Tags</Text>
    //             {renderTags()}
    //         </View>

    //         <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
    //             <Text className="font-bold text-lg mb-1">Destination</Text>
    //             {renderDestination()}
    //         </View>

    //         <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
    //             <Text className="font-bold text-lg mb-1">Images</Text>
    //             {formData.images.length > 0 ? (
    //                 renderImages()
    //             ) : (
    //                 <Text className="text-gray-500">No images uploaded</Text>
    //             )}
    //         </View>

    //         <View className="flex-row justify-between mt-6">
    //             <Pressable 
    //                 onPress={onBack} 
    //                 className="bg-gray-300 p-4 rounded-xl flex-1 mr-2"
    //                 disabled={isSubmitting}
    //             >
    //                 <Text className="text-center font-semibold">Back</Text>
    //             </Pressable>

    //             <Pressable
    //                 onPress={onSubmit}
    //                 disabled={isSubmitting}
    //                 className={`p-4 rounded-xl flex-1 ml-2 ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600'}`}
    //             >
    //                 {isSubmitting ? (
    //                     <ActivityIndicator color="white" />
    //                 ) : (
    //                     <Text className="text-white text-center font-semibold">Submit</Text>
    //                 )}
    //             </Pressable>
    //         </View>
    //     </ScrollView>
    // );

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
                            <Text className="text-gray-800">${formData.price} per {formData.unit}</Text>
                        </View>
                    </View>
                </View>

                {/* Availability Section */}
                <View className="bg-white pb-4">
                    <Text className="font-onest-medium py-2 text-gray-800">Availability</Text>
                    <View className="rounded-xl border border-gray-200 p-4">
                        {formData.availability.length > 0 ? (
                            formData.availability.map((slot, index) => (
                                <View key={index} className="flex-row justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                                    <Text className="text-gray-800">{slot.day_of_week}</Text>
                                    <Text className="text-gray-800">{slot.start_time} - {slot.end_time}</Text>
                                </View>
                            ))
                        ) : (
                            <Text className="text-gray-500 text-center py-2">No availability set</Text>
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
                                        <Text className="text-gray-800">{tagId}</Text>
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

                {/* Navigation Buttons */}
                <View className="flex-row justify-between mt-4">
                    <Pressable
                        onPress={onBack}
                        className="border border-primary p-4 rounded-xl"
                        disabled={isSubmitting}
                    >
                        <Text className="text-gray-800 font-onest-medium">Previous step</Text>
                    </Pressable>

                    <Pressable
                        onPress={onSubmit}
                        disabled={isSubmitting}
                        className={`p-4 px-6 rounded-xl ${isSubmitting ? 'bg-gray-400' : 'bg-primary'}`}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <Text className="text-center font-onest-medium text-base text-gray-300">Submit</Text>
                        )}
                    </Pressable>
                </View>
            </View>
        </ScrollView>
    );
};

export default ReviewSubmit;