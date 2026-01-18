import {
  GeneratedItinerary,
  ItineraryFormData,
  ItineraryItem,
} from "@/types/itineraryTypes";
import { EnhancedError } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import API_URL from "../../../../constants/api";
import AnimatedDots from "./components/AnimatedDots";
import { EnhancedErrorDisplay } from "./components/EnhancedErrorDisplay";
import ExperienceCard from "./components/ExperienceCard";
import UnderfilledNotice from "./components/Notice";

interface StepProps {
  formData: ItineraryFormData;
  setFormData: React.Dispatch<React.SetStateAction<ItineraryFormData>>;
  onNext: () => void;
  onBack: () => void;
}

interface DayChipData {
  dayNumber: number;
  label: string;
  subLabel: string;
  itemCount: number;
  isEmpty: boolean;
}

const INTENSITY_COLORS: Record<string, string> = {
  low: "text-green-600",
  moderate: "text-teal-600",
  high: "text-blue-600",
};

// Utility functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {

    month: "long",
    day: "numeric",
  });
};

const formatShortDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "short",
  });
};

const groupItemsByDay = (items: ItineraryItem[]) => {
  return items.reduce((acc, item) => {
    if (!acc[item.day_number]) acc[item.day_number] = [];
    acc[item.day_number].push(item);
    return acc;
  }, {} as { [key: number]: ItineraryItem[] });
};

