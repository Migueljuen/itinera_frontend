import React from 'react';
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { ExperienceFormData } from '../../../../types/types';

const units = ['Entry', 'Hour', 'Day', 'Package'];

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
    experience: Experience; // Original experience data for comparison
}

const Step1EditExperienceDetails: React.FC<StepProps> = ({ formData, setFormData, onNext, experience }) => {
    const handleChange = (field: keyof ExperienceFormData, value: any) => {
        setFormData({ ...formData, [field]: value });
    };

    const isValid = () => {
        return formData.title && formData.description && formData.price && units.includes(formData.unit);
    };

    // Check if there are changes from original
    const hasChanges = () => {
        return (
            formData.title !== experience.title ||
            formData.description !== experience.description ||
            formData.price !== experience.price ||
            formData.unit !== experience.unit
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    contentContainerStyle={{ padding: 16 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="text-center py-2">
                        <Text className="text-center text-xl font-onest-semibold mb-2">Edit Experience Details</Text>
                        <Text className="text-center text-sm text-gray-500 font-onest mb-6 w-3/4 m-auto">
                            Update your experience information. You can modify the title, description, pricing, and unit type.
                        </Text>

                        <View className="flex justify-evenly gap-4 border-t pt-12 border-gray-200">
                            {/* Title Input */}
                            <View className="bg-white pb-4">
                                <Text className="font-onest-medium py-2">Experience Title</Text>
                                <TextInput
                                    placeholder="Sunset in the mountains"
                                    value={formData.title}
                                    onChangeText={(text) => handleChange('title', text)}
                                    className="p-4 text-base font-onest text-gray-600 rounded-xl overflow-hidden border border-gray-200"
                                    placeholderTextColor="#9CA3AF"
                                />
                                {/* Show original value if different */}
                                {formData.title !== experience.title && experience.title && (
                                    <Text className="text-xs text-gray-400 mt-1 px-1">
                                        Original: "{experience.title}"
                                    </Text>
                                )}
                            </View>

                            {/* Description Input */}
                            <View className="bg-white pb-4">
                                <Text className="font-onest-medium py-2">Description</Text>
                                <TextInput
                                    placeholder="Description of the experience"
                                    value={formData.description}
                                    onChangeText={(text) => handleChange('description', text)}
                                    className="p-4 text-base text-gray-800 h-32 rounded-xl overflow-hidden border border-gray-200"
                                    multiline
                                    textAlignVertical="top"
                                    placeholderTextColor="#9CA3AF"
                                />
                                {/* Show indicator if description changed */}
                                {formData.description !== experience.description && experience.description && (
                                    <Text className="text-xs text-gray-400 mt-1 px-1">
                                        Description modified ✓
                                    </Text>
                                )}
                            </View>

                            {/* Price Input */}
                            <View className="bg-white pb-4">
                                <Text className="font-onest-medium py-2">Price ₱</Text>
                                <TextInput
                                    placeholder="Price"
                                    keyboardType="numeric"
                                    value={formData.price}
                                    onChangeText={(text) => handleChange('price', text)}
                                    className="flex-1 p-4 text-base text-gray-800 rounded-xl overflow-hidden border border-gray-200 flex-row items-center"
                                    placeholderTextColor="#9CA3AF"
                                />
                                {/* Show original price if different */}
                                {formData.price !== experience.price && experience.price && (
                                    <Text className="text-xs text-gray-400 mt-1 px-1">
                                        Original: ₱{experience.price}
                                    </Text>
                                )}
                            </View>

                            {/* Units Selection */}
                            <View className="bg-white mt-6">
                                <Text className="text-base font-onest-medium py-2">Select Unit</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                                    {units.map((unit) => (
                                        <TouchableOpacity
                                            key={unit}
                                            onPress={() => handleChange('unit', unit)}
                                            className={`px-6 py-2 rounded-full mr-3 ${formData.unit === unit
                                                ? 'bg-gray-800'
                                                : 'bg-white border border-gray-200'
                                                }`}
                                        >
                                            <Text
                                                className={`text-base font-onest-medium ${formData.unit === unit
                                                    ? 'text-white'
                                                    : 'text-gray-400'
                                                    }`}
                                            >
                                                {unit}
                                                {unit === experience.unit && unit !== formData.unit && experience.unit ? ' (original)' : ''}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                {/* Show original unit if different */}
                                {formData.unit !== experience.unit && experience.unit && (
                                    <Text className="text-xs text-gray-400 mt-1 px-1">
                                        Original unit: {experience.unit}
                                    </Text>
                                )}
                            </View>

                            {/* Changes indicator */}
                            {hasChanges() && (
                                <View className="bg-blue-50 p-3 rounded-xl mt-2">
                                    <Text className="text-blue-600 text-sm text-center font-onest-medium">
                                        ✓ Changes detected - ready to continue
                                    </Text>
                                </View>
                            )}

                            {/* Submit Button */}
                            <TouchableOpacity
                                onPress={isValid() ? onNext : undefined}
                                className={`mt-4 p-4 rounded-xl ${isValid() ? 'bg-primary' : 'bg-gray-200'}`}
                                disabled={!isValid()}
                            >
                                <Text className={`text-center font-onest-medium text-base ${isValid() ? 'text-white' : 'text-gray-500'}`}>
                                    {hasChanges() ? 'Continue with changes' : 'Next step'}
                                </Text>
                            </TouchableOpacity>

                            {/* Reset to original button */}
                            {hasChanges() && (
                                <TouchableOpacity
                                    onPress={() => {
                                        setFormData({
                                            ...formData,
                                            title: experience.title,
                                            description: experience.description,
                                            price: experience.price,
                                            unit: experience.unit
                                        });
                                    }}
                                    className="mt-2 p-3 rounded-xl border border-gray-200"
                                >
                                    <Text className="text-center font-onest-medium text-sm text-gray-500">
                                        Reset to original values
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

export default Step1EditExperienceDetails;