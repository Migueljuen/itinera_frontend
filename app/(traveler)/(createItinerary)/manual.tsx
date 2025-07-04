import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StepIndicator from 'react-native-step-indicator';
import API_URL from '../../../constants/api';

// Step components
import { useAuth } from '@/contexts/AuthContext';
import Step1_1Accommodation from './(manual)/Step1.1Accommodation';
import Step1SelectLocation from './(manual)/Step1SelectLocation';
import Step2Preference from './(manual)/Step2Preference';
import Step3AddItems from './(manual)/Step3AddItems';
import Step4Calendar from './(manual)/Step4Calendar';
import Step5ReviewSubmit from './(manual)/Step5ReviewSubmit';

// Types - move these to a separate types file
interface ItineraryItem {
    experience_id: number;
    day_number: number;
    start_time: string;
    end_time: string;
    custom_note?: string;
}

interface Accommodation {
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
    check_in?: string;
    check_out?: string;
    booking_link?: string;
    check_in_time?: string;
    check_out_time?: string;
}

interface ItineraryFormData {
    traveler_id: number;
    start_date: string;
    end_date: string;
    title: string;
    notes?: string;
    city: string;
    items: ItineraryItem[];
    accommodation?: Accommodation; // New accommodation field
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
    // Get the logged-in user from AuthContext
    const { user, token, loading: authLoading } = useAuth();

    // Step state management - updated to handle step 1.1
    const [step, setStep] = useState<number>(1);
    const [subStep, setSubStep] = useState<number>(0); // 0 for main step, 1 for sub-step
    const stepCount = 6; // Increased from 5 to 6 to account for accommodation
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form data state with default values
    const [formData, setFormData] = useState<ItineraryFormData>({
        traveler_id: 0,
        start_date: '',
        end_date: '',
        title: 'Manually Created Itinerary',
        notes: 'test note',
        city: '',
        items: [] as ItineraryItem[]
    });

    // Debug logging
    useEffect(() => {
        console.log('=== ItineraryCreationForm Debug ===');
        console.log('Auth loading:', authLoading);
        console.log('Current user object:', user);
        console.log('User ID:', user?.user_id);
        console.log('Token exists:', !!token);
        console.log('Form traveler_id:', formData.traveler_id);
        console.log('Current step:', step, 'Sub-step:', subStep);
        console.log('=====================================');
    }, [user, token, authLoading, formData.traveler_id, step, subStep]);

    // Update traveler_id when user is available
    useEffect(() => {
        if (user?.user_id && formData.traveler_id !== user.user_id) {
            console.log('Setting traveler_id to:', user.user_id);
            setFormData(prev => ({
                ...prev,
                traveler_id: user.user_id
            }));
        }
    }, [user, formData.traveler_id]);

    // Step navigation handlers
    const handleNext = () => {
        if (step === 1 && subStep === 0) {
            // From Step 1 Location to Step 1.1 Accommodation
            setSubStep(1);
        } else if (step === 1 && subStep === 1) {
            // From Step 1.1 Accommodation to Step 2
            setStep(2);
            setSubStep(0);
        } else {
            // Regular step progression
            setStep((prev) => Math.min(prev + 1, 5)); // Max step is still 5 (Review)
            setSubStep(0);
        }
    };

    const handleBack = () => {
        if (step === 2 && subStep === 0) {
            // From Step 2 back to Step 1.1 Accommodation
            setStep(1);
            setSubStep(1);
        } else if (step === 1 && subStep === 1) {
            // From Step 1.1 Accommodation back to Step 1 Location
            setSubStep(0);
        } else {
            // Regular step back progression
            setStep((prev) => Math.max(prev - 1, 1));
            setSubStep(0);
        }
    };

    // Skip accommodation step
    const handleSkipAccommodation = () => {
        setStep(2);
        setSubStep(0);
    };

    // Get current step position for progress bar
    const getCurrentStepPosition = () => {
        if (step === 1 && subStep === 0) return 1; // Step 1 Location
        if (step === 1 && subStep === 1) return 2; // Step 1.1 Accommodation
        return step + 1; // Other steps shifted by 1
    };

    // Validate form data before submission
    const validateFormData = () => {
        const { start_date, end_date, items, traveler_id } = formData;

        // Check if user is logged in
        if (!traveler_id) {
            return false;
        }

        // Check date validity if provided
        if (start_date && end_date) {
            const start = new Date(start_date);
            const end = new Date(end_date);
            if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
                return false;
            }

            const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

            // Validate items if provided
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

        return true;
    };

    // Submit form data to API
    const handleSubmit = async (status = 'active') => {
        console.log('Submitting formData:', formData);

        if (!validateFormData()) {
            if (!formData.traveler_id) {
                Alert.alert('Authentication Error', 'Please log in to create an itinerary.');
            } else {
                Alert.alert('Validation Error', 'Please fill out all required fields and ensure all experiences are scheduled.');
            }
            return;
        }

        try {
            setIsSubmitting(true);

            const payload = {
                traveler_id: formData.traveler_id,
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
                })),
                // Include accommodation if provided
                ...(formData.accommodation && { accommodation: formData.accommodation })
            };

            console.log('Submitting payload:', payload);

            const response = await fetch(`${API_URL}/itinerary/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
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

        } catch (err) {
            console.error('Submit error:', err);
            Alert.alert('Error', 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Show loading spinner while auth is loading
    if (authLoading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
                <ActivityIndicator size="large" color="#376a63" />
                <Text className="mt-4 text-gray-600">Loading...</Text>
            </SafeAreaView>
        );
    }

    // Show error/redirect if not authenticated
    if (!user) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
                <Text className="text-lg text-red-600 text-center px-6">
                    You need to be logged in to create an itinerary.
                </Text>
                <Text className="text-sm text-gray-600 text-center px-6 mt-2">
                    Please go back and log in first.
                </Text>
            </SafeAreaView>
        );
    }

    // Render current step component
    const renderStep = () => {
        if (step === 1 && subStep === 0) {
            return <Step1SelectLocation formData={formData} setFormData={setFormData} onNext={handleNext} />;
        } else if (step === 1 && subStep === 1) {
            return <Step1_1Accommodation
                formData={formData}
                setFormData={setFormData}
                onNext={handleNext}
                onBack={handleBack}
                onSkip={handleSkipAccommodation}
            />;
        }

        switch (step) {
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
            <View className="flex-1 px-6 py-4">
                <ProgressBar currentStep={getCurrentStepPosition()} totalSteps={stepCount} />
                {renderStep()}
            </View>
        </SafeAreaView>
    );
};

// Progress bar styles
const loadingBarStyles = {
    stepIndicatorSize: 0,
    currentStepIndicatorSize: 0,
    separatorStrokeWidth: 6,
    separatorStrokeUnfinishedWidth: 6,
    separatorStrokeFinishedWidth: 6,
    separatorFinishedColor: '#376a63',
    separatorUnFinishedColor: '#E5E7EB',
    labelSize: 0,
    stepStrokeWidth: 0,
    currentStepStrokeWidth: 0
};

export default ItineraryCreationForm;