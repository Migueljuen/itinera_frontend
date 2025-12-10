// CollapsibleFilter.tsx

import {
  ActivityIntensity,
  Budget,
  Experience,
  ExploreTime,
  TravelCompanion,
  TravelDistance,
} from "@/types/experienceTypes";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";

interface ItineraryFormData {
  traveler_id: number;
  start_date: string;
  end_date: string;
  title: string;
  notes?: string;
  city: string;
  items: any[];
  preferences?: {
    experiences: Experience[];
    travelerCount: number;
    travelCompanion?: TravelCompanion;
    travelCompanions?: TravelCompanion[];
    exploreTime?: ExploreTime;
    budget?: Budget;
    activityIntensity?: ActivityIntensity;
    travelDistance?: TravelDistance;
  };
}

const ALL_EXPERIENCE_OPTIONS: readonly Experience[] = [
  "Visual Arts",
  "Crafts",
  "Performing Arts",
  "Creative Expression",
  "Mindfulness",
  "Physical Fitness",
  "Wellness Activities",
  "Relaxation",
  "Local Cuisine",
  "Beverages",
  "Culinary Experiences",
  "Sweets & Desserts",
  "Museums & Galleries",
  "Historical Sites",
  "Cultural Performances",
  "Traditional Arts",
  "Hiking & Trekking",
  "Water Activities",
  "Wildlife & Nature",
  "Camping & Outdoors",
] as const;

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

const DEFAULT_PREFERENCES: NonNullable<ItineraryFormData["preferences"]> = {
  experiences: [],
  travelCompanions: [],
  travelerCount: 1,
  exploreTime: "Both",
  budget: "Mid-range",
  activityIntensity: "Moderate",
  travelDistance: "Moderate",
};
interface CollapsibleFilterProps {
  preferences: ItineraryFormData["preferences"];
  city: string;
  startDate: string;
  endDate: string;
  onRegenerateWithNewFilters: (
    newPreferences: ItineraryFormData["preferences"]
  ) => void;
  expandFilter?: () => void;
}

const PreferenceButton: React.FC<{
  label: string;
  isSelected: boolean;
  onPress: () => void;
  icon?: string;
}> = React.memo(({ label, isSelected, onPress, icon }) => (
  <Pressable
    onPress={(e) => {
      e.stopPropagation();
      onPress();
    }}
    className={`px-6 py-2 rounded-lg mr-2 mb-2 border ${
      isSelected ? "bg-indigo-50 border-gray-300" : "bg-white border-gray-300"
    }`}
  >
    <View className="flex-row items-center">
      <Text
        className={`${icon ? "ml-1" : ""} text-sm font-onest ${
          isSelected ? "text-black/80" : "text-black/60"
        }`}
      >
        {label}
      </Text>
    </View>
  </Pressable>
));

