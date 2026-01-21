import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import API_URL from "../../../../constants/api";

import { ItineraryFormData } from "@/types/itineraryTypes";
interface ItineraryItem {
  experience_id: number;
  experience_name?: string; // ✅ Add this
  day_number: number;
  start_time: string;
  end_time: string;
  price?: number; // ✅ Add this
  unit?: string; // ✅ Add this
  custom_note?: string;
}

interface StepProps {
  formData: ItineraryFormData;
  setFormData: React.Dispatch<React.SetStateAction<ItineraryFormData>>;
  onNext: () => void;
  onBack: () => void;
}

// API Experience Types
interface ExperienceData {
  id: number;
  title: string;
  description: string;
  price: number;
  unit: string;
  destination_name: string;
  location: string;
  tags: string[];
  images: string[];
  availability: AvailabilityInfo[];
  budget_category: "Free" | "Budget-friendly" | "Mid-range" | "Premium";
  type?: "recommended" | "other";
}

interface AvailabilityInfo {
  availability_id: number;
  experience_id: number;
  day_of_week: string;
  time_slots: TimeSlot[];
}

interface TimeSlot {
  slot_id: number;
  availability_id: number;
  start_time: string;
  end_time: string;
}

const ITEMS_PER_PAGE = 5;

const Step3AddItems: React.FC<StepProps> = ({
  formData,
  setFormData,
  onNext,
  onBack,
}) => {
  const [experiences, setExperiences] = useState<ExperienceData[]>([]);
  const [filteredExperiences, setFilteredExperiences] = useState<
    ExperienceData[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExperiences, setSelectedExperiences] = useState<
    Record<number, boolean>
  >({});

  // Pagination states
  const [currentPageRecommended, setCurrentPageRecommended] = useState(1);
  const [currentPageOther, setCurrentPageOther] = useState(1);

  useEffect(() => {
    console.log("=== User selections from STEP 2 ===");

    // Step 2 preferences data
    if (formData.preferences) {
      console.log("From Step 2:");
      console.log("  Experiences:", formData.preferences.experiences);
      console.log(
        "  Travel companion (old):",
        formData.preferences.travelCompanion
      );
      console.log(
        "  Travel companions (new):",
        formData.preferences.travelCompanions
      );
      console.log("  Explore time:", formData.preferences.exploreTime);
      console.log("  Budget:", formData.preferences.budget);
      console.log("  Travel distance:", formData.preferences.travelDistance);
    }

    console.log("==========================================");
  }, []);

  // Fetch recommended experiences
  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        setLoading(true);


        const fullParams = new URLSearchParams();
        fullParams.append("location", formData.city);
        fullParams.append("start_date", formData.start_date);
        fullParams.append("end_date", formData.end_date);

        if (formData.preferences) {
          if (formData.preferences.experiences?.length) {
            fullParams.append(
              "tags",
              formData.preferences.experiences.join(",")
            );
          }
          if (formData.preferences.budget) {
            fullParams.append("budget", formData.preferences.budget);
          }
          if (formData.preferences.exploreTime) {
            fullParams.append("explore_time", formData.preferences.exploreTime);
          }

          // Handle travel companions - support both old and new format
          if (
            formData.preferences.travelCompanions &&
            formData.preferences.travelCompanions.length > 0
          ) {
            // New format: send multiple companions
            formData.preferences.travelCompanions.forEach((companion) => {
              if (companion !== "Any") {
                fullParams.append("travel_companions", companion);
              }
            });
          }

          if (formData.preferences.travelDistance) {
            fullParams.append(
              "travel_distance",
              formData.preferences.travelDistance
            );
          }
        }

        console.log(
          "Fetching recommended experiences with params:",
          fullParams.toString()
        );

        const recommendedUrl = `${API_URL}/experience?${fullParams.toString()}`;
        const recommendedResponse = await fetch(recommendedUrl);

        if (!recommendedResponse.ok) {
          throw new Error("Failed to fetch recommended experiences");
        }

        const recommendedData = await recommendedResponse.json();
        console.log("Recommended experiences found:", recommendedData.length);

        const recommendedExperiences = recommendedData.map((exp: any) => ({
          ...exp,
          type: "recommended",
        }));

        // ========== 2. Fetch other experiences (fallback) ==========
        const fallbackParams = new URLSearchParams();
        fallbackParams.append("location", formData.city);
        fallbackParams.append("start_date", formData.start_date);
        fallbackParams.append("end_date", formData.end_date);

        // Include at least experience types for fallback
        if (formData.preferences?.experiences?.length) {
          fallbackParams.append(
            "tags",
            formData.preferences.experiences.join(",")
          );
        }

        const otherUrl = `${API_URL}/experience?${fallbackParams.toString()}`;
        const otherResponse = await fetch(otherUrl);

        if (!otherResponse.ok) {
          throw new Error("Failed to fetch fallback experiences");
        }

        const otherData = await otherResponse.json();
        console.log("Other experiences found:", otherData.length);

        // Filter out duplicates (experiences already in recommended)
        const recommendedIds = new Set(
          recommendedData.map((exp: any) => exp.id)
        );
        const otherExperiences = otherData
          .filter((exp: any) => !recommendedIds.has(exp.id))
          .map((exp: any) => ({
            ...exp,
            type: "other",
          }));

        // ========== Final merge ==========
        const allExperiences = [...recommendedExperiences, ...otherExperiences];
        console.log("Total experiences available:", allExperiences.length);

        setExperiences(allExperiences);
        setFilteredExperiences(allExperiences);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching experiences:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    if (formData.city && formData.start_date && formData.end_date) {
      fetchExperiences();
    }
  }, [
    formData.city,
    formData.start_date,
    formData.end_date,
    formData.preferences,
  ]);

  // Calculate pagination for recommended and other experiences
  const recommendedExperiences = filteredExperiences.filter(
    (exp) => exp.type === "recommended"
  );
  const otherExperiences = filteredExperiences.filter(
    (exp) => exp.type === "other"
  );

  const totalPagesRecommended = Math.ceil(
    recommendedExperiences.length / ITEMS_PER_PAGE
  );
  const totalPagesOther = Math.ceil(otherExperiences.length / ITEMS_PER_PAGE);

  const paginatedRecommended = recommendedExperiences.slice(
    (currentPageRecommended - 1) * ITEMS_PER_PAGE,
    currentPageRecommended * ITEMS_PER_PAGE
  );

  const paginatedOther = otherExperiences.slice(
    (currentPageOther - 1) * ITEMS_PER_PAGE,
    currentPageOther * ITEMS_PER_PAGE
  );

  // Generate page numbers to display
  const getPageNumbers = (currentPage: number, totalPages: number) => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Toggle experience selection
  const toggleExperienceSelection = (experienceId: number) => {
    setSelectedExperiences((prev) => ({
      ...prev,
      [experienceId]: !prev[experienceId],
    }));
  };

  // Check if Next button should be enabled
  const isNextEnabled = () => {
    const selectedIds = Object.keys(selectedExperiences).filter(
      (id) => selectedExperiences[Number(id)]
    );
    return selectedIds.length > 0;
  };

  // Handle Next button click
  const handleNext = () => {
    // Get all selected experience IDs
    const selectedIds = Object.keys(selectedExperiences)
      .filter((id) => selectedExperiences[Number(id)])
      .map((id) => Number(id));

    // Find the selected experience objects
    const selectedExperienceObjects = experiences.filter((exp) =>
      selectedIds.includes(exp.id)
    );

    // Calculate trip duration in days
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const tripDays =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

    // Create itinerary items from selected experiences
    const itineraryItems: ItineraryItem[] = selectedExperienceObjects.map(
      (exp, index) => {
        // Distribute experiences across trip days
        const dayNumber = (index % tripDays) + 1;

        // Calculate the actual date for this day number
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + dayNumber - 1);

        // Get day of week name for this date
        const dayName = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ][currentDate.getDay()];

        // Default times in case we can't find availability
        let startTime = "10:00";
        let endTime = "12:00";

        // Try to find matching availability for this day and experience
        const dayAvailability = exp.availability.find(
          (a) => a.day_of_week === dayName
        );
        if (dayAvailability && dayAvailability.time_slots.length > 0) {
          const slot = dayAvailability.time_slots[0];
          startTime = slot.start_time.substring(0, 5);
          endTime = slot.end_time.substring(0, 5);
        }

        return {
          experience_id: exp.id,
          experience_name: exp.title, // ✅ Add this for display
          day_number: dayNumber,
          start_time: startTime,
          end_time: endTime,
          price: exp.price, // ✅ Add this
          unit: exp.unit, // ✅ Add this
          custom_note: `Experience at ${exp.destination_name}`,
        };
      }
    );

    console.log("Created itinerary items:", itineraryItems);

    // Update form data with selected experiences
    setFormData({
      ...formData,
      items: [...(formData.items || []), ...itineraryItems],
    });

    onNext();
  };

  // Retry fetch function
  const retryFetch = () => {
    setError(null);
    setLoading(true);
    window.location.reload();
  };

  // Helper function to get travel companions display text
  const getTravelCompanionsText = () => {
    if (
      formData.preferences?.travelCompanions &&
      formData.preferences.travelCompanions.length > 0
    ) {
      return formData.preferences.travelCompanions.join(", ");
    } else if (formData.preferences?.travelCompanion) {
      return formData.preferences.travelCompanion;
    }
    return "";
  };

  // Render experience card
  const renderExperienceCard = ({ item }: { item: ExperienceData }) => {
    const isSelected = selectedExperiences[item.id] || false;

    return (
      <TouchableOpacity
        className={`mb-4 rounded-lg overflow-hidden border ${isSelected ? "border-primary bg-indigo-50" : "border-gray-200"
          }`}
        onPress={() => toggleExperienceSelection(item.id)}
        activeOpacity={0.7}
      >
        <View className="relative">
          {/* Image */}
          {item.images && item.images.length > 0 ? (
            <Image
              source={{ uri: `${API_URL}/${item.images[0]}` }}
              className="w-full h-40"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-40 bg-gray-200 items-center justify-center">
              <Ionicons name="image-outline" size={40} color="#A0AEC0" />
            </View>
          )}

          {/* Price Badge */}
          <View className="absolute top-2 right-2 bg-white/80 px-2 py-1 rounded-md">
            <Text className="font-onest-medium text-sm">
              {item.price === 0 ? "Free" : `${item.price} ${item.unit}`}
            </Text>
          </View>

          {/* Selection Indicator */}
          {isSelected && (
            <View className="absolute top-2 left-2 bg-primary p-1 rounded-full">
              <Ionicons name="checkmark" size={20} color="white" />
            </View>
          )}

          {/* Recommended Badge */}
          {item.type === "recommended" && (
            <View className="absolute bottom-2 left-2 bg-green-500 px-2 py-1 rounded-md">
              <Text className="text-white text-xs font-onest-medium">
                Recommended
              </Text>
            </View>
          )}
        </View>

        <View className="p-3">
          {/* Title */}
          <Text className="text-lg font-onest-semibold mb-1" numberOfLines={2}>
            {item.title}
          </Text>

          {/* Location */}
          <View className="flex-row items-center mb-2">
            <Ionicons name="location-outline" size={16} color="#4F46E5" />
            <Text className="text-sm text-gray-600 ml-1" numberOfLines={1}>
              {item.destination_name}
            </Text>
          </View>

          {/* Description */}
          {item.description && (
            <Text className="text-sm text-gray-600 mb-2" numberOfLines={2}>
              {item.description}
            </Text>
          )}

          {/* Tags */}
          <View className="flex-row flex-wrap">
            {item.tags.slice(0, 3).map((tag, index) => (
              <View
                key={index}
                className="bg-indigo-50 px-2 py-1 rounded-md mr-2 mb-2"
              >
                <Text className="text-xs text-primary font-onest-medium">
                  {tag}
                </Text>
              </View>
            ))}
            {item.tags.length > 3 && (
              <View className="bg-gray-100 px-2 py-1 rounded-md mr-2 mb-2">
                <Text className="text-xs text-gray-500 font-onest-medium">
                  +{item.tags.length - 3} more
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render pagination controls
  const renderPaginationControls = (
    currentPage: number,
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>,
    totalPages: number,
    startIndex: number,
    endIndex: number,
    totalItems: number
  ) => {
    if (totalPages <= 1) return null;

    return (
      <View className="mt-6 mb-4">
        {/* Results Info */}
        <Text className="text-center text-gray-500 text-sm mb-4 font-onest">
          Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of{" "}
          {totalItems} experiences
        </Text>

        {/* Pagination Buttons */}
        <View className="flex-row justify-center items-center">
          {/* Previous Button */}
          <TouchableOpacity
            onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-2 mr-2 rounded-md ${currentPage === 1 ? "bg-gray-200" : "bg-gray-800"
              }`}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={currentPage === 1 ? "#9CA3AF" : "#FFFFFF"}
            />
          </TouchableOpacity>

          {/* Page Numbers */}
          {getPageNumbers(currentPage, totalPages).map((page, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => typeof page === "number" && setCurrentPage(page)}
              disabled={page === "..."}
              className={`px-3 py-2 mx-1 rounded-md ${page === currentPage
                ? "bg-primary"
                : page === "..."
                  ? "bg-transparent"
                  : "bg-white border border-gray-300"
                }`}
            >
              <Text
                className={`font-onest-medium ${page === currentPage
                  ? "text-white"
                  : page === "..."
                    ? "text-gray-400"
                    : "text-gray-700"
                  }`}
              >
                {page}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Next Button */}
          <TouchableOpacity
            onPress={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className={`px-3 py-2 ml-2 rounded-md ${currentPage === totalPages ? "bg-gray-200" : "bg-gray-800"
              }`}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={currentPage === totalPages ? "#9CA3AF" : "#FFFFFF"}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const selectedCount =
    Object.values(selectedExperiences).filter(Boolean).length;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="p-4 flex-1">
          {/* Header */}
          <View className="text-center py-2">
            <Text className="text-center text-xl font-onest-semibold mb-2">
              Select Experiences
            </Text>
            <Text className="text-center text-sm text-gray-500 font-onest mb-4 w-11/12 m-auto">
              Choose the experiences you'd like to add to your itinerary.
            </Text>

            {/* Trip Duration Info */}
            <View className="bg-blue-50 p-3 rounded-lg mb-4">
              <Text className="text-sm text-blue-700 font-onest-medium text-center">
                💡 You're planning a{" "}
                {Math.ceil(
                  (new Date(formData.end_date).getTime() -
                    new Date(formData.start_date).getTime()) /
                  (1000 * 60 * 60 * 24)
                ) + 1}
                -day trip. Select as many experiences as you'd like!
              </Text>
            </View>
          </View>

          {/* Loading/Error/Content */}
          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text className="text-gray-500 mt-2 font-onest">
                Finding experiences for you...
              </Text>
            </View>
          ) : error ? (
            <View className="flex-1 justify-center items-center">
              <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
              <Text className="text-red-500 font-onest-medium text-center mt-2">
                {error}
              </Text>
              <TouchableOpacity
                onPress={retryFetch}
                className="mt-4 bg-primary px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-onest-medium">Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Recommended Experiences */}
              {recommendedExperiences.length > 0 && (
                <>
                  <View className="flex-row items-center mb-3">
                    <Ionicons name="star" size={20} color="#10B981" />
                    <Text className="text-lg font-onest-bold ml-2">
                      Recommended for You
                    </Text>
                  </View>
                  <Text className="text-sm text-gray-600 font-onest mb-4">
                    Based on your preferences:{" "}
                    {formData.preferences?.experiences.join(", ")}
                    {getTravelCompanionsText() &&
                      ` • Traveling with: ${getTravelCompanionsText()}`}
                  </Text>
                  <FlatList
                    data={paginatedRecommended}
                    renderItem={renderExperienceCard}
                    keyExtractor={(item) => `recommended-${item.id}`}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                  />
                  {renderPaginationControls(
                    currentPageRecommended,
                    setCurrentPageRecommended,
                    totalPagesRecommended,
                    (currentPageRecommended - 1) * ITEMS_PER_PAGE,
                    currentPageRecommended * ITEMS_PER_PAGE,
                    recommendedExperiences.length
                  )}
                </>
              )}

              {/* Other Experiences */}
              {otherExperiences.length > 0 && (
                <>
                  <View className="flex-row items-center mb-3 mt-6">
                    <Ionicons name="grid-outline" size={20} color="#6B7280" />
                    <Text className="text-lg font-onest-bold ml-2">
                      Other Experiences
                    </Text>
                  </View>
                  <FlatList
                    data={paginatedOther}
                    renderItem={renderExperienceCard}
                    keyExtractor={(item) => `other-${item.id}`}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                  />
                  {renderPaginationControls(
                    currentPageOther,
                    setCurrentPageOther,
                    totalPagesOther,
                    (currentPageOther - 1) * ITEMS_PER_PAGE,
                    currentPageOther * ITEMS_PER_PAGE,
                    otherExperiences.length
                  )}
                </>
              )}

              {/* No Experiences Found */}
              {filteredExperiences.length === 0 && (
                <View className="flex-1 justify-center items-center">
                  <Ionicons name="search-outline" size={48} color="#9CA3AF" />
                  <Text className="text-gray-500 font-onest-medium text-center mt-2">
                    No experiences found for your selected preferences.
                  </Text>
                  <Text className="text-gray-400 font-onest text-center mt-1">
                    Try adjusting your preferences or check back later.
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Selection Summary */}
          {selectedCount > 0 && (
            <View className="bg-indigo-50 p-3 rounded-lg mt-4 mb-4">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="font-onest-semibold text-primary">
                    {selectedCount} experience{selectedCount !== 1 ? "s" : ""}{" "}
                    selected
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedExperiences({})}
                  className="px-3 py-1 bg-white rounded-md border border-gray-200"
                >
                  <Text className="text-gray-600 font-onest-medium">
                    Clear All
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Navigation Buttons */}
          <View className="flex-row justify-between mt-4 pt-4 border-t border-gray-200 pb-4">
            <TouchableOpacity
              onPress={onBack}
              className="py-4 px-6 rounded-xl border border-gray-300"
              activeOpacity={0.7}
            >
              <Text className="text-center font-onest-medium text-base text-gray-700">
                Back
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNext}
              className={`py-4 px-8 rounded-xl ${isNextEnabled() ? "bg-primary" : "bg-gray-200"
                }`}
              disabled={!isNextEnabled()}
              activeOpacity={0.7}
            >
              <Text
                className={`text-center font-onest-medium text-base ${isNextEnabled() ? "text-white" : "text-gray-500"
                  }`}
              >
                Next step
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Step3AddItems;
