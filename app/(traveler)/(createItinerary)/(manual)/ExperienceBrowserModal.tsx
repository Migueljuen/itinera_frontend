// (createItinerary)/(manual)/ExperienceBrowserModal.tsx

import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import API_URL from "../../../../constants/api";

// --------------------
// Types
// --------------------
interface ItineraryItem {
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
    price_estimate?: string;
    unit?: string;
}

interface Experience {
    id: number;
    title: string;
    description: string;
    price: string;
    price_estimate: string;
    unit: string;
    destination_name: string;
    location: string;
    tags: string[];
    images: string[];
}

interface TimeSlot {
    slot_id?: number;
    availability_id?: number;
    start_time: string;
    end_time: string;
}

interface AvailabilityDay {
    availability_id?: number;
    experience_id?: number;
    day_of_week: string;
    time_slots: TimeSlot[];
}

interface ExperienceBrowserModalProps {
    city: string;
    tripStartDate: string;
    tripEndDate: string;
    selectedDayNumber: number;
    selectedDayDate: Date | null;
    existingItems: ItineraryItem[];
    onAddExperience: (item: ItineraryItem) => void;
    onClose: () => void;
    onViewExperience: (experienceId: number) => void;

}

// Filter options - matching your category table
const FILTER_OPTIONS = [
    { key: "all", label: "All" },
    { key: "Food & Drinks", label: "Food" },
    { key: "Nature & Adventure", label: "Adventure" },
    { key: "Heritage & Culture", label: "Culture" },
    { key: "Health & Wellness", label: "Wellness" },
    { key: "Arts & Creativity", label: "Arts" },
];

// --------------------
// Utility Functions
// --------------------
const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        weekday: "short",
    });
};

const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
};

const convertToFormTimeFormat = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    return `${hours}:${minutes}`;
};

const timeToMinutes = (timeString: string) => {
    const [hours, minutes] = timeString
        .split(":")
        .map((num) => parseInt(num, 10));
    return hours * 60 + minutes;
};

const sortTimeSlots = (slots: TimeSlot[]) => {
    return [...slots].sort((a, b) => {
        return timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
    });
};