export const CollapsibleFilter: React.FC<CollapsibleFilterProps> = ({
  preferences,
  city,
  startDate,
  endDate,
  onRegenerateWithNewFilters,
  expandFilter,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [maxHeight] = useState(new Animated.Value(0));
  const lastPreferencesRef = useRef<string>("");
  const isAnimatingRef = useRef(false);

  const normalizePreferences = useCallback(
    (prefs: ItineraryFormData["preferences"]) => {
      if (!prefs) return DEFAULT_PREFERENCES;

      return {
        ...DEFAULT_PREFERENCES,
        ...prefs,
        travelerCount: prefs.travelerCount || DEFAULT_PREFERENCES.travelerCount, // ✅ Preserve travelerCount
        travelCompanions: prefs.travelCompanions?.length
          ? prefs.travelCompanions
          : prefs.travelCompanion
          ? [prefs.travelCompanion]
          : DEFAULT_PREFERENCES.travelCompanions,
      };
    },
    []
  );

  const [displayPreferences, setDisplayPreferences] = useState<
    ItineraryFormData["preferences"]
  >(() => normalizePreferences(preferences));

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Only update when preferences actually change AND there are no unsaved changes
  useEffect(() => {
    const currentPrefsString = JSON.stringify(preferences);

    if (
      currentPrefsString !== lastPreferencesRef.current &&
      !hasUnsavedChanges
    ) {
      lastPreferencesRef.current = currentPrefsString;
      setDisplayPreferences(normalizePreferences(preferences));
    }
  }, [preferences, hasUnsavedChanges, normalizePreferences]);

  // Sync animation with expanded state
  useEffect(() => {
    Animated.timing(maxHeight, {
      toValue: isExpanded ? 2000 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded, maxHeight]);

  // Expose expand function
  useEffect(() => {
    if (expandFilter) {
      (expandFilter as any).expand = () => {
        setIsExpanded(true);
      };
    }
  }, [expandFilter]);

  const toggleExpanded = () => {
    console.log("Toggling from", isExpanded, "to", !isExpanded);
    setIsExpanded((prev) => !prev);
  };

  const updatePreference = useCallback(
    <K extends keyof NonNullable<ItineraryFormData["preferences"]>>(
      key: K,
      value: NonNullable<ItineraryFormData["preferences"]>[K]
    ) => {
      if (!displayPreferences) return;

      const newPreferences = {
        ...displayPreferences,
        [key]: value,
      } as NonNullable<ItineraryFormData["preferences"]>;

      setDisplayPreferences(newPreferences);

      const originalNormalized = normalizePreferences(preferences);
      setHasUnsavedChanges(
        JSON.stringify(newPreferences) !== JSON.stringify(originalNormalized)
      );
    },
    [displayPreferences, preferences, normalizePreferences]
  );

  const handleApplyChanges = useCallback(() => {
    setHasUnsavedChanges(false);
    lastPreferencesRef.current = JSON.stringify(displayPreferences);

    const preferencesToSend: ItineraryFormData["preferences"] = {
      experiences: displayPreferences?.experiences || [],
      travelerCount:
        displayPreferences?.travelerCount || preferences?.travelerCount || 1,
      travelCompanion: displayPreferences?.travelCompanion,
      travelCompanions: displayPreferences?.travelCompanions,
      exploreTime: displayPreferences?.exploreTime,
      budget: displayPreferences?.budget,
      activityIntensity: displayPreferences?.activityIntensity,
      travelDistance: displayPreferences?.travelDistance,
    };

    onRegenerateWithNewFilters(preferencesToSend);
  }, [displayPreferences, preferences, onRegenerateWithNewFilters]);
  const renderPreferenceSection = useCallback(
    (
      title: string,
      options: readonly string[],
      value: any,
      onUpdate: (val: any) => void,
      multiSelect = false,
      icons?: Record<string, string>
    ) => (
      <View className="mt-4">
        <Text className="font-onest-medium text-sm text-gray-700 mb-2">
          {title}
        </Text>
        <View className="flex-row flex-wrap">
          {options.map((option) => {
            const isSelected = multiSelect
              ? (value as string[])?.includes(option)
              : value === option;

            return (
              <PreferenceButton
                key={option}
                label={option}
                isSelected={isSelected}
                icon={icons?.[option]}
                onPress={() => {
                  if (multiSelect) {
                    const currentValues = (value as string[]) || [];
                    const newValues = isSelected
                      ? currentValues.filter((v) => v !== option)
                      : [...currentValues, option];
                    onUpdate(newValues);
                  } else {
                    onUpdate(option);
                  }
                }}
              />
            );
          })}
        </View>
      </View>
    ),
    []
  );

  return (
    <View className="mb-4">
      <Pressable
        onPress={toggleExpanded}
        className="bg-white rounded-xl border border-gray-200 p-4"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <Ionicons name="options-outline" size={20} color="#4F46E5" />
            <Text className="ml-2 font-onest-semibold text-base text-gray-900">
              Trip Preferences
            </Text>
            {hasUnsavedChanges && (
              <View className="ml-2 bg-orange-100 px-2 py-1 rounded">
                <Text className="text-xs font-onest text-orange-600">
                  Modified
                </Text>
              </View>
            )}
          </View>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#6B7280"
          />
        </View>
      </Pressable>

      {isExpanded && (
        <View className="bg-white rounded-xl border border-gray-200 border-t-0 rounded-t-none px-4 pb-4">
          {renderPreferenceSection(
            "Experience Types",
            ALL_EXPERIENCE_OPTIONS,
            displayPreferences?.experiences,
            (val) => updatePreference("experiences", val),
            true,
            EXPERIENCE_ICONS
          )}

          {renderPreferenceSection(
            "Travel Companions",
            ["Solo", "Partner", "Friends", "Family", "Any"] as const,
            displayPreferences?.travelCompanions,
            (val) => updatePreference("travelCompanions", val),
            true
          )}

          {renderPreferenceSection(
            "Explore Time",
            ["Daytime", "Nighttime", "Both"] as const,
            displayPreferences?.exploreTime,
            (val) => updatePreference("exploreTime", val)
          )}

          {renderPreferenceSection(
            "Budget",
            ["Free", "Budget-friendly", "Mid-range", "Premium"] as const,
            displayPreferences?.budget,
            (val) => updatePreference("budget", val)
          )}

          {renderPreferenceSection(
            "Activity Intensity",
            ["Low", "Moderate", "High"] as const,
            displayPreferences?.activityIntensity,
            (val) => updatePreference("activityIntensity", val)
          )}

          {renderPreferenceSection(
            "Travel Distance",
            ["Nearby", "Moderate", "Far"] as const,
            displayPreferences?.travelDistance,
            (val) => updatePreference("travelDistance", val)
          )}

          {hasUnsavedChanges && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleApplyChanges();
              }}
              className="mt-4 bg-primary py-3 rounded-xl"
            >
              <Text className="text-center font-onest-semibold text-white">
                Apply Changes & Regenerate
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};

export default CollapsibleFilter;
