// (traveler)/(createItinerary)/generate.tsx
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StepIndicator from "react-native-step-indicator";
// Step components
import API_URL from "@/constants/api"; // Adjust path as needed
import { useAuth } from "@/contexts/AuthContext";

import MeetingPointStep from "./(generate)/MeetingPointStep";
import Step2Preference from "./(generate)/Step2Preference";
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
  onNext: () => void; // Now just moves to next step without saving
  onBack: () => void;
}

interface Step3aProps {
  formData: ItineraryFormData;
  setFormData: React.Dispatch<React.SetStateAction<ItineraryFormData>>;
  onNext: (itineraryId: number) => void; // Accepts itinerary ID after saving
  onBack: () => void;
  initialMeetingPoint?: string; // Add this to pass meeting point from params
}

interface Step4Props {
  formData: ItineraryFormData;
  itineraryId: number;
  totalCost: number;
  onNext: () => void;
  onBack: () => void;
}

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

const GenerateItineraryForm: React.FC = () => {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [step, setStep] = useState<number>(1);
  const stepCount = 6; // Updated: 1-Location, 2-Preferences, 3-Itinerary, 4-Services, 5-MeetingPoint, 6-Payment
  const [savedItineraryId, setSavedItineraryId] = useState<number>(0);

  // Meeting point state
  const [meetingPoint, setMeetingPoint] = useState<LocationData | null>(null);

  // Form data state with default values
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

  // Step navigation handlers
  const handleNext = () => setStep((prev) => Math.min(prev + 1, stepCount));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

  // Handler for when meeting point is confirmed and itinerary should be saved
  const handleItinerarySaved = async (location: LocationData) => {
    console.log("Saving itinerary with meeting point:", location);

    try {
      // Build service assignments array
      const serviceAssignments: Array<{
        service_type: 'Guide' | 'Driver';
        provider_id: number;
        provider_profile_id: number;
        price: number;
      }> = [];

      if (formData.tourGuide) {
        const guideCost = Number(formData.tourGuide.price_per_day) * getTotalDays();
        serviceAssignments.push({
          service_type: 'Guide',
          provider_id: formData.tourGuide.user_id,
          provider_profile_id: formData.tourGuide.guide_id,
          price: guideCost,
        });
      }

      if (formData.carService) {
        const carCost = Number(formData.carService.price_per_day) * getTotalDays();
        serviceAssignments.push({
          service_type: 'Driver',
          provider_id: formData.carService.driver_user_id,
          provider_profile_id: formData.carService.driver_id,
          price: carCost,
        });
      }

      // Build meeting point data
      const meetingPointData = {
        requested_name: location.name,
        requested_address: location.address,
        requested_latitude: location.latitude,
        requested_longitude: location.longitude,
      };

      const response = await fetch(`${API_URL}/itinerary/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          traveler_id: formData.traveler_id,
          start_date: formData.start_date,
          end_date: formData.end_date,
          title: formData.title,
          notes: formData.notes,
          items: formData.items,
          total_cost: calculateActivityCost(),
          traveler_count: formData.preferences?.travelerCount || 1,
          service_assignments: serviceAssignments,
          meeting_point: meetingPointData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to save itinerary");
      }

      if (!data.itinerary_id) {
        throw new Error("No itinerary ID returned from server");
      }

      console.log("Itinerary saved with ID:", data.itinerary_id);
      setSavedItineraryId(data.itinerary_id);
      setMeetingPoint(location);
      handleNext(); // Move to payment confirmation step
    } catch (error) {
      console.error("Error saving itinerary:", error);
      Alert.alert(
        "Save Failed",
        error instanceof Error ? error.message : "Failed to save itinerary. Please try again."
      );
    }
  };

  // Helper to calculate total days
  const getTotalDays = () => {
    if (!formData.start_date || !formData.end_date) return 0;
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // Handler for final completion (after payment step)
  const handleFinalCompletion = () => {
    console.log("Itinerary process fully completed");
    router.replace("/");
  };

  // Calculate total cost (activities only)
  const calculateActivityCost = (): number => {
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

  // Calculate total cost including additional services
  const calculateTotalCost = (): number => {
    return calculateActivityCost(); // Only activities, services excluded
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
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <Step3aReviewServices
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext} // Move to meeting point step
            onBack={handleBack}
          />
        );
      case 5:
        return (
          <MeetingPointStep
            onConfirm={(location) => {
              setMeetingPoint(location);
              handleItinerarySaved(location);
            }}
            onBack={handleBack}
            initialLocation={meetingPoint}
          />
        );
      case 6:
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
    <SafeAreaView className="flex-1 bg-[#fff]">
      {/* <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
        <ProgressBar currentStep={step} totalSteps={stepCount} />
      </View> */}

      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
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