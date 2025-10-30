// CollapsibleFilter.tsx - Updated Types and Experience Categories

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// Updated Types to match Step2Preference
type Experience =
    | "Visual Arts"
    | "Crafts"
    | "Performing Arts"
    | "Creative Expression"
    | "Mindfulness"
    | "Physical Fitness"
    | "Wellness Activities"
    | "Relaxation"
    | "Local Cuisine"
    | "Beverages"
    | "Culinary Experiences"
    | "Sweets & Desserts"
    | "Museums & Galleries"
    | "Historical Sites"
    | "Cultural Performances"
    | "Traditional Arts"
    | "Hiking & Trekking"
    | "Water Activities"
    | "Wildlife & Nature"
    | "Camping & Outdoors";

type TravelCompanion = 'Solo' | 'Partner' | 'Friends' | 'Family' | 'Any';
type ExploreTime = 'Daytime' | 'Nighttime' | 'Both';
type Budget = 'Free' | 'Budget-friendly' | 'Mid-range' | 'Premium';
type ActivityIntensity = 'Low' | 'Moderate' | 'High';
type TravelDistance = 'Nearby' | 'Moderate' | 'Far';

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
        travelCompanion?: TravelCompanion;
        travelCompanions?: TravelCompanion[];
        exploreTime?: ExploreTime;
        budget?: Budget;
        activityIntensity?: ActivityIntensity;
        travelDistance?: TravelDistance;
    };
}

// Updated experience options array
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
    "Camping & Outdoors"
] as const;

// Updated experience icons to match new categories
const EXPERIENCE_ICONS: Partial<Record<Experience, string>> = {
    'Visual Arts': 'brush',
    'Crafts': 'hand-left',
    'Performing Arts': 'musical-notes',
    'Creative Expression': 'color-palette',
    'Mindfulness': 'flower',
    'Physical Fitness': 'fitness',
    'Wellness Activities': 'heart',
    'Relaxation': 'bed',
    'Local Cuisine': 'restaurant',
    'Beverages': 'cafe',
    'Culinary Experiences': 'pizza',
    'Sweets & Desserts': 'ice-cream',
    'Museums & Galleries': 'business',
    'Historical Sites': 'map',
    'Cultural Performances': 'musical-note',
    'Traditional Arts': 'brush',
    'Hiking & Trekking': 'walk',
    'Water Activities': 'water',
    'Wildlife & Nature': 'leaf',
    'Camping & Outdoors': 'bonfire'
};

const DEFAULT_PREFERENCES: NonNullable<ItineraryFormData['preferences']> = {
    experiences: [],
    travelCompanions: [],
    exploreTime: 'Both',
    budget: 'Mid-range',
    activityIntensity: 'Moderate',
    travelDistance: 'Moderate'
};

// Props interface
interface CollapsibleFilterProps {
    preferences: ItineraryFormData['preferences'];
    city: string;
    startDate: string;
    endDate: string;
    onRegenerateWithNewFilters: (newPreferences: ItineraryFormData['preferences']) => void;
    expandFilter?: () => void;
}

// Preference Button Component (unchanged)
const PreferenceButton: React.FC<{
    label: string;
    isSelected: boolean;
    onPress: () => void;
    icon?: string;
}> = ({ label, isSelected, onPress, icon }) => (
    <TouchableOpacity
        onPress={onPress}
        className={`px-6 py-2 rounded-lg mr-2 mb-2 border ${isSelected ? 'bg-indigo-50 border-gray-300' : 'bg-white border-gray-300'
            }`}
        activeOpacity={0.7}
    >
        <View className="flex-row items-center">
            <Text className={`${icon ? 'ml-1' : ''} text-sm font-onest ${isSelected ? 'text-black/80' : 'text-black/60'
                }`}>
                {label}
            </Text>
        </View>
    </TouchableOpacity>
);