// Main Component
const Step3GeneratedItinerary: React.FC<StepProps> = ({
  formData,
  setFormData,
  onNext,
  onBack,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedItinerary, setGeneratedItinerary] =
    useState<GeneratedItinerary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enhancedError, setEnhancedError] = useState<EnhancedError | null>(
    null
  );
  const [isPreview, setIsPreview] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedDayChip, setSelectedDayChip] = useState<number>(1);

  const mainScrollRef = useRef<ScrollView>(null);
  const chipScrollRef = useRef<ScrollView>(null);

  const MIN_LOADING_TIME = 100;

  useEffect(() => {
    generateItinerary();
  }, []);

  const totalCost: number = useMemo(() => {
    if (!generatedItinerary?.items) return 0;

    const travelerCount = formData.preferences?.travelerCount || 1;

    return generatedItinerary.items.reduce((sum, item) => {
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
  }, [generatedItinerary?.items, formData.preferences?.travelerCount]);

  const perPersonCost = useMemo(() => {
    const count = formData.preferences?.travelerCount || 1;
    return count > 1 ? Math.round(totalCost / count) : totalCost;
  }, [totalCost, formData.preferences?.travelerCount]);

  const totalDays = useMemo(() => {
    if (!generatedItinerary) return 0;
    const start = new Date(generatedItinerary.start_date);
    const end = new Date(generatedItinerary.end_date);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [generatedItinerary]);

  const groupedItems = useMemo(() => {
    if (!generatedItinerary?.items) return {};
    return groupItemsByDay(generatedItinerary.items);
  }, [generatedItinerary?.items]);

  const groupedItemsWithEmptyDays = useMemo(() => {
    const grouped = groupItemsByDay(generatedItinerary?.items || []);
    const allDays: Record<number, ItineraryItem[]> = {};

    for (let day = 1; day <= totalDays; day++) {
      allDays[day] = grouped[day] || [];
    }

    return allDays;
  }, [generatedItinerary?.items, totalDays]);

  // Generate day chips data
  const dayChips: DayChipData[] = useMemo(() => {
    if (!generatedItinerary) return [];

    const startDate = new Date(generatedItinerary.start_date);

    return Array.from({ length: totalDays }, (_, index) => {
      const dayNumber = index + 1;
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + index);

      const items = groupedItemsWithEmptyDays[dayNumber] || [];

      return {
        dayNumber,
        label: formatShortDate(dayDate.toISOString()),
        subLabel: dayDate.getDate().toString(),
        itemCount: items.length,
        isEmpty: items.length === 0,
      };
    });
  }, [generatedItinerary, totalDays, groupedItemsWithEmptyDays]);

  // Get selected day's items
  const selectedDayItems = useMemo(() => {
    return groupedItemsWithEmptyDays[selectedDayChip] || [];
  }, [groupedItemsWithEmptyDays, selectedDayChip]);

  // Get selected day's date
  const selectedDayDate = useMemo(() => {
    if (!generatedItinerary) return null;
    const startDate = new Date(generatedItinerary.start_date);
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + selectedDayChip - 1);
    return dayDate;
  }, [generatedItinerary, selectedDayChip]);

  const underfilledDays = useMemo(() => {
    return Object.entries(groupedItemsWithEmptyDays)
      .filter(([_, items]) => items.length <= 1)
      .map(([day]) => Number(day));
  }, [groupedItemsWithEmptyDays]);

  const showUnderfilledNotice = underfilledDays.length > 0;

  const generateItineraryWithPreferences = async (
    preferencesToUse?: ItineraryFormData["preferences"]
  ) => {
    const currentPreferences = preferencesToUse || formData.preferences;

    setLoading(true);
    setError(null);
    setEnhancedError(null);

    const startTime = Date.now();

    try {
      const requestBody: any = {
        traveler_id: formData.traveler_id,
        city: formData.city,
        start_date: formData.start_date,
        end_date: formData.end_date,
        experience_types: currentPreferences?.experiences || [],
        explore_time: currentPreferences?.exploreTime || "",
        budget: currentPreferences?.budget || "",
        activity_intensity: currentPreferences?.activityIntensity || "",
        travel_distance: currentPreferences?.travelDistance || "",
        title: formData.title,
        notes: formData.notes || "Auto-generated itinerary",
      };

      if (currentPreferences?.travelCompanions?.length) {
        requestBody.travel_companions = currentPreferences.travelCompanions;
        requestBody.travel_companion = currentPreferences.travelCompanions[0];
      } else if (currentPreferences?.travelCompanion) {
        requestBody.travel_companion = currentPreferences.travelCompanion;
        requestBody.travel_companions = [currentPreferences.travelCompanion];
      }

      console.log("🚀 Generating itinerary with:", requestBody);

      const response = await fetch(`${API_URL}/itinerary/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "no_experiences_found" && data.details) {
          console.log("📊 Enhanced error received:", data);
          setEnhancedError(data);
          return;
        }
        throw new Error(
          data.message || data.error || "Failed to generate itinerary"
        );
      }

      if (!data.itineraries || !Array.isArray(data.itineraries)) {
        throw new Error("Invalid response format from server");
      }

      if (data.itineraries.length === 0) {
        throw new Error(
          "No itinerary was generated. Please try different preferences."
        );
      }

      if (data.itineraries[0]) {
        const itinerary = data.itineraries[0];

        if (!itinerary.items || itinerary.items.length === 0) {
          throw new Error(
            "Generated itinerary has no activities. Please adjust your filters."
          );
        }

        console.log("✅ Itinerary generated successfully:", {
          totalItems: itinerary.items.length,
          days: Object.keys(groupItemsByDay(itinerary.items)).length,
        });

        setGeneratedItinerary(itinerary);
        setFormData({
          ...formData,
          items: itinerary.items,
          ...(preferencesToUse && { preferences: preferencesToUse }),
        });
        setRetryCount(0);
        setSelectedDayChip(1); // Reset to first day
      } else {
        throw new Error("No itinerary data in response");
      }
    } catch (err) {
      console.error("❌ Error generating itinerary:", err);

      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to generate itinerary"
        );
      }

      setRetryCount((prev) => prev + 1);
    } finally {
      const elapsed = Date.now() - startTime;
      const remaining = MIN_LOADING_TIME - elapsed;

      if (remaining > 0) {
        setTimeout(() => setLoading(false), remaining);
      } else {
        setLoading(false);
      }
    }
  };

  const generateItinerary = () => generateItineraryWithPreferences();

  const handleRegenerateWithNewFilters = (
    newPreferences: ItineraryFormData["preferences"]
  ) => {
    console.log("🔄 Regenerating with new filters:", newPreferences);
    setFormData({ ...formData, preferences: newPreferences });
    generateItineraryWithPreferences(newPreferences);
  };

  const handleModifyPreferences = () => {
    onBack();
  };

  const handleRetry = () => {
    console.log(
      "🔄 Retrying itinerary generation (attempt:",
      retryCount + 1,
      ")"
    );
    generateItinerary();
  };

  const handleDayChipPress = (dayNumber: number) => {
    setSelectedDayChip(dayNumber);
  };

  const removeItem = (itemToRemove: ItineraryItem) => {
    Alert.alert(
      "Remove Experience",
      `Are you sure you want to remove "${itemToRemove.experience_name}" from your itinerary?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            if (generatedItinerary) {
              const updatedItems = generatedItinerary.items.filter(
                (item) =>
                  !(
                    item.experience_id === itemToRemove.experience_id &&
                    item.day_number === itemToRemove.day_number &&
                    item.start_time === itemToRemove.start_time
                  )
              );

              if (updatedItems.length === 0) {
                Alert.alert(
                  "Cannot Remove",
                  "This is the only activity in your itinerary. Please regenerate with different filters instead.",
                  [{ text: "OK" }]
                );
                return;
              }

              setGeneratedItinerary({
                ...generatedItinerary,
                items: updatedItems,
              });
              setFormData({ ...formData, items: updatedItems });
            }
          },
        },
      ]
    );
  };

  const handleContinue = () => {
    if (!generatedItinerary?.items || generatedItinerary.items.length === 0) {
      Alert.alert(
        "Cannot Continue",
        "Your itinerary has no activities. Please regenerate or go back to adjust your preferences.",
        [{ text: "OK" }]
      );
      return;
    }
    onNext();
  };

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="text-center text-lg font-onest-medium mt-4 mb-2 text-black/90">
          Generating your perfect itinerary
        </Text>
        <Text className="text-center text-sm text-black/50 font-onest px-6">
          Your adventures are being lined up <AnimatedDots />
        </Text>
        {retryCount > 0 && (
          <Text className="text-center text-xs text-black/40 font-onest mt-2">
            Attempt {retryCount + 1}
          </Text>
        )}
      </View>
    );
  }

  // Enhanced error state
  if (enhancedError?.details) {
    return (
      <EnhancedErrorDisplay
        error={enhancedError}
        city={formData.city}
        onTryAgain={handleRetry}
        onModifyPreferences={handleModifyPreferences}
      />
    );
  }

  // No itinerary generated state
  if (!generatedItinerary) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <View className="items-center">
          <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
            <Ionicons name="calendar-outline" size={32} color="#9CA3AF" />
          </View>
          <Text className="text-center text-lg font-onest-medium text-black/90 mb-2">
            No itinerary available
          </Text>
          <Text className="text-center text-sm text-black/50 font-onest mb-6">
            Unable to generate an itinerary with current settings
          </Text>
          <TouchableOpacity
            onPress={handleRetry}
            className="bg-primary py-3 px-6 rounded-xl"
            activeOpacity={0.7}
          >
            <Text className="text-white font-onest-medium text-center">
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Preview Banner */}
      {/* {isPreview && (
        <View className="px-4 py-3 border-b border-gray-100">
          <View className="flex-row items-center justify-center">
            <Ionicons name="eye-outline" size={16} color="#3B82F6" />
            <Text className="ml-2 text-sm text-blue-600 font-onest-medium">
              Preview Mode - Remove activities you don't want
            </Text>
          </View>
        </View>
      )} */}



      <ScrollView
        ref={mainScrollRef}
        showsVerticalScrollIndicator={false}
        className="flex-1 "
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Summary Card */}
        <View className="mt-6 border-b py-4 border-gray-200 rounded-xl">
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1">
              <Text className="text-black/90 font-onest text-sm mb-1">
                Estimated Total Cost
              </Text>
              <Text className="text-3xl font-onest-bold text-black/90">
                ₱{totalCost.toLocaleString()}
              </Text>
            </View>
            {formData.preferences?.travelerCount &&
              formData.preferences.travelerCount > 1 && (
                <View className="bg-indigo-50 rounded-xl px-3 py-2">
                  <Text className="text-indigo-700 font-onest-semibold text-xs">
                    {formData.preferences.travelerCount} people
                  </Text>
                </View>
              )}
          </View>
          <Text className="text-black/50 font-onest text-sm">
            {formData.preferences?.travelerCount &&
              formData.preferences.travelerCount > 1
              ? `≈ ₱${perPersonCost.toLocaleString()} per person • This is an estimate`
              : "This is an estimate. Final total will be calculated after saving."}
          </Text>

          {/* Stats Row */}
          <View className="flex-row justify-between items-center mt-6 pt-6  border-gray-100">

            <View className="items-center flex flex-row ">
              <Ionicons name={"calendar-outline"}></Ionicons>
              <Text className="text-sm text-black/90 font-onest ml-2">
                {formatDate(generatedItinerary.start_date)} - {formatDate(generatedItinerary.end_date)}
              </Text>

            </View>

          </View>
        </View>


        {/* Horizontal Day Chips */}
        {dayChips.length > 0 && (
          <View className=" pt-4">
            <ScrollView
              ref={chipScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row"
            >
              {dayChips.map((chip) => {
                const isSelected = selectedDayChip === chip.dayNumber;

                return (
                  <Pressable
                    key={chip.dayNumber}
                    style={{ width: 80 }}
                    onPress={() => handleDayChipPress(chip.dayNumber)}
                    className={`
                    mr-2 py-3 rounded-xl items-center justify-center
                    ${isSelected
                        ? 'bg-blue-500'
                        : chip.isEmpty
                          ? 'bg-yellow-50'
                          : 'bg-gray-50'
                      }
                  `}
                  >
                    <Text
                      className={`
                      text-sm font-onest
                      ${isSelected
                          ? 'text-white'
                          : chip.isEmpty
                            ? 'text-yellow-600'
                            : 'text-black/80'
                        }
                    `}
                    >
                      {chip.label}
                    </Text>
                    <Text
                      className={`
                      text-xs font-onest mt-0.5
                      ${isSelected
                          ? 'text-white/80'
                          : chip.isEmpty
                            ? 'text-yellow-500'
                            : 'text-black/50'
                        }
                    `}
                    >
                      {chip.subLabel}
                    </Text>
                    {!isSelected && (
                      <Text
                        className={`
                        text-[10px] font-onest mt-1
                        ${chip.isEmpty
                            ? 'text-yellow-500'
                            : 'text-black/40'
                          }
                      `}
                      >
                        {chip.itemCount} {chip.itemCount === 1 ? 'activity' : 'activities'}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Selected Day Content */}
        <View className="mt-8">
          {/* Day Header */}
          <View className="flex-row items-center mb-4">
            {/* <View className="bg-primary rounded-full w-10 h-10 items-center justify-center mr-3">
              <Text className="text-white font-onest-bold text-sm">
                {selectedDayChip}
              </Text>
            </View> */}
            <View className="flex-1">
              <Text className="font-onest-semibold text-lg text-black/90">
                Day {selectedDayChip}
              </Text>
              {selectedDayDate && (
                <Text className="text-black/70 font-onest ">
                  {formatDate(selectedDayDate.toISOString())}
                </Text>
              )}
            </View>
            <Text className="text-black/40 font-onest text-sm">
              {selectedDayItems.length}{" "}
              {selectedDayItems.length !== 1 ? "activities" : "activity"}
            </Text>
          </View>

          {/* Day Items */}
          {selectedDayItems.length > 0 ? (
            selectedDayItems.map((item, index) => (
              <View key={`${selectedDayChip}-${index}`} className="mb-4">
                <ExperienceCard
                  item={item}
                  isPreview={isPreview}
                  onRemove={() => removeItem(item)}
                  travelerCount={formData.preferences?.travelerCount || 1}
                />
              </View>
            ))
          ) : (
            <View className="py-12 items-center">
              <View className="w-16 h-16 rounded-full bg-yellow-50 items-center justify-center mb-4">
                <Ionicons name="calendar-outline" size={32} color="#D97706" />
              </View>
              <Text className="text-black/90 font-onest-medium text-base mb-1">
                No activities scheduled
              </Text>
              <Text className="text-black/50 font-onest text-sm text-center px-8">
                This day has no activities. Consider regenerating your itinerary.
              </Text>
            </View>
          )}
        </View>
        {/* Underfilled Notice */}
        {showUnderfilledNotice && (
          <View className="mt-6">
            <UnderfilledNotice underfilledDays={underfilledDays} visible={showUnderfilledNotice} />
          </View>
        )}
      </ScrollView>

      {/* Navigation Buttons */}
      <View className="px-4 border-t border-gray-100">
        {isPreview ? (
          <View className="flex-row justify-between py-4">
            <TouchableOpacity
              onPress={onBack}
              className="py-3 px-5 rounded-xl border border-gray-200 bg-gray-50"
              activeOpacity={0.7}
              disabled={saving}
            >
              <Text className="text-center font-onest-medium text-base text-black/70">
                Back
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={generateItinerary}
              className="py-3 px-5 rounded-xl border border-gray-200 bg-gray-50"
              activeOpacity={0.7}
              disabled={saving}
            >
              <Text className="text-center font-onest-medium  text-base text-black/70">
                Regenerate
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleContinue}
              className="py-3 px-7 rounded-xl bg-primary"
              activeOpacity={0.7}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-center font-onest-medium text-base text-white">
                  Continue
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View className="items-center py-4">
            <View className="flex-row items-center mb-3">
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text className="ml-2 text-green-600 font-onest-medium">
                Itinerary saved successfully!
              </Text>
            </View>
            <Text className="text-sm text-black/50 font-onest text-center">
              Proceeding to next step...
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default Step3GeneratedItinerary;