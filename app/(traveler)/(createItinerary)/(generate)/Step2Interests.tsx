// (traveler)/(createItinerary)/(generate)/Step2Interests.tsx
import API_URL from "@/constants/api";
import { Experience } from "@/types/experienceTypes";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
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

// ✅ Adjust these paths to where you store images in RN
const CATEGORY_IMAGES: Record<string, any> = {
  "Arts & Creativity": require("@/assets/images/category.png"),
  "Health & Wellness": require("@/assets/images/category1.png"),
  "Food & Drinks": require("@/assets/images/category2.png"),
  "Heritage & Culture": require("@/assets/images/category3.png"),
  "Nature & Adventure": require("@/assets/images/category4.png"),
};

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

// Itinerary interfaces (kept minimal to what we touch here)
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
    experienceIds?: number[];
    travelerCount: number;
  };
}

interface StepProps {
  formData: ItineraryFormData;
  setFormData: React.Dispatch<React.SetStateAction<ItineraryFormData>>;
  onNext: () => void;
  onBack: () => void;
}

const Step2Interests: React.FC<StepProps> = ({
  formData,
  setFormData,
  onNext,
  onBack,
}) => {
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Store selected tags as objects with both ID and name
  const [selectedTags, setSelectedTags] = useState<
    Array<{ id: number; name: string }>
  >([]);

  // Fetch categories and tags from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/tags/preference`);

        if (!response.ok) throw new Error("Failed to fetch categories");

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

  // Toggle tag selection (multiple selection)
  const toggleTag = (tagId: number, tagName: string) => {
    setSelectedTags((prev) => {
      const isSelected = prev.some((t) => t.id === tagId);
      return isSelected
        ? prev.filter((t) => t.id !== tagId)
        : [...prev, { id: tagId, name: tagName }];
    });
  };

  const isTagSelected = (tagId: number) =>
    selectedTags.some((tag) => tag.id === tagId);

  const isValid = () => selectedTags.length > 0;

  const handleNext = () => {
    if (!isValid()) return;

    const experienceNames = selectedTags.map((tag) => tag.name as Experience);
    const experienceIds = selectedTags.map((tag) => tag.id);

    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...(prev.preferences ?? { travelerCount: 1, experiences: [] }),
        experiences: experienceNames,
        experienceIds,
      },
    }));

    onNext();
  };

  // Helpers for category selection states
  const getCategorySelectionMeta = (category: Category) => {
    const selectedCount = category.tags.filter((t) => isTagSelected(t.tag_id))
      .length;
    const total = category.tags.length;
    const allSelected = total > 0 && selectedCount === total;
    const someSelected = selectedCount > 0 && !allSelected;
    return { selectedCount, total, allSelected, someSelected };
  };

  const toggleSelectAllInCategory = (category: Category) => {
    const { allSelected } = getCategorySelectionMeta(category);
    const categoryTagIds = category.tags.map((t) => t.tag_id);

    setSelectedTags((prev) => {
      if (allSelected) {
        // clear all tags in category
        return prev.filter((t) => !categoryTagIds.includes(t.id));
      }

      // select all tags in category (keep other categories)
      const other = prev.filter((t) => !categoryTagIds.includes(t.id));
      const toAdd = category.tags.map((t) => ({ id: t.tag_id, name: t.tag_name }));
      return [...other, ...toAdd];
    });
  };

  const getCheckboxVisual = (allSelected: boolean, someSelected: boolean) => {
    if (allSelected) return { filled: true, icon: "checkmark" as const };
    if (someSelected) return { filled: true, icon: "remove" as const };
    return { filled: false, icon: null };
  };

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-4 text-gray-600 font-onest">Loading interests...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text className="mt-4 text-red-600 font-onest-medium text-center">
          {error}
        </Text>

        <TouchableOpacity
          onPress={async () => {
            try {
              setError(null);
              setLoading(true);
              const res = await fetch(`${API_URL}/tags/preference`);
              const data: ApiResponse = await res.json();
              setCategories(data.categories);
            } catch {
              setError("Failed to load categories. Please try again.");
            } finally {
              setLoading(false);
            }
          }}
          className="mt-4 py-3 px-6 bg-primary rounded-lg"
          activeOpacity={1}
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
            <View className="flex-1">
              <View className="py-2">
                <Text className="font-onest-semibold text-2xl text-black/90 mb-3">
                  What kind of experiences are you looking for?
                </Text>
                <Text className="text-base text-black/50 font-onest mb-8">
                  Select all that interest you
                </Text>

                {/* Category Cards */}
                <View className="gap-3">
                  {categories.map((category) => {
                    const isOpen = openCategory === category.category_name;
                    const { selectedCount, total, allSelected, someSelected } =
                      getCategorySelectionMeta(category);

                    const cardSelected = selectedCount > 0 || isOpen;
                    const checkbox = getCheckboxVisual(allSelected, someSelected);
                    const imageSrc =
                      CATEGORY_IMAGES[category.category_name] ?? null;

                    return (
                      <View key={category.category_id}>
                        {/* Card header */}
                        <Pressable
                          onPress={() =>
                            setOpenCategory(isOpen ? null : category.category_name)
                          }
                          className={`border rounded-2xl bg-gray-100 px-4 py-4 flex-row items-center ${cardSelected ? "border-primary" : "border-gray-200"
                            }`}
                        >
                          {/* Image */}
                          <View className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 items-center justify-center">
                            {imageSrc ? (
                              <Image
                                source={imageSrc}
                                style={{ width: 56, height: 56 }}
                                resizeMode="contain"
                              />
                            ) : (
                              <Ionicons name="pricetag" size={22} color="#6B7280" />
                            )}
                          </View>

                          {/* Title + meta */}
                          <View className="flex-1 ml-4">
                            <Text
                              className={`text-base font-onest ${cardSelected ? "text-black/90" : "text-black/80"
                                }`}
                            >
                              {category.category_name}
                            </Text>

                            <Text className="text-xs text-gray-500 font-onest mt-1">
                              {selectedCount > 0
                                ? `${selectedCount}/${total} selected`
                                : `${total} options`}
                            </Text>
                          </View>

                          {/* Select-all checkbox (separate from expand) */}
                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              toggleSelectAllInCategory(category);
                            }}
                            className="mr-3 w-9 h-9 items-center justify-center"
                          >
                            <View
                              className={`w-5 h-5 border items-center justify-center rounded ${checkbox.filled
                                ? "border-primary bg-primary"
                                : "border-gray-400"
                                }`}
                            >
                              {checkbox.icon && (
                                <Ionicons
                                  name={checkbox.icon}
                                  size={14}
                                  color="#fff"
                                />
                              )}
                            </View>
                          </Pressable>

                          {/* Chevron */}
                          <Ionicons
                            name={isOpen ? "chevron-up" : "chevron-down"}
                            size={18}
                            color="#6B7280"
                          />
                        </Pressable>

                        {/* Expanded tags */}
                        {isOpen && (
                          <View className="mt-3 px-1">
                            <View className="flex-row flex-wrap justify-between">
                              {category.tags.map((tag) => (
                                <TouchableOpacity
                                  key={tag.tag_id}
                                  className={`border rounded-xl py-3 px-2 mb-3 w-[48%] items-center ${isTagSelected(tag.tag_id)
                                    ? "border-primary bg-indigo-50"
                                    : "border-gray-200"
                                    }`}
                                  onPress={() => toggleTag(tag.tag_id, tag.tag_name)}
                                  activeOpacity={1}
                                >
                                  <Text
                                    className={`text-base font-onest ${isTagSelected(tag.tag_id)
                                      ? "text-black/90"
                                      : "text-black/80"
                                      }`}
                                  >
                                    {tag.tag_name}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>

                            {/* small helper row */}
                            <View className="flex-row justify-between items-center mb-2">
                              <Text className="text-xs text-gray-500 font-onest">
                                Tip: choose a few favorites for better results
                              </Text>
                              <Pressable
                                onPress={() => toggleSelectAllInCategory(category)}
                              >
                                <Text className="text-xs text-primary font-onest-medium">
                                  {allSelected ? "Clear" : "Select all"}
                                </Text>
                              </Pressable>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>

                {selectedTags.length === 0 && (
                  <Text className="text-xs text-red-500 font-onest mt-3">
                    Please select at least one experience
                  </Text>
                )}
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
          </TouchableWithoutFeedback>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Step2Interests;
