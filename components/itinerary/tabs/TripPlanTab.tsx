// components/itinerary/tabs/TripPlanTab.tsx

import { ItineraryItemCard } from "@/components/itinerary/ItineraryItemCard";
import { PlacesToEatSection } from "@/components/itinerary/PlacesToEatSection";
import { TimeSlotEditSheet } from "@/components/itinerary/TimeSlotEditSheet";
import { TravelIndicator } from "@/components/itinerary/TravelIndicator";
import { TripPlanActionBar } from "@/components/itinerary/TripPlanActionBar";
import API_URL from "@/constants/api";
import { useFoodStopsAlongRoute } from "@/hooks/useFoodStopsAlongRoutes";
import { BookingPayment } from "@/types/bookingPayment";

import {
    Itinerary,
    ItineraryFoodSuggestion,
    ItineraryItem,
} from "@/types/itineraryDetails";
import {
    formatTime,
    getDateForDay,
    groupItemsByDay,
    hasEnoughTimeBetween,
} from "@/utils/itinerary-utils";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";

/* ---------------- Types ---------------- */

interface DayStyles {
    container: string;
    text: string;
    indicator?: string;
}

interface Props {
    itinerary: Itinerary;
    bookingPayments?: BookingPayment[];
    readOnly?: boolean;
    collapsedDays: Set<number>;
    getDayHeaderStyle: (day: number) => DayStyles;
    onToggleDayCollapse: (day: number) => void;
    onNavigateAll: (items: ItineraryItem[]) => void;
    onNavigateSingle: (item: ItineraryItem) => void;
    onNavigateBetween: (from: ItineraryItem, to: ItineraryItem) => void;
    onShowFoodStops: (dayNumber: number, items: ItineraryItem[]) => void;
    onRefresh?: () => void;
}

interface DayGroup {
    dayNumber: number;
    items: ItineraryItem[];
    dateString: string;
    isToday: boolean;
    isPast: boolean;
    isFuture: boolean;
}

interface DayChipData {
    dayNumber: number;
    label: string;
    subLabel: string;
    isToday: boolean;
    isPast: boolean;
    isCurrent: boolean;
}

/* ---------------- Main Component ---------------- */