// Main CollapsibleFilter Component
export const CollapsibleFilter: React.FC<CollapsibleFilterProps> = ({
    preferences,
    city,
    startDate,
    endDate,
    onRegenerateWithNewFilters,
    expandFilter
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [maxHeight] = useState(new Animated.Value(0));

    // Initialize displayPreferences with proper defaults and handle both travelCompanion formats
    const [displayPreferences, setDisplayPreferences] = useState<ItineraryFormData['preferences']>(() => {
        if (!preferences) return DEFAULT_PREFERENCES;

        const normalizedPreferences = {
            ...DEFAULT_PREFERENCES,
            ...preferences,
            travelCompanions: preferences.travelCompanions?.length
                ? preferences.travelCompanions
                : preferences.travelCompanion
                    ? [preferences.travelCompanion]
                    : DEFAULT_PREFERENCES.travelCompanions
        };

        return normalizedPreferences;
    });

    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Update displayPreferences when preferences prop changes
    useEffect(() => {
        if (!hasUnsavedChanges && preferences) {
            const normalizedPreferences = {
                ...DEFAULT_PREFERENCES,
                ...preferences,
                travelCompanions: preferences.travelCompanions?.length
                    ? preferences.travelCompanions
                    : preferences.travelCompanion
                        ? [preferences.travelCompanion]
                        : DEFAULT_PREFERENCES.travelCompanions
            };

            setDisplayPreferences(normalizedPreferences);
        }
    }, [preferences, hasUnsavedChanges]);

    // Expose expand function
    useEffect(() => {
        if (expandFilter) {
            (expandFilter as any).expand = () => {
                setIsExpanded(true);
                Animated.timing(maxHeight, {
                    toValue: 2000, // Increased for more content
                    duration: 300,
                    useNativeDriver: false,
                }).start();
            };
        }
    }, [expandFilter, maxHeight]);

    const toggleExpanded = () => {
        Animated.timing(maxHeight, {
            toValue: isExpanded ? 0 : 2000, // Increased for more content
            duration: 300,
            useNativeDriver: false,
        }).start();
        setIsExpanded(!isExpanded);
    };

    const updatePreference = <K extends keyof NonNullable<ItineraryFormData['preferences']>>(
        key: K,
        value: NonNullable<ItineraryFormData['preferences']>[K]
    ) => {
        if (!displayPreferences) return;

        const newPreferences = { ...displayPreferences, [key]: value } as NonNullable<ItineraryFormData['preferences']>;
        setDisplayPreferences(newPreferences);

        const originalNormalized = preferences ? {
            ...DEFAULT_PREFERENCES,
            ...preferences,
            travelCompanions: preferences.travelCompanions?.length
                ? preferences.travelCompanions
                : preferences.travelCompanion
                    ? [preferences.travelCompanion]
                    : DEFAULT_PREFERENCES.travelCompanions
        } : DEFAULT_PREFERENCES;

        setHasUnsavedChanges(JSON.stringify(newPreferences) !== JSON.stringify(originalNormalized));
    };

    const handleApplyChanges = () => {
        setHasUnsavedChanges(false);
        onRegenerateWithNewFilters(displayPreferences);
    };

    const renderPreferenceSection = (
        title: string,
        options: readonly string[],
        value: any,
        onUpdate: (val: any) => void,
        multiSelect = false,
        icons?: Record<string, string>
    ) => (
        <View className="mt-4">
            <Text className="font-onest-medium text-sm text-gray-700 mb-2">{title}</Text>
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
                                        ? currentValues.filter(v => v !== option)
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
    );

    return (
        <View className="mb-4">
            <TouchableOpacity
                onPress={toggleExpanded}
                className="bg-white rounded-xl border border-gray-200 p-4"
                activeOpacity={0.7}
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                        <Ionicons name="options-outline" size={20} color="#4F46E5" />
                        <Text className="ml-2 font-onest-semibold text-base text-gray-900">
                            Trip Preferences
                        </Text>
                        {hasUnsavedChanges && (
                            <View className="ml-2 bg-orange-100 px-2 py-1 rounded">
                                <Text className="text-xs font-onest text-orange-600">Modified</Text>
                            </View>
                        )}
                    </View>
                    <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={20}
                        color="#6B7280"
                    />
                </View>
            </TouchableOpacity>

            <Animated.View style={{ maxHeight, overflow: 'hidden' }}>
                <View className="bg-white rounded-xl border border-gray-200 border-t-0 rounded-t-none px-4 pb-4">
                    {/* UPDATED: Use new experience options */}
                    {renderPreferenceSection(
                        'Experience Types',
                        ALL_EXPERIENCE_OPTIONS,
                        displayPreferences?.experiences,
                        (val) => updatePreference('experiences', val),
                        true,
                        EXPERIENCE_ICONS
                    )}

                    {renderPreferenceSection(
                        'Travel Companions',
                        ['Solo', 'Partner', 'Friends', 'Family', 'Any'] as const,
                        displayPreferences?.travelCompanions,
                        (val) => updatePreference('travelCompanions', val),
                        true
                    )}

                    {renderPreferenceSection(
                        'Explore Time',
                        ['Daytime', 'Nighttime', 'Both'] as const,
                        displayPreferences?.exploreTime,
                        (val) => updatePreference('exploreTime', val)
                    )}

                    {renderPreferenceSection(
                        'Budget',
                        ['Free', 'Budget-friendly', 'Mid-range', 'Premium'] as const,
                        displayPreferences?.budget,
                        (val) => updatePreference('budget', val)
                    )}

                    {renderPreferenceSection(
                        'Activity Intensity',
                        ['Low', 'Moderate', 'High'] as const,
                        displayPreferences?.activityIntensity,
                        (val) => updatePreference('activityIntensity', val)
                    )}

                    {renderPreferenceSection(
                        'Travel Distance',
                        ['Nearby', 'Moderate', 'Far'] as const,
                        displayPreferences?.travelDistance,
                        (val) => updatePreference('travelDistance', val)
                    )}

                    {hasUnsavedChanges && (
                        <TouchableOpacity
                            onPress={handleApplyChanges}
                            className="mt-4 bg-primary py-3 rounded-xl"
                            activeOpacity={0.7}
                        >
                            <Text className="text-center font-onest-semibold text-white">
                                Apply Changes & Regenerate
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Animated.View>
        </View>
    );
};

export default CollapsibleFilter;