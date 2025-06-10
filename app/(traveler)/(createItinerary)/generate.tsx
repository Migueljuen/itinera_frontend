import { useRouter } from "expo-router";
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StepIndicator from 'react-native-step-indicator';
// Step components
import { useAuth } from '@/contexts/AuthContext';
import Step2Preference from './(generate)/Step2Preference';
import Step3GeneratedItinerary from './(generate)/Step3GeneratedItinerary';
import Step1SelectLocation from './(manual)/Step1.1Accommodation'; // Reusing from manual

// Component prop interfaces to match your existing components
interface Step1Props {
    formData: ItineraryFormData;
    setFormData: React.Dispatch<React.SetStateAction<ItineraryFormData>>;
    onNext: () => void;
}

interface Step2Props {
    formData: ItineraryFormData;
    setFormData: React.Dispatch<React.SetStateAction<ItineraryFormData>>;
    onNext: () => void;
    onBack: () => void;
}

interface Step3Props {
    formData: ItineraryFormData;
    setFormData: React.Dispatch<React.SetStateAction<ItineraryFormData>>;
    onNext: () => void;
    onBack: () => void;
}

// Types
type Experience = 'Adventure' | 'Cultural' | 'Food' | 'Nature' | 'Relaxation' | 'Nightlife';
type TravelCompanion = 'Solo' | 'Partner' | 'Friends' | 'Family' | 'Any';
type ExploreTime = 'Daytime' | 'Nighttime' | 'Both';
type Budget = 'Free' | 'Budget-friendly' | 'Mid-range' | 'Premium';
type ActivityIntensity = 'Low' | 'Moderate' | 'High';
const router = useRouter();

interface ItineraryItem {
    experience_id: number;
    day_number: number;
    start_time: string;
    end_time: string;
    custom_note?: string;
    experience_name?: string;
    experience_description?: string;
    destination_name?: string;
    destination_city?: string;
    images?: string[];
    primary_image?: string;
    price?: number;
    unit?: string;
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
        experiences: Experience[];
        travelCompanion: TravelCompanion;
        exploreTime: ExploreTime;
        budget: Budget;
        activityIntensity: ActivityIntensity;
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

const GenerateItineraryForm: React.FC = () => {
    // Get the logged-in user from AuthContext
    const { user, token, loading: authLoading } = useAuth();
    
    // Step state management - only 3 steps for generate flow
    const [step, setStep] = useState<number>(1);
    const stepCount = 3;
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form data state with default values
const [formData, setFormData] = useState<ItineraryFormData>({
    traveler_id: 0,
    start_date: '',
    end_date: '',
    title: 'Generated Itinerary',
    notes: 'Auto-generated based on preferences',
    city: '',
    items: [] as ItineraryItem[],
    preferences: {
        experiences: [],
        travelCompanion: '' as TravelCompanion, // or use a default like 'Any' if needed
        exploreTime: '' as ExploreTime,
        budget: '' as Budget,
        activityIntensity: '' as ActivityIntensity
    }
});

    // Debug logging
    useEffect(() => {
        console.log('=== GenerateItineraryForm Debug ===');
        console.log('Auth loading:', authLoading);
        console.log('Current user object:', user);
        console.log('User ID:', user?.user_id);
        console.log('Token exists:', !!token);
        console.log('Form traveler_id:', formData.traveler_id);
        console.log('Current step:', step);
        console.log('Form preferences:', formData.preferences);
        console.log('====================================');
    }, [user, token, authLoading, formData.traveler_id, step, formData.preferences]);

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
    const handleNext = () => setStep((prev) => Math.min(prev + 1, stepCount));
    const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

    // Validate form data for generate flow
    const validateFormData = () => {
        const { traveler_id, city, start_date, end_date, preferences } = formData;

        console.log('Validating form data:', { traveler_id, city, start_date, end_date, preferences });

        // Check if user is logged in
        if (!traveler_id) {
            console.log('Validation failed: No traveler_id');
            return false;
        }

        // Check if city is selected (Step 1)
        if (!city || city.trim() === '') {
            console.log('Validation failed: No city selected');
            return false;
        }

        // Check if dates are provided (Step 1)
        if (!start_date || !end_date) {
            console.log('Validation failed: Missing dates');
            return false;
        }

        // Check date validity
        const start = new Date(start_date);
        const end = new Date(end_date);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
            console.log('Validation failed: Invalid dates');
            return false;
        }

        // Check if preferences are set (Step 2)
        if (!preferences) {
            console.log('Validation failed: No preferences');
            return false;
        }

        // Check if at least one experience type is selected
        if (!preferences.experiences || preferences.experiences.length === 0) {
            console.log('Validation failed: No experience types selected');
            return false;
        }

        // For step 3, check if itinerary has been generated
        if (step === 3 && (!formData.items || formData.items.length === 0)) {
            console.log('Validation failed: No generated itinerary items');
            return false;
        }

        console.log('Validation passed');
        return true;
    };

    const handleFinalStep = () => {
    // Since Step3GeneratedItinerary handles its own saving,
    // we just need to handle what happens after the itinerary is saved
    console.log('Itinerary process completed');
    
    Alert.alert('Success', 'Your generated itinerary has been saved successfully!', [
        {
            text: 'OK',
            onPress: () => {
               router.replace("/"); 
            }
        }
    ]);
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
                    You need to be logged in to generate an itinerary.
                </Text>
                <Text className="text-sm text-gray-600 text-center px-6 mt-2">
                    Please go back and log in first.
                </Text>
            </SafeAreaView>
        );
    }

    // Render current step component
    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <Step1SelectLocation 
                        formData={formData} 
                        setFormData={setFormData} 
                        onNext={handleNext}
                    />
                );
            case 2:
                return (
                    <Step2Preference 
                        formData={formData} 
                        setFormData={setFormData} 
                        onNext={handleNext} 
                        onBack={handleBack}
                    />
                );
            case 3:
                return (
                  <Step3GeneratedItinerary 
            formData={formData} 
            setFormData={setFormData} 
            onNext={handleFinalStep}  
            onBack={handleBack}
        />
                );
            default:
                return null;
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="flex-1 px-6 py-4">
                <ProgressBar currentStep={step} totalSteps={stepCount} />
                {renderStep()}
            </View>
        </SafeAreaView>
    );
};

// Progress bar styles - consistent with manual form
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

export default GenerateItineraryForm;