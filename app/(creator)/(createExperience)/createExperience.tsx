import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StepIndicator from 'react-native-step-indicator';
import API_URL from '../../../constants/api';
// Step components
import Step1ExperienceDetails from './(steps)/Step1ExperienceDetails';
import Step2Availability from './(steps)/Step2Availability';
import Step3Tags from './(steps)/Step3Tags';
import Step4Destination from './(steps)/Step4Destination';
import Step5Images from './(steps)/Step5Images';
import ReviewSubmit from './(steps)/Step6Submit';

// Types
import { ExperienceFormData } from '../../../types/types';


// Progress bar component
interface ProgressBarProps {
    currentStep: number;
    totalSteps: number;
    labels?: string[];
}

const ProgressBar: React.FC<ProgressBarProps> = React.memo(({ currentStep, totalSteps, labels = [] }) => {
    return (
        <View className="px-6 my-4">
            <StepIndicator
                customStyles={loadingBarStyles}
                currentPosition={currentStep - 1}
                stepCount={totalSteps}
                labels={labels}
            />
        </View>
    );
});


const ExperienceCreationForm: React.FC = () => {
    const [step, setStep] = useState<number>(1);
    const stepCount = 6;
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState<ExperienceFormData>({
        title: '',
        description: '',
        price: '',
        unit: '',
        availability: [],
        tags: [],
        useExistingDestination: false,
        destination_id: null,
        destination_name: '',
        city: '',
        destination_description: '',
        latitude: '',
        longitude: '',
        images: [],
    });

    const validateFormData = () => {
        const requiredUnits = ['Entry', 'Hour', 'Day', 'Package'];

        if (
            !formData.title ||
            !formData.description ||
            !formData.price ||
            isNaN(Number(formData.price)) ||
            !requiredUnits.includes(formData.unit) ||
            !Array.isArray(formData.tags) ||
            formData.tags.length === 0 ||
            !Array.isArray(formData.availability) ||
            formData.availability.length === 0
        ) {
            console.log('Basic form data validation failed');
            return false;
        }

        for (const day of formData.availability) {
            if (!day.day_of_week) {
                console.log('Missing day_of_week:', day);
                return false;
            }
            if (!Array.isArray(day.time_slots)) {
                console.log('Missing or invalid time_slots:', day);
                return false;
            }
            if (day.time_slots.length === 0) {
                console.log('Empty time_slots array:', day);
                return false;
            }

            for (const slot of day.time_slots) {
                if (!slot.start_time || !slot.end_time) {
                    console.log('Missing start or end time in slot:', slot, 'Day:', day.day_of_week);
                    return false;
                }

                const startTime = new Date(`2000-01-01T${slot.start_time}`);
                const endTime = new Date(`2000-01-01T${slot.end_time}`);
                if (endTime <= startTime) {
                    Alert.alert('Invalid Time', `End time must be after start time for ${day.day_of_week}`);
                    return false;
                }
            }
        }

        if (!formData.useExistingDestination) {
            if (
                !formData.destination_name ||
                !formData.city ||
                !formData.destination_description ||
                !formData.latitude ||
                !formData.longitude
            ) {
                console.log('Missing destination info');
                return false;
            }
        } else if (!formData.destination_id) {
            console.log('Missing destination_id');
            return false;
        }

        return true;
    };

    const handleSubmit = async (status = 'draft') => {
        console.log('Submitting formData:', formData);

        if (!validateFormData()) {
            Alert.alert('Validation Error', 'Please fill out all required fields.');
            return;
        }

        try {
            setIsSubmitting(true);

            // Create FormData object for multipart/form-data
            const formDataObj = new FormData();

            // Add text fields
            formDataObj.append('creator_id', '12'); // replace with actual creator ID
            formDataObj.append('title', formData.title);
            formDataObj.append('description', formData.description);
            formDataObj.append('price', Number(formData.price).toString());
            formDataObj.append('unit', formData.unit);
            formDataObj.append('status', status); // Set status based on button clicked

            // Add tags
            formDataObj.append('tags', JSON.stringify(formData.tags));

            // Transform availability with the proper structure
            // We need to ensure that each time slot has the proper fields as expected by the backend
            const transformedAvailability = formData.availability.map((day) => ({
                availability_id: day.availability_id, // Include if it exists (for editing scenarios)
                experience_id: day.experience_id, // Include if it exists (for editing scenarios)
                day_of_week: day.day_of_week,
                time_slots: day.time_slots.map(slot => ({
                    slot_id: slot.slot_id, // Include if it exists (for editing scenarios)
                    availability_id: slot.availability_id, // Include if it exists (for editing scenarios)
                    start_time: slot.start_time.length === 5 ? slot.start_time + ':00' : slot.start_time,
                    end_time: slot.end_time.length === 5 ? slot.end_time + ':00' : slot.end_time,
                })),
            }));

            console.log('Transformed availability:', JSON.stringify(transformedAvailability));
            formDataObj.append('availability', JSON.stringify(transformedAvailability));

            // Handle destination data
            if (formData.useExistingDestination && formData.destination_id) {
                formDataObj.append('destination_id', formData.destination_id.toString());
            } else {
                formDataObj.append('destination_name', formData.destination_name);
                formDataObj.append('city', formData.city);
                formDataObj.append('destination_description', formData.destination_description);
                formDataObj.append('latitude', formData.latitude);
                formDataObj.append('longitude', formData.longitude);
            }

            // Add image files
            if (formData.images && formData.images.length > 0) {
                formData.images.forEach((img, index) => {
                    // Check if img is a string or an object
                    if (typeof img === 'string') {
                        // Handle legacy format (just uri string)
                        const uriParts = img.split('/');
                        const name = uriParts[uriParts.length - 1];
                        const fileExtension = name.split('.').pop() || '';
                        const type = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;

                        // Create a file object with necessary properties for React Native FormData
                        const fileObj: any = {
                            uri: img,
                            name,
                            type,
                        };
                        formDataObj.append('images', fileObj as any);
                    } else {
                        // Handle new format (object with uri, name, type)
                        const fileObj: any = {
                            uri: img.uri,
                            name: img.name || `image${index}.jpg`,
                            type: img.type || 'image/jpeg',
                        };
                        formDataObj.append('images', fileObj as any);
                    }
                });
            }

            console.log('Submitting form data:', formDataObj);

            // Your API call and response handling
            const response = await fetch(`${API_URL}/experience/create`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                },
                body: formDataObj,
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || 'Failed to create experience');
            }

            const successMessage = status === 'active'
                ? 'Experience published successfully!'
                : 'Experience saved as draft successfully!';

            Alert.alert('Success', successMessage);
            // Navigation or reset logic here

        } catch (err) {
            console.error('Submit error:', err);
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit experience');
        } finally {
            setIsSubmitting(false);
        }
    };
    // Step navigation
    const handleNext = () => setStep((prev) => Math.min(prev + 1, stepCount));
    const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));



    const renderStep = () => {
        switch (step) {
            case 1:
                return <Step1ExperienceDetails formData={formData} setFormData={setFormData} onNext={handleNext} />;
            case 2:
                return <Step2Availability formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} />;
            case 3:
                return <Step3Tags formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} />;
            case 4:
                return <Step4Destination formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} />;
            case 5:
                return <Step5Images formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} />;
            case 6:
                // Pass both onSubmit and onSubmitAsDraft to ReviewSubmit
                return <ReviewSubmit
                    formData={formData}
                    onBack={handleBack}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                />;
            default:
                return null;
        }
    };
    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Step content */}
            <View className="flex-1 px-6 py-4">
                <ProgressBar currentStep={step} totalSteps={stepCount} />
                {renderStep()}
            </View>
        </SafeAreaView>
    );
};

// Progress bar styles
const loadingBarStyles = {
    // Hide the circles
    stepIndicatorSize: 0,
    currentStepIndicatorSize: 0,

    // Make the separator into a bar
    separatorStrokeWidth: 6,
    separatorStrokeUnfinishedWidth: 6,
    separatorStrokeFinishedWidth: 6,

    // Colors
    separatorFinishedColor: '#376a63', // Updated to use an actual color value
    separatorUnFinishedColor: '#E5E7EB',

    // Remove labels
    labelSize: 0,

    // Additional styles to hide any remaining elements
    stepStrokeWidth: 0,
    currentStepStrokeWidth: 0
};

export default ExperienceCreationForm;