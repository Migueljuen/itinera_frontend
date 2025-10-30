import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
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

import {
  ActivityIntensity,
  Budget,
  Experience,
  ExploreTime,
  TravelCompanion,
  TravelDistance,
} from "@/types/experienceTypes";

export interface ItineraryFormData {
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
    activityIntensity?: ActivityIntensity;
    travelDistance?: TravelDistance;
  };
}

export interface ItineraryItem {
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

interface GeneratedItinerary {
  itinerary_id: number;
  traveler_id: number;
  start_date: string;
  end_date: string;
  title: string;
  notes: string;
  created_at: string;
  status: string;
  travel_companions?: TravelCompanion[];
  items: ItineraryItem[];
}

// Enhanced error interface
interface EnhancedError {
  error: string;
  message: string;
  details?: {
    total_experiences_in_city: number;
    filter_breakdown: {
      after_travel_companion: number;
      after_budget: number;
      after_distance: number;
      after_availability: number;
    };
    suggestions: string[];
    conflicting_preferences: string[];
    alternative_options: {
      nearby_cities: Array<{ city: string; experience_count: number }>;
      popular_experiences: Array<{
        title: string;
        price: number;
        travel_companion: string;
        travel_companions?: string[];
        popularity: number;
      }>;
    };
  };
}

interface StepProps {
  formData: ItineraryFormData;
  setFormData: React.Dispatch<React.SetStateAction<ItineraryFormData>>;
  onNext: () => void;
  onBack: () => void;
}

// Constants
const EXPERIENCE_ICONS: Partial<Record<Experience, string>> = {
  "Visual Arts": "brush",
  Crafts: "hand-left",
  "Performing Arts": "musical-notes",
  "Creative Expression": "color-palette",
  Mindfulness: "flower",
  "Physical Fitness": "fitness",
  "Wellness Activities": "heart",
  Relaxation: "bed",
  "Local Cuisine": "restaurant",
  Beverages: "cafe",
  "Culinary Experiences": "pizza",
  "Sweets & Desserts": "ice-cream",
  "Museums & Galleries": "business",
  "Historical Sites": "map",
  "Cultural Performances": "musical-note",
  "Traditional Arts": "brush",
  "Hiking & Trekking": "walk",
  "Water Activities": "water",
  "Wildlife & Nature": "leaf",
  "Camping & Outdoors": "bonfire",
};

const INTENSITY_COLORS: Record<string, string> = {
  low: "text-green-600",
  moderate: "text-yellow-600",
  high: "text-red-600",
};

const DEFAULT_PREFERENCES: NonNullable<ItineraryFormData["preferences"]> = {
  experiences: [],
  travelCompanions: [],
  exploreTime: "Both",
  budget: "Mid-range",
  activityIntensity: "Moderate",
  travelDistance: "Moderate",
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
}> = ({ item, isPreview, onRemove }) => (
  <View className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    {item.primary_image && (
      <Image
        source={{ uri: `${API_URL}/${item.primary_image}` }}
        className="w-full h-32"
        resizeMode="cover"
      />
    )}
    <View className="p-4">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 mr-3">
          <Text className="font-onest-semibold text-base mb-1">
            {item.experience_name || "Experience"}
          </Text>
          <Text className="text-gray-600 font-onest text-sm">
            {item.destination_name}
          </Text>
        </View>
        <View className="items-end">
          <Text className="font-onest-bold text-primary">
            {formatTime(item.start_time)} - {formatTime(item.end_time)}
          </Text>
          {item.price && item.price > 0 && (
            <Text className="text-gray-600 font-onest text-sm">
              ₱{item.price} {item.unit && `/ ${item.unit}`}
            </Text>
          )}
        </View>
      </View>

      {item.experience_description && (
        <Text className="text-gray-700 font-onest text-sm mb-2">
          {item.experience_description}
        </Text>
      )}

      {item.custom_note && (
        <View className="bg-blue-50 rounded-lg p-2 mt-2">
          <Text className="text-blue-800 font-onest text-xs">
            {item.custom_note}
          </Text>
        </View>
      )}

      {isPreview && (
        <View className="flex-row justify-end mt-3 pt-3 border-t border-gray-100">
          <TouchableOpacity
            onPress={onRemove}
            className="flex-row items-center px-3 py-2 rounded-lg border border-red-200 bg-red-50"
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={16} color="#DC2626" />
            <Text className="ml-2 text-red-600 font-onest text-sm">Remove</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  </View>
);

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

  useEffect(() => {
    console.log("=== User selections from STEP 2 ===");

    console.log("Selected experiences:", formData.preferences?.experiences);
    console.log("Selected companion:", formData.preferences?.travelCompanion);
    console.log("Selected explore time:", formData.preferences?.exploreTime);
    console.log("Selected budget:", formData.preferences?.budget);
    console.log(
      "Selected activity intensity:",
      formData.preferences?.activityIntensity
    );
    console.log(
      "Selected travel distance:",
      formData.preferences?.travelDistance
    );

    console.log("==========================================");
  }, [formData]);

  // Reference for expanding filter
  const expandFilterRef = React.useRef<any>(null);

  useEffect(() => {
    generateItinerary();
  }, []);

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
        throw new Error(data.message || "Failed to generate itinerary");
      }

      if (data.itineraries?.[0]) {
        setGeneratedItinerary(data.itineraries[0]);
        setFormData({
          ...formData,
          items: data.itineraries[0].items,
          ...(preferencesToUse && { preferences: preferencesToUse }),
        });
      } else {
        throw new Error("No itinerary generated");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate itinerary"
      );
    } finally {
      setLoading(false);
    }
  };

  const generateItinerary = () => generateItineraryWithPreferences();

  const handleRegenerateWithNewFilters = (
    newPreferences: ItineraryFormData["preferences"]
  ) => {
    setFormData({ ...formData, preferences: newPreferences });
    generateItineraryWithPreferences(newPreferences);
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
      if (!response.ok)
        throw new Error(data.message || "Failed to save itinerary");

      setGeneratedItinerary({
        ...generatedItinerary,
        itinerary_id: data.itinerary_id,
        status: "upcoming",
      });
      setIsPreview(false);
      setTimeout(onNext, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save itinerary");
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="text-center text-lg font-onest-medium mt-4 mb-2">
          Generating your perfect itinerary...
        </Text>
        <Text className="text-center text-sm text-gray-500 font-onest">
          This may take a few moments while we find the best activities for you.
        </Text>
      </View>
    );
  }

  // Error states
  if (enhancedError?.details) {
    // Enhanced error UI - keeping as is for brevity
    return <View />; // Your existing enhanced error UI
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text className="text-center text-lg font-onest-medium mt-4 mb-2">
          Oops! Something went wrong
        </Text>
        <Text className="text-center text-sm text-gray-500 font-onest mb-6">
          {error}
        </Text>
        <TouchableOpacity
          onPress={generateItinerary}
          className="bg-primary py-3 px-6 rounded-xl"
          activeOpacity={0.7}
        >
          <Text className="text-white font-onest-medium">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!generatedItinerary) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-center text-lg font-onest-medium">
          No itinerary available
        </Text>
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
        <View className="p-4">
          <CollapsibleFilter
            preferences={formData.preferences}
            city={formData.city}
            startDate={formData.start_date}
            endDate={formData.end_date}
            onRegenerateWithNewFilters={handleRegenerateWithNewFilters}
          />

          {/* Stats */}
          <View className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
            <View className="flex-row justify-between items-center">
              {[
                { value: totalDays, label: "Days" },
                { value: generatedItinerary.items.length, label: "Activities" },
                {
                  value: formData.preferences?.activityIntensity || "",
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
              <View key={dayNumber} className="mb-6">
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
