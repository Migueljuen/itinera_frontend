import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

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

// Props interface
interface EnhancedErrorDisplayProps {
  error: EnhancedError;
  onTryAgain: () => void;
  onModifyPreferences: () => void;
  city: string;
}

// Filter Breakdown Component
const FilterBreakdown: React.FC<{
  breakdown: NonNullable<EnhancedError["details"]>["filter_breakdown"];
  totalExperiences: number;
  city: string;
}> = ({ breakdown, totalExperiences, city }) => (
  <View className="bg-gray-50 rounded-lg p-4 mb-4">
    <Text className="font-onest-semibold text-sm text-gray-700 mb-3">
      Filter Results Breakdown:
    </Text>
    <View className="space-y-2">
      <View className="flex-row justify-between">
        <Text className="text-sm text-gray-600">Total in {city}:</Text>
        <Text className="text-sm font-onest-medium">{totalExperiences}</Text>
      </View>
      <View className="flex-row justify-between">
        <Text className="text-sm text-gray-600">After budget filter:</Text>
        <Text className="text-sm font-onest-medium">
          {breakdown.after_budget}
        </Text>
      </View>
      <View className="flex-row justify-between">
        <Text className="text-sm text-gray-600">After distance filter:</Text>
        <Text className="text-sm font-onest-medium">
          {breakdown.after_distance}
        </Text>
      </View>
      <View className="flex-row justify-between">
        <Text className="text-sm text-gray-600">Final matches:</Text>
        <Text className="text-sm font-onest-medium text-red-600">
          {breakdown.after_availability}
        </Text>
      </View>
    </View>
  </View>
);

// Suggestions Section Component
const SuggestionsSection: React.FC<{
  suggestions: string[];
}> = ({ suggestions }) => (
  <View className="mb-4">
    <Text className="font-onest-semibold text-sm text-gray-700 mb-3">
      💡 Suggestions:
    </Text>
    {suggestions.map((suggestion, index) => (
      <View key={index} className="flex-row items-start mb-2">
        <Text className="text-orange-500 mr-2">•</Text>
        <Text className="text-sm text-gray-600 flex-1">{suggestion}</Text>
      </View>
    ))}
  </View>
);

// Conflicting Preferences Section Component
const ConflictingPreferencesSection: React.FC<{
  conflicts: string[];
}> = ({ conflicts }) => (
  <View className="mb-4">
    <Text className="font-onest-semibold text-sm text-red-700 mb-3">
      ⚠️ Conflicting Preferences:
    </Text>
    {conflicts.map((conflict, index) => (
      <View key={index} className="flex-row items-start mb-2">
        <Text className="text-red-500 mr-2">•</Text>
        <Text className="text-sm text-red-600 flex-1">{conflict}</Text>
      </View>
    ))}
  </View>
);

// Nearby Cities Component
const NearbyCitiesSection: React.FC<{
  cities: Array<{ city: string; experience_count: number }>;
}> = ({ cities }) => (
  <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
    <Text className="font-onest-semibold text-base text-gray-900 mb-3">
      🏙️ Try Nearby Cities
    </Text>
    <View className="space-y-2">
      {cities.map((cityOption, index) => (
        <View
          key={index}
          className="flex-row justify-between items-center py-2"
        >
          <Text className="text-sm text-gray-700">{cityOption.city}</Text>
          <Text className="text-sm font-onest-medium text-green-600">
            {cityOption.experience_count} activities
          </Text>
        </View>
      ))}
    </View>
  </View>
);

// Popular Experiences Component
const PopularExperiencesSection: React.FC<{
  experiences: Array<{
    title: string;
    price: number;
    travel_companion: string;
    travel_companions?: string[];
    popularity: number;
  }>;
  city: string;
}> = ({ experiences, city }) => (
  <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
    <Text className="font-onest-semibold text-base text-gray-900 mb-3">
      🔥 Popular in {city}
    </Text>
    <Text className="text-sm text-gray-600 mb-3">
      These activities are available but don't match your current filters:
    </Text>
    <View className="space-y-3">
      {experiences.slice(0, 3).map((exp, index) => (
        <View key={index} className="bg-gray-50 rounded-lg p-3">
          <View className="flex-row justify-between items-start mb-1">
            <Text className="text-sm font-onest-medium text-gray-900 flex-1">
              {exp.title}
            </Text>
            <Text className="text-sm text-green-600 font-onest-medium">
              ${exp.price}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-xs text-gray-500">
              {exp.travel_companions || exp.travel_companion}
            </Text>
            <Text className="text-xs text-gray-400 mx-2">•</Text>
            <Text className="text-xs text-gray-500">
              {Math.round(exp.popularity * 100)}% popularity
            </Text>
          </View>
        </View>
      ))}
    </View>
  </View>
);

