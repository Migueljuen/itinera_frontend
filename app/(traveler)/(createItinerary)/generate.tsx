// (traveler)/(createItinerary)/generate.tsx
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StepIndicator from "react-native-step-indicator";

import { useAuth } from "@/contexts/AuthContext";

// Step components
import MeetingPointStep from "./(generate)/MeetingPointStep";
import Step2Interests from "./(generate)/Step2Interests";
import Step2aGroupTiming from "./(generate)/Step2aGroupTiming";
import Step2bPaceConstraints from "./(generate)/Step2bPaceConstraints";
import Step2cFoodSuggestions from "./(generate)/Step2cFoodSuggestions"; // ✅ NEW STEP
import Step3GeneratedItinerary from "./(generate)/Step3GeneratedItinerary";
import Step3aReviewServices from "./(generate)/Step3aReviewServices";
import Step4PaymentConfirmation from "./(generate)/step4PaymentConfirmation";
import Step1SelectLocation from "./(manual)/Step1SelectLocation"; // Reusing from manual

import type { Experience } from "@/types/experienceTypes";
import type {
  FoodSuggestion,
  GuestBreakdown,
  ItineraryFormData,
} from "@/types/itineraryTypes";

/* ---------------- Local types (only those NOT in shared types) ---------------- */

interface LocationData {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

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

interface TourGuide {
  guide_id: number;
  user_id: number;
  name: string;
  languages: string[] | string;
  bio: string | null;
  areas_covered: string;
  experience_years: number;
  availability_days: string[] | string;
  city: string;
  price_per_day: string | number;
  profile_pic?: string;
  avg_rating: string | number;
  review_count: number;
}

interface CarService {
  vehicle_id: number;
  vehicle_type: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  passenger_capacity: number;
  vehicle_photos?: string[] | string;
  price_per_day: string | number;
  city: string;
  driver_name: string;
  driver_id: number;
  driver_user_id: number;
  avg_rating: string | number;
  review_count: number;
}

// If your shared ItineraryFormData doesn't include these fields, extend it locally.
type GenerateFormData = ItineraryFormData & {
  items: ItineraryItem[];
  tourGuide?: TourGuide | null;
  carService?: CarService | null;
  additionalServices?: {
    guideCost: number;
    carCost: number;
    totalAdditionalCost: number;
  };

  // ✅ Keep generated Places-to-eat suggestions across steps
  foodSuggestions?: FoodSuggestion[];

  // ✅ NEW (optional, stored in preferences)
  preferences?:
  | (ItineraryFormData["preferences"] & {
    includeFoodSuggestions?: boolean;
  })
  | undefined;
};

/* ---------------- Progress bar component ---------------- */

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

/* ---------------- Main component ---------------- */

const GenerateItineraryForm: React.FC = () => {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const [step, setStep] = useState<number>(1);

  // ✅ was 7, now 8 because we added Step2cFoodSuggestions
  const stepCount = 8;

  const [savedItineraryId, setSavedItineraryId] = useState<number>(0);
  const [meetingPoint, setMeetingPoint] = useState<LocationData | null>(null);
  const [showMeetingPointModal, setShowMeetingPointModal] = useState(false);

  const [formData, setFormData] = useState<GenerateFormData>({
    traveler_id: 0,
    start_date: "",
    end_date: "",
    title: "",
    notes: "Add notes here...",
    city: "",
    items: [] as ItineraryItem[],

    // ✅ init so Step3 can store + Step3a can save
    foodSuggestions: [],

    preferences: {
      experiences: [] as Experience[],
      travelerCount: 1,

      guestBreakdown: { adult: 1, child: 0, infant: 0 } as GuestBreakdown,
      travelCompanions: [],

      includeFoodSuggestions: undefined,
    },
  });

  useEffect(() => {
    if (user?.user_id && formData.traveler_id !== user.user_id) {
      setFormData((prev) => ({
        ...prev,
        traveler_id: user.user_id,
      }));
    }
  }, [user, formData.traveler_id]);

  const handleNext = () => setStep((prev) => Math.min(prev + 1, stepCount));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

  // ✅ was setStep(7); now Step4 is step 8
  const handleStep3aSave = (itineraryId: number) => {
    setSavedItineraryId(itineraryId);
    setStep(8);
  };

  const handleSelectMeetingPoint = () => {
    setShowMeetingPointModal(true);
  };

  const handleMeetingPointConfirmed = (location: LocationData) => {
    setMeetingPoint(location);
    setShowMeetingPointModal(false);
  };

  const calculateActivityCost = (): number => {
    if (!formData.items || formData.items.length === 0) return 0;
    const travelerCount = formData.preferences?.travelerCount || 1;

    return formData.items.reduce((sum, item) => {
      const price = Number(item.price || 0);
      if (price <= 0) return sum;

      if (
        item.unit?.toLowerCase() === "entry" ||
        item.unit?.toLowerCase() === "person"
      ) {
        return sum + price * travelerCount;
      }

      return sum + price;
    }, 0);
  };

  const calculateTotalCost = (): number => {
    return calculateActivityCost();
  };

  const handleFinalCompletion = () => {
    router.replace("/");
  };

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
          <Step2Interests
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );

      case 3:
        return (
          <Step2aGroupTiming
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );

      case 4:
        return (
          <Step2bPaceConstraints
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext} // ✅ now goes to Step2c
            onBack={handleBack}
          />
        );

      // ✅ NEW STEP: ask about dining suggestions
      case 5:
        return (
          <Step2cFoodSuggestions
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext} // ✅ goes to Step3GeneratedItinerary
            onBack={handleBack}
          />
        );

      // ✅ Step3 shifts to 6
      case 6:
        return (
          <Step3GeneratedItinerary
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );

      // ✅ Step3a shifts to 7
      case 7:
        return (
          <Step3aReviewServices
            formData={formData}
            setFormData={setFormData}
            onNext={handleStep3aSave}
            onBack={handleBack}
            onSelectMeetingPoint={handleSelectMeetingPoint}
            meetingPoint={meetingPoint}
          />
        );

      // ✅ Payment shifts to 8
      case 8:
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

  if (authLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#376a63" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </SafeAreaView>
    );
  }

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

  return (
    <SafeAreaView className="flex-1 bg-[#fff]">
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
        {renderStep()}
      </View>

      <Modal
        visible={showMeetingPointModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <MeetingPointStep
          onConfirm={handleMeetingPointConfirmed}
          onBack={() => setShowMeetingPointModal(false)}
          initialLocation={meetingPoint}
        />
      </Modal>
    </SafeAreaView>
  );
};

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
