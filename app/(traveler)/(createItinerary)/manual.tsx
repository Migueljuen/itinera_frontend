import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StepIndicator from 'react-native-step-indicator';
import API_URL from '../../../constants/api';

// Step components
import Step1SelectLocation from './(manual)/Step1SelectLocation';
import Step2Preference from './(manual)/Step2Preference';
import Step3AddItems from './(manual)/Step3AddItems';
import Step4Calendar from './(manual)/Step4Calendar';
import Step5ReviewSubmit from './(manual)/Step5ReviewSubmit'; // Add this import

// Types - you should move these to a separate types file
interface ItineraryItem {
    experience_id: number;
    day_number: number;
    start_time: string;
    end_time: string;
    custom_note?: string;
}

interface ItineraryFormData {
    traveler_id: number;
    start_date: string;
    end_date: string;
    title: string;
    notes?: string;
    city: string;
    items: ItineraryItem[];
    preferences?: {
        experiences: any[];
        travelCompanion: any;
        exploreTime: any;
        budget: any;
    };
}

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

const ItineraryCreationForm: React.FC = () => {
    const [step, setStep] = useState<number>(1);
    const stepCount = 5; // Updated from 6 to 5
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState<ItineraryFormData>({
        traveler_id: 12,
        start_date: '',
        end_date: '',
        title: 'Test',
        notes: 'sample note',
        city: '',
        items: [] as ItineraryItem[]
    });

    // Step navigation
    const handleNext = () => setStep((prev) => Math.min(prev + 1, stepCount));
    const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const validateFormData = () => {
    const { start_date, end_date, items } = formData;

    // If dates are provided, check validity
    if (start_date && end_date) {
        const start = new Date(start_date);
        const end = new Date(end_date);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
            return false;
        }

        const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        // If items are provided, validate them
        if (Array.isArray(items) && items.length > 0) {
            for (const item of items) {
                if (
                    !item.experience_id ||
                    !item.day_number ||
                    !item.start_time ||
                    !item.end_time ||
                    item.day_number < 1 ||
                    item.day_number > totalDays
                ) {
                    return false;
                }
            }
        }
    }

    // Allow submission even if title or items are empty
    return true;
};


    const handleSubmit = async (status = 'active') => {
        console.log('Submitting formData:', formData);

        if (!validateFormData()) {
            Alert.alert('Validation Error', 'Please fill out all required fields and ensure all experiences are scheduled.');
            return;
        }

        try {
            setIsSubmitting(true);

            const payload = {
                traveler_id: 12, // Replace with your logged-in user's ID
                start_date: formData.start_date,
                end_date: formData.end_date,
                title: formData.title,
                notes: formData.notes || '',
                items: formData.items.map(item => ({
                    experience_id: item.experience_id,
                    day_number: item.day_number,
                    start_time: item.start_time,
                    end_time: item.end_time,
                    custom_note: item.custom_note || ''
                }))
            };

            console.log('Submitting payload:', payload);

            const response = await fetch(`${API_URL}/itinerary/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                console.error('Server error:', result);
                Alert.alert('Error', result.message || 'Failed to create itinerary.');
                return;
            }

            Alert.alert('Success', 'Itinerary created successfully!');
            // Navigation or form reset logic here

        } catch (err) {
            console.error('Submit error:', err);
            Alert.alert('Error', 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return <Step1SelectLocation formData={formData} setFormData={setFormData} onNext={handleNext} />;
            case 2:
                return <Step2Preference formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} />;
            case 3:
                return <Step3AddItems formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} />;
            case 4:
                return <Step4Calendar formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} />;
            case 5:
                return <Step5ReviewSubmit
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
    separatorFinishedColor: '#376a63',
    separatorUnFinishedColor: '#E5E7EB',

    // Remove labels
    labelSize: 0,

    // Additional styles to hide any remaining elements
    stepStrokeWidth: 0,
    currentStepStrokeWidth: 0
};

export default ItineraryCreationForm;