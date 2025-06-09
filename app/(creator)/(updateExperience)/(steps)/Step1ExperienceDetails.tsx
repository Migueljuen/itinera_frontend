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



interface StepProps {
    formData: ExperienceFormData;
    setFormData: React.Dispatch<React.SetStateAction<ExperienceFormData>>;
    onNext: () => void;
}

const Step1ExperienceDetails: React.FC<StepProps> = ({ formData, setFormData, onNext }) => {
    const handleChange = (field: keyof ExperienceFormData, value: any) => {
        setFormData({ ...formData, [field]: value });
    };

    const isValid = () => {
        return formData.title && formData.description && formData.price && units.includes(formData.unit);
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
                        <Text className="text-center text-xl font-onest-semibold mb-2">Update!@!</Text>
                        <Text className="text-center text-sm text-gray-500 font-onest mb-6 w-3/4 m-auto">
                            Please fill the form below. Feel free to add as much detail as needed.
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
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Submit Button */}
                            <TouchableOpacity
                                onPress={isValid() ? onNext : undefined}
                                className={`mt-4 p-4 rounded-xl ${isValid() ? 'bg-primary' : 'bg-gray-200'}`}
                                disabled={!isValid()}
                            >
                                <Text className="text-center font-onest-medium text-base text-gray-300">Next step</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

export default Step1ExperienceDetails;
