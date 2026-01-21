// (traveler)/(createItinerary)/(generate)/Step2aGroupTiming.tsx
import { ExploreTime, TravelCompanion } from "@/types/experienceTypes";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
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
  const companionOptions: TravelCompanion[] = useMemo(
    () => ["Solo", "Partner", "Friends", "Family", "Any"],
    []
  );

  const exploreTimeOptions: ExploreTime[] = useMemo(
    () => ["Daytime", "Nighttime", "Both"],
    []
  );

  const [selectedCompanion, setSelectedCompanion] =
    useState<TravelCompanion | null>(
      formData.preferences?.travelCompanion || null
    );

  const [travelerCount, setTravelerCount] = useState<number>(
    formData.preferences?.travelerCount || 1
  );

  const [selectedExploreTime, setSelectedExploreTime] =
    useState<ExploreTime | null>(formData.preferences?.exploreTime || null);

  useEffect(() => {
    if (formData.preferences?.travelerCount) return;

    if (selectedCompanion === "Solo") setTravelerCount(1);
    else if (selectedCompanion === "Partner") setTravelerCount(2);
    else if (selectedCompanion === "Friends" || selectedCompanion === "Family")
      setTravelerCount(4);
    else if (selectedCompanion === "Any") setTravelerCount(1);
  }, [selectedCompanion, formData.preferences?.travelerCount]);

  const isValid = () =>
    selectedCompanion !== null && selectedExploreTime !== null;

  const handleNext = () => {
    if (!isValid()) return;

    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...(prev.preferences ?? { travelerCount: 1, experiences: [] }),
        travelCompanion: selectedCompanion!,
        travelerCount: selectedCompanion === "Solo" ? 1 : travelerCount,
        exploreTime: selectedExploreTime!,
      },
    }));

    onNext();
  };

  const selectCompanion = (companion: TravelCompanion) => {
    setSelectedCompanion(companion);

    if (companion === "Solo") setTravelerCount(1);
    else if (companion === "Partner") setTravelerCount(2);
    else if (companion === "Friends") setTravelerCount(3);
    else if (companion === "Family") setTravelerCount(4);
    else setTravelerCount(1);
  };

  const renderCard = (params: {
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
        className={` rounded-2xl px-4 py-2 w-[48%] mb-3 ${selected ? "border-primary bg-indigo-100" : "border-gray-200 bg-black/5"
          }`}
      >
        <View>
          <View className="flex flex-row items-center justify-between">
            <Text className="text-lg font-onest text-black/90">
              {title}
            </Text>
            {selected && (
              <View className="">
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
            <View>
              {/* Companion */}
              <View className="mb-8">
                <Text className="font-onest-semibold text-2xl text-black/90 mb-3">
                  Who are you travelling with?
                </Text>
                <Text className="text-base text-black/50 font-onest mb-8">
                  Group size affects pricing suggestions.
                </Text>

                <View className="flex-row flex-wrap justify-between">
                  {companionOptions.map((companion) =>
                    renderCard({
                      keyProp: `companion-${companion}`,
                      title: companion,
                      subtitle:
                        companion === "Solo"
                          ? "Just you"
                          : companion === "Partner"
                            ? "Two people"
                            : companion === "Friends"
                              ? "Small group"
                              : companion === "Family"
                                ? "Family trip"
                                : "We’ll adapt",
                      selected: selectedCompanion === companion,
                      onPress: () => selectCompanion(companion),
                    })
                  )}
                </View>

                {/* travelerCount only if not Solo */}
                {selectedCompanion && selectedCompanion !== "Solo" && (
                  <View className="mt-4 border border-gray-200 rounded-2xl bg-white px-4 py-4">
                    <Text className="font-onest-medium text-sm mb-3 text-gray-700">
                      Total number of participants
                    </Text>

                    <View className="flex-row items-center justify-between">
                      <Pressable
                        onPress={() =>
                          setTravelerCount((prev) => Math.max(2, prev - 1))
                        }
                        className="bg-white border border-gray-200 rounded-xl p-3"
                      >
                        <Ionicons name="remove" size={20} color="#374151" />
                      </Pressable>

                      <View className="items-center">
                        <Text className="font-onest-bold text-3xl text-primary">
                          {travelerCount}
                        </Text>
                        <Text className="text-xs text-gray-500 font-onest mt-1">
                          travelers
                        </Text>
                      </View>

                      <Pressable
                        onPress={() =>
                          setTravelerCount((prev) => Math.min(20, prev + 1))
                        }
                        className="bg-white border border-gray-200 rounded-xl p-3"
                      >
                        <Ionicons name="add" size={20} color="#374151" />
                      </Pressable>
                    </View>
                  </View>
                )}

                {selectedCompanion === "Solo" && (
                  <View className="mt-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <Text className="text-xs text-indigo-700 font-onest">
                      ✨ Solo travel — costs calculated for 1 person
                    </Text>
                  </View>
                )}

                {selectedCompanion === null && (
                  <Text className="text-xs text-red-500 font-onest mt-3">
                    Please select a companion option
                  </Text>
                )}
              </View>

              {/* Explore time */}
              <View className="mb-6">
                <Text className="font-onest-medium text-2xl mb-8">
                  When do you prefer to explore?
                </Text>

                <View className="flex-row flex-wrap justify-between">
                  {exploreTimeOptions.map((time) =>
                    renderCard({
                      keyProp: `time-${time}`,
                      title: time,
                      subtitle:
                        time === "Daytime"
                          ? "Morning to afternoon"
                          : time === "Nighttime"
                            ? "Evening to late night"
                            : "We’ll mix both",
                      selected: selectedExploreTime === time,
                      onPress: () => setSelectedExploreTime(time),
                    })
                  )}
                </View>

                {selectedExploreTime === null && (
                  <Text className="text-xs text-red-500 font-onest mt-3">
                    Please select an explore time
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

export default Step2aGroupTiming;
