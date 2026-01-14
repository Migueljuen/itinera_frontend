// components/itinerary/tabs/TripPlanTab.tsx

import { ItineraryItemCard } from '@/components/itinerary/ItineraryItemCard';
import { TravelIndicator } from '@/components/itinerary/TravelIndicator';
import { TripPlanActionBar } from '@/components/itinerary/TripPlanActionBar';
import { Itinerary, ItineraryItem } from '@/types/itineraryDetails';
import {
    getDateForDay,
    groupItemsByDay,
    hasEnoughTimeBetween,
} from '@/utils/itinerary-utils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

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
}: Props) {
    const router = useRouter();
    const groupedItems = groupItemsByDay(itinerary.items);
    const mainScrollRef = useRef<ScrollView>(null);
    const chipScrollRef = useRef<ScrollView>(null);
    const [selectedDayChip, setSelectedDayChip] = useState<number | null>(null);

    const dayPositions = useRef<{ [key: number]: number }>({});

    // Categorize days into: current/today, upcoming, and completed
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
                day: 'numeric'
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

    const selectedDay = useMemo(() => {
        if (selectedDayChip !== null) {
            return allDays.find(d => d.dayNumber === selectedDayChip) || currentDay;
        }
        return currentDay;
    }, [selectedDayChip, allDays, currentDay]);

    // Determine if selected day is completed
    const isSelectedDayCompleted = selectedDay?.isPast ?? false;

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
                            const isSelected = selectedDayChip === chip.dayNumber ||
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
                contentContainerStyle={{ paddingBottom: 120 }} // Extra padding for action bar
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
                            variant={
                                selectedDay.isToday || selectedDay.dayNumber === currentDay?.dayNumber
                                    ? 'current'
                                    : selectedDay.isPast
                                        ? 'completed'
                                        : 'upcoming'
                            }
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
                                        isCompleted={variant === 'completed'}
                                    />
                                </View>

                                {nextItem && (
                                    <TravelIndicator
                                        timeCheck={timeCheck}
                                        canNavigate={canNavigateBetween && variant !== 'completed'}
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