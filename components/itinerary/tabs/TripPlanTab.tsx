// components/itinerary/tabs/TripPlanTab.tsx

import { ItineraryItemCard } from '@/components/itinerary/ItineraryItemCard';
import { TimeSlotEditSheet } from '@/components/itinerary/TimeSlotEditSheet';
import { TravelIndicator } from '@/components/itinerary/TravelIndicator';
import { TripPlanActionBar } from '@/components/itinerary/TripPlanActionBar';
import API_URL from '@/constants/api';
import { useFoodStopsAlongRoute } from '@/hooks/useFoodStopsAlongRoutes';
import { Itinerary, ItineraryItem } from '@/types/itineraryDetails';
import {
    formatTime,
    getDateForDay,
    groupItemsByDay,
    hasEnoughTimeBetween,
} from '@/utils/itinerary-utils';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

interface DayStyles {
    container: string;
    text: string;
    indicator?: string;
}

interface Props {
    itinerary: Itinerary;
    collapsedDays: Set<number>;
    getDayHeaderStyle: (day: number) => DayStyles;
    onToggleDayCollapse: (day: number) => void;
    onNavigateAll: (items: ItineraryItem[]) => void;
    onNavigateSingle: (item: ItineraryItem) => void;
    onNavigateBetween: (from: ItineraryItem, to: ItineraryItem) => void;
    onShowFoodStops: (dayNumber: number, items: ItineraryItem[]) => void;
    onRefresh?: () => void; // Optional callback to refresh itinerary data
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

export function TripPlanTab({
    itinerary,
    collapsedDays,
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

    const { clearCache } = useFoodStopsAlongRoute();

    // FOR CLEAR CACHE
    useEffect(() => {
        clearCache();
        console.log('>>> Cache cleared!');
    }, []);
    // Time Edit Sheet State
    const [timeEditSheetVisible, setTimeEditSheetVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
    const [editingDayDate, setEditingDayDate] = useState<Date | null>(null);
    const [editingDayNumber, setEditingDayNumber] = useState<number | null>(null);

    const dayPositions = useRef<{ [key: number]: number }>({});

    // ============ Time Edit Handlers ============

    const handleEditTime = (item: ItineraryItem, dayNumber: number) => {
        // Calculate the actual date for this day
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

            // Reuse the bulk endpoint with a single item
            const response = await fetch(
                `${API_URL}/itinerary/${itinerary.itinerary_id}/items/bulk-update`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
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
                throw new Error('Failed to update time slot');
            }

            setTimeEditSheetVisible(false);
            setEditingItem(null);
            setEditingDayNumber(null);

            onRefresh?.();
        } catch (error) {
            console.error('Error updating time slot:', error);
            Alert.alert('Error', 'Failed to update time slot. Please try again.');
        }
    };

    const handleCloseTimeEditSheet = () => {
        setTimeEditSheetVisible(false);
        setEditingItem(null);
        setEditingDayNumber(null);
    };

    const handleRemoveItem = (item: ItineraryItem) => {
        // Find the activity payment info for this item
        const paymentInfo = itinerary.payments?.[0];
        const activityPayment = paymentInfo?.activity_payments?.find(
            (ap) => ap.item_id === item.item_id
        );

        const activityPrice = activityPayment?.activity_price || 0;
        const isFullyPaid = activityPayment?.is_fully_paid || false;
        const paymentStatus = paymentInfo?.payment_status || 'Unpaid';

        // Navigate to cancellation screen with booking details
        router.push({
            pathname: '/(traveler)/(cancelBooking)/cancelBooking',
            params: {
                itemId: item.item_id.toString(),
                itineraryId: itinerary.itinerary_id.toString(),
                experienceName: item.experience_name,
                destinationName: item.destination_name,
                destinationCity: item.destination_city,
                startTime: formatTime(item.start_time),
                endTime: formatTime(item.end_time),
                activityPrice: activityPrice.toString(),
                paymentStatus: isFullyPaid ? 'fully_paid' : 'downpayment',
            },
        });
    };

    const getOtherItemsOnDay = (dayNumber: number): ItineraryItem[] => {
        const dayItems = groupedItems[dayNumber] || [];
        return dayItems.filter((item) => item.item_id !== editingItem?.item_id);
    };

    // ============ Day Categorization ============

    const { currentDay, upcomingDays, completedDays, allDays, dayChips } = useMemo(() => {
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

        // Find current day (today or next upcoming if trip hasn't started)
        let current: DayGroup | null = days.find((d) => d.isToday) || null;

        // If no today, get the first upcoming day
        if (!current) {
            current = days.find((d) => d.isFuture) || null;
        }

        // If trip is completed, show the last day as current
        if (!current && days.length > 0) {
            current = days[days.length - 1];
        }

        const upcoming = days.filter(
            (d) => d.isFuture && d.dayNumber !== current?.dayNumber
        );
        const completed = days.filter((d) => d.isPast);

        // Generate day chips data
        const chips: DayChipData[] = days.map((day) => {
            const dayDate = new Date(startDate);
            dayDate.setDate(startDate.getDate() + day.dayNumber - 1);

            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);

            let label = '';
            if (day.isToday) {
                label = 'Today';
            } else if (dayDate.getTime() === tomorrow.getTime()) {
                label = 'Tomorrow';
            } else {
                label = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
            }

            const subLabel = dayDate.toLocaleDateString('en-US', {
                day: 'numeric',
            });

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
            upcomingDays: upcoming,
            completedDays: completed,
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

        // Scroll to the day section
        const position = dayPositions.current[dayNumber];
        if (position !== undefined && mainScrollRef.current) {
            mainScrollRef.current.scrollTo({ y: position, animated: true });
        }

        // Expand the day if it's collapsed
        if (collapsedDays.has(dayNumber)) {
            onToggleDayCollapse(dayNumber);
        }
    };

    const handleDayLayout = (dayNumber: number, y: number) => {
        dayPositions.current[dayNumber] = y;
    };

    // ============ Computed Values ============

    const selectedDay = useMemo(() => {
        if (selectedDayChip !== null) {
            return allDays.find((d) => d.dayNumber === selectedDayChip) || currentDay;
        }
        return currentDay;
    }, [selectedDayChip, allDays, currentDay]);

    const isSelectedDayCompleted = selectedDay?.isPast ?? false;

    const getVariant = (day: DayGroup): 'current' | 'upcoming' | 'completed' => {
        if (day.isToday || day.dayNumber === currentDay?.dayNumber) {
            return 'current';
        }
        if (day.isPast) {
            return 'completed';
        }
        return 'upcoming';
    };

    // ============ Render ============

    return (
        <View className="flex-1 mt-6">
            {/* Horizontal Date Chips */}
            {dayChips.length > 0 && (
                <View className="px-6 mx-4">
                    <ScrollView
                        ref={chipScrollRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="flex-row"
                    >
                        {dayChips.map((chip, index) => {
                            const isSelected =
                                selectedDayChip === chip.dayNumber ||
                                (selectedDayChip === null && chip.isCurrent);

                            return (
                                <Pressable
                                    key={chip.dayNumber}
                                    style={{ width: 80 }}
                                    onPress={() => handleDayChipPress(chip.dayNumber)}
                                    className={`
                                        mr-2 py-3 rounded-xl items-center justify-center w-[80px]
                                        ${isSelected
                                            ? 'bg-blue-500'
                                            : chip.isPast
                                                ? 'bg-gray-200'
                                                : 'bg-gray-50'
                                        }
                                    `}
                                >
                                    <Text
                                        className={`
                                            text-sm font-onest
                                            ${isSelected
                                                ? 'text-white'
                                                : chip.isPast
                                                    ? 'text-black/40'
                                                    : 'text-black/80'
                                            }
                                        `}
                                    >
                                        {chip.label}
                                    </Text>
                                    <Text
                                        className={`
                                            text-xs font-onest mt-0.5
                                            ${isSelected
                                                ? 'text-white/80'
                                                : chip.isPast
                                                    ? 'text-black/30'
                                                    : 'text-black/50'
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
                            forceExpanded={true}
                            onToggle={() => { }}
                            onNavigateSingle={onNavigateSingle}
                            onNavigateBetween={onNavigateBetween}
                            onItemPress={handleItemPress}
                            onEditTime={(item) => handleEditTime(item, selectedDay.dayNumber)}
                            onRemoveItem={handleRemoveItem}
                            variant={getVariant(selectedDay)}
                        />
                    </View>
                ) : (
                    /* Empty State */
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
                )}
            </ScrollView>

            {/* Time Slot Edit Sheet */}
            <TimeSlotEditSheet
                visible={timeEditSheetVisible}
                onClose={handleCloseTimeEditSheet}
                onSave={handleSaveTimeSlot}
                item={editingItem}
                dayDate={editingDayDate}
                otherItemsOnDay={
                    editingDayNumber ? getOtherItemsOnDay(editingDayNumber) : []
                }
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

// ============ Day Card Component ============

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
    variant: 'current' | 'upcoming' | 'completed';
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
}: DayCardProps) {
    const { dayNumber, items, dateString, isToday } = day;
    const showExpanded = forceExpanded || isExpanded;

    // Get relative day label
    const getDayLabel = (): string => {
        if (isToday) return 'Today';

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startDate = new Date(itinerary.start_date);
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + dayNumber - 1);
        dayDate.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        if (dayDate.getTime() === tomorrow.getTime()) return 'Tomorrow';

        return dateString;
    };

    // Styling based on variant
    const getCardStyle = () => {
        switch (variant) {
            case 'current':
                return {
                    container: ' rounded-2xl ',
                    titleColor: 'text-black/90',
                    badgeBg: 'bg-primary',
                    badgeText: 'text-white',
                };
            case 'upcoming':
                return {
                    container: ' rounded-xl ',
                    titleColor: 'text-black/90',
                    showBadge: false,
                    badgeBg: '',
                    badgeText: '',
                    badgeLabel: '',
                };
            case 'completed':
                return {
                    container: ' rounded-xl ',
                    titleColor: 'text-black/50',
                    showBadge: true,
                    badgeBg: 'bg-green-100',
                    badgeText: 'text-green-600',
                    badgeLabel: 'Done',
                };
            default:
                return {
                    container: ' rounded-xl ',
                    titleColor: 'text-black/90',
                    showBadge: false,
                    badgeBg: '',
                    badgeText: '',
                    badgeLabel: '',
                };
        }
    };

    const style = getCardStyle();

    return (
        <View className={`mt-4 ${style.container}`}>
            {/* Day Header */}
            <Pressable
                onPress={forceExpanded ? undefined : onToggle}
                disabled={forceExpanded}
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                        {/* Header content can go here if needed */}
                    </View>
                </View>
            </Pressable>

            {/* Day Items */}
            {showExpanded && (
                <View className={variant === 'completed' ? 'opacity-60' : ''}>
                    {items.map((item, index) => {
                        const nextItem = items[index + 1];
                        const isLast = index === items.length - 1;
                        const timeCheck = nextItem
                            ? hasEnoughTimeBetween(item, nextItem)
                            : null;

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
                                        onEditTime={() => onEditTime(item)}
                                        onRemove={
                                            onRemoveItem
                                                ? () => onRemoveItem(item)
                                                : undefined
                                        }
                                        isCompleted={variant === 'completed'}
                                        swipeEnabled={variant !== 'completed'}
                                    />
                                </View>

                                {nextItem && (
                                    <TravelIndicator
                                        timeCheck={timeCheck}
                                        canNavigate={
                                            canNavigateBetween && variant !== 'completed'
                                        }
                                        onNavigate={() =>
                                            onNavigateBetween(item, nextItem)
                                        }
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