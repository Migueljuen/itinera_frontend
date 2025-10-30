//manual
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import {
  ActivityIntensity,
  Budget,
  Experience,
  ExploreTime,
  TravelCompanion,
  TravelDistance,
} from "@/types/experienceTypes";

// Itinerary interfaces

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
    travelCompanion?: TravelCompanion;
    travelCompanions?: TravelCompanion[];
    exploreTime?: ExploreTime;
    budget?: Budget;
    activityIntensity?: ActivityIntensity; // Remove the ? to make it required
    travelDistance?: TravelDistance;
  };
}
export interface ItineraryItem {
  experience_id: number;
  day_number: number; // Must be between 1 and total number of days in the itinerary
  start_time: string; // Format: 'HH:mm'
  end_time: string; // Format: 'HH:mm'
  custom_note?: string;
}

interface StepProps {
  formData: ItineraryFormData;
  setFormData: React.Dispatch<React.SetStateAction<ItineraryFormData>>;
  onNext: () => void;
  onBack: () => void;
}

const Step2Preference: React.FC<StepProps> = ({
  formData,
  setFormData,
  onNext,
  onBack,
}) => {
  const [selectedExperiences, setSelectedExperiences] = useState<Experience[]>(
    formData.preferences?.experiences || []
  );
  const [selectedCompanion, setSelectedCompanion] =
    useState<TravelCompanion | null>(
      formData.preferences?.travelCompanion || null
    );
  const [selectedExploreTime, setSelectedExploreTime] =
    useState<ExploreTime | null>(formData.preferences?.exploreTime || null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(
    formData.preferences?.budget || null
  );
  const [selectedTravelDistance, setSelectedTravelDistance] =
    useState<TravelDistance | null>(
      formData.preferences?.travelDistance || null
    );

  // check user input in console
  useEffect(() => {
    console.log("=== User selections from STEP 1 ===");
    console.log("Selected city:", formData.city);
    console.log("Start date:", formData.start_date);
    console.log("End date:", formData.end_date);

    console.log("==========================================");
  }, []);

  // Available options
  const experienceOptions: Experience[] = [
    "Adventure",
    "Cultural",
    "Food",
    "Nature",
    "Relaxation",
    "Nightlife",
  ];
  const companionOptions: TravelCompanion[] = [
    "Solo",
    "Partner",
    "Friends",
    "Family",
    "Any",
  ];
  const exploreTimeOptions: ExploreTime[] = ["Daytime", "Nighttime", "Both"];
  const budgetOptions: Budget[] = [
    "Free",
    "Budget-friendly",
    "Mid-range",
    "Premium",
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

  // Toggle experience selection (multiple selection)
  const toggleExperience = (experience: Experience) => {
    if (selectedExperiences.includes(experience)) {
      setSelectedExperiences(
        selectedExperiences.filter((item) => item !== experience)
      );
    } else {
      setSelectedExperiences([...selectedExperiences, experience]);
    }
  };

  // Check if form is valid to enable the Next button
  const isValid = () => {
    return (
      selectedExperiences.length > 0 &&
      selectedCompanion !== null &&
      selectedExploreTime !== null &&
      selectedBudget !== null &&
      selectedTravelDistance !== null
    );
  };

  // Handle submission
  const handleNext = () => {
    if (isValid()) {
      // Update the formData with preferences
      setFormData({
        ...formData,
        preferences: {
          experiences: selectedExperiences,
          travelCompanion: selectedCompanion!,
          exploreTime: selectedExploreTime!,
          budget: selectedBudget!,
          travelDistance: selectedTravelDistance!,
        },
      });
      onNext();
    }
  };

  // Render preference option
  const renderOption = (
    option: string,
    isSelected: boolean,
    onPress: () => void,
    icon?: string
  ) => {
    return (
      <TouchableOpacity
        key={option}
        className={`border rounded-lg p-3 mb-2 flex-row items-center justify-between ${
          isSelected ? "border-primary bg-indigo-50" : "border-gray-300"
        }`}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center">
          {icon && (
            <Ionicons
              name={icon as any}
              size={20}
              color={isSelected ? "#4F46E5" : "#6B7280"}
              className="mr-2"
            />
          )}
          <Text
            className={`text-base ${
              isSelected
                ? "font-onest-medium text-primary"
                : "font-onest text-gray-700"
            }`}
          >
            {option}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color="#4F46E5" />
        )}
      </TouchableOpacity>
    );
  };

  // Render travel distance option with description
  const renderTravelDistanceOption = (
    option: { value: TravelDistance; label: string; description: string },
    isSelected: boolean,
    onPress: () => void
  ) => {
    return (
      <TouchableOpacity
        key={option.value}
        className={`border rounded-lg p-3 mb-2 flex-row items-center justify-between ${
          isSelected ? "border-primary bg-indigo-50" : "border-gray-300"
        }`}
        onPress={onPress}
        activeOpacity={0.7}
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
            size={20}
            color={isSelected ? "#4F46E5" : "#6B7280"}
            className="mr-3"
          />
          <View className="flex-1">
            <Text
              className={`text-base ${
                isSelected
                  ? "font-onest-medium text-primary"
                  : "font-onest text-gray-700"
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
          <Ionicons name="checkmark-circle" size={20} color="#4F46E5" />
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
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 p-4">
              <View className="text-center py-2">
                <Text className="text-center text-xl font-onest-semibold mb-2">
                  Tell us about your preferences
                </Text>
                <Text className="text-center text-sm text-gray-500 font-onest mb-6 w-11/12 m-auto">
                  Let's customize your itinerary based on what you enjoy most.
                </Text>

                <View className="flex justify-evenly gap-6 border-t pt-8 border-gray-200">
                  {/* Experience Preferences */}
                  <View className="mb-6">
                    <Text className="font-onest-medium text-base mb-3">
                      What kind of experiences are you craving?
                    </Text>
                    <Text className="text-xs text-gray-500 font-onest mb-2">
                      Select all that interest you
                    </Text>
                    <View className="flex-row flex-wrap justify-between">
                      {experienceOptions.map((experience) => (
                        <TouchableOpacity
                          key={experience}
                          className={`border rounded-lg py-3 px-2 mb-3 w-[48%] items-center ${
                            selectedExperiences.includes(experience)
                              ? "border-primary bg-indigo-50"
                              : "border-gray-300"
                          }`}
                          onPress={() => toggleExperience(experience)}
                          activeOpacity={0.7}
                        >
                          <Text
                            className={`text-base ${
                              selectedExperiences.includes(experience)
                                ? "font-onest-medium text-primary"
                                : "font-onest text-gray-700"
                            }`}
                          >
                            {experience}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {selectedExperiences.length === 0 && (
                      <Text className="text-xs text-red-500 font-onest mt-1">
                        Please select at least one experience
                      </Text>
                    )}
                  </View>

                  {/* Travel Companion */}
                  <View className="mb-6">
                    <Text className="font-onest-medium text-base mb-3">
                      Who are you traveling with?
                    </Text>
                    {companionOptions.map((companion) =>
                      renderOption(
                        companion,
                        selectedCompanion === companion,
                        () => setSelectedCompanion(companion),
                        companion === "Solo"
                          ? "person"
                          : companion === "Partner"
                          ? "heart"
                          : companion === "Friends"
                          ? "people"
                          : companion === "Family"
                          ? "home"
                          : companion === "Any"
                          ? "person"
                          : "person"
                      )
                    )}
                  </View>

                  {/* Explore Time */}
                  <View className="mb-6">
                    <Text className="font-onest-medium text-base mb-3">
                      Do you want to explore more during the day or night?
                    </Text>
                    {exploreTimeOptions.map((time) =>
                      renderOption(
                        time,
                        selectedExploreTime === time,
                        () => setSelectedExploreTime(time),
                        time === "Daytime"
                          ? "sunny"
                          : time === "Nighttime"
                          ? "moon"
                          : "time"
                      )
                    )}
                  </View>

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
                        budget === "Free" ? "gift" : "cash"
                      )
                    )}
                  </View>

                  {/* Travel Distance */}
                  <View className="mb-6">
                    <Text className="font-onest-medium text-base mb-3">
                      How far are you willing to travel outside your selected
                      city?
                    </Text>
                    {travelDistanceOptions.map((option) =>
                      renderTravelDistanceOption(
                        option,
                        selectedTravelDistance === option.value,
                        () => setSelectedTravelDistance(option.value)
                      )
                    )}
                  </View>
                </View>
              </View>

              {/* Navigation Buttons */}
              <View className="flex-row justify-between mt-4 pt-2 border-t border-gray-200 pb-4">
                <TouchableOpacity
                  onPress={onBack}
                  className="py-4 px-6 rounded-xl border border-gray-300"
                  activeOpacity={0.7}
                >
                  <Text className="text-center font-onest-medium text-base text-gray-700">
                    Back
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleNext}
                  className={`py-4 px-8 rounded-xl ${
                    isValid() ? "bg-primary" : "bg-gray-200"
                  }`}
                  disabled={!isValid()}
                  activeOpacity={0.7}
                >
                  <Text className="text-center font-onest-medium text-base text-white">
                    Next step
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Step2Preference;