// Action Buttons Component
const ActionButtons: React.FC<{
  onModifyPreferences: () => void;
  onTryAgain: () => void;
}> = ({ onModifyPreferences, onTryAgain }) => (
  <View className="space-y-3 mt-6">
    <TouchableOpacity
      onPress={onModifyPreferences}
      className="bg-primary py-4 rounded-xl"
      activeOpacity={0.7}
    >
      <Text className="text-center font-onest-semibold text-white text-base">
        Modify Preferences
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      onPress={onTryAgain}
      className="bg-white border border-gray-300 py-4 rounded-xl"
      activeOpacity={0.7}
    >
      <Text className="text-center font-onest-semibold text-gray-700 text-base">
        Try Again
      </Text>
    </TouchableOpacity>
  </View>
);

// Main Error Header Component
const ErrorHeader: React.FC<{
  city: string;
}> = ({ city }) => (
  <View className="items-center mb-4">
    <View className="bg-orange-100 rounded-full p-4 mb-3">
      <Ionicons name="search-outline" size={32} color="#F59E0B" />
    </View>
    <Text className="font-onest-bold text-lg text-gray-900 text-center">
      No Activities Found
    </Text>
    <Text className="font-onest text-sm text-gray-600 text-center mt-2">
      We couldn't find any activities in {city} that match your current
      preferences
    </Text>
  </View>
);

// Main EnhancedErrorDisplay Component
export const EnhancedErrorDisplay: React.FC<EnhancedErrorDisplayProps> = ({
  error,
  onTryAgain,
  onModifyPreferences,
  city,
}) => {
  const { details } = error;

  // Early return if no details
  if (!details) {
    return (
      <View className="flex-1 bg-gray-50 px-4 py-6">
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="bg-white rounded-xl p-6 mb-4 border border-gray-200">
            <ErrorHeader city={city} />
          </View>
          <ActionButtons
            onModifyPreferences={onModifyPreferences}
            onTryAgain={onTryAgain}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 px-4 py-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Main Error Card */}
        <View className="bg-white rounded-xl p-6 mb-4 border border-gray-200">
          <ErrorHeader city={city} />

          {/* Filter Breakdown */}
          {details.filter_breakdown && (
            <FilterBreakdown
              breakdown={details.filter_breakdown}
              totalExperiences={details.total_experiences_in_city}
              city={city}
            />
          )}

          {/* Suggestions */}
          {details.suggestions && details.suggestions.length > 0 && (
            <SuggestionsSection suggestions={details.suggestions} />
          )}

          {/* Conflicting Preferences */}
          {details.conflicting_preferences &&
            details.conflicting_preferences.length > 0 && (
              <ConflictingPreferencesSection
                conflicts={details.conflicting_preferences}
              />
            )}
        </View>

        {/* Alternative Options */}
        {details.alternative_options && (
          <>
            {/* Nearby Cities */}
            {details.alternative_options.nearby_cities?.length > 0 && (
              <NearbyCitiesSection
                cities={details.alternative_options.nearby_cities}
              />
            )}

            {/* Popular Experiences */}
            {details.alternative_options.popular_experiences?.length > 0 && (
              <PopularExperiencesSection
                experiences={details.alternative_options.popular_experiences}
                city={city}
              />
            )}
          </>
        )}

        {/* Action Buttons */}
        <ActionButtons
          onModifyPreferences={onModifyPreferences}
          onTryAgain={onTryAgain}
        />
      </ScrollView>
    </View>
  );
};

export default EnhancedErrorDisplay;
