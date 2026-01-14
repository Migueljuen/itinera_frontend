// components/itinerary/tabs/OverviewTab.tsx

import API_URL from '@/constants/api';
import { usePaymentSummary } from '@/hooks/usePaymentSummary';
import { Itinerary, ItineraryItem } from '@/types/itineraryDetails';
import { getImageUri } from '@/utils/itinerary-utils';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';

interface Props {
    itinerary: Itinerary;
    onAddToCalendar: () => void;
    onNavigateToTab: (tab: 'tripplan' | 'payment') => void;
}

export function OverviewTab({ itinerary, onAddToCalendar, onNavigateToTab }: Props) {
    const paymentSummary = usePaymentSummary(itinerary.payments?.[0]);

    const stats = calculateTripStats(itinerary);
    const upcomingActivities = getUpcomingActivities(itinerary, 2);
    const highlights = getHighlights(itinerary.items, 3);

    return (
        <ScrollView className="flex-1 px-6 mx-4 mt-6" contentContainerStyle={{ paddingBottom: 100 }}>
            <View className=' '>
                <View className='flex justify-between  flex-row items-center'>
                    <Text className='text-2xl font-onest-medium '>Itinerary Notes</Text>
                    <Pressable >
                        <Text className="text-sm font-onest text-primary">Edit</Text>
                    </Pressable>
                </View>
                <Text className='text-black/50 mt-4'>{itinerary.notes}</Text>
            </View>
            {/* <QuickStatsSection stats={stats} /> */}
            {/* {itinerary.status === 'ongoing' && (
                <TripProgressSection itinerary={itinerary} stats={stats} />
            )} */}

            {upcomingActivities.length > 0 && (
                <UpcomingSection
                    activities={upcomingActivities}
                    itinerary={itinerary}
                    onViewAll={() => onNavigateToTab('tripplan')}
                />
            )}
            {highlights.length > 0 && (
                <HighlightsSection highlights={highlights} />
            )}

            {paymentSummary && (
                <PaymentPreviewCard
                    summary={paymentSummary}
                    onViewDetails={() => onNavigateToTab('payment')}
                />
            )}
            {/* <QuickActionsSection
                onAddToCalendar={onAddToCalendar}
                onShare={() => { }}
                onDownload={() => { }}
            /> */}
        </ScrollView>
    );
}

// ============ Helper Functions ============

function getDateForDayNumber(startDate: string, dayNumber: number): Date {
    const start = new Date(startDate);
    const result = new Date(start);
    result.setDate(start.getDate() + dayNumber - 1);
    return result;
}

function isItemInPast(itinerary: Itinerary, item: ItineraryItem): boolean {
    const itemDate = getDateForDayNumber(itinerary.start_date, item.day_number);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    itemDate.setHours(0, 0, 0, 0);
    return itemDate < today;
}

function isItemToday(itinerary: Itinerary, item: ItineraryItem): boolean {
    const itemDate = getDateForDayNumber(itinerary.start_date, item.day_number);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    itemDate.setHours(0, 0, 0, 0);
    return itemDate.getTime() === today.getTime();
}

function hasItemTimePassed(item: ItineraryItem): boolean {
    const now = new Date();
    const [hours, minutes] = item.end_time.split(':').map(Number);
    const itemEndTime = new Date();
    itemEndTime.setHours(hours, minutes, 0, 0);
    return now > itemEndTime;
}

// ============ Stats Calculation ============

interface TripStats {
    totalDays: number;
    totalNights: number;
    totalActivities: number;
    uniqueDestinations: string[];
    totalEstimatedCost: number;
    currentDay?: number;
    completedActivities: number;
}

