import {
  GeneratedItinerary,
  ItineraryFormData,
  ItineraryItem,
} from "@/types/itineraryTypes";
import { EnhancedError } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
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

type FoodSuggestion = {
  experience_id: number;
  experience_name?: string;
  title?: string;
  experience_description?: string;
  description?: string;
  experience_notes?: string;
  notes?: string;
  destination_name?: string;
  destination_city?: string;
  images?: string[];
  primary_image?: string | null;
  price?: number | null;
  price_estimate?: string | null;
  unit?: string | null;

  // Optional context fields if backend provides them:
  near_experience_name?: string | null;
  near_experience_id?: number | null;
};

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

const parsePriceEstimateRange = (
  value: any
): { min: number; max: number } | null => {
  if (!value) return null;

  if (typeof value === "number") return { min: value, max: value };

  const s = String(value).trim();

  const nums = s.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
  if (nums.length === 0) return null;

  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return { min, max };
};

const applyUnitMultiplier = (
  amount: number,
  unit: string | undefined,
  travelerCount: number
) => {
  const u = String(unit || "").toLowerCase();
  const perPerson = u === "entry" || u === "person";
  return perPerson ? amount * travelerCount : amount;
};

const formatPeso = (n: number) => `₱${Math.round(n).toLocaleString()}`;

const formatPriceText = (
  price: any,
  priceEstimate: any,
  unit: any,
  travelerCount: number
) => {
  const p = Number(price || 0);

  if (p > 0) {
    const v = applyUnitMultiplier(p, unit, travelerCount);
    return `${formatPeso(v)}${String(unit || "").toLowerCase() === "entry" ||
      String(unit || "").toLowerCase() === "person"
      ? ` (${travelerCount} pax)`
      : ""
      }`;
  }

  const range = parsePriceEstimateRange(priceEstimate);
  if (range) {
    const vMin = applyUnitMultiplier(range.min, unit, travelerCount);
    const vMax = applyUnitMultiplier(range.max, unit, travelerCount);

    if (Math.round(vMin) === Math.round(vMax)) return formatPeso(vMax);
    return `${formatPeso(vMin)} - ${formatPeso(vMax)}`;
  }

  return "Price not available";
};

const resolveImageUri = (raw?: string | null) => {
  if (!raw) return null;

  const s = String(raw).trim();
  if (!s) return null;

  if (
    s.startsWith("http://") ||
    s.startsWith("https://") ||
    s.startsWith("data:")
  )
    return s;

  if (s.startsWith("//")) return `https:${s}`;

  const base = String(API_URL || "").replace(/\/api\/?$/i, "");
  if (!base) return s;

  if (s.startsWith("/")) return `${base}${s}`;
  return `${base}/${s}`;
};

