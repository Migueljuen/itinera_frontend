import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import API_URL from "../../../../constants/api";
import ExperienceBrowserModal from "./ExperienceBrowserModal";

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
    unit?: string;
    price_estimate?: string;
}

interface ItineraryFormData {
    traveler_id: number;
    start_date: string;
    end_date: string;
    title: string;
    notes?: string;
    city: string;
    items: ItineraryItem[];
    preferences?: {
        experiences: any[];
        travelerCount: number;
        travelCompanions?: any[];
    };
    tourGuide?: any | null;
    carService?: any | null;
}

interface StepProps {
    formData: ItineraryFormData;
    setFormData: React.Dispatch<React.SetStateAction<ItineraryFormData>>;
    onNext: () => void;
    onBack: () => void;
}

interface DayChipData {
    dayNumber: number;
    date: Date;
    label: string;
    subLabel: string;
    itemCount: number;
    isEmpty: boolean;
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

// --------------------
// Utility Functions
// --------------------
const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
    });
};

const formatShortDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
        weekday: "short",
    });
};

const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
};

const convertToFormTimeFormat = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    return `${hours}:${minutes}`;
};

const timeToMinutes = (timeString: string) => {
    const [hours, minutes] = timeString.split(":").map((num) => parseInt(num, 10));
    return hours * 60 + minutes;
};

const formatMinutesToDuration = (minutes: number) => {
    if (minutes < 60) {
        return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
        return `${hours} hr`;
    }
    return `${hours} hr ${mins} min`;
};

const sortTimeSlots = (slots: TimeSlot[]) => {
    return [...slots].sort((a, b) => {
        return timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
    });
};

// Calculate gap between two activities
const calculateGap = (endTime1: string, startTime2: string): number => {
    const end = timeToMinutes(endTime1);
    const start = timeToMinutes(startTime2);
    return start - end;
};

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

    return start1Min < end2Min && start2Min < end1Min;
};

// Determine time gap status
interface TimeGapInfo {
    gapMinutes: number;
    message: string;
    hasTime: boolean;
}

const getTimeGapInfo = (gapMinutes: number): TimeGapInfo => {
    if (gapMinutes < 0) {
        return {
            gapMinutes,
            message: "⚠️ Time overlap detected!",
            hasTime: false,
        };
    }
    if (gapMinutes === 0) {
        return {
            gapMinutes,
            message: "Back-to-back activities",
            hasTime: false,
        };
    }
    if (gapMinutes < 15) {
        return {
            gapMinutes,
            message: `Only ${gapMinutes} min gap - might be tight!`,
            hasTime: false,
        };
    }
    if (gapMinutes > 180) {
        return {
            gapMinutes,
            message: `${formatMinutesToDuration(gapMinutes)} gap - consider adding another activity`,
            hasTime: true,
        };
    }
    return {
        gapMinutes,
        message: `${formatMinutesToDuration(gapMinutes)} break`,
        hasTime: true,
    };
};

const groupItemsByDay = (items: ItineraryItem[]) => {
    return items.reduce((acc, item) => {
        if (!acc[item.day_number]) acc[item.day_number] = [];
        acc[item.day_number].push(item);
        return acc;
    }, {} as { [key: number]: ItineraryItem[] });
};