function calculateTripStats(itinerary: Itinerary): TripStats {
    const startDate = new Date(itinerary.start_date);
    const endDate = new Date(itinerary.end_date);
    const today = new Date();

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalNights = Math.max(0, totalDays - 1);

    const uniqueDestinations = [...new Set(
        itinerary.items.map(item => item.destination_city).filter(Boolean)
    )];

    let currentDay: number | undefined;
    const todayNormalized = new Date(today);
    todayNormalized.setHours(0, 0, 0, 0);
    const startNormalized = new Date(startDate);
    startNormalized.setHours(0, 0, 0, 0);
    const endNormalized = new Date(endDate);
    endNormalized.setHours(0, 0, 0, 0);

    if (todayNormalized >= startNormalized && todayNormalized <= endNormalized) {
        currentDay = Math.ceil((todayNormalized.getTime() - startNormalized.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }

    const completedActivities = itinerary.items.filter(item => {
        if (isItemInPast(itinerary, item)) {
            return true;
        }
        if (isItemToday(itinerary, item) && hasItemTimePassed(item)) {
            return true;
        }
        return false;
    }).length;

    return {
        totalDays,
        totalNights,
        totalActivities: itinerary.items.length,
        uniqueDestinations,
        totalEstimatedCost: itinerary.payments?.[0]?.total_amount || 0,
        currentDay,
        completedActivities,
    };
}

function getUpcomingActivities(itinerary: Itinerary, limit: number): ItineraryItem[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return itinerary.items
        .filter(item => {
            const itemDate = getDateForDayNumber(itinerary.start_date, item.day_number);
            itemDate.setHours(0, 0, 0, 0);

            if (itemDate > today) {
                return true;
            }

            if (itemDate.getTime() === today.getTime() && !hasItemTimePassed(item)) {
                return true;
            }

            return false;
        })
        .sort((a, b) => {
            const dayCompare = a.day_number - b.day_number;
            if (dayCompare !== 0) return dayCompare;
            return a.start_time.localeCompare(b.start_time);
        })
        .slice(0, limit);
}

function getHighlights(items: ItineraryItem[], limit: number): ItineraryItem[] {
    return items
        .filter(item => item.primary_image)
        .slice(0, limit);
}

// ============ Sub-Components ============

function TripHeaderCard({ itinerary, stats }: { itinerary: Itinerary; stats: TripStats }) {
    const statusConfig = {
        pending: { bg: 'bg-gray-100', text: 'text-black/60', label: 'Pending' },
        upcoming: { bg: 'bg-indigo-100', text: 'text-primary', label: 'Upcoming' },
        ongoing: { bg: 'bg-green-100', text: 'text-green-600', label: 'Ongoing' },
        completed: { bg: 'bg-gray-100', text: 'text-black/50', label: 'Completed' },
        cancelled: { bg: 'bg-red-100', text: 'text-red-500', label: 'Cancelled' },
    };

    const status = statusConfig[itinerary.status] || statusConfig.pending;

    const durationText = stats.totalNights > 0
        ? `${stats.totalDays} ${stats.totalDays === 1 ? 'day' : 'days'}, ${stats.totalNights} ${stats.totalNights === 1 ? 'night' : 'nights'}`
        : `${stats.totalDays} ${stats.totalDays === 1 ? 'day' : 'days'}`;

    return (
        <View className="mx-4 mt-4 hidden bg-white rounded-2xl p-5 shadow-sm">
            {/* <View className="flex-row justify-between items-start mb-3">
                <View className={`px-3 py-1 rounded-full ${status.bg}`}>
                    <Text className={`text-xs font-onest-medium ${status.text}`}>
                        {status.label}
                    </Text>
                </View>
                {stats.currentDay !== undefined && (
                    <Text className="text-xs font-onest text-black/50">
                        {`Day ${stats.currentDay} of ${stats.totalDays}`}
                    </Text>
                )}
            </View>

            <Text className="text-2xl font-onest-semibold text-black/90 mb-1">
                {itinerary.title}
            </Text>

            <View className="flex-row items-center mt-2">
                <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                <Text className="text-sm text-black/50 font-onest ml-2">
                    {`${formatDate(itinerary.start_date)} — ${formatDate(itinerary.end_date)}`}
                </Text>
            </View>

            <View className="flex-row items-center mt-1.5">
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text className="text-sm text-black/50 font-onest ml-2">
                    {durationText}
                </Text>
            </View>

            {stats.uniqueDestinations.length > 0 && (
                <View className="flex-row items-center mt-1.5">
                    <Ionicons name="location-outline" size={16} color="#6B7280" />
                    <Text className="text-sm text-black/50 font-onest ml-2" numberOfLines={1}>
                        {stats.uniqueDestinations.join(' • ')}
                    </Text>
                </View>
            )} */}
        </View>
    );
}

function QuickStatsSection({ stats }: { stats: TripStats }) {
    const statItems = [
        { icon: 'calendar-outline' as const, value: stats.totalDays, label: 'Days' },
        { icon: 'flag-outline' as const, value: stats.totalActivities, label: 'Activities' },
        { icon: 'location-outline' as const, value: stats.uniqueDestinations.length, label: 'Places' },
    ];

    return (
        <View className="flex-row mx-4 mt-4 gap-3">
            {statItems.map((item, index) => (
                <View
                    key={index}
                    className="flex-1 bg-white rounded-xl p-4 items-center shadow-sm"
                >
                    <View className="w-10 h-10 rounded-full bg-indigo-50 items-center justify-center mb-2">
                        <Ionicons name={item.icon} size={20} color="#4F46E5" />
                    </View>
                    <Text className="text-xl font-onest-semibold text-black/90">
                        {item.value}
                    </Text>
                    <Text className="text-xs font-onest text-black/50 mt-0.5">
                        {item.label}
                    </Text>
                </View>
            ))}
        </View>
    );
}

function TripProgressSection({ itinerary, stats }: { itinerary: Itinerary; stats: TripStats }) {
    const progress = stats.currentDay ? (stats.currentDay / stats.totalDays) * 100 : 0;
    const activityProgress = stats.totalActivities > 0
        ? (stats.completedActivities / stats.totalActivities) * 100
        : 0;

    return (
        <View className="mx-4 mt-4 bg-white rounded-xl p-4 shadow-sm">
            <Text className="text-sm font-onest-medium text-black/90 mb-3">Trip Progress</Text>

            <View className="mb-3">
                <View className="flex-row justify-between mb-1.5">
                    <Text className="text-xs font-onest text-black/50">
                        {`Day ${stats.currentDay} of ${stats.totalDays}`}
                    </Text>
                    <Text className="text-xs font-onest text-primary">
                        {`${Math.round(progress)}%`}
                    </Text>
                </View>
                <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <View className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                </View>
            </View>

            <View>
                <View className="flex-row justify-between mb-1.5">
                    <Text className="text-xs font-onest text-black/50">
                        {`${stats.completedActivities} of ${stats.totalActivities} activities done`}
                    </Text>
                    <Text className="text-xs font-onest text-green-600">
                        {`${Math.round(activityProgress)}%`}
                    </Text>
                </View>
                <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <View className="h-full bg-green-500 rounded-full" style={{ width: `${activityProgress}%` }} />
                </View>
            </View>
        </View>
    );
}

function PaymentPreviewCard({
    summary,
    onViewDetails,
}: {
    summary: NonNullable<ReturnType<typeof usePaymentSummary>>;
    onViewDetails: () => void;
}) {
    const { isPaid, totalPaid, remainingBalance } = summary;

    const statusText = isPaid ? 'Payment Complete' : 'Payment Pending';
    const amountText = isPaid
        ? `₱${totalPaid.toLocaleString()} paid`
        : `₱${remainingBalance.toLocaleString()} remaining`;

    return (
        <>
            <Text className="text-2xl mt-12  font-onest-medium text-black/90 ">Payment Details</Text>
            <Pressable
                onPress={onViewDetails}
                className=" flex-row items-center justify-between mt-4"
            >
                <View className="flex-row items-center flex-1">
                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isPaid ? 'bg-green-100' : 'bg-yellow-100'}`}>
                        <Ionicons
                            name={isPaid ? 'checkmark-circle' : 'card'}
                            size={20}
                            color={isPaid ? '#059669' : '#D97706'}
                        />
                    </View>
                    <View className="flex-1">
                        <Text className="text-sm font-onest-medium text-black/90">
                            {statusText}
                        </Text>
                        <Text className="text-xs font-onest text-black/50 mt-0.5">
                            {amountText}
                        </Text>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </Pressable>
        </>
    );
}

function UpcomingSection({
    activities,
    itinerary,
    onViewAll,
}: {
    activities: ItineraryItem[];
    itinerary: Itinerary;
    onViewAll: () => void;
}) {
    return (
        <View className="mt-12 ">
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-2xl font-onest-medium text-black/90">Coming Up</Text>
                <Pressable onPress={onViewAll}>
                    <Text className="text-sm font-onest text-primary">View all</Text>
                </Pressable>
            </View>

            {activities.map((activity, index) => {
                const isToday = isItemToday(itinerary, activity);
                const timeDisplay = activity.start_time ? activity.start_time.slice(0, 5) : '';

                return (
                    <View
                        key={activity.item_id}
                        className={` flex-row items-center ${index < activities.length - 1 ? 'mb-3' : ''}`}
                    >
                        {activity.primary_image ? (
                            <Image
                                source={{ uri: getImageUri(activity.primary_image, API_URL) }}
                                className="w-14 h-14 rounded-lg mr-3"
                                resizeMode="cover"
                            />
                        ) : (
                            <View className="w-14 h-14 rounded-lg bg-gray-100 items-center justify-center mr-3">
                                <Ionicons name="image-outline" size={24} color="#9CA3AF" />
                            </View>
                        )}
                        <View className="flex-1">
                            <Text className="text-sm font-onest text-black/90" numberOfLines={1}>
                                {activity.experience_name}
                            </Text>
                            <Text className="text-xs font-onest text-black/50 mt-0.5">
                                {activity.destination_name}
                            </Text>
                        </View>

                    </View>
                );
            })}
        </View>
    );
}

function HighlightsSection({ highlights }: { highlights: ItineraryItem[] }) {
    return (
        <View className="mt-12">
            <Text className="text-2xl font-onest-medium text-black/90 mb-4">
                Trip Highlights
            </Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
            >
                {highlights.map((item, index) => (
                    <View
                        key={item.item_id}
                        className={`w-40 ${index < highlights.length - 1 ? 'mr-3' : ''}`}
                    >
                        {item.primary_image && (
                            <Image
                                source={{ uri: getImageUri(item.primary_image, API_URL) }}
                                className="w-40 h-28 rounded-xl"
                                resizeMode="cover"
                            />
                        )}
                        <Text className="text-sm font-onest-medium text-black/90 mt-2" numberOfLines={1}>
                            {item.experience_name}
                        </Text>
                        <Text className="text-xs font-onest text-black/50" numberOfLines={1}>
                            {item.destination_city}
                        </Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

// function QuickActionsSection({
//     onAddToCalendar,
//     onShare,
//     onDownload,
// }: {
//     onAddToCalendar: () => void;
//     onShare: () => void;
//     onDownload: () => void;
// }) {
//     const actions = [
//         { icon: 'calendar-outline' as const, label: 'Add to Calendar', onPress: onAddToCalendar },
//         { icon: 'share-outline' as const, label: 'Share Trip', onPress: onShare },
//         { icon: 'download-outline' as const, label: 'Download PDF', onPress: onDownload },
//     ];

//     return (
//         <View className="mt-6 px-4 mb-4">
//             <Text className="text-base font-onest-medium text-black/90 mb-3">Quick Actions</Text>
//             <View className="flex-row gap-3">
//                 {actions.map((action, index) => (
//                     <Pressable
//                         key={index}
//                         onPress={action.onPress}
//                         className="flex-1 bg-white rounded-xl p-4 items-center shadow-sm"
//                     >
//                         <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mb-2">
//                             <Ionicons name={action.icon} size={20} color="#4F46E5" />
//                         </View>
//                         <Text className="text-xs font-onest text-black/60 text-center">
//                             {action.label}
//                         </Text>
//                     </Pressable>
//                 ))}
//             </View>
//         </View>
//     );
// }