const formatTimeRange = (startTime: string, endTime: string) => {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

const formatPrice = (price: number) => `₱${price.toLocaleString()}`;

// Check if two time ranges overlap
const hasTimeConflict = (
    start1: string,
    end1: string,
    start2: string,
    end2: string
): boolean => {
    const start1Min = timeToMinutes(start1);
    const end1Min = timeToMinutes(end1);
    const start2Min = timeToMinutes(start2);
    const end2Min = timeToMinutes(end2);

    // Two ranges overlap if one starts before the other ends
    return start1Min < end2Min && start2Min < end1Min;
};

// --------------------
// Main Component
// --------------------
const ExperienceBrowserModal: React.FC<ExperienceBrowserModalProps> = ({
    city,
    tripStartDate,
    tripEndDate,
    selectedDayNumber,
    selectedDayDate,
    existingItems,
    onAddExperience,
    onClose,
    onViewExperience
}) => {

    const [experiences, setExperiences] = useState<Experience[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedFilter, setSelectedFilter] = useState("all");
    const [expandedExperienceId, setExpandedExperienceId] = useState<
        number | null
    >(null);
    const [availabilityData, setAvailabilityData] = useState<{
        [key: number]: AvailabilityDay[];
    }>({});
    const [loadingAvailability, setLoadingAvailability] = useState<number | null>(
        null
    );


    const handleViewExperience = (experienceId: number) => {
        onViewExperience(experienceId);
    };

    // Get day of week for the selected date
    const selectedDayOfWeek = useMemo(() => {
        if (!selectedDayDate) return "";
        return selectedDayDate.toLocaleDateString("en-US", { weekday: "long" });
    }, [selectedDayDate]);

    // Get existing items for the selected day only
    const existingItemsForDay = useMemo(() => {
        return existingItems.filter((item) => item.day_number === selectedDayNumber);
    }, [existingItems, selectedDayNumber]);

    // Get IDs of experiences already added to this day
    const addedExperienceIds = useMemo(() => {
        return new Set(existingItemsForDay.map((item) => item.experience_id));
    }, [existingItemsForDay]);

    // Filter out already-added experiences from the list
    const filteredExperiences = useMemo(() => {
        return experiences.filter((exp) => !addedExperienceIds.has(exp.id));
    }, [experiences, addedExperienceIds]);

    // Fetch experiences
    useEffect(() => {
        fetchExperiences();
    }, [city, selectedFilter]);

    const fetchExperiences = async () => {
        try {
            setLoading(true);
            setError(null);

            let url = `${API_URL}/experience/active`;

            if (selectedFilter !== "all") {
                url += `?category=${encodeURIComponent(selectedFilter)}`;
            }

            const response = await axios.get(url);
            setExperiences(response.data);
        } catch (err) {
            console.error("Error fetching experiences:", err);
            setError("Failed to load experiences. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Fetch availability for a specific experience
    const fetchAvailability = async (experienceId: number) => {
        // Check if already fetched
        if (availabilityData[experienceId]) {
            return;
        }

        try {
            setLoadingAvailability(experienceId);
            const response = await axios.get(
                `${API_URL}/experience/${experienceId}/availability`
            );

            if (response.data?.availability) {
                setAvailabilityData((prev) => ({
                    ...prev,
                    [experienceId]: response.data.availability,
                }));
            }
        } catch (err) {
            console.error("Error fetching availability:", err);
        } finally {
            setLoadingAvailability(null);
        }
    };

    // Handle experience card press - toggle expansion and fetch availability
    const handleExperiencePress = async (experienceId: number) => {
        if (expandedExperienceId === experienceId) {
            setExpandedExperienceId(null);
        } else {
            setExpandedExperienceId(experienceId);
            await fetchAvailability(experienceId);
        }
    };

    // Check if a time slot has conflict with existing items
    const getTimeSlotConflict = (
        startTime: string,
        endTime: string
    ): ItineraryItem | null => {
        const formattedStart = convertToFormTimeFormat(startTime);
        const formattedEnd = convertToFormTimeFormat(endTime);

        for (const item of existingItemsForDay) {
            if (
                hasTimeConflict(
                    formattedStart,
                    formattedEnd,
                    item.start_time,
                    item.end_time
                )
            ) {
                return item;
            }
        }
        return null;
    };

    // Handle adding a time slot
    const handleAddTimeSlot = (experience: Experience, slot: TimeSlot) => {
        const newItem: ItineraryItem = {
            experience_id: experience.id,
            day_number: selectedDayNumber,
            start_time: convertToFormTimeFormat(slot.start_time),
            end_time: convertToFormTimeFormat(slot.end_time),
            price: parseFloat(experience.price) || 0,
            unit: experience.unit,
            experience_name: experience.title,
            experience_description: experience.description,
            destination_name: experience.destination_name,
            images: experience.images,
            price_estimate: experience.price_estimate, // Add this line
        };

        onAddExperience(newItem);
        onClose();
    };
    // Get available slots for the selected day
    const getAvailableSlotsForDay = (experienceId: number): TimeSlot[] => {
        const availability = availabilityData[experienceId];
        if (!availability) return [];

        const dayAvailability = availability.find(
            (a) => a.day_of_week === selectedDayOfWeek
        );

        if (!dayAvailability) return [];

        return sortTimeSlots(dayAvailability.time_slots);
    };

    const renderExperienceCard = ({ item }: { item: Experience }) => {
        const isExpanded = expandedExperienceId === item.id;
        const availableSlots = getAvailableSlotsForDay(item.id);
        const isLoadingSlots = loadingAvailability === item.id;
        const hasAvailability = availabilityData[item.id] !== undefined;

        return (
            // ✅ Whole card navigates to details
            <Pressable
                onPress={() => handleViewExperience(item.id)}
                className="bg-white rounded-xl mb-4 overflow-hidden"
                style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 3,
                }}
            >
                {/* Image */}
                <View className="h-72">
                    {item.images && item.images.length > 0 ? (
                        <Image
                            source={{ uri: `${API_URL}/${item.images[0]}` }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="w-full h-full bg-gray-200 items-center justify-center">
                            <Ionicons name="image-outline" size={40} color="#9CA3AF" />
                        </View>
                    )}
                </View>

                {/* Content */}
                <View className="p-4">
                    <Text className="font-onest-semibold text-lg text-black/90" numberOfLines={2}>
                        {item.title}
                    </Text>

                    <View className="flex-row items-center mt-2">
                        <Ionicons name="location-outline" size={14} color="#6B7280" />
                        <Text className="text-black/50 font-onest text-sm ml-1" numberOfLines={1}>
                            {item.location}, {item.destination_name}
                        </Text>
                    </View>

                    <View className="flex-row items-center justify-between mt-3">
                        {item.price && item.price !== "0" && (
                            <Text className="text-black/70 font-onest-medium">
                                From ₱{parseFloat(item.price).toLocaleString()}{" "}
                                <Text className="text-black/40 font-onest">/ {item.unit}</Text>
                            </Text>
                        )}

                        {/* ✅ ONLY this opens/closes slots (prevents navigating) */}
                        <Pressable
                            onPress={(e) => {
                                e.stopPropagation(); // 👈 prevents the card navigation
                                handleExperiencePress(item.id);
                            }}
                            className="flex-row items-center"
                            hitSlop={10}
                        >
                            <Text className="text-blue-600 font-onest-medium text-sm mr-1">
                                {isExpanded ? "Hide slots" : "Select time"}
                            </Text>
                            <Ionicons
                                name={isExpanded ? "chevron-up" : "chevron-down"}
                                size={16}
                                color="#3B82F6"
                            />
                        </Pressable>
                    </View>
                </View>

                {/* Expanded Time Slots Section */}
                {isExpanded && (
                    <View className="px-4 pb-4 border-t border-gray-100 pt-4">
                        {isLoadingSlots ? (
                            <View className="py-4 items-center">
                                <ActivityIndicator size="small" color="#3B82F6" />
                                <Text className="text-black/50 font-onest text-sm mt-2">
                                    Loading availability...
                                </Text>
                            </View>
                        ) : availableSlots.length > 0 ? (
                            <View>

                                {availableSlots.map((slot, idx) => {
                                    const conflictingItem = getTimeSlotConflict(slot.start_time, slot.end_time);
                                    const hasConflict = conflictingItem !== null;

                                    const slotPrice = parseFloat(item.price) || 0;

                                    return (
                                        <TouchableOpacity
                                            key={idx}
                                            onPress={() => !hasConflict && handleAddTimeSlot(item, slot)}
                                            disabled={hasConflict}
                                            activeOpacity={0.8}
                                            style={{
                                                borderWidth: 1,
                                                borderColor: "#E5E7EB",
                                                backgroundColor: hasConflict ? "#F9FAFB" : "#FFFFFF",
                                                borderRadius: 12,
                                                paddingHorizontal: 16,
                                                paddingVertical: 14,
                                                marginBottom: 12,
                                                opacity: hasConflict ? 0.6 : 1,
                                            }}
                                        >
                                            <View
                                                style={{
                                                    flexDirection: "row",
                                                    alignItems: "flex-start",
                                                    justifyContent: "space-between",
                                                }}
                                            >
                                                <View style={{ flex: 1, paddingRight: 12 }}>
                                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                                        {hasConflict && (
                                                            <Ionicons
                                                                name="alert-circle"
                                                                size={16}
                                                                color="#9CA3AF"
                                                                style={{ marginRight: 6 }}
                                                            />
                                                        )}

                                                        <Text
                                                            style={{
                                                                fontFamily: "Onest-SemiBold",
                                                                fontSize: 16,
                                                                fontWeight: "600",
                                                                color: "#000",
                                                            }}
                                                        >
                                                            {formatTimeRange(slot.start_time, slot.end_time)}
                                                        </Text>
                                                    </View>

                                                    {/* price line (matches AvailabilityCalendar vibe) */}
                                                    {slotPrice > 0 && (
                                                        <Text
                                                            style={{
                                                                fontFamily: "Onest",
                                                                fontSize: 14,
                                                                color: "#6B7280",
                                                                marginTop: 2,
                                                            }}
                                                        >
                                                            {formatPrice(slotPrice)} / {item.unit}
                                                        </Text>
                                                    )}

                                                    {/* conflict line */}
                                                    {hasConflict && (
                                                        <Text
                                                            style={{
                                                                fontFamily: "Onest",
                                                                fontSize: 12,
                                                                color: "#9CA3AF",
                                                                marginTop: 6,
                                                            }}
                                                        >
                                                            Conflicts with {conflictingItem?.experience_name || "another activity"}
                                                        </Text>
                                                    )}
                                                </View>

                                                {!hasConflict && (
                                                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                        ) : hasAvailability ? (
                            <View className="py-4 items-center">
                                <Ionicons name="calendar-outline" size={24} color="#9CA3AF" />
                                <Text className="text-black/50 font-onest text-sm mt-2 text-center">
                                    Not available on {selectedDayOfWeek}
                                </Text>
                            </View>
                        ) : (
                            <View className="py-4 items-center">
                                <Ionicons name="alert-circle-outline" size={24} color="#F59E0B" />
                                <Text className="text-black/50 font-onest text-sm mt-2 text-center">
                                    No availability information
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </Pressable>
        );
    };

    return (
        <View
            className="flex-1 bg-gray-50"
            style={{
                paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 50,
            }}
        >
            {/* Header */}
            <View className="bg-white px-6 py-4 border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-2xl font-onest-semibold text-black/90">
                            Browse activities
                        </Text>
                        {selectedDayDate && (
                            <Text className="text-black/50 font-onest mt-1">
                                Day {selectedDayNumber} · {formatDate(selectedDayDate)}
                            </Text>
                        )}
                    </View>
                    <TouchableOpacity
                        onPress={onClose}
                        className="p-2 bg-gray-100 rounded-full"
                    >
                        <Ionicons name="close" size={24} color="#374151" />
                    </TouchableOpacity>
                </View>

                {/* Filter Chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mt-4 -mx-6 px-6"
                >
                    {FILTER_OPTIONS.map((filter) => (
                        <TouchableOpacity
                            key={filter.key}
                            onPress={() => setSelectedFilter(filter.key)}
                            className={`
                mr-2 px-4 py-2 rounded-full
                ${selectedFilter === filter.key ? "bg-blue-500" : "bg-gray-100"}
              `}
                            activeOpacity={0.7}
                        >
                            <Text
                                className={`
                  font-onest-medium text-sm
                  ${selectedFilter === filter.key
                                        ? "text-white"
                                        : "text-black/70"
                                    }
                `}
                            >
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Content */}
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text className="text-black/50 font-onest mt-4">
                        Loading experiences...
                    </Text>
                </View>
            ) : error ? (
                <View className="flex-1 items-center justify-center px-6">
                    <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                    <Text className="text-red-500 font-onest-medium text-center mt-4">
                        {error}
                    </Text>
                    <TouchableOpacity
                        onPress={fetchExperiences}
                        className="mt-4 bg-blue-500 px-6 py-3 rounded-xl"
                    >
                        <Text className="text-white font-onest-medium">Try Again</Text>
                    </TouchableOpacity>
                </View>
            ) : filteredExperiences.length === 0 ? (
                <View className="flex-1 items-center justify-center px-6">
                    <Ionicons name="checkmark-circle-outline" size={48} color="#10B981" />
                    <Text className="text-black/70 font-onest-medium text-center mt-4">
                        {experiences.length > 0
                            ? "All available experiences have been added!"
                            : "No experiences found"}
                    </Text>
                    <Text className="text-black/40 font-onest text-center mt-2">
                        {experiences.length > 0
                            ? "Try a different filter or go back to view your itinerary"
                            : "Try a different filter or check back later"}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredExperiences}
                    renderItem={renderExperienceCard}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ padding: 16 }}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Done Button */}
            {/* <View className="bg-white px-6 py-4 border-t border-gray-100 pb-8">
                <TouchableOpacity
                    onPress={onClose}
                    className="bg-primary py-4 rounded-xl items-center"
                    activeOpacity={0.7}
                >
                    <Text className="text-white font-onest-semibold text-base">Done</Text>
                </TouchableOpacity>
            </View> */}
        </View>
    );
};

export default ExperienceBrowserModal;