// Main Component
const Step3GeneratedItinerary: React.FC<StepProps> = ({
  formData,
  setFormData,
  onNext,
  onBack,
}) => {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedItinerary, setGeneratedItinerary] =
    useState<GeneratedItinerary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enhancedError, setEnhancedError] = useState<EnhancedError | null>(null);
  const [isPreview, setIsPreview] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedDayChip, setSelectedDayChip] = useState<number>(1);

  //  food suggestions UI state
  const [foodExpanded, setFoodExpanded] = useState(false);

  const mainScrollRef = useRef<ScrollView>(null);
  const chipScrollRef = useRef<ScrollView>(null);

  const MIN_LOADING_TIME = 100;

  useEffect(() => {
    generateItinerary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const includeFoodSuggestions = !!formData.preferences?.includeFoodSuggestions;

  const foodSuggestions: FoodSuggestion[] = useMemo(() => {
    // Backend attaches this in itineraries[0].food_suggestions
    // We keep it optional + separate from items.
    const anyItin: any = generatedItinerary as any;
    const list = anyItin?.food_suggestions;
    return Array.isArray(list) ? list : [];
  }, [generatedItinerary]);

  // ✅ Estimated Budget (includes exact price + price_estimate range)
  const estimatedBudget = useMemo(() => {
    if (!generatedItinerary?.items) return { min: 0, max: 0, hasRange: false };

    const travelerCount = formData.preferences?.travelerCount || 1;

    let minTotal = 0;
    let maxTotal = 0;
    let hasRange = false;

    for (const item of generatedItinerary.items) {
      const unit = item.unit;
      const price = Number(item.price || 0);

      // 1) exact price
      if (price > 0) {
        const v = applyUnitMultiplier(price, unit, travelerCount);
        minTotal += v;
        maxTotal += v;
        continue;
      }

      // 2) estimate range
      const range = parsePriceEstimateRange(item.price_estimate);
      if (range) {
        const vMin = applyUnitMultiplier(range.min, unit, travelerCount);
        const vMax = applyUnitMultiplier(range.max, unit, travelerCount);

        minTotal += vMin;
        maxTotal += vMax;

        if (range.min !== range.max) hasRange = true;
        continue;
      }

      // 3) no price data => 0
    }

    return {
      min: Math.round(minTotal),
      max: Math.round(maxTotal),
      hasRange: hasRange || Math.round(minTotal) !== Math.round(maxTotal),
    };
  }, [generatedItinerary?.items, formData.preferences?.travelerCount]);

  const estimatedBudgetPerPerson = useMemo(() => {
    const count = formData.preferences?.travelerCount || 1;
    if (count <= 1) return null;

    return {
      min: Math.round(estimatedBudget.min / count),
      max: Math.round(estimatedBudget.max / count),
      hasRange: estimatedBudget.hasRange,
    };
  }, [estimatedBudget, formData.preferences?.travelerCount]);

  const totalDays = useMemo(() => {
    if (!generatedItinerary) return 0;
    const start = new Date(generatedItinerary.start_date);
    const end = new Date(generatedItinerary.end_date);
    return (
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );
  }, [generatedItinerary]);

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
    const travelerCount = Number(currentPreferences?.travelerCount || 1);
    const guestBreakdown = currentPreferences?.guestBreakdown || null;

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
        guest_count: travelerCount,
        traveler_count: travelerCount,
        guest_breakdown: guestBreakdown,

        //  tells backend to attach food suggestions
        include_food_suggestions: !!currentPreferences?.includeFoodSuggestions,
      };

      if (currentPreferences?.travelCompanions?.length) {
        requestBody.travel_companions = currentPreferences.travelCompanions;
        requestBody.travel_companion = currentPreferences.travelCompanions[0];
      } else if (currentPreferences?.travelCompanion) {
        requestBody.travel_companion = currentPreferences.travelCompanion;
        requestBody.travel_companions = [currentPreferences.travelCompanion];
      }

      const response = await fetch(`${API_URL}/itinerary/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "no_experiences_found" && data.details) {
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
        const foodList = Array.isArray((itinerary as any)?.food_suggestions)
          ? (itinerary as any).food_suggestions
          : [];

        setGeneratedItinerary(itinerary);


        setFormData({
          ...formData,
          items: itinerary.items,
          foodSuggestions: itinerary.food_suggestions ?? [],
          ...(preferencesToUse && { preferences: preferencesToUse }),
        });

        setRetryCount(0);
        setSelectedDayChip(1);

        //  UX: If user opted in and backend returned suggestions, keep collapsed by default
        setFoodExpanded(false);
      } else {
        throw new Error("No itinerary data in response");
      }
    } catch (err) {
      console.error("❌ Error generating itinerary:", err);

      if (
        err instanceof TypeError &&
        String((err as any).message).includes("fetch")
      ) {
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

      if (remaining > 0) setTimeout(() => setLoading(false), remaining);
      else setLoading(false);
    }
  };

  const generateItinerary = () => generateItineraryWithPreferences();

  const handleRetry = () => {
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
        onModifyPreferences={onBack}
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

  const travelerCount = formData.preferences?.travelerCount || 1;
  const { width: SCREEN_WIDTH } = Dimensions.get("window");
  const FOOD_CARD_WIDTH = 280;

  // For "Near <activity>" label:
  const firstActivityNameForSelectedDay = selectedDayItems?.[0]?.experience_name || "";

  return (
    <View className="flex-1">
      <ScrollView
        ref={mainScrollRef}
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Summary Card */}
        <View className="mt-6 border-b py-4 border-gray-200 rounded-xl">
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1">
              <Text className="text-black/90 font-onest text-sm mb-1">
                Estimated Budget
              </Text>

              <Text className="text-3xl font-onest-bold text-black/90">
                {estimatedBudget.hasRange
                  ? `₱${estimatedBudget.min.toLocaleString()} - ₱${estimatedBudget.max.toLocaleString()}`
                  : `₱${estimatedBudget.max.toLocaleString()}`}
              </Text>
            </View>

            {travelerCount > 1 && (
              <View className="bg-indigo-50 rounded-xl px-3 py-2">
                <Text className="text-indigo-700 font-onest-semibold text-xs">
                  {travelerCount} people
                </Text>
              </View>
            )}
          </View>

          <Text className="text-black/50 font-onest text-sm">
            {travelerCount > 1 ? (
              estimatedBudgetPerPerson ? (
                estimatedBudgetPerPerson.hasRange ? (
                  `≈ ₱${estimatedBudgetPerPerson.min.toLocaleString()} - ₱${estimatedBudgetPerPerson.max.toLocaleString()} per person`
                ) : (
                  `≈ ₱${estimatedBudgetPerPerson.max.toLocaleString()} per person`
                )
              ) : null
            ) : (
              "This is an estimate. Final total may change after saving."
            )}
          </Text>

          {generatedItinerary?.items?.some(
            (item) => !item.price && item.price_estimate
          ) && (
              <Text className="text-black/70 font-onest text-sm mt-2">
                Budget includes activities with estimated prices when exact prices
                aren’t available.
              </Text>
            )}

          <View className="flex-row justify-between items-center mt-6 pt-6 border-gray-100">
            <View className="items-center flex flex-row">
              <Ionicons name={"calendar-outline"} />
              <Text className="text-sm text-black/90 font-onest ml-2">
                {formatDate(generatedItinerary.start_date)} -{" "}
                {formatDate(generatedItinerary.end_date)}
              </Text>
            </View>
          </View>
        </View>

        {/* Horizontal Day Chips */}
        {dayChips.length > 0 && (
          <View className="pt-4">
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
                        ? "bg-blue-500"
                        : chip.isEmpty
                          ? "bg-yellow-50"
                          : "bg-gray-50"
                      }
                    `}
                  >
                    <Text
                      className={`
                        text-sm font-onest
                        ${isSelected
                          ? "text-white"
                          : chip.isEmpty
                            ? "text-yellow-600"
                            : "text-black/80"
                        }
                      `}
                    >
                      {chip.label}
                    </Text>
                    <Text
                      className={`
                        text-xs font-onest mt-0.5
                        ${isSelected
                          ? "text-white/80"
                          : chip.isEmpty
                            ? "text-yellow-500"
                            : "text-black/50"
                        }
                      `}
                    >
                      {chip.subLabel}
                    </Text>
                    {!isSelected && (
                      <Text
                        className={`
                          text-[10px] font-onest mt-1
                          ${chip.isEmpty ? "text-yellow-500" : "text-black/40"}
                        `}
                      >
                        {chip.itemCount}{" "}
                        {chip.itemCount === 1 ? "activity" : "activities"}
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
          <View className="flex-row items-center mb-4">
            <View className="flex-1">
              <Text className="font-onest-semibold text-lg text-black/90">
                Day {selectedDayChip}
              </Text>
              {selectedDayDate && (
                <Text className="text-black/70 font-onest">
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
                  travelerCount={travelerCount}
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

          {/* Places to eat (optional) - horizontal cards */}
          {includeFoodSuggestions && (
            <View className="mt-8">
              {/* Section Header */}
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <View className="">
                    <View className="flex-row items-center">
                      <Text className="font-onest-semibold text-xl text-black/90">
                        Places to eat
                      </Text>
                    </View>

                    <Text className="text-black/50 font-onest text-sm mt-0.5">
                      Suggestions near your trip
                    </Text>
                  </View>
                </View>

                {foodSuggestions.length > 0 && (
                  <Text className="text-black/40 font-onest text-xs">
                    Swipe →
                  </Text>
                )}
              </View>

              {/* Content */}
              {foodSuggestions.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="flex-row"
                  contentContainerStyle={{ paddingRight: 16 }}
                >
                  {foodSuggestions.slice(0, 12).map((place, idx) => {
                    const name =
                      place.experience_name || place.title || "Untitled";
                    const desc =
                      place.experience_description || place.description || "";
                    const priceText = formatPriceText(
                      place.price,
                      place.price_estimate,
                      place.unit,
                      travelerCount
                    );

                    const rawImg =
                      place.primary_image || place.images?.[0] || null;
                    const imageUri = resolveImageUri(rawImg);

                    const nearLabel =
                      place.near_experience_name ||
                      firstActivityNameForSelectedDay ||
                      "";

                    return (
                      <Pressable
                        key={`food-${place.experience_id}-${idx}`}
                        style={{ width: FOOD_CARD_WIDTH }}
                        className="mr-4 border border-gray-200 rounded-2xl bg-white overflow-hidden"
                        android_ripple={{ color: "rgba(0,0,0,0.05)" }}
                        onPress={() => {
                          // Navigate to experience details (adjust path to match your app route if needed)
                          router.push(`/experience/${place.experience_id}`);
                        }}
                      >
                        {/* Image / Placeholder */}
                        {imageUri ? (
                          <View className="h-48 bg-gray-100">
                            <Image
                              source={{ uri: imageUri }}
                              style={{ width: "100%", height: "100%" }}
                              resizeMode="cover"
                            />
                          </View>
                        ) : (
                          <View className="h-48 bg-gray-50 border-b border-gray-200 items-center justify-center">
                            <Ionicons
                              name="restaurant-outline"
                              size={20}
                              color="#9CA3AF"
                            />
                            <Text className="text-black/40 font-onest text-xs mt-1">
                              No photo
                            </Text>
                          </View>
                        )}

                        {/* Body */}
                        <View className="px-4 py-4">
                          <Text
                            className="font-onest-semibold text-black/90 text-lg"
                            numberOfLines={1}
                          >
                            {name}
                          </Text>

                          {!!nearLabel && (
                            <View className="mt-2">
                              <Text
                                className="text-black/60 font-onest text-sm"
                                numberOfLines={1}
                              >
                                Near{" "}
                                <Text className="font-onest-medium text-black/80">
                                  {nearLabel}
                                </Text>
                              </Text>
                            </View>
                          )}

                          {!!desc && (
                            <Text
                              className="text-black/70 font-onest text-sm mt-2"
                              numberOfLines={1}
                            >
                              {desc}
                            </Text>
                          )}

                          <View className="flex-row items-center mt-3">
                            <Text className="">Est.</Text>
                            <Text className="ml-1 text-black/70 font-onest text-sm">
                              {priceText}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : (
                <View className="py-10 items-center bg-gray-50 border border-gray-200 rounded-2xl">
                  <Ionicons
                    name="restaurant-outline"
                    size={26}
                    color="#9CA3AF"
                  />
                  <Text className="text-black/90 font-onest-medium mt-2">
                    No dining suggestions
                  </Text>
                  <Text className="text-black/50 font-onest text-sm mt-1 text-center px-6">
                    We couldn’t find suggested places to eat for this trip yet.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Underfilled Notice */}
        {showUnderfilledNotice && (
          <View className="mt-6">
            <UnderfilledNotice
              underfilledDays={underfilledDays}
              visible={showUnderfilledNotice}
            />
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

            {/* <TouchableOpacity
              onPress={generateItinerary}
              className="py-3 px-5 rounded-xl border border-gray-200 bg-gray-50"
              activeOpacity={0.7}
              disabled={saving}
            >
              <Text className="text-center font-onest-medium text-base text-black/70">
                Regenerate
              </Text>
            </TouchableOpacity> */}

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
