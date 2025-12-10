import {
  GeneratedItinerary,
  ItineraryFormData,
  ItineraryItem,
} from "@/types/itineraryTypes";
import { EnhancedError } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import API_URL from "../../../../constants/api";
import { CollapsibleFilter } from "./components/CollapsibleFilter";
import { EnhancedErrorDisplay } from "./components/EnhancedErrorDisplay";

interface StepProps {
  formData: ItineraryFormData;
  setFormData: React.Dispatch<React.SetStateAction<ItineraryFormData>>;
  onNext: (itineraryId: number) => void; // Changed: now accepts itinerary ID
  onBack: () => void;
}

const INTENSITY_COLORS: Record<string, string> = {
  low: "text-green-600",
  moderate: "text-teal-600",
  high: "text-blue-600",
};

// Utility functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (timeString: string) => {
  const [hours, minutes] = timeString.split(":");
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const groupItemsByDay = (items: ItineraryItem[]) => {
  return items.reduce((acc, item) => {
    if (!acc[item.day_number]) acc[item.day_number] = [];
    acc[item.day_number].push(item);
    return acc;
  }, {} as { [key: number]: ItineraryItem[] });
};

// Preference Option Button Component
const PreferenceButton: React.FC<{
  label: string;
  isSelected: boolean;
  onPress: () => void;
  icon?: string;
}> = ({ label, isSelected, onPress, icon }) => (
  <TouchableOpacity
    onPress={onPress}
    className={`px-3 py-2 rounded-lg mr-2 mb-2 border ${
      isSelected ? "bg-primary border-primary" : "bg-white border-gray-300"
    }`}
    activeOpacity={0.7}
  >
    <View className="flex-row items-center">
      {icon && (
        <Ionicons
          name={icon as any}
          size={16}
          color={isSelected ? "#FFFFFF" : "#6B7280"}
        />
      )}
      <Text
        className={`${icon ? "ml-1" : ""} text-sm font-onest ${
          isSelected ? "text-white" : "text-gray-700"
        }`}
      >
        {label}
      </Text>
    </View>
  </TouchableOpacity>
);

