// (traveler)/(createItinerary)/(generate)/Step2bPaceConstraints.tsx
import {
  ActivityIntensity,
  Budget,
  TravelDistance,
} from "@/types/experienceTypes";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Itinerary interfaces (minimal: only what we touch here)
interface ItineraryFormData {
  traveler_id: number;
  start_date: string;
  end_date: string;
  title: string;
  notes?: string;
  city: string;
  items: any[];
  preferences?: {
    experiences: any[];
    experienceIds?: number[];
    travelerCount: number;
    budget?: Budget;
    activityIntensity?: ActivityIntensity;
    travelDistance?: TravelDistance;
  };
}

interface StepProps {
  formData: ItineraryFormData;
  setFormData: React.Dispatch<React.SetStateAction<ItineraryFormData>>;
  onNext: () => void;
  onBack: () => void;
}

const Step2bPaceConstraints: React.FC<StepProps> = ({
  formData,
  setFormData,
  onNext,
  onBack,
}) => {
  const budgetOptions: Budget[] = [
    "Free",
    "Budget-friendly",
    "Mid-range",
    "Premium",
  ];

  const budgetIconMap: Record<Budget, string> = {
    Free: "gift",
    "Budget-friendly": "wallet",
    "Mid-range": "cash-outline",
    Premium: "diamond",
  };

  const activityIntensityOptions: ActivityIntensity[] = [
    "Low",
    "Moderate",
    "High",
  ];

  const travelDistanceOptions: {
    value: TravelDistance;
    label: string;
    description: string;
  }[] = [
      { value: "Nearby", label: "Nearby only", description: "Within 10 km" },
      {
        value: "Moderate",
        label: "A moderate distance is fine",
        description: "Within 20 km",
      },
      {
        value: "Far",
        label: "Willing to travel far",
        description: "20 km or more",
      },
    ];

  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(
    formData.preferences?.budget || null
  );

  const [selectedActivityIntensity, setSelectedActivityIntensity] =
    useState<ActivityIntensity | null>(
      formData.preferences?.activityIntensity || null
    );

  const [selectedTravelDistance, setSelectedTravelDistance] =
    useState<TravelDistance | null>(formData.preferences?.travelDistance || null);

  const isValid = () =>
    selectedBudget !== null &&
    selectedActivityIntensity !== null &&
    selectedTravelDistance !== null;

  const handleNext = () => {
    if (!isValid()) return;

    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...(prev.preferences ?? { travelerCount: 1, experiences: [] }),
        budget: selectedBudget!,
        activityIntensity: selectedActivityIntensity!,
        travelDistance: selectedTravelDistance!,
      },
    }));

    console.log("=== User selections from STEP 2b (Pace & constraints) ===");
    console.log("Budget:", selectedBudget);
    console.log("Activity intensity:", selectedActivityIntensity);
    console.log("Travel distance:", selectedTravelDistance);
    console.log("========================================================");

    onNext();
  };

  const renderOption = (
    option: string,
    isSelected: boolean,
    onPress: () => void,
    icon?: string
  ) => {
    return (
      <TouchableOpacity
        key={option}
        className={`border rounded-lg p-3 mb-2 flex-row items-center justify-between ${isSelected ? "border-primary bg-indigo-50" : "border-gray-200"
          }`}
        onPress={onPress}
        activeOpacity={1}
      >
        <View className="flex-row items-center">
          {icon && (
            <Ionicons
              name={icon as any}
              size={16}
              color={isSelected ? "#4F46E5" : "#1a1a1a"}
              className="mr-3"
            />
          )}
          <Text
            className={`text-base font-onest ${isSelected ? "text-black/90" : "text-black/80"
              }`}
          >
            {option}
          </Text>
        </View>

        {isSelected && (
          <Ionicons name="checkmark-circle" size={16} color="#4F46E5" />
        )}
      </TouchableOpacity>
    );
  };

  const renderTravelDistanceOption = (
    option: { value: TravelDistance; label: string; description: string },
    isSelected: boolean,
    onPress: () => void
  ) => {
    return (
      <TouchableOpacity
        key={option.value}
        className={`border rounded-lg p-3 mb-2 flex-row items-center justify-between ${isSelected ? "border-primary bg-indigo-50" : "border-gray-200"
          }`}
        onPress={onPress}
        activeOpacity={1}
      >
        <View className="flex-row items-center flex-1">
          <Ionicons
            name={
              option.value === "Nearby"
                ? "location"
                : option.value === "Moderate"
                  ? "car"
                  : "airplane"
            }
            size={16}
            color={isSelected ? "#4F46E5" : "#1a1a1a"}
            className="mr-3"
          />

          <View className="flex-1">
            <Text
              className={`text-base font-onest ${isSelected ? "text-black/90" : "text-black/80"
                }`}
            >
              {option.label}
            </Text>
            <Text className="text-xs text-gray-500 font-onest mt-1">
              {option.description}
            </Text>
          </View>
        </View>

        {isSelected && (
          <Ionicons name="checkmark-circle" size={16} color="#4F46E5" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <View className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
        >
          <View className="py-2">
            <Text className="text-center text-xl font-onest-semibold mb-2">
              Pace & constraints
            </Text>
            <Text className="text-center text-sm text-gray-500 font-onest mb-6 w-11/12 m-auto">
              Set your budget, how packed you want your days, and how far you’re
              willing to travel.
            </Text>

            <View className="border-t pt-8 border-gray-200">
              {/* Budget */}
              <View className="mb-6">
                <Text className="font-onest-medium text-base mb-3">
                  What's your ideal budget for experiences?
                </Text>

                {budgetOptions.map((budget) =>
                  renderOption(
                    budget,
                    selectedBudget === budget,
                    () => setSelectedBudget(budget),
                    budgetIconMap[budget]
                  )
                )}

                {selectedBudget === null && (
                  <Text className="text-xs text-red-500 font-onest mt-2">
                    Please select a budget
                  </Text>
                )}
              </View>

              {/* Activity Intensity */}
              <View className="mb-6">
                <Text className="font-onest-medium text-base mb-3">
                  How packed would you like your days to be?
                </Text>
                <Text className="text-xs text-gray-500 font-onest mb-2">
                  This affects the number of experiences per day
                </Text>

                {activityIntensityOptions.map((intensity) =>
                  renderOption(
                    intensity,
                    selectedActivityIntensity === intensity,
                    () => setSelectedActivityIntensity(intensity),
                    intensity === "Low"
                      ? "leaf"
                      : intensity === "Moderate"
                        ? "walk"
                        : "flash"
                  )
                )}

                {selectedActivityIntensity && (
                  <View className="mt-2 p-2 rounded-lg">
                    <Text className="text-xs text-gray-600 font-onest">
                      {selectedActivityIntensity === "Low" &&
                        " Perfect for a relaxed pace"}
                      {selectedActivityIntensity === "Moderate" &&
                        " A good balance of activities and rest"}
                      {selectedActivityIntensity === "High" &&
                        " Action-packed adventure!"}
                    </Text>
                  </View>
                )}

                {selectedActivityIntensity === null && (
                  <Text className="text-xs text-red-500 font-onest mt-2">
                    Please select an intensity level
                  </Text>
                )}
              </View>

              {/* Travel Distance */}
              <View className="mb-6">
                <Text className="font-onest-medium text-base mb-3">
                  How far are you willing to travel outside your selected city?
                </Text>

                {travelDistanceOptions.map((option) =>
                  renderTravelDistanceOption(
                    option,
                    selectedTravelDistance === option.value,
                    () => setSelectedTravelDistance(option.value)
                  )
                )}

                {selectedTravelDistance === null && (
                  <Text className="text-xs text-red-500 font-onest mt-2">
                    Please select a travel distance
                  </Text>
                )}
              </View>
            </View>

            {/* Navigation Buttons */}
            <View className="flex-row justify-between mt-4 pt-2 border-t border-gray-200 pb-4">
              <TouchableOpacity
                onPress={onBack}
                className="py-4 px-6 rounded-xl border border-gray-200"
                activeOpacity={1}
              >
                <Text className="text-center font-onest-medium text-base text-gray-700">
                  Back
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNext}
                className={`py-4 px-8 rounded-xl ${isValid() ? "bg-primary" : "bg-gray-200"
                  }`}
                disabled={!isValid()}
                activeOpacity={1}
              >
                <Text className="text-center font-onest-medium text-base text-white">
                  Next step
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Step2bPaceConstraints;
