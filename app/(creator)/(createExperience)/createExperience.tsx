import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
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

    const [formData, setFormData] = useState<ExperienceFormData>({
        title: '',
        description: '',
        price: '',
        unit: '',
        availability: [],
        tags: [],
        useExistingDestination: true,
        destination_id: null,
        destination_name: '',
        city: '',
        destination_description: '',
        latitude: '',
        longitude: '',
        images: [],
    });

    // Step navigation
    const handleNext = () => setStep((prev) => Math.min(prev + 1, stepCount));
    const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));



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
            formData.availability.length === 0 ||
            formData.availability.some(
                slot =>
                    !slot.day_of_week ||
                    !slot.start_time ||
                    !slot.end_time
            )
        ) {
            return false;
        }

        if (!formData.useExistingDestination) {
            if (
                !formData.destination_name ||
                !formData.city ||
                !formData.destination_description ||
                !formData.latitude ||
                !formData.longitude
            ) {
                return false;
            }
        }

        return true;
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!validateFormData()) {
            Alert.alert('Validation Error', 'Please fill out all required fields.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/experience/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creator_id: 12, // replace with actual creator ID
                    ...formData,
                    price: Number(formData.price), // ensure it's a number
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Server error:', data);
                throw new Error('Failed to create experience');
            }

            Alert.alert('Success', 'Experience created successfully!');
        } catch (err) {
            console.error('Submit error:', err);
            Alert.alert('Error', 'Something went wrong.');
        }
    };


    // Render active step component
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
                return <ReviewSubmit formData={formData} onBack={handleBack} onSubmit={handleSubmit} />;
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