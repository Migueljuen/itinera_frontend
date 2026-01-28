// (traveler)/(createItinerary)/(generate)/Step2cFoodSuggestions.tsx
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
    budget?: any;
    travelDistance?: any;

    // ✅ NEW
    includeFoodSuggestions?: boolean;
  };
}

interface StepProps {
  formData: ItineraryFormData;
  setFormData: React.Dispatch<React.SetStateAction<ItineraryFormData>>;
  onNext: () => void;
  onBack: () => void;
}

const Step2cFoodSuggestions: React.FC<StepProps> = ({
  formData,
  setFormData,
  onNext,
  onBack,
}) => {
  const initial = useMemo(() => {
    const v = formData.preferences?.includeFoodSuggestions;
    return typeof v === "boolean" ? v : null;
  }, [formData.preferences?.includeFoodSuggestions]);

  const [includeFoodSuggestions, setIncludeFoodSuggestions] = useState<
    boolean | null
  >(initial);

  const isValid = () => includeFoodSuggestions !== null;

  const handleNext = () => {
    if (!isValid()) return;

    setFormData((prev) => ({
      ...prev,
      preferences: {
        // ✅ keep ALL existing preferences intact (including travelerCount)
        ...(prev.preferences ?? {
          travelerCount: 1,
          experiences: [],
        }),
        includeFoodSuggestions: includeFoodSuggestions!,
      },
    }));

    onNext();
  };

  const renderChoiceCard = (params: {
    keyProp: string;
    title: string;
    subtitle?: string;
    selected: boolean;
    onPress: () => void;
  }) => {
    const { keyProp, title, subtitle, selected, onPress } = params;

    return (
      <Pressable
        key={keyProp}
        onPress={onPress}
        className={`rounded-2xl px-4 py-4 mb-3 border ${selected ? "border-primary bg-indigo-100" : "border-gray-200 bg-gray-50"
          }`}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-base font-onest text-black/90">{title}</Text>
            {!!subtitle && (
              <Text className="text-xs text-gray-500 font-onest mt-1">
                {subtitle}
              </Text>
            )}
          </View>

          {selected ? (
            <Ionicons name="checkmark-circle" size={20} color="#4F46E5" />
          ) : (
            <View className="w-5 h-5 rounded-full border border-gray-300" />
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
      <View className="flex-1 flex justify-between">
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
        >
          <View className="py-2 px-4">
            <Text className="font-onest-semibold text-2xl text-black/90 mb-3">
              Dining suggestions
            </Text>

            <Text className="text-base text-black/50 font-onest mb-8">
              Would you like us to suggest places to eat near your trip?
            </Text>

            <View className="mb-2">
              {renderChoiceCard({
                keyProp: "food-yes",
                title: "Yes, include dining suggestions",
                subtitle: "We’ll recommend nearby places to eat during your trip.",
                selected: includeFoodSuggestions === true,
                onPress: () => setIncludeFoodSuggestions(true),
              })}

              {renderChoiceCard({
                keyProp: "food-no",
                title: "No, skip for now",
                subtitle: "You can still explore food spots later.",
                selected: includeFoodSuggestions === false,
                onPress: () => setIncludeFoodSuggestions(false),
              })}
            </View>

            {includeFoodSuggestions === null && (
              <Text className="text-xs text-red-500 font-onest mt-2">
                Please choose an option
              </Text>
            )}


          </View>
        </ScrollView>
        {/* Navigation Buttons */}
        <View className="flex-row justify-between mt-4 pt-2 absolute bottom-0 left-0 right-0 pb-4">
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

export default Step2cFoodSuggestions;
