// (traveler)/(createItinerary)/(generate)/Step2aGroupTiming.tsx
import { ActivityIntensity, ExploreTime, TravelCompanion } from "@/types/experienceTypes";
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
    travelCompanion?: TravelCompanion;
    exploreTime?: ExploreTime;
    activityIntensity?: ActivityIntensity;
  };
}

interface StepProps {
  formData: ItineraryFormData;
  setFormData: React.Dispatch<React.SetStateAction<ItineraryFormData>>;
  onNext: () => void;
  onBack: () => void;
}

const Step2aGroupTiming: React.FC<StepProps> = ({
  formData,
  setFormData,
  onNext,
  onBack,
}) => {
  const exploreTimeOptions: ExploreTime[] = useMemo(
    () => ["Daytime", "Nighttime", "Both"],
    []
  );

  const activityIntensityOptions: ActivityIntensity[] = useMemo(
    () => ["Low", "Moderate", "High"],
    []
  );

  const [selectedExploreTime, setSelectedExploreTime] =
    useState<ExploreTime | null>(formData.preferences?.exploreTime || null);

  const [selectedActivityIntensity, setSelectedActivityIntensity] =
    useState<ActivityIntensity | null>(
      formData.preferences?.activityIntensity || null
    );

  const isValid = () =>
    selectedExploreTime !== null && selectedActivityIntensity !== null;

  const handleNext = () => {
    if (!isValid()) return;

    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...(prev.preferences ?? { travelerCount: 1, experiences: [] }),
        exploreTime: selectedExploreTime!,
        activityIntensity: selectedActivityIntensity!,
      },
    }));

    onNext();
  };

  const renderCard = (params: {
    keyProp: string;
    title: string;
    subtitle?: string;
    icon?: string;
    selected: boolean;
    onPress: () => void;
  }) => {
    const { keyProp, title, subtitle, icon, selected, onPress } = params;

    return (
      <Pressable
        key={keyProp}
        onPress={onPress}
        className={`rounded-2xl px-4 py-4 w-full mb-3 ${selected ? "border-primary bg-indigo-100" : "border-gray-200 bg-gray-50"
          }`}
      >
        <View>
          <View className="flex flex-row items-center justify-between">
            <View className="flex-row items-center">
              {icon && (
                <Text className="text-2xl mr-3">{icon}</Text>
              )}
              <View>
                <Text className="text-lg font-onest text-black/90">{title}</Text>
                {!!subtitle && (
                  <Text className="text-sm text-gray-500 font-onest mt-1">
                    {subtitle}
                  </Text>
                )}
              </View>
            </View>
            {selected && (
              <View>
                <Ionicons name="checkmark-circle" size={22} color="#4F46E5" />
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <View className="flex-1 flex justify-between">
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
        >
          <View className="py-2 px-4">

            {/* Explore time */}
            <View className="mb-8">
              <Text className="font-onest-semibold text-2xl text-black/90 mb-3">
                When do you prefer to explore?
              </Text>
              <Text className="text-base text-black/50 font-onest mb-6">
                This helps us suggest activities that match your schedule.
              </Text>

              <View>
                {exploreTimeOptions.map((time) =>
                  renderCard({
                    keyProp: `time-${time}`,
                    title: time,
                    icon:
                      time === "Daytime"
                        ? "☀️"
                        : time === "Nighttime"
                          ? "🌙"
                          : "🌗",
                    subtitle:
                      time === "Daytime"
                        ? "Morning to afternoon activities"
                        : time === "Nighttime"
                          ? "Evening to late night experiences"
                          : "A mix of day and night activities",
                    selected: selectedExploreTime === time,
                    onPress: () => setSelectedExploreTime(time),
                  })
                )}
              </View>

              {selectedExploreTime === null && (
                <Text className="text-xs text-red-500 font-onest mt-3">
                  Please select when you prefer to explore
                </Text>
              )}
            </View>

            {/* Activity Intensity */}
            <View className="mb-6">
              <Text className="font-onest-semibold text-2xl text-black/90 mb-3">
                How packed do you want your days?
              </Text>
              <Text className="text-base text-black/50 font-onest mb-6">
                This affects how many activities we schedule per day.
              </Text>

              <View>
                {activityIntensityOptions.map((intensity) =>
                  renderCard({
                    keyProp: `intensity-${intensity}`,
                    title: intensity,
                    icon:
                      intensity === "Low"
                        ? "🧘"
                        : intensity === "Moderate"
                          ? "🚶"
                          : "🏃",
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
                <Text className="text-xs text-red-500 font-onest mt-3">
                  Please select an intensity level
                </Text>
              )}
            </View>


          </View>
        </ScrollView>
        {/* Navigation Buttons */}
        <View className="flex-row justify-between mt-4 pt-4  pb-4 sticky bottom-0 left-0 right-0">
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
    </KeyboardAvoidingView>
  );
};

export default Step2aGroupTiming;