import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StepIndicator from "react-native-step-indicator";
// Step components
import { useAuth } from "@/contexts/AuthContext";

import Step2Preference from "./(generate)/Step2Preference";
import Step3GeneratedItinerary from "./(generate)/Step3GeneratedItinerary";
import Step4PaymentConfirmation from "./(generate)/step4PaymentConfirmation";
import Step1SelectLocation from "./(manual)/Step1SelectLocation"; // Reusing from manual

import {
  ActivityIntensity,
  Budget,
  Experience,
  ExploreTime,
  TravelCompanion,
  TravelDistance,
} from "@/types/experienceTypes";

// Component prop interfaces
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

interface Step4Props {
  formData: ItineraryFormData;
  itineraryId: number;
  totalCost: number;
  onNext: () => void;
  onBack: () => void;
}

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
  accommodation?: Accommodation;
  preferences?: {
    experiences: Experience[];
    travelerCount: number;
    travelCompanion?: TravelCompanion;
    travelCompanions?: TravelCompanion[];

    exploreTime?: ExploreTime;
    budget?: Budget;
    activityIntensity?: ActivityIntensity;
    travelDistance?: TravelDistance;
  };
}

// Progress bar component
interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

const ProgressBar: React.FC<ProgressBarProps> = React.memo(
  ({ currentStep, totalSteps, labels = [] }) => {
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
  }
);

const GenerateItineraryForm: React.FC = () => {
  const { user, token, loading: authLoading } = useAuth();
  const [step, setStep] = useState<number>(1);
  const stepCount = 4; // Updated to 4 steps
  const [savedItineraryId, setSavedItineraryId] = useState<number>(0);

  // Form data state with default values
  const [formData, setFormData] = useState<ItineraryFormData>({
    traveler_id: 0,
    start_date: "",
    end_date: "",
    title: "",
    notes: "Auto-generated based on preferences",
    city: "",
    items: [] as ItineraryItem[],
    preferences: {
      experiences: [],
      travelerCount: 1,
      travelCompanions: [],
    },
  });

  // Update traveler_id when user is available
  useEffect(() => {
    if (user?.user_id && formData.traveler_id !== user.user_id) {
      setFormData((prev) => ({
        ...prev,
        traveler_id: user.user_id,
      }));
    }
  }, [user, formData.traveler_id]);

  // Step navigation handlers
  const handleNext = () => setStep((prev) => Math.min(prev + 1, stepCount));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

  // Handler for when itinerary is saved (called from Step 3)
  const handleItinerarySaved = (itineraryId: number) => {
    console.log("Itinerary saved with ID:", itineraryId);
    setSavedItineraryId(itineraryId);
    handleNext(); // Move to payment confirmation step
  };

  // Handler for final completion (after payment step)
  const handleFinalCompletion = () => {
    console.log("Itinerary process fully completed");
    router.replace("/");
  };

  // Calculate total cost
  const calculateTotalCost = (): number => {
    if (!formData.items || formData.items.length === 0) return 0;

    const travelerCount = formData.preferences?.travelerCount || 1;

    return formData.items.reduce((sum, item) => {
      const price = Number(item.price || 0);
      if (price <= 0) return sum;

      // Multiply by traveler count for per-person pricing
      if (
        item.unit?.toLowerCase() === "entry" ||
        item.unit?.toLowerCase() === "person"
      ) {
        return sum + price * travelerCount;
      }

      // Flat rate for packages, day, hour, etc.
      return sum + price;
    }, 0);
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
            onNext={handleItinerarySaved}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <Step4PaymentConfirmation
            formData={formData}
            itineraryId={savedItineraryId}
            totalCost={calculateTotalCost()}
            onNext={handleFinalCompletion}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
        <ProgressBar currentStep={step} totalSteps={stepCount} />
      </View> */}

      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}>
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
  separatorFinishedColor: "#376a63",
  separatorUnFinishedColor: "#E5E7EB",
  labelSize: 0,
  stepStrokeWidth: 0,
  currentStepStrokeWidth: 0,
};

export default GenerateItineraryForm;
