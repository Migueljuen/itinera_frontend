// (traveler)/(createItinerary)/generate.tsx
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StepIndicator from "react-native-step-indicator";
// Step components
import { useAuth } from "@/contexts/AuthContext";

import MeetingPointStep from "./(generate)/MeetingPointStep";
import Step2Interests from "./(generate)/Step2Interests";
import Step2aGroupTiming from "./(generate)/Step2aGroupTiming";
import Step2bPaceConstraints from "./(generate)/Step2bPaceConstraints";

import Step3GeneratedItinerary from "./(generate)/Step3GeneratedItinerary";
import Step3aReviewServices from "./(generate)/Step3aReviewServices";
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
    experienceIds?: number[];
    experiences: Experience[];
    travelerCount: number;
    travelCompanion?: TravelCompanion;
    travelCompanions?: TravelCompanion[];
    exploreTime?: ExploreTime;
    budget?: Budget;
    activityIntensity?: ActivityIntensity;
    travelDistance?: TravelDistance;
  };
  // Additional services from Step3a
  tourGuide?: TourGuide | null;
  carService?: CarService | null;
  additionalServices?: {
    guideCost: number;
    carCost: number;
    totalAdditionalCost: number;
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

// Key changes to GenerateItineraryForm in generate.tsx

const GenerateItineraryForm: React.FC = () => {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [step, setStep] = useState<number>(1);
  const stepCount = 7;

  const [savedItineraryId, setSavedItineraryId] = useState<number>(0);
  const [meetingPoint, setMeetingPoint] = useState<LocationData | null>(null);
  const [showMeetingPointModal, setShowMeetingPointModal] = useState(false);

  const [formData, setFormData] = useState<ItineraryFormData>({
    traveler_id: 0,
    start_date: "",
    end_date: "",
    title: "",
    notes: "Add notes here...",
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

  const handleNext = () => setStep((prev) => Math.min(prev + 1, stepCount));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

  // Modified handler for Step3a - handles both with and without services
  const handleStep3aSave = (itineraryId: number) => {
    setSavedItineraryId(itineraryId);
    setStep(7);

  };

  const handleSelectMeetingPoint = () => {
    // Navigate to meeting point selection (we'll use a modal or separate screen)
    // For now, just show an alert - you can implement a modal or navigate
    setShowMeetingPointModal(true);
  };

  const handleMeetingPointConfirmed = (location: LocationData) => {
    setMeetingPoint(location);
    setShowMeetingPointModal(false);
  };

  const getTotalDays = () => {
    if (!formData.start_date || !formData.end_date) return 0;
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleFinalCompletion = () => {
    console.log("Itinerary process fully completed");
    router.replace("/");
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
            onNext={handleNext}
            onBack={handleBack}
          />
        );

      case 5:
        return (
          <Step3GeneratedItinerary
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );

      case 6:
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

      case 7:
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
      {/* Meeting Point Modal */}
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