export function TripPlanTab({
    itinerary,
    collapsedDays,
    bookingPayments,
    readOnly = false,
    getDayHeaderStyle,
    onToggleDayCollapse,
    onNavigateAll,
    onNavigateSingle,
    onNavigateBetween,
    onShowFoodStops,
    onRefresh,
}: Props) {
    const router = useRouter();
    const groupedItems = groupItemsByDay(itinerary.items);
    const mainScrollRef = useRef<ScrollView>(null);
    const chipScrollRef = useRef<ScrollView>(null);
    const [selectedDayChip, setSelectedDayChip] = useState<number | null>(null);
    const canEdit = !readOnly;

    const { clearCache } = useFoodStopsAlongRoute();

    useEffect(() => {
        clearCache();
        console.log(">>> Cache cleared!");
    }, []);

    // Time Edit Sheet State
    const [timeEditSheetVisible, setTimeEditSheetVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
    const [editingDayDate, setEditingDayDate] = useState<Date | null>(null);
    const [editingDayNumber, setEditingDayNumber] = useState<number | null>(null);

    // Cancel Modal State (for unpaid bookings)
    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [cancellingItem, setCancellingItem] = useState<ItineraryItem | null>(null);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [cancelSuccessVisible, setCancelSuccessVisible] = useState(false);

    const dayPositions = useRef<{ [key: number]: number }>({});

    // ============ Time Edit Handlers ============

    const handleEditTime = (item: ItineraryItem, dayNumber: number) => {
        const startDate = new Date(itinerary.start_date);
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + dayNumber - 1);

        setEditingItem(item);
        setEditingDayDate(dayDate);
        setEditingDayNumber(dayNumber);
        setTimeEditSheetVisible(true);
    };

    const handleSaveTimeSlot = async (
        item: ItineraryItem,
        newStartTime: string,
        newEndTime: string
    ) => {
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Error", "Please log in again");
                return;
            }

            const response = await fetch(
                `${API_URL}/itinerary/${itinerary.itinerary_id}/items/bulk-update`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        updates: [
                            {
                                item_id: item.item_id,
                                start_time: newStartTime,
                                end_time: newEndTime,
                            },
                        ],
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to update time slot");
            }

            setTimeEditSheetVisible(false);
            setEditingItem(null);
            setEditingDayNumber(null);

            onRefresh?.();
        } catch (error) {
            console.error("Error updating time slot:", error);
            Alert.alert("Error", "Failed to update time slot. Please try again.");
        }
    };

    const handleCloseTimeEditSheet = () => {
        setTimeEditSheetVisible(false);
        setEditingItem(null);
        setEditingDayNumber(null);
    };

    // ============ Cancel/Remove Handlers ============

    const handleRemoveItem = (item: ItineraryItem) => {
        // Wait for bookings to load
        if (!bookingPayments || bookingPayments.length === 0) {
            Alert.alert(
                "Loading",
                "Payment information is still loading. Please try again in a moment."
            );
            return;
        }

        const booking = bookingPayments.find(
            (b) => b.item_id === item.item_id
        );

        const paymentStatus = booking?.payment_status;

        // Check if the booking has been paid (either fully or downpayment)
        const isPaid = paymentStatus === 'Paid';

        if (isPaid) {
            // Navigate to cancel booking screen for refund process
            const activityPrice = booking?.activity_price || 0;
            const paymentStatusParam = paymentStatus === 'Paid'
                ? 'fully_paid'
                : 'downpayment';

            router.push({
                pathname: "/(traveler)/(cancelBooking)/cancelBooking",
                params: {
                    itemId: item.item_id.toString(),
                    itineraryId: itinerary.itinerary_id.toString(),
                    experienceName: item.experience_name,
                    destinationName: item.destination_name,
                    destinationCity: item.destination_city,
                    startTime: formatTime(item.start_time),
                    endTime: formatTime(item.end_time),
                    activityPrice: activityPrice.toString(),
                    paymentStatus: paymentStatusParam,
                },
            });
        } else {
            // Show confirmation modal for unpaid booking
            setCancellingItem(item);
            setCancelModalVisible(true);
        }
    };

    const handleConfirmCancelUnpaid = async () => {
        if (!cancellingItem) return;

        setCancelLoading(true);

        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Error", "Please log in again");
                setCancelLoading(false);
                return;
            }

            // Use the bulk delete endpoint which does soft delete
            const response = await fetch(
                `${API_URL}/itinerary/${itinerary.itinerary_id}/items/bulk-delete`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        item_ids: [cancellingItem.item_id],
                        cancellation_reason: "Cancelled by traveler",
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to cancel booking");
            }

            setCancelModalVisible(false);
            setCancelSuccessVisible(true);

        } catch (error: any) {
            console.error("Error cancelling booking:", error);
            Alert.alert("Error", error.message || "Failed to cancel booking. Please try again.");
        } finally {
            setCancelLoading(false);
        }
    };

    const handleCloseCancelModal = () => {
        setCancelModalVisible(false);
        setCancellingItem(null);
    };

    const handleCloseSuccessModal = () => {
        setCancelSuccessVisible(false);
        setCancellingItem(null);
        onRefresh?.();
    };

    const getOtherItemsOnDay = (dayNumber: number): ItineraryItem[] => {
        const dayItems = groupedItems[dayNumber] || [];
        return dayItems.filter((item) => item.item_id !== editingItem?.item_id);
    };

    // ============ Day Categorization ============

    const { currentDay, allDays, dayChips } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startDate = new Date(itinerary.start_date);
        startDate.setHours(0, 0, 0, 0);

        const days: DayGroup[] = Object.entries(groupedItems)
            .map(([day, items]) => {
                const dayNumber = parseInt(day);
                const dayDate = new Date(startDate);
                dayDate.setDate(startDate.getDate() + dayNumber - 1);
                dayDate.setHours(0, 0, 0, 0);

                const isToday = dayDate.getTime() === today.getTime();
                const isPast = dayDate < today;
                const isFuture = dayDate > today;

                return {
                    dayNumber,
                    items: [...items].sort((a, b) => a.start_time.localeCompare(b.start_time)),
                    dateString: getDateForDay(itinerary, dayNumber),
                    isToday,
                    isPast,
                    isFuture,
                };
            })
            .sort((a, b) => a.dayNumber - b.dayNumber);

        let current: DayGroup | null = days.find((d) => d.isToday) || null;

        if (!current) {
            current = days.find((d) => d.isFuture) || null;
        }

        if (!current && days.length > 0) {
            current = days[days.length - 1];
        }

        const chips: DayChipData[] = days.map((day) => {
            const dayDate = new Date(startDate);
            dayDate.setDate(startDate.getDate() + day.dayNumber - 1);

            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);

            let label = "";
            if (day.isToday) {
                label = "Today";
            } else if (dayDate.getTime() === tomorrow.getTime()) {
                label = "Tomorrow";
            } else {
                label = dayDate.toLocaleDateString("en-US", { weekday: "short" });
            }

            const subLabel = dayDate.toLocaleDateString("en-US", { day: "numeric" });

            return {
                dayNumber: day.dayNumber,
                label,
                subLabel,
                isToday: day.isToday,
                isPast: day.isPast,
                isCurrent: day.dayNumber === current?.dayNumber,
            };
        });

        return {
            currentDay: current,
            allDays: days,
            dayChips: chips,
        };
    }, [groupedItems, itinerary]);

    // ============ Navigation Handlers ============

    const handleItemPress = (item: ItineraryItem) => {
        router.push(
            `/(traveler)/(experience)/${item.experience_id}?itineraryItemId=${item.item_id}`
        );
    };

    const handleDayChipPress = (dayNumber: number) => {
        setSelectedDayChip(dayNumber);

        const position = dayPositions.current[dayNumber];
        if (position !== undefined && mainScrollRef.current) {
            mainScrollRef.current.scrollTo({ y: position, animated: true });
        }

        if (collapsedDays.has(dayNumber)) {
            onToggleDayCollapse(dayNumber);
        }
    };

    const handleFoodPress = (experienceId: number) => {
        router.push(`/(traveler)/(experience)/${experienceId}`);
    };

    // ============ Computed Values ============

    const selectedDay = useMemo(() => {
        if (selectedDayChip !== null) {
            return allDays.find((d) => d.dayNumber === selectedDayChip) || currentDay;
        }
        return currentDay;
    }, [selectedDayChip, allDays, currentDay]);

    const isSelectedDayCompleted = selectedDay?.isPast ?? false;

    const getVariant = (day: DayGroup): "current" | "upcoming" | "completed" => {
        if (day.isToday || day.dayNumber === currentDay?.dayNumber) {
            return "current";
        }
        if (day.isPast) {
            return "completed";
        }
        return "upcoming";
    };

    // ============ Food Suggestions ============

    const allFoodSuggestions: ItineraryFoodSuggestion[] = useMemo(() => {
        return Array.isArray(itinerary.food_suggestions) ? itinerary.food_suggestions : [];
    }, [itinerary.food_suggestions]);

    // ============ Render ============

    return (
        <View className="flex-1 mt-6">
            {/* Horizontal Date Chips */}
            {dayChips.length > 0 && (
                <DayChipScroller
                    chips={dayChips}
                    selectedDayChip={selectedDayChip}
                    onChipPress={handleDayChipPress}
                    scrollRef={chipScrollRef}
                />
            )}

            <ScrollView
                ref={mainScrollRef}
                className="flex-1 px-6 mx-4"
                contentContainerStyle={{ paddingBottom: 180 }}
                showsVerticalScrollIndicator={false}
            >
                {selectedDay ? (
                    <View className="pt-4">
                        <DayCard
                            day={selectedDay}
                            itinerary={itinerary}
                            isExpanded={true}
                            canEdit={canEdit}
                            forceExpanded={true}
                            onToggle={() => { }}
                            onNavigateSingle={onNavigateSingle}
                            onNavigateBetween={onNavigateBetween}
                            onItemPress={handleItemPress}
                            onEditTime={(item) => handleEditTime(item, selectedDay.dayNumber)}
                            onRemoveItem={handleRemoveItem}
                            variant={getVariant(selectedDay)}
                        />

                        {/* Places to Eat Section */}
                        <PlacesToEatSection
                            allFoodSuggestions={allFoodSuggestions}
                            dayItems={selectedDay.items}
                            onFoodPress={handleFoodPress}
                        />
                    </View>
                ) : (
                    <EmptyState />
                )}
            </ScrollView>

            {/* Time Slot Edit Sheet */}
            <TimeSlotEditSheet
                visible={timeEditSheetVisible}
                onClose={handleCloseTimeEditSheet}
                onSave={handleSaveTimeSlot}
                item={editingItem}
                dayDate={editingDayDate}
                otherItemsOnDay={editingDayNumber ? getOtherItemsOnDay(editingDayNumber) : []}
            />

            {/* Cancel Confirmation Modal (for unpaid bookings) */}
            <CancelConfirmationModal
                visible={cancelModalVisible}
                item={cancellingItem}
                loading={cancelLoading}
                onConfirm={handleConfirmCancelUnpaid}
                onClose={handleCloseCancelModal}
            />

            {/* Cancel Success Modal */}
            <CancelSuccessModal
                visible={cancelSuccessVisible}
                item={cancellingItem}
                onClose={handleCloseSuccessModal}
            />

            {/* Bottom Action Bar */}
            {selectedDay && (
                <TripPlanActionBar
                    items={selectedDay.items}
                    dayNumber={selectedDay.dayNumber}
                    isCompleted={isSelectedDayCompleted}
                    onNavigateAll={onNavigateAll}

                    onNavigateSingle={onNavigateSingle}
                    onShowFoodStops={onShowFoodStops}
                />
            )}
        </View>
    );
}

