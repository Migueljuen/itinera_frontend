// (traveler)/(createItinerary)/(generate)/Step2bPaceConstraints.tsx
import {
  ActivityIntensity,
  Budget,
  TravelDistance,
} from "@/types/experienceTypes";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
  const budgetOptions: Budget[] = useMemo(
    () => ["Free", "Budget-friendly", "Mid-range", "Premium"],
    []
  );

  const activityIntensityOptions: ActivityIntensity[] = useMemo(
    () => ["Low", "Moderate", "High"],
    []
  );

  const travelDistanceOptions: {
    value: TravelDistance;
    label: string;
    description: string;
  }[] = useMemo(
    () => [
      { value: "Nearby", label: "Nearby only", description: "Within 10 km" },
      {
        value: "Moderate",
        label: "A moderate distance is fine",
        description: "Within 20 km",
      },
      { value: "Far", label: "Willing to travel far", description: "20 km or more" },
    ],
    []
  );

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

    onNext();
  };

  const renderCard = (params: {
    keyProp: string;
    title: string;
    subtitle?: string;
    selected: boolean;
    onPress: () => void;
    fullWidth?: boolean;
  }) => {
    const { keyProp, title, subtitle, selected, onPress, fullWidth } = params;

    return (
      <Pressable
        key={keyProp}
        onPress={onPress}
        className={` rounded-2xl px-4 py-2 mb-3 ${fullWidth ? "w-full" : "w-[48%]"
          } ${selected ? "border-primary bg-indigo-100" : "border-gray-200 bg-black/5"}`}
      >
        <View>
          <View className="flex flex-row items-center justify-between">
            <Text className={`${fullWidth ? "text-base" : "text-lg"} font-onest text-black/90`}>
              {title}
            </Text>

            {selected && (
              <View>
                <Ionicons name="checkmark-circle" size={18} color="#4F46E5" />
              </View>
            )}
          </View>

          {!!subtitle && (
            <Text className="text-xs text-gray-500 font-onest mt-1">
              {subtitle}
            </Text>
          )}
        </View>
      </Pressable>
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
            {/* Budget */}
            <View className="mb-8">
              <Text className="font-onest-semibold text-2xl text-black/90 mb-3">
                What’s your ideal budget?
              </Text>
              <Text className="text-base text-black/50 font-onest mb-8">
                This helps match experiences to your price range.
              </Text>

              <View className="flex-row flex-wrap justify-between">
                {budgetOptions.map((budget) =>
                  renderCard({
                    keyProp: `budget-${budget}`,
                    title: budget,
                    subtitle:
                      budget === "Free"
                        ? "No-cost spots"
                        : budget === "Budget-friendly"
                          ? "Affordable picks"
                          : budget === "Mid-range"
                            ? "Balanced spend"
                            : "Premium experiences",
                    selected: selectedBudget === budget,
                    onPress: () => setSelectedBudget(budget),
                  })
                )}
              </View>

              {selectedBudget === null && (
                <Text className="text-xs text-red-500 font-onest mt-2">
                  Please select a budget
                </Text>
              )}
            </View>

            {/* Activity Intensity */}
            <View className="mb-8">
              <Text className="font-onest-semibold text-2xl text-black/90 mb-3">
                How packed do you want your days?
              </Text>
              <Text className="text-base text-black/50 font-onest mb-8">
                This affects how many activities we schedule per day.
              </Text>

              <View className="flex-row flex-wrap justify-between">
                {activityIntensityOptions.map((intensity) =>
                  renderCard({
                    keyProp: `intensity-${intensity}`,
                    title: intensity,
                    subtitle:
                      intensity === "Low"
                        ? "Relaxed pace"
                        : intensity === "Moderate"
                          ? "Balanced days"
                          : "Action-packed",
                    selected: selectedActivityIntensity === intensity,
                    onPress: () => setSelectedActivityIntensity(intensity),
                  })
                )}
              </View>

              {selectedActivityIntensity === null && (
                <Text className="text-xs text-red-500 font-onest mt-2">
                  Please select an intensity level
                </Text>
              )}
            </View>

            {/* Travel Distance */}
            <View className="mb-6">
              <Text className="font-onest-semibold text-2xl text-black/90 mb-3">
                How far are you willing to travel?
              </Text>
              <Text className="text-base text-black/50 font-onest mb-8">
                We’ll prioritize experiences within your preferred distance.
              </Text>

              {travelDistanceOptions.map((option) =>
                renderCard({
                  keyProp: `distance-${option.value}`,
                  title: option.label,
                  subtitle: option.description,
                  selected: selectedTravelDistance === option.value,
                  onPress: () => setSelectedTravelDistance(option.value),
                  fullWidth: true,
                })
              )}

              {selectedTravelDistance === null && (
                <Text className="text-xs text-red-500 font-onest mt-2">
                  Please select a travel distance
                </Text>
              )}
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
