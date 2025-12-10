//generate
import API_URL from "@/constants/api";
import {
  ActivityIntensity,
  Budget,
  Experience,
  ExploreTime,
  TravelCompanion,
  TravelDistance,
} from "@/types/experienceTypes";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

// API response interfaces
interface Tag {
  tag_id: number;
  tag_name: string;
}

interface Category {
  category_id: number;
  category_name: string;
  tags: Tag[];
}

interface ApiResponse {
  categories: Category[];
}

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
    experienceIds?: number[]; // Store both names and IDs
    travelerCount: number;
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
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [travelerCount, setTravelerCount] = useState<number>(
    formData.preferences?.travelerCount || 1
  );
  // Store selected tags as objects with both ID and name
  const [selectedTags, setSelectedTags] = useState<
    Array<{ id: number; name: string }>
  >([]);

  const [selectedCompanion, setSelectedCompanion] =
    useState<TravelCompanion | null>(
      formData.preferences?.travelCompanion || null
    );
  const [selectedExploreTime, setSelectedExploreTime] =
    useState<ExploreTime | null>(formData.preferences?.exploreTime || null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(
    formData.preferences?.budget || null
  );
  useEffect(() => {
    if (formData.preferences?.travelerCount) {
      return;
    }

    if (selectedCompanion === "Solo") {
      setTravelerCount(1);
    } else if (selectedCompanion === "Partner") {
      setTravelerCount(2);
    } else if (
      selectedCompanion === "Friends" ||
      selectedCompanion === "Family"
    ) {
      setTravelerCount(4);
    } else if (selectedCompanion === "Any") {
      setTravelerCount(1);
    }
  }, [selectedCompanion, formData.preferences?.travelerCount]);
  const [selectedActivityIntensity, setSelectedActivityIntensity] =
    useState<ActivityIntensity | null>(
      formData.preferences?.activityIntensity || null
    );
  const [selectedTravelDistance, setSelectedTravelDistance] =
    useState<TravelDistance | null>(
      formData.preferences?.travelDistance || null
    );

  // Fetch categories and tags from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/tags/preference`);

        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }

        const data: ApiResponse = await response.json();
        setCategories(data.categories);
        setError(null);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to load categories. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Initialize selected tags from formData when categories are loaded
  useEffect(() => {
    if (
      categories.length > 0 &&
      formData.preferences?.experiences &&
      formData.preferences.experiences.length > 0
    ) {
      // Map experience names to tag objects
      const initialTags: Array<{ id: number; name: string }> = [];
      categories.forEach((category) => {
        category.tags.forEach((tag) => {
          if (
            formData.preferences?.experiences.includes(
              tag.tag_name as Experience
            )
          ) {
            initialTags.push({ id: tag.tag_id, name: tag.tag_name });
          }
        });
      });
      setSelectedTags(initialTags);
    }
  }, [categories]);

  // Check user input in console
  useEffect(() => {
    console.log("=== User selections from STEP 1 ===");
    console.log("Selected city:", formData.city);
    console.log("Start date:", formData.start_date);
    console.log("End date:", formData.end_date);
    console.log("==========================================");
  }, []);

  // Map category names to icons
  const getCategoryIcon = (
    categoryName: string
  ): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      "Arts & Creativity": "color-palette",
      "Health & Wellness": "fitness",
      "Food & Drinks": "restaurant",
      "Heritage & Culture": "book",
      "Nature & Adventure": "leaf",
    };
    return iconMap[categoryName] || "pricetag";
  };

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
  const budgetIconMap: Record<Budget, string> = {
    Free: "gift",
    "Budget-friendly": "wallet",
    "Mid-range": "cash-outline",
    Premium: "diamond",
  };

  const activityIntensityOptions: ActivityIntensity[] = [
    "Low",
    "Moderate",
    "High",
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

  // Toggle tag selection (multiple selection)
  const toggleTag = (tagId: number, tagName: string) => {
    const isSelected = selectedTags.some((tag) => tag.id === tagId);

    if (isSelected) {
      setSelectedTags(selectedTags.filter((tag) => tag.id !== tagId));
    } else {
      setSelectedTags([...selectedTags, { id: tagId, name: tagName }]);
    }
  };

  // Check if a tag is selected
  const isTagSelected = (tagId: number) => {
    return selectedTags.some((tag) => tag.id === tagId);
  };

  // Check if form is valid to enable the Next button
  const isValid = () => {
    return (
      selectedTags.length > 0 &&
      selectedCompanion !== null &&
      selectedExploreTime !== null &&
      selectedBudget !== null &&
      selectedActivityIntensity !== null &&
      selectedTravelDistance !== null
    );
  };

  // Handle submission
  const handleNext = () => {
    if (isValid()) {
      // Extract tag names and IDs
      const experienceNames = selectedTags.map((tag) => tag.name as Experience);
      const experienceIds = selectedTags.map((tag) => tag.id);

      // Update the formData with preferences
      setFormData({
        ...formData,
        preferences: {
          experiences: experienceNames, // Store tag names for type compatibility
          experienceIds: experienceIds, // Store IDs for API calls
          travelerCount: travelerCount,
          travelCompanion: selectedCompanion!,
          exploreTime: selectedExploreTime!,
          budget: selectedBudget!,
          activityIntensity: selectedActivityIntensity!,
          travelDistance: selectedTravelDistance!,
        },
      });

      // Log selections for debugging
      console.log("=== User selections from STEP 2 ===");
      console.log("Selected experiences (names):", experienceNames);
      console.log("Selected experiences (IDs):", experienceIds);
      console.log("Travel companion:", selectedCompanion);
      console.log("Explore time:", selectedExploreTime);
      console.log("Budget:", selectedBudget);
      console.log("Activity intensity:", selectedActivityIntensity);
      console.log("Travel distance:", selectedTravelDistance);
      console.log("==========================================");

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
        activeOpacity={1}
      >
        <View className="flex-row items-center">
          {icon && (
            <Ionicons
              name={icon as any}
              size={16}
              color={isSelected ? "#4F46E5" : "#1a1a1a"}
              className="mr-3"
            />
          )}
          <Text
            className={`text-base font-onest ${
              isSelected ? " text-black/90" : "text-black/80"
            }`}
          >
            {option}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={16} color="#4F46E5" />
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
        activeOpacity={1}
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
            size={16}
            color={isSelected ? "#4F46E5" : "#1a1a1a"}
            className="mr-3"
          />
          <View className="flex-1">
            <Text
              className={`text-base font-onest ${
                isSelected ? " text-black/90" : " text-black/80"
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
          <Ionicons name="checkmark-circle" size={16} color="#4F46E5" />
        )}
      </TouchableOpacity>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-4 text-gray-600 font-onest">
          Loading preferences...
        </Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text className="mt-4 text-red-600 font-onest-medium text-center">
          {error}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setError(null);
            setLoading(true);
            // Retry fetch
            fetch("http://localhost:3000/tags/preference")
              .then((res) => res.json())
              .then((data) => {
                setCategories(data.categories);
                setError(null);
              })
              .catch(() => setError("Failed to load categories"))
              .finally(() => setLoading(false));
          }}
          className="mt-4 py-3 px-6 bg-primary rounded-lg"
        >
          <Text className="text-white font-onest-medium">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

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

                    {categories.map((category) => {
                      const isOpen = openCategory === category.category_name;
                      const hasSelectedTag = category.tags.some((tag) =>
                        isTagSelected(tag.tag_id)
                      );

                      return (
                        <View key={category.category_id} className="mt-2">
                          {/* Category button */}
                          <TouchableOpacity
                            activeOpacity={1}
                            onPress={() =>
                              setOpenCategory(
                                isOpen ? null : category.category_name
                              )
                            }
                            className={`p-4 border rounded-lg flex-row justify-between items-center ${
                              isOpen || hasSelectedTag
                                ? "border-primary bg-indigo-50"
                                : "border-gray-300"
                            }`}
                          >
                            <View className="flex-row items-center">
                              <Ionicons
                                name={getCategoryIcon(category.category_name)}
                                size={16}
                                color={
                                  isOpen || hasSelectedTag
                                    ? "#4F46E5"
                                    : "#1a1a1a"
                                }
                                className="mr-3"
                              />
                              <Text
                                className={`text-base font-onest ${
                                  isOpen || hasSelectedTag
                                    ? "text-black/90"
                                    : "text-black/80"
                                }`}
                              >
                                {category.category_name}
                              </Text>
                            </View>
                            <Ionicons
                              name={isOpen ? "chevron-up" : "chevron-down"}
                              size={16}
                              color="#6B7280"
                            />
                          </TouchableOpacity>

                          {/* Tags */}
                          {isOpen && (
                            <View className="flex-row flex-wrap justify-between mt-2">
                              {category.tags.map((tag) => (
                                <TouchableOpacity
                                  key={tag.tag_id}
                                  className={`border rounded-lg py-3 px-2 mb-3 w-[48%] items-center ${
                                    isTagSelected(tag.tag_id)
                                      ? "border-primary bg-indigo-50"
                                      : "border-gray-300"
                                  }`}
                                  onPress={() =>
                                    toggleTag(tag.tag_id, tag.tag_name)
                                  }
                                  activeOpacity={1}
                                >
                                  <Text
                                    className={`text-base font-onest ${
                                      isTagSelected(tag.tag_id)
                                        ? "text-black/90"
                                        : "text-black/80"
                                    }`}
                                  >
                                    {tag.tag_name}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </View>
                      );
                    })}

                    {selectedTags.length === 0 && (
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
                        () => {
                          setSelectedCompanion(companion);
                          // Set smart defaults
                          if (companion === "Solo") setTravelerCount(1);
                          else if (companion === "Partner") setTravelerCount(2);
                          else if (companion === "Friends") setTravelerCount(3);
                          else if (companion === "Family") setTravelerCount(4);
                        }
                      )
                    )}

                    {/* Only show if not Solo */}
                    {selectedCompanion && selectedCompanion !== "Solo" && (
                      <View className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <Text className="font-onest-medium text-sm mb-3 text-gray-700">
                          May I know the total number of participants?
                        </Text>
                        <View className="flex-row items-center justify-center">
                          <Pressable
                            onPress={() =>
                              setTravelerCount(Math.max(2, travelerCount - 1))
                            }
                            className="bg-white  rounded-lg p-3"
                          >
                            <Ionicons name="remove" size={20} color="#374151" />
                          </Pressable>

                          <View className="mx-6 items-center">
                            <Text className="font-onest-bold text-2xl text-primary">
                              {travelerCount}
                            </Text>
                            <Text className="text-xs text-gray-500 font-onest mt-1">
                              travelers
                            </Text>
                          </View>

                          <Pressable
                            onPress={() =>
                              setTravelerCount(Math.min(20, travelerCount + 1))
                            }
                            className="bg-white rounded-lg p-3"
                          >
                            <Ionicons name="add" size={20} color="#374151" />
                          </Pressable>
                        </View>
                      </View>
                    )}

                    {selectedCompanion === "Solo" && (
                      <View className="mt-2 p-3 bg-indigo-50 rounded-lg">
                        <Text className="text-xs text-indigo-700 font-onest">
                          ✨ Solo travel - costs calculated for 1 person
                        </Text>
                      </View>
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
                        budgetIconMap[budget]
                      )
                    )}
                  </View>

                  {/* Activity Intensity */}
                  <View className="mb-6">
                    <Text className="font-onest-medium text-base mb-3">
                      How packed would you like your days to be?
                    </Text>
                    <Text className="text-xs text-gray-500 font-onest mb-2">
                      This affects the number of experiences per day
                    </Text>
                    {activityIntensityOptions.map((intensity) =>
                      renderOption(
                        intensity,
                        selectedActivityIntensity === intensity,
                        () => setSelectedActivityIntensity(intensity),
                        intensity === "Low"
                          ? "leaf"
                          : intensity === "Moderate"
                          ? "walk"
                          : "flash"
                      )
                    )}
                    {selectedActivityIntensity && (
                      <View className="mt-2 p-2 bg-gray-50 rounded-lg">
                        <Text className="text-xs text-gray-600 font-onest">
                          {selectedActivityIntensity === "Low" &&
                            "1-2 activities per day - Perfect for a relaxed pace"}
                          {selectedActivityIntensity === "Moderate" &&
                            "2-3 activities per day - A good balance of activities and rest"}
                          {selectedActivityIntensity === "High" &&
                            "3+ activities per day - Action-packed adventure!"}
                        </Text>
                      </View>
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
                  activeOpacity={1}
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
                  activeOpacity={1}
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