/* ---------------- Cancel Confirmation Modal ---------------- */

interface CancelConfirmationModalProps {
    visible: boolean;
    item: ItineraryItem | null;
    loading: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

function CancelConfirmationModal({
    visible,
    item,
    loading,
    onConfirm,
    onClose,
}: CancelConfirmationModalProps) {
    if (!item) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50 justify-center items-center px-6">
                <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
                    {/* Icon */}
                    <View className="items-center mb-4">
                        <View className="w-14 h-14 rounded-full bg-orange-100 items-center justify-center">
                            <Ionicons name="alert-circle-outline" size={32} color="#F97316" />
                        </View>
                    </View>

                    {/* Title */}
                    <Text className="text-xl font-onest-semibold text-black/90 text-center mb-2">
                        Cancel Activity?
                    </Text>

                    {/* Description */}
                    <Text className="text-sm font-onest text-black/60 text-center mb-2">
                        Are you sure you want to cancel
                    </Text>
                    <Text className="text-base font-onest-medium text-black/80 text-center mb-6">
                        {item.experience_name}
                    </Text>

                    {/* Buttons */}
                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            onPress={onClose}
                            disabled={loading}
                            className="flex-1 py-3 rounded-xl bg-gray-100"
                            activeOpacity={0.8}
                        >
                            <Text className="text-black/70 font-onest-medium text-center">
                                Keep It
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onConfirm}
                            disabled={loading}
                            className="flex-1 py-3 rounded-xl bg-[#191313]"
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text className="text-white font-onest-medium text-center">
                                    Cancel
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

/* ---------------- Cancel Success Modal ---------------- */

interface CancelSuccessModalProps {
    visible: boolean;
    item: ItineraryItem | null;
    onClose: () => void;
}

function CancelSuccessModal({
    visible,
    item,
    onClose,
}: CancelSuccessModalProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50 justify-center items-center px-6">
                <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
                    {/* Success Icon */}
                    <View className="items-center mb-4">
                        <View className="w-14 h-14 rounded-full bg-green-100 items-center justify-center">
                            <Ionicons name="checkmark-circle" size={32} color="#22C55E" />
                        </View>
                    </View>

                    {/* Title */}
                    <Text className="text-xl font-onest-semibold text-black/90 text-center mb-2">
                        Activity Cancelled
                    </Text>

                    {/* Description */}
                    <Text className="text-sm font-onest text-black/60 text-center mb-6">
                        {item?.experience_name ? (
                            <>
                                <Text className="font-onest-medium text-black/80">
                                    {item.experience_name}
                                </Text>
                                {" "}has been removed from your itinerary.
                            </>
                        ) : (
                            "The activity has been removed from your itinerary."
                        )}
                    </Text>

                    {/* Done Button */}
                    <TouchableOpacity
                        onPress={onClose}
                        className="py-3 rounded-xl bg-primary"
                        activeOpacity={0.8}
                    >
                        <Text className="text-white font-onest-semibold text-center">
                            Done
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

/* ---------------- Day Chip Scroller ---------------- */

interface DayChipScrollerProps {
    chips: DayChipData[];
    selectedDayChip: number | null;
    onChipPress: (dayNumber: number) => void;
    scrollRef: React.RefObject<ScrollView | null>;
}

function DayChipScroller({
    chips,
    selectedDayChip,
    onChipPress,
    scrollRef,
}: DayChipScrollerProps) {
    return (
        <View className="px-6 mx-4">
            <ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row"
            >
                {chips.map((chip) => {
                    const isSelected =
                        selectedDayChip === chip.dayNumber ||
                        (selectedDayChip === null && chip.isCurrent);

                    return (
                        <Pressable
                            key={chip.dayNumber}
                            style={{ width: 80 }}
                            onPress={() => onChipPress(chip.dayNumber)}
                            className={`
                                mr-2 py-3 rounded-xl items-center justify-center w-[80px]
                                ${isSelected ? "bg-blue-500" : chip.isPast ? "bg-gray-200" : "bg-gray-50"}
                            `}
                        >
                            <Text
                                className={`
                                    text-sm font-onest
                                    ${isSelected ? "text-white" : chip.isPast ? "text-black/40" : "text-black/80"}
                                `}
                            >
                                {chip.label}
                            </Text>
                            <Text
                                className={`
                                    text-xs font-onest mt-0.5
                                    ${isSelected ? "text-white/80" : chip.isPast ? "text-black/30" : "text-black/50"}
                                `}
                            >
                                {chip.subLabel}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
}

/* ---------------- Empty State ---------------- */

function EmptyState() {
    return (
        <View className="flex-1 items-center justify-center py-20">
            <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
                <Ionicons name="calendar-outline" size={32} color="#9CA3AF" />
            </View>
            <Text className="text-lg font-onest-medium text-black/90 mb-2">
                No Activities Yet
            </Text>
            <Text className="text-sm font-onest text-black/50 text-center px-8">
                Your trip activities will appear here once you add them.
            </Text>
        </View>
    );
}

/* ---------------- Day Card Component ---------------- */

interface DayCardProps {
    day: DayGroup;
    itinerary: Itinerary;
    isExpanded: boolean;
    forceExpanded?: boolean;
    onToggle: () => void;
    onNavigateSingle: (item: ItineraryItem) => void;
    onNavigateBetween: (from: ItineraryItem, to: ItineraryItem) => void;
    onItemPress: (item: ItineraryItem) => void;
    onEditTime: (item: ItineraryItem) => void;
    onRemoveItem?: (item: ItineraryItem) => void;
    variant: "current" | "upcoming" | "completed";
    canEdit: boolean;
}

function DayCard({
    day,
    itinerary,
    isExpanded,
    forceExpanded = false,
    onToggle,
    onNavigateSingle,
    onNavigateBetween,
    onItemPress,
    onEditTime,
    onRemoveItem,
    variant,
    canEdit
}: DayCardProps) {
    const { dayNumber, items, dateString, isToday } = day;
    const showExpanded = forceExpanded || isExpanded;

    const getDayLabel = (): string => {
        if (isToday) return "Today";

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startDate = new Date(itinerary.start_date);
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + dayNumber - 1);
        dayDate.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        if (dayDate.getTime() === tomorrow.getTime()) return "Tomorrow";

        return dateString;
    };

    const getCardStyle = () => {
        switch (variant) {
            case "current":
                return {
                    container: "rounded-2xl",
                    titleColor: "text-black/90",
                    badgeBg: "bg-primary",
                    badgeText: "text-white",
                };
            case "upcoming":
                return {
                    container: "rounded-xl",
                    titleColor: "text-black/90",
                    showBadge: false,
                    badgeBg: "",
                    badgeText: "",
                    badgeLabel: "",
                };
            case "completed":
                return {
                    container: "rounded-xl",
                    titleColor: "text-black/50",
                    showBadge: true,
                    badgeBg: "bg-green-100",
                    badgeText: "text-green-600",
                    badgeLabel: "Done",
                };
            default:
                return {
                    container: "rounded-xl",
                    titleColor: "text-black/90",
                    showBadge: false,
                    badgeBg: "",
                    badgeText: "",
                    badgeLabel: "",
                };
        }
    };

    const style = getCardStyle();

    return (
        <View className={`mt-4 ${style.container}`}>
            {/* Day Header */}
            <Pressable onPress={forceExpanded ? undefined : onToggle} disabled={forceExpanded}>
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">{/* header content */}</View>
                </View>
            </Pressable>

            {/* Day Items */}
            {showExpanded && (
                <View className={variant === "completed" ? "opacity-60" : ""}>
                    {items.map((item, index) => {
                        const nextItem = items[index + 1];
                        const isLast = index === items.length - 1;
                        const timeCheck = nextItem ? hasEnoughTimeBetween(item, nextItem) : null;

                        const canNavigateBetween = Boolean(
                            nextItem &&
                            item.destination_latitude &&
                            item.destination_longitude &&
                            nextItem.destination_latitude &&
                            nextItem.destination_longitude
                        );

                        return (
                            <React.Fragment key={item.item_id}>
                                <View>
                                    <ItineraryItemCard
                                        item={item}
                                        isLast={isLast && !nextItem}
                                        onPress={() => onItemPress(item)}
                                        onNavigate={() => onNavigateSingle(item)}
                                        onEditTime={canEdit ? () => onEditTime(item) : undefined} // 
                                        onRemove={canEdit && onRemoveItem ? () => onRemoveItem(item) : undefined} // 
                                        isCompleted={variant === "completed"}
                                        swipeEnabled={canEdit && variant !== "completed"} // disables swipe for service
                                    />

                                </View>

                                {nextItem && (
                                    <TravelIndicator
                                        timeCheck={timeCheck}
                                        canNavigate={canNavigateBetween && variant !== "completed"}
                                        onNavigate={() => onNavigateBetween(item, nextItem)}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}
                </View>
            )}
        </View>
    );
}