// Experience Card Component
const ExperienceCard: React.FC<{
  item: ItineraryItem;
  isPreview: boolean;
  onRemove: () => void;
  travelerCount?: number;
}> = ({ item, isPreview, onRemove, travelerCount = 1 }) => {
  const isPricedPerPerson =
    item.unit?.toLowerCase() === "entry" ||
    item.unit?.toLowerCase() === "person";

  const displayPrice =
    isPricedPerPerson && travelerCount > 1
      ? (item.price || 0) * travelerCount
      : item.price || 0;

  return (
    <View
      className="bg-[#fff] rounded-2xl  "
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 2, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 5,
      }}
    >
      {/* Image with overlay text or fallback */}
      <View className="relative h-72 overflow-hidden ">
        {item.primary_image ? (
          <Image
            source={{ uri: `${API_URL}/${item.primary_image}` }}
            className="w-full h-72 absolute rounded-2xl"
            resizeMode="cover"
          />
        ) : (
          // Fallback when no image
          <View className="w-full h-72 bg-gradient-to-br from-indigo-100 to-indigo-200 items-center justify-center absolute">
            <Ionicons name="image-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-400 font-onest text-sm mt-2">
              No image available
            </Text>
          </View>
        )}
        {/* Gradient overlay for better text readability */}
        <LinearGradient
          colors={[
            "rgba(0, 0, 0, 0.0)",
            "rgba(0, 0, 0, 0.3)",
            "rgba(0, 0, 0, 0.7)",
          ]}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          pointerEvents="none"
        />
        <View className="absolute bottom-0 left-0 right-0 p-4 ">
          <Text className="font-onest-semibold text-lg text-[#fff]/90 mb-1">
            {item.experience_name || "Not Available"}
          </Text>
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={14} color="#fff" />
            <Text className="text-[#fff]/90 font-onest text-sm ml-1">
              {item.destination_name}
            </Text>
          </View>
        </View>
        {isPreview && (
          <View className="absolute top-4 right-4 flex-row justify-end  ">
            <TouchableOpacity
              onPress={onRemove}
              className="flex-row items-center  p-1.5 rounded-full  bg-[#fff]/80"
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color="#1a1a1a" />

              {/* <Text className=" text-black/90 font-onest-medium text-xs">
                Remove
              </Text> */}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View className="p-4 pb-6">
        <View className="flex-row justify-between items-baseline my-2">
          <View className="flex-1 ">
            <Text className="font-onest-bold text-black/80">
              {formatTime(item.start_time)} - {formatTime(item.end_time)}
            </Text>
          </View>
          <View className="items-end ">
            {item.price && item.price > 0 && (
              <View className="items-end">
                <Text className="font-onest-bold text-gray-900">
                  ₱{displayPrice.toLocaleString()}
                </Text>
                {isPricedPerPerson && travelerCount > 1 ? (
                  <Text className="text-gray-500 font-onest text-xs">
                    ₱{(item.price || 0).toLocaleString()} × {travelerCount}{" "}
                    {travelerCount > 1 ? "people" : "person"}
                  </Text>
                ) : (
                  item.unit && (
                    <Text className="text-black/40 font-onest text-xs">
                      {item.unit}
                    </Text>
                  )
                )}
              </View>
            )}
          </View>
        </View>

        {item.experience_description && (
          <Text
            numberOfLines={2}
            className="text-black/60 font-onest text-sm mb-2"
          >
            {item.experience_description}
          </Text>
        )}

        {item.experience_notes && (
          <View className="bg-blue-50 rounded-lg p-2 mt-2">
            <Text className="text-blue-800 font-onest text-xs">
              {item.experience_notes}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
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

  // useEffect(() => {
  //   console.log("=== User selections from STEP 2 ===");
  //   console.log("Selected experiences:", formData.preferences?.experiences);
  //   console.log("Selected companion:", formData.preferences?.travelCompanion);
  //   console.log("Selected explore time:", formData.preferences?.exploreTime);
  //   console.log("Selected budget:", formData.preferences?.budget);
  //   console.log(
  //     "Selected activity intensity:",
  //     formData.preferences?.activityIntensity
  //   );
  //   console.log(
  //     "Selected travel distance:",
  //     formData.preferences?.travelDistance
  //   );
  //   console.log("==========================================");
  // }, [formData]);

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

  const generateItineraryWithPreferences = async (
    preferencesToUse?: ItineraryFormData["preferences"]
  ) => {
    const currentPreferences = preferencesToUse || formData.preferences;

    setLoading(true);
    setError(null);
    setEnhancedError(null);

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

      // Handle travel companions
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
        // Handle enhanced error with detailed breakdown
        if (data.error === "no_experiences_found" && data.details) {
          console.log("📊 Enhanced error received:", data);
          setEnhancedError(data);
          return;
        }

        // Handle other API errors
        throw new Error(
          data.message || data.error || "Failed to generate itinerary"
        );
      }

      // Validate response structure
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

        // Validate itinerary has items
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
        setRetryCount(0); // Reset retry count on success
      } else {
        throw new Error("No itinerary data in response");
      }
    } catch (err) {
      console.error("❌ Error generating itinerary:", err);

      // Handle network errors
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to generate itinerary"
        );
      }

      setRetryCount((prev) => prev + 1);
    } finally {
      setLoading(false);
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
    // Go back to step 2 to modify preferences
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

              // Check if removing this item leaves us with no items
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

  const saveItinerary = async () => {
    if (!generatedItinerary || saving) return;

    // Validate we have items to save
    if (!generatedItinerary.items || generatedItinerary.items.length === 0) {
      Alert.alert(
        "Cannot Save",
        "Your itinerary has no activities. Please regenerate or go back to adjust your preferences.",
        [{ text: "OK" }]
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/itinerary/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          traveler_id: generatedItinerary.traveler_id,
          start_date: generatedItinerary.start_date,
          end_date: generatedItinerary.end_date,
          title: generatedItinerary.title,
          notes: generatedItinerary.notes,
          items: generatedItinerary.items,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Failed to save itinerary"
        );
      }

      if (!data.itinerary_id) {
        throw new Error("No itinerary ID returned from server");
      }

      console.log("✅ Itinerary saved successfully:", data.itinerary_id);

      setGeneratedItinerary(data.itinerary);
      setIsPreview(false);

      // Pass the itinerary ID to the parent component
      setTimeout(() => onNext(data.itinerary_id), 500);
    } catch (err) {
      console.error("❌ Error saving itinerary:", err);

      Alert.alert(
        "Save Failed",
        err instanceof Error
          ? err.message
          : "Failed to save itinerary. Please try again.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Retry", onPress: saveItinerary },
        ]
      );

      setError(err instanceof Error ? err.message : "Failed to save itinerary");
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center p-4 bg-gray-50">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="text-center text-lg font-onest-medium mt-4 mb-2">
          Generating your perfect itinerary...
        </Text>
        <Text className="text-center text-sm text-gray-500 font-onest px-6">
          This may take a few moments while we find the best activities for you.
        </Text>
        {retryCount > 0 && (
          <Text className="text-center text-xs text-gray-400 font-onest mt-2">
            Attempt {retryCount + 1}
          </Text>
        )}
      </View>
    );
  }

  // Enhanced error state with detailed breakdown
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

  // Simple error state
  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-6 bg-gray-50">
        <View className="bg-white rounded-xl p-6 w-full max-w-md border border-gray-200">
          <View className="items-center mb-4">
            <View className="bg-red-100 rounded-full p-4 mb-3">
              <Ionicons name="alert-circle" size={32} color="#EF4444" />
            </View>
            <Text className="text-center text-lg font-onest-semibold text-gray-900 mb-2">
              Oops! Something went wrong
            </Text>
            <Text className="text-center text-sm text-gray-600 font-onest">
              {error}
            </Text>
          </View>

          {retryCount >= 2 && (
            <View className="bg-yellow-50 rounded-lg p-3 mb-4">
              <Text className="text-xs text-yellow-800 font-onest text-center">
                Multiple attempts failed. Try adjusting your preferences.
              </Text>
            </View>
          )}

          <View className="space-y-3">
            <TouchableOpacity
              onPress={handleRetry}
              className="bg-primary py-3 px-6 rounded-xl"
              activeOpacity={0.7}
            >
              <Text className="text-white font-onest-medium text-center">
                Try Again
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleModifyPreferences}
              className="bg-white border border-gray-300 py-3 px-6 rounded-xl"
              activeOpacity={0.7}
            >
              <Text className="text-gray-700 font-onest-medium text-center">
                Modify Preferences
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onBack}
              className="py-2"
              activeOpacity={0.7}
            >
              <Text className="text-gray-500 font-onest text-sm text-center">
                Go Back
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // No itinerary generated state
  if (!generatedItinerary) {
    return (
      <View className="flex-1 justify-center items-center p-4 bg-gray-50">
        <View className="bg-white rounded-xl p-6 border border-gray-200">
          <View className="items-center mb-4">
            <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
            <Text className="text-center text-lg font-onest-medium mt-3">
              No itinerary available
            </Text>
            <Text className="text-center text-sm text-gray-500 font-onest mt-2">
              Unable to generate an itinerary with current settings
            </Text>
          </View>
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

  const groupedItems = groupItemsByDay(generatedItinerary.items);
  const totalDays = Object.keys(groupedItems).length;

  return (
    <View className="flex-1 bg-gray-50">
      {isPreview && (
        <View className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <View className="flex-row items-center justify-center">
            <Ionicons name="eye-outline" size={16} color="#3B82F6" />
            <Text className="ml-2 text-sm text-blue-700 font-onest-medium">
              Preview Mode - You can remove activities you don't want
            </Text>
          </View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="px-2 py-4">
          {/* Total Cost Card */}
          <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-1">
                <Text className="text-gray-700 font-onest-medium text-sm mb-1">
                  Estimated Total Cost
                </Text>
                <Text className="text-2xl font-onest-bold text-primary">
                  ₱{totalCost.toLocaleString()}
                </Text>
              </View>
              {formData.preferences?.travelerCount &&
                formData.preferences.travelerCount > 1 && (
                  <View className="bg-indigo-50 rounded-lg px-3 py-2">
                    <Text className="text-indigo-700 font-onest-semibold text-xs">
                      {formData.preferences.travelerCount} people
                    </Text>
                  </View>
                )}
            </View>
            <Text className="text-gray-500 font-onest text-xs mt-1">
              {formData.preferences?.travelerCount &&
              formData.preferences.travelerCount > 1
                ? `≈ ₱${perPersonCost.toLocaleString()} per person • This is an estimate`
                : "This is an estimate. Final total will be calculated after saving."}
            </Text>
          </View>

          {/* Collapsible Filter */}
          <CollapsibleFilter
            preferences={formData.preferences}
            city={formData.city}
            startDate={formData.start_date}
            endDate={formData.end_date}
            onRegenerateWithNewFilters={handleRegenerateWithNewFilters}
          />

          {/* Stats */}
          <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
            <View className="flex-row justify-between items-center">
              {[
                { value: totalDays, label: "Days" },
                { value: generatedItinerary.items.length, label: "Activities" },
                {
                  value: formData.preferences?.activityIntensity || "N/A",
                  label: "Intensity",
                  className: `text-sm font-onest-medium capitalize ${
                    INTENSITY_COLORS[
                      formData.preferences?.activityIntensity?.toLowerCase() ||
                        ""
                    ] || "text-gray-600"
                  }`,
                },
              ].map((stat, index) => (
                <View key={index} className="items-center">
                  <Text
                    className={
                      stat.className || "text-2xl font-onest-bold text-primary"
                    }
                  >
                    {stat.value}
                  </Text>
                  <Text className="text-xs text-gray-600 font-onest">
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Itinerary Days */}
          {Object.entries(groupedItems).map(([dayNumber, dayItems]) => {
            const dayDate = new Date(generatedItinerary.start_date);
            dayDate.setDate(dayDate.getDate() + parseInt(dayNumber) - 1);

            return (
              <View key={dayNumber} className="my-6">
                {/* Day Header */}
                <View className="flex-row items-center mb-3">
                  <View className="bg-primary rounded-full w-8 h-8 items-center justify-center mr-3">
                    <Text className="text-white font-onest-bold text-sm">
                      {dayNumber}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-onest-semibold text-lg">
                      Day {dayNumber}
                    </Text>
                    <Text className="text-gray-600 font-onest text-sm">
                      {formatDate(dayDate.toISOString())}
                    </Text>
                  </View>
                  <Text className="text-gray-500 font-onest text-xs">
                    {dayItems.length}{" "}
                    {dayItems.length !== 1 ? "activities" : "activity"}
                  </Text>
                </View>

                {/* Day Items */}
                {dayItems.length > 0 ? (
                  dayItems.map((item, index) => (
                    <View key={`${dayNumber}-${index}`} className="mb-4">
                      <ExperienceCard
                        item={item}
                        isPreview={isPreview}
                        onRemove={() => removeItem(item)}
                        travelerCount={formData.preferences?.travelerCount || 1}
                      />
                    </View>
                  ))
                ) : (
                  <View className="bg-gray-50 rounded-xl p-6 items-center">
                    <Ionicons
                      name="calendar-outline"
                      size={32}
                      color="#9CA3AF"
                    />
                    <Text className="text-gray-500 font-onest text-sm mt-2">
                      No activities scheduled for this day
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View className="px-4 bg-white border-t border-gray-200">
        {isPreview ? (
          <View className="flex-row justify-between py-4">
            <TouchableOpacity
              onPress={onBack}
              className="py-3 px-5 rounded-xl border border-gray-300"
              activeOpacity={0.7}
              disabled={saving}
            >
              <Text className="text-center font-onest-medium text-base text-gray-700">
                Back
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={generateItinerary}
              className="py-3 px-5 rounded-xl border border-primary"
              activeOpacity={0.7}
              disabled={saving}
            >
              <Text className="text-center font-onest-medium text-base text-primary">
                Regenerate
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={saveItinerary}
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
            <Text className="text-sm text-gray-500 font-onest text-center">
              Proceeding to next step...
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default Step3GeneratedItinerary;