// --------------------
// Main Component
// --------------------
const Step2DaySelection: React.FC<StepProps> = ({
    formData,
    setFormData,
    onNext,
    onBack,
}) => {
    const [selectedDayChip, setSelectedDayChip] = useState<number>(1);
    const [showBrowserModal, setShowBrowserModal] = useState(false);
    const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
    const [showTimeEditModal, setShowTimeEditModal] = useState(false);

    const router = useRouter();

    const handleViewExperience = (experienceId: number) => {

        setShowBrowserModal(false);

        requestAnimationFrame(() => {
            router.push({
                pathname: "/(traveler)/(experience)/[id]",
                params: {
                    id: String(experienceId),
                    viewOnly: "true",
                    tripStartDate: formData.start_date,
                    tripEndDate: formData.end_date,

                },
            });
        });
    };


    // Calculate total days
    const totalDays = useMemo(() => {
        if (!formData.start_date || !formData.end_date) return 0;
        const start = new Date(formData.start_date);
        const end = new Date(formData.end_date);
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }, [formData.start_date, formData.end_date]);

    // Group items by day
    const groupedItems = useMemo(() => {
        return groupItemsByDay(formData.items);
    }, [formData.items]);

    // Generate day chips data
    const dayChips: DayChipData[] = useMemo(() => {
        if (!formData.start_date) return [];

        const startDate = new Date(formData.start_date);

        return Array.from({ length: totalDays }, (_, index) => {
            const dayNumber = index + 1;
            const dayDate = new Date(startDate);
            dayDate.setDate(startDate.getDate() + index);

            const items = groupedItems[dayNumber] || [];

            return {
                dayNumber,
                date: dayDate,
                label: formatShortDate(dayDate),
                subLabel: dayDate.getDate().toString(),
                itemCount: items.length,
                isEmpty: items.length === 0,
            };
        });
    }, [formData.start_date, totalDays, groupedItems]);

    // Get selected day's items - sorted by start time
    const selectedDayItems = useMemo(() => {
        const items = groupedItems[selectedDayChip] || [];
        return [...items].sort((a, b) => {
            return timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
        });
    }, [groupedItems, selectedDayChip]);

    // Get selected day's date
    const selectedDayDate = useMemo(() => {
        if (!formData.start_date) return null;
        const startDate = new Date(formData.start_date);
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + selectedDayChip - 1);
        return dayDate;
    }, [formData.start_date, selectedDayChip]);

    // ---- Helpers for parsing price_estimate like "200-400", "₱1,000 – ₱2,000", "Free" ----
    const parsePriceEstimate = (estimate?: string | null): { min: number; max: number } | null => {
        if (!estimate) return null;

        const raw = String(estimate).trim();
        if (!raw) return null;

        const lower = raw.toLowerCase();

        // common "free" values
        if (["free", "0", "₱0", "php0", "none", "n/a", "-", "—"].includes(lower)) {
            return { min: 0, max: 0 };
        }

        // extract all numbers (supports commas and currency)
        const nums = raw
            .replace(/,/g, "")
            .match(/\d+(\.\d+)?/g)
            ?.map((n) => Number(n))
            .filter((n) => Number.isFinite(n)) ?? [];

        if (nums.length === 0) return null;

        const min = Math.min(...nums);
        const max = Math.max(...nums);

        return { min, max };
    };

    const formatPeso = (n: number) => `₱${Math.round(n).toLocaleString()}`;

    // ✅ Estimated Budget (includes price_estimate when price is missing)
    const estimatedBudget = useMemo(() => {
        const travelerCount = formData.preferences?.travelerCount || 1;

        let minTotal = 0;
        let maxTotal = 0;
        let hasEstimatedRanges = false;

        for (const item of formData.items) {
            const unit = String(item.unit || "").toLowerCase();
            const multiplier = unit === "entry" || unit === "person" ? travelerCount : 1;

            const price = Number(item.price || 0);

            // 1) If we have an actual price, treat it as fixed
            if (price > 0) {
                minTotal += price * multiplier;
                maxTotal += price * multiplier;
                continue;
            }

            // 2) Otherwise, try to use price_estimate as range
            const est = parsePriceEstimate(item.price_estimate);
            if (est) {
                minTotal += est.min * multiplier;
                maxTotal += est.max * multiplier;
                hasEstimatedRanges = hasEstimatedRanges || est.min !== est.max;
                continue;
            }

            // 3) If neither exists, ignore (unknown)
        }

        return {
            min: minTotal,
            max: maxTotal,
            hasEstimatedRanges,
            hasAnyEstimate: formData.items.some((i) => !Number(i.price || 0) && !!parsePriceEstimate(i.price_estimate)),
        };
    }, [formData.items, formData.preferences?.travelerCount]);

    // Handlers
    const handleDayChipPress = (dayNumber: number) => {
        setSelectedDayChip(dayNumber);
    };

    const handleAddExperience = () => {
        setShowBrowserModal(true);
    };

    const handleExperienceAdded = (newItem: ItineraryItem) => {
        setFormData((prev) => ({
            ...prev,
            items: [...prev.items, newItem],
        }));
    };

    const handleRemoveItem = (itemToRemove: ItineraryItem) => {
        Alert.alert(
            "Remove Experience",
            `Are you sure you want to remove "${itemToRemove.experience_name || "this experience"}" from your itinerary?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => {
                        setFormData((prev) => ({
                            ...prev,
                            items: prev.items.filter(
                                (item) =>
                                    !(
                                        item.experience_id === itemToRemove.experience_id &&
                                        item.day_number === itemToRemove.day_number &&
                                        item.start_time === itemToRemove.start_time
                                    )
                            ),
                        }));
                    },
                },
            ]
        );
    };

    const handleEditTime = (item: ItineraryItem) => {
        setEditingItem(item);
        setShowTimeEditModal(true);
    };

    const handleTimeSlotSelected = (newStartTime: string, newEndTime: string) => {
        if (!editingItem) return;

        setFormData((prev) => ({
            ...prev,
            items: prev.items.map((item) => {
                // Match the specific item being edited
                if (
                    item.experience_id === editingItem.experience_id &&
                    item.day_number === editingItem.day_number &&
                    item.start_time === editingItem.start_time
                ) {
                    return {
                        ...item,
                        start_time: newStartTime,
                        end_time: newEndTime,
                    };
                }
                return item;
            }),
        }));

        setShowTimeEditModal(false);
        setEditingItem(null);
    };

    const handleContinue = () => {
        if (formData.items.length === 0) {
            Alert.alert(
                "No Experiences Added",
                "Please add at least one experience to your itinerary before continuing.",
                [{ text: "OK" }]
            );
            return;
        }
        onNext();
    };

    // Check if any items exist
    const hasItems = formData.items.length > 0;

    return (
        <View className="flex-1">
            {/* Header */}
            <View className="mb-4">
                <Text className="text-2xl font-onest-semibold text-black/90">
                    Build Your Itinerary
                </Text>
                <Text className="text-black/50 font-onest mt-1">
                    Select a day and add experiences
                </Text>
            </View>

            {/* Summary Card */}
            {hasItems && (
                <View className="bg-gray-50 rounded-xl p-4 mb-4">
                    <View className="flex-row justify-between items-center">
                        <View>
                            <Text className="text-black/50 font-onest text-sm">
                                Estimated Budget
                            </Text>

                            <Text className="text-2xl font-onest-bold text-black/90">
                                {estimatedBudget.min === estimatedBudget.max
                                    ? formatPeso(estimatedBudget.min)
                                    : `${formatPeso(estimatedBudget.min)} – ${formatPeso(estimatedBudget.max)}`}
                            </Text>
                        </View>

                        <View className="bg-blue-50 rounded-xl px-3 py-2">
                            <Text className="text-blue-700 font-onest-semibold text-sm">
                                {formData.items.length} {formData.items.length === 1 ? "experience" : "experiences"}
                            </Text>
                        </View>
                    </View>

                    {/* Note about estimates */}
                    {estimatedBudget.hasAnyEstimate && (
                        <Text className="text-black/50 font-onest text-xs mt-2">
                            Includes estimated pricing for activities without a fixed price.
                        </Text>
                    )}
                </View>
            )}

            {/* Horizontal Day Chips */}
            {dayChips.length > 0 && (
                <View className="mb-4">
                    <ScrollView
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
                                                ? "bg-gray-50"
                                                : "bg-gray-200"
                                        }
                                    `}
                                >
                                    <Text
                                        className={`
                                            text-sm font-onest
                                            ${isSelected
                                                ? "text-white"
                                                : chip.isEmpty
                                                    ? "text-black/40"
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
                                                    ? "text-black/30"
                                                    : "text-black/50"
                                            }
                                        `}
                                    >
                                        {chip.subLabel}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {/* Selected Day Content */}
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                {/* Day Items with Timeline */}
                {selectedDayItems.length > 0 ? (
                    <View className="pt-4">
                        {selectedDayItems.map((item, index) => {
                            const nextItem = selectedDayItems[index + 1];
                            const isLast = index === selectedDayItems.length - 1;

                            // Calculate gap to next item
                            const timeGapInfo = nextItem
                                ? getTimeGapInfo(calculateGap(item.end_time, nextItem.start_time))
                                : null;

                            return (
                                <React.Fragment key={`${selectedDayChip}-${item.experience_id}-${index}`}>
                                    {/* Itinerary Item Card */}
                                    <ItineraryBuilderItemCard
                                        item={item}
                                        isLast={isLast && !nextItem}
                                        onRemove={() => handleRemoveItem(item)}
                                        onEditTime={() => handleEditTime(item)}
                                    />

                                    {/* Travel/Gap Indicator */}
                                    {timeGapInfo && (
                                        <TravelGapIndicator timeGapInfo={timeGapInfo} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </View>
                ) : (
                    <View className="py-12 items-center">
                        <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
                            <Ionicons name="calendar-outline" size={32} color="#9CA3AF" />
                        </View>
                        <Text className="text-black/70 font-onest-medium text-base mb-1">
                            No experiences yet
                        </Text>
                        <Text className="text-black/40 font-onest text-sm text-center px-8">
                            Tap the button below to add experiences for this day
                        </Text>
                    </View>
                )}

                {/* Add Experience Button */}
                <TouchableOpacity
                    onPress={handleAddExperience}
                    className="mt-4 py-4 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 items-center justify-center flex-row"
                    activeOpacity={0.7}
                >
                    <Ionicons name="add-circle-outline" size={24} color="#3B82F6" />
                    <Text className="text-blue-600 font-onest-medium ml-2">
                        Add Experience
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Navigation Buttons */}
            <View className="flex-row justify-between py-4 border-t border-gray-100">
                <TouchableOpacity
                    onPress={onBack}
                    className="py-3 px-6 rounded-xl border border-gray-200 bg-gray-50"
                    activeOpacity={0.7}
                >
                    <Text className="text-center font-onest-medium text-base text-black/70">
                        Back
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleContinue}
                    className={`py-3 px-8 rounded-xl ${hasItems ? "bg-primary" : "bg-gray-300"
                        }`}
                    activeOpacity={0.7}
                >
                    <Text
                        className={`text-center font-onest-medium text-base ${hasItems ? "text-white" : "text-black/40"
                            }`}
                    >
                        Continue
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Experience Browser Modal */}
            <Modal
                visible={showBrowserModal}
                animationType="slide"
                presentationStyle="fullScreen"
            >
                <ExperienceBrowserModal
                    city={formData.city}
                    tripStartDate={formData.start_date}
                    tripEndDate={formData.end_date}
                    selectedDayNumber={selectedDayChip}
                    selectedDayDate={selectedDayDate}
                    travelerCount={formData.preferences?.travelerCount ?? 1}
                    existingItems={formData.items}
                    onAddExperience={handleExperienceAdded}
                    onClose={() => setShowBrowserModal(false)}
                    onViewExperience={handleViewExperience}
                />
            </Modal>

            {/* Time Edit Modal */}
            <TimeSlotEditModal
                visible={showTimeEditModal}
                item={editingItem}
                selectedDayDate={selectedDayDate}
                existingItems={selectedDayItems}
                onSelectTimeSlot={handleTimeSlotSelected}
                onClose={() => {
                    setShowTimeEditModal(false);
                    setEditingItem(null);
                }}
            />
        </View>
    );
};

// --------------------
// Time Slot Edit Modal
// --------------------
interface TimeSlotEditModalProps {
    visible: boolean;
    item: ItineraryItem | null;
    selectedDayDate: Date | null;
    existingItems: ItineraryItem[];
    onSelectTimeSlot: (startTime: string, endTime: string) => void;
    onClose: () => void;
}

const TimeSlotEditModal: React.FC<TimeSlotEditModalProps> = ({
    visible,
    item,
    selectedDayDate,
    existingItems,
    onSelectTimeSlot,
    onClose,
}) => {
    const [availabilityData, setAvailabilityData] = useState<AvailabilityDay[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get day of week for the selected date
    const selectedDayOfWeek = useMemo(() => {
        if (!selectedDayDate) return "";
        return selectedDayDate.toLocaleDateString("en-US", { weekday: "long" });
    }, [selectedDayDate]);

    // Fetch availability when modal opens
    useEffect(() => {
        if (visible && item) {
            fetchAvailability(item.experience_id);
        }
    }, [visible, item]);

    const fetchAvailability = async (experienceId: number) => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(
                `${API_URL}/experience/${experienceId}/availability`
            );

            if (response.data?.availability) {
                setAvailabilityData(response.data.availability);
            }
        } catch (err) {
            console.error("Error fetching availability:", err);
            setError("Failed to load availability");
        } finally {
            setLoading(false);
        }
    };

    // Get available slots for the selected day
    const availableSlots = useMemo(() => {
        if (!availabilityData.length) return [];

        const dayAvailability = availabilityData.find(
            (a) => a.day_of_week === selectedDayOfWeek
        );

        if (!dayAvailability) return [];

        return sortTimeSlots(dayAvailability.time_slots);
    }, [availabilityData, selectedDayOfWeek]);

    // Check if a time slot has conflict with other existing items (excluding current item)
    const getTimeSlotConflict = (startTime: string, endTime: string): ItineraryItem | null => {
        const formattedStart = convertToFormTimeFormat(startTime);
        const formattedEnd = convertToFormTimeFormat(endTime);

        for (const existingItem of existingItems) {
            // Skip the item being edited
            if (
                item &&
                existingItem.experience_id === item.experience_id &&
                existingItem.start_time === item.start_time
            ) {
                continue;
            }

            if (hasTimeConflict(formattedStart, formattedEnd, existingItem.start_time, existingItem.end_time)) {
                return existingItem;
            }
        }
        return null;
    };

    // Check if slot is currently selected
    const isCurrentSlot = (slot: TimeSlot): boolean => {
        if (!item) return false;
        const formattedStart = convertToFormTimeFormat(slot.start_time);
        const formattedEnd = convertToFormTimeFormat(slot.end_time);
        return item.start_time === formattedStart && item.end_time === formattedEnd;
    };

    const handleSlotPress = (slot: TimeSlot) => {
        const formattedStart = convertToFormTimeFormat(slot.start_time);
        const formattedEnd = convertToFormTimeFormat(slot.end_time);
        onSelectTimeSlot(formattedStart, formattedEnd);
    };

    if (!item) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/50">
                <View className="bg-white rounded-t-3xl max-h-[70%]">
                    {/* Header */}
                    <View className="px-6 py-4 border-b border-gray-100">
                        <View className="flex-row items-center justify-between">
                            <View className="flex-1 mr-4">
                                <Text className="text-xl font-onest-semibold text-black/90">
                                    Change Time
                                </Text>
                                <Text className="text-black/50 font-onest mt-1" numberOfLines={1}>
                                    {item.experience_name}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={onClose}
                                className="p-2 bg-gray-100 rounded-full"
                            >
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Content */}
                    <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
                        {loading ? (
                            <View className="py-8 items-center">
                                <ActivityIndicator size="large" color="#3B82F6" />
                                <Text className="text-black/50 font-onest mt-4">
                                    Loading availability...
                                </Text>
                            </View>
                        ) : error ? (
                            <View className="py-8 items-center">
                                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                                <Text className="text-red-500 font-onest-medium text-center mt-4">
                                    {error}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => item && fetchAvailability(item.experience_id)}
                                    className="mt-4 bg-blue-500 px-6 py-3 rounded-xl"
                                >
                                    <Text className="text-white font-onest-medium">Try Again</Text>
                                </TouchableOpacity>
                            </View>
                        ) : availableSlots.length > 0 ? (
                            <View>
                                <Text className="text-black/70 font-onest-medium mb-4">
                                    {"Available times on " + selectedDayOfWeek}
                                </Text>

                                {availableSlots.map((slot, idx) => {
                                    const conflictingItem = getTimeSlotConflict(
                                        slot.start_time,
                                        slot.end_time
                                    );
                                    const hasConflict = conflictingItem !== null;
                                    const isCurrent = isCurrentSlot(slot);

                                    return (
                                        <TouchableOpacity
                                            key={idx}
                                            onPress={() => !hasConflict && !isCurrent && handleSlotPress(slot)}
                                            disabled={hasConflict || isCurrent}
                                            className={`
                                                mb-3 px-4 py-4 rounded-xl border
                                                ${isCurrent
                                                    ? "bg-blue-500 border-blue-500"
                                                    : hasConflict
                                                        ? "bg-gray-100 border-gray-200"
                                                        : "bg-white border-gray-200"
                                                }
                                            `}
                                            activeOpacity={0.7}
                                        >
                                            <View className="flex-row items-center justify-between">
                                                <View className="flex-row items-center">
                                                    {isCurrent && (
                                                        <Ionicons
                                                            name="checkmark-circle"
                                                            size={20}
                                                            color="#ffffff"
                                                            style={{ marginRight: 8 }}
                                                        />
                                                    )}
                                                    {hasConflict && (
                                                        <Ionicons
                                                            name="alert-circle"
                                                            size={20}
                                                            color="#9CA3AF"
                                                            style={{ marginRight: 8 }}
                                                        />
                                                    )}
                                                    <Text
                                                        className={`font-onest-semibold text-lg ${isCurrent
                                                            ? "text-white"
                                                            : hasConflict
                                                                ? "text-gray-400"
                                                                : "text-black/90"
                                                            }`}
                                                    >
                                                        {formatTime(slot.start_time) + " - " + formatTime(slot.end_time)}
                                                    </Text>
                                                </View>

                                                {isCurrent && (
                                                    <Text className="text-white/80 font-onest text-sm">
                                                        Current
                                                    </Text>
                                                )}
                                            </View>

                                            {hasConflict && (
                                                <Text className="text-gray-400 font-onest text-sm mt-2">
                                                    {"Conflicts with " + (conflictingItem?.experience_name || "another activity")}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : (
                            <View className="py-8 items-center">
                                <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
                                <Text className="text-black/50 font-onest-medium text-center mt-4">
                                    {"Not available on " + selectedDayOfWeek}
                                </Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Safe area padding */}
                    <View className="h-8" />
                </View>
            </View>
        </Modal>
    );
};

// --------------------
// Itinerary Builder Item Card (Timeline Style)
// --------------------
interface ItineraryBuilderItemCardProps {
    item: ItineraryItem;
    isLast: boolean;
    onRemove: () => void;
    onEditTime: () => void;
}

const ItineraryBuilderItemCard: React.FC<ItineraryBuilderItemCardProps> = ({
    item,
    isLast,
    onRemove,
    onEditTime,
}) => {
    const startTimeDisplay = formatTime(item.start_time);
    const endTimeDisplay = formatTime(item.end_time);

    // Determine if we have an actual price or just an estimate
    const hasActualPrice = item.price !== undefined && item.price !== null && Number(item.price) > 0;
    const hasPriceEstimate = !hasActualPrice && item.price_estimate;

    return (
        <View className="flex-row">
            {/* Timeline Column */}
            <View className="w-6 items-center mr-3">
                {/* Dot */}
                <View className="w-3 h-3 rounded-full mt-2 z-10 bg-blue-500" />

                {/* Connecting line - extends from dot to bottom */}
                {!isLast && (
                    <View
                        style={{
                            flex: 1,
                            width: 1,
                            backgroundColor: '#d1d5db',
                            marginTop: 2,
                        }}
                    />
                )}
            </View>

            {/* Content Column */}
            <View className="flex-1 pb-6">
                {/* Experience Name */}
                <Text
                    className="text-2xl font-onest text-black/90 mb-1"
                    numberOfLines={1}
                >
                    {item.experience_name || "Unnamed Experience"}
                </Text>

                {/* Location */}
                {(item.destination_name || item.destination_city) && (
                    <View className="flex-row items-center">
                        <Ionicons
                            name="location-outline"
                            size={14}
                            color="#4F46E5"
                        />
                        <Text
                            className="text-sm font-onest ml-1 text-black/50"
                            numberOfLines={1}
                        >
                            {[item.destination_name, item.destination_city]
                                .filter(Boolean)
                                .join(", ")}
                        </Text>
                    </View>
                )}

                {/* Time & Actions Row */}
                <View className="mt-8 flex flex-row items-center justify-between">
                    {/* Tappable Time Display */}
                    <Pressable
                        onPress={onEditTime}
                        className="flex-row items-center"
                    >
                        <Text
                            className="text-2xl font-onest text-black/90"
                            numberOfLines={1}
                        >
                            {startTimeDisplay + " - " + endTimeDisplay}
                        </Text>
                        <Ionicons
                            name="chevron-down"
                            size={20}
                            color="#3B82F6"
                            style={{ marginLeft: 8 }}
                        />
                    </Pressable>

                    {/* Remove Button */}
                    <Pressable
                        onPress={onRemove}
                        style={{ backgroundColor: '#fee2e2' }}
                        className="rounded-2xl px-4 py-3"
                    >
                        <Ionicons name="trash-outline" size={24} color="#dc2626" />
                    </Pressable>
                </View>

                {/* Price Display - Show actual price OR price estimate */}
                {hasActualPrice ? (
                    <View className="mt-3 flex-row items-center">
                        <Text className="text-sm font-onest text-black/50">
                            {"₱" + item.price!.toLocaleString() + (item.unit ? " / " + item.unit : "")}
                        </Text>
                    </View>
                ) : hasPriceEstimate ? (
                    <View className="mt-3 flex-row items-center">
                        <Text className="text-sm font-onest text-black/50 italic">
                            {"Est. " + item.price_estimate}
                        </Text>
                    </View>
                ) : null}
            </View>
        </View>
    );
};

// --------------------
// Travel Gap Indicator (Timeline Style)
// --------------------
interface TravelGapIndicatorProps {
    timeGapInfo: TimeGapInfo;
}

const TravelGapIndicator: React.FC<TravelGapIndicatorProps> = ({ timeGapInfo }) => {
    const hasTimeConflict = !timeGapInfo.hasTime;

    return (
        <View className="flex-row">
            {/* Timeline Column - continues the line */}
            <View className="w-6 items-center mr-3">
                <View
                    style={{
                        width: 1,
                        height: 60,
                        backgroundColor: '#d1d5db',
                    }}
                />
            </View>

            {/* Content Column */}
            <View className="flex-1 h-16 justify-center">
                <View className="flex-row items-center gap-2">
                    <Ionicons
                        name={hasTimeConflict ? "warning-outline" : "time-outline"}
                        size={16}
                        color={hasTimeConflict ? "#D97706" : "#6B7280"}
                    />
                    <Text
                        className={`text-sm font-onest ${hasTimeConflict ? 'text-amber-600' : 'text-black/50'
                            }`}
                    >
                        {timeGapInfo.message}
                    </Text>
                </View>
            </View>
        </View>
    );
};

export default Step2DaySelection;