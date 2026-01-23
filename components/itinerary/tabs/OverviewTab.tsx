// components/itinerary/tabs/OverviewTab.tsx

import API_URL from '@/constants/api';
import { usePaymentSummary } from '@/hooks/usePaymentSummary';
import { Itinerary, ItineraryItem, ServiceAssignment } from '@/types/itineraryDetails';
import { getImageUri } from '@/utils/itinerary-utils';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, Text, View, } from 'react-native';

interface Props {
    itinerary: Itinerary;
    serviceAssignments?: ServiceAssignment[];
    onAddToCalendar: () => void;
    onNavigateToTab: (tab: 'tripplan' | 'payment') => void;
}

export function OverviewTab({ itinerary, serviceAssignments = [], onAddToCalendar, onNavigateToTab }: Props) {
    const paymentSummary = usePaymentSummary(itinerary.payments?.[0]);

    const stats = calculateTripStats(itinerary);
    const upcomingActivities = getUpcomingActivities(itinerary, 2);
    const highlights = getHighlights(itinerary.items, 3);

    // Separate assignments by type
    const guideAssignments = serviceAssignments.filter(a => a.service_type === 'Guide');
    const driverAssignments = serviceAssignments.filter(a => a.service_type === 'Driver');

    return (
        <ScrollView className="flex-1 px-6 mx-4 mt-6" contentContainerStyle={{ paddingBottom: 100 }}>
            {/* <View className=''>
                <View className='flex justify-between flex-row items-center'>
                    <Text className='text-2xl text-onest'>Itinerary Notes</Text>
                    <Pressable>
                        <Text className="text-sm font-onest text-primary">Edit</Text>
                    </Pressable>
                </View>
                <Text className='text-black/50 mt-4'>{itinerary.notes}</Text>
            </View> */}

            {/* Tour Guide Section */}
            {/* {guideAssignments.length > 0 && (
                <ServiceSection
                    title="Tour Guide"
                    assignments={guideAssignments}
                    icon="map"
                />
            )} */}

            {/* Transportation Section */}
            {/* {driverAssignments.length > 0 && (
                <ServiceSection
                    title="Transportation"
                    assignments={driverAssignments}
                    icon="car"
                />
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
        </ScrollView>
    );
}

// ============ Helper Functions ============

function getProfilePicUrl(profilePic: string | null): string | null {
    if (!profilePic) return null;
    if (profilePic.startsWith('http://') || profilePic.startsWith('https://')) {
        return profilePic;
    }
    return `${API_URL}${profilePic.startsWith('/') ? '' : '/'}${profilePic}`;
}

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

function ServiceSection({
    title,
    assignments,
    icon
}: {
    title: string;
    assignments: ServiceAssignment[];
    icon: 'map' | 'car';
}) {
    const router = useRouter();
    const [startingChat, setStartingChat] = useState<number | null>(null);


    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'Accepted':
                return { bg: 'bg-green-100', text: 'text-green-600', icon: 'checkmark-circle' as const };
            case 'Pending':
                return { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: 'time' as const };
            case 'Declined':
                return { bg: 'bg-red-100', text: 'text-red-600', icon: 'close-circle' as const };
            case 'Expired':
                return { bg: 'bg-gray-100', text: 'text-gray-600', icon: 'hourglass' as const };
            case 'Cancelled':
                return { bg: 'bg-gray-100', text: 'text-gray-600', icon: 'ban' as const };
            default:
                return { bg: 'bg-gray-100', text: 'text-gray-600', icon: 'ellipse' as const };
        }
    };

    const handleStartConversation = async (
        providerId: number,
        providerName: string,
        assignmentId: number
    ) => {
        setStartingChat(assignmentId);

        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Error', 'Please log in to start a conversation');
                return;
            }

            const response = await fetch(`${API_URL}/conversations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    participantId: providerId, // ✅ correct key
                }),
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(err);
            }

            const data = await response.json();
            const conversationId = data.data.id; // ✅ correct shape

            router.push({
                pathname: '/(traveler)/(conversations)/[id]',
                params: {
                    id: String(conversationId),
                    name: providerName,
                },
            });
        } catch (error) {
            console.error('Error starting conversation:', error);
            Alert.alert('Error', 'Failed to start conversation. Please try again.');
        } finally {
            setStartingChat(null);
        }
    };


    return (
        <View className="mt-12">
            <Text className="text-2xl text-onest text-black/90 mb-4">
                {title}
            </Text>

            {assignments.map((assignment, index) => {
                const statusConfig = getStatusConfig(assignment.status);
                const isDriver = assignment.service_type === 'Driver';
                const isAccepted = assignment.status === 'Accepted';
                const isPending = assignment.status === 'Pending';

                return (
                    <View
                        key={assignment.assignment_id}
                        className={`rounded-xl py-4 ${index < assignments.length - 1 ? 'mb-3' : ''}`}
                    >
                        {/* Header Row */}
                        <View className="flex-row items-start mb-3">
                            {/* Profile Picture */}
                            {assignment.provider.profile_pic ? (
                                <Image
                                    source={{ uri: getProfilePicUrl(assignment.provider.profile_pic)! }}
                                    style={{ width: 40, height: 40, borderRadius: 20 }}
                                />
                            ) : (
                                <View
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 20,
                                        backgroundColor: "#E5E7EB",
                                        justifyContent: "center",
                                        alignItems: "center",
                                    }}
                                >
                                    <Ionicons name="person" size={24} color="#9CA3AF" />
                                </View>
                            )}

                            {/* Name and Vehicle Info */}
                            <View className="ml-3 flex-1">
                                <Text className="text-base font-onest-semibold text-black/90">
                                    {assignment.provider.name}

                                </Text>
                                {isDriver && assignment.provider.vehicle_type ? (
                                    <Text className="text-xs font-onest text-black/50 mt-0.5">
                                        {assignment.provider.vehicle_type}
                                        {assignment.provider.vehicle_model && ` ${assignment.provider.vehicle_model}`}
                                    </Text>
                                ) : (
                                    <Text className="text-xs font-onest text-gray-400 mt-0.5">
                                        {assignment.service_type}
                                    </Text>
                                )}
                            </View>

                            {/* Status Badge or Chat Button */}
                            {isAccepted ? (
                                <Pressable
                                    onPress={() => handleStartConversation(
                                        assignment.provider.provider_id,
                                        assignment.provider.name,
                                        assignment.assignment_id
                                    )}
                                    disabled={startingChat === assignment.assignment_id}
                                    className="bg-gray-100 p-3 rounded-full"
                                >
                                    {startingChat === assignment.assignment_id ? (
                                        <ActivityIndicator size="small" color="#1f2937" />
                                    ) : (
                                        <Ionicons
                                            name="chatbubble-ellipses-outline"
                                            size={20}
                                            color="#1f2937"
                                        />
                                    )}
                                </Pressable>
                            ) : (
                                <View className={`px-3 py-1 rounded-full ${statusConfig.bg}`}>
                                    <Text className={`text-xs font-onest ${statusConfig.text}`}>
                                        {assignment.status}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <Pressable
                            onPress={() => {
                                if (assignment.provider.mobile_number) {
                                    Linking.openURL(`tel:${assignment.provider.mobile_number}`);
                                }
                            }}

                            className="flex-row items-center justify-center bg-green-50 py-3 rounded-xl mt-2"
                        >
                            <Ionicons name="call-outline" size={18} color="#16a34a" />
                            <Text className="font-onest-medium text-green-700 ml-2">
                                {assignment.provider.mobile_number}
                            </Text>
                        </Pressable>

                        {/* Provider Details - Accepted Status */}
                        {/* {isAccepted && (
                            <View className="border-t border-gray-100 pt-3">
                                {assignment.provider.mobile_number && (
                                    <View className="flex-row items-center mb-2">
                                        <Ionicons name="call-outline" size={14} color="#6B7280" />
                                        <Text className="text-sm font-onest text-black/70 ml-2">
                                            {assignment.provider.mobile_number}
                                        </Text>
                                    </View>
                                )}

                                {assignment.provider.years_of_experience && (
                                    <View className="flex-row items-center mb-2">
                                        <Ionicons name="trophy-outline" size={14} color="#6B7280" />
                                        <Text className="text-sm font-onest text-black/70 ml-2">
                                            {assignment.provider.years_of_experience} years experience
                                        </Text>
                                    </View>
                                )}

                                {isDriver && assignment.provider.vehicle_plate_number && (
                                    <View className="flex-row items-center mb-2">
                                        <Ionicons name="document-text-outline" size={14} color="#6B7280" />
                                        <Text className="text-sm font-onest text-black/70 ml-2">
                                            Plate: {assignment.provider.vehicle_plate_number}
                                        </Text>
                                    </View>
                                )}

                                {assignment.price && (
                                    <View className="flex-row items-center">
                                        <Ionicons name="cash-outline" size={14} color="#6B7280" />
                                        <Text className="text-sm font-onest text-black/70 ml-2">
                                            ₱{assignment.price.toLocaleString()}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )} */}

                        {/* Meeting Points Status - Guide Only */}
                        {!isDriver && isAccepted && assignment.meeting_points.length > 0 && (
                            <View className="border-t border-gray-100 pt-3 mt-3">
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center">
                                        <Ionicons name="location-outline" size={14} color="#6B7280" />
                                        <Text className="text-sm font-onest text-black/70 ml-2">
                                            Meeting Points
                                        </Text>
                                    </View>
                                    {assignment.has_pending_meeting_points ? (
                                        <View className="flex-row items-center">
                                            <View className="w-2 h-2 rounded-full bg-yellow-500 mr-1.5" />
                                            <Text className="text-xs font-onest text-yellow-600">
                                                Pending confirmation
                                            </Text>
                                        </View>
                                    ) : assignment.all_meeting_points_confirmed ? (
                                        <View className="flex-row items-center">
                                            <Ionicons name="checkmark-circle" size={14} color="#059669" />
                                            <Text className="text-xs font-onest text-green-600 ml-1">
                                                All confirmed
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>
                            </View>
                        )}

                        {/* Message CTA - Accepted Status */}
                        {/* {isAccepted && (
                            <View className="border-t border-gray-100 pt-3 mt-3">
                                <Text className="text-xs font-onest text-primary text-center">
                                    Message your {isDriver ? 'driver' : 'guide'}!
                                </Text>
                            </View>
                        )} */}

                        {/* Decline Reason */}
                        {assignment.status === 'Declined' && assignment.decline_reason && (
                            <View className="border-t border-gray-100 pt-3 mt-3">
                                <Text className="text-xs font-onest text-black/50">
                                    Reason: {assignment.decline_reason}
                                </Text>
                            </View>
                        )}

                        {/* Pending Notice */}
                        {isPending && (
                            <View className="border-t border-gray-100 pt-3 mt-3">
                                <Text className="text-xs font-onest text-black/50">
                                    Waiting for {isDriver ? 'driver' : 'guide'} to accept your request
                                </Text>
                            </View>
                        )}
                    </View>
                );
            })}
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
            <Text className="text-2xl mt-12 text-onest text-black/90">Payment Details</Text>
            <Pressable
                onPress={onViewDetails}
                className="flex-row items-center justify-between mt-4"
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
                        <Text className="text-sm text-onest text-black/90">
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
        <View className="">
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-2xl text-onest text-black/90">Coming Up</Text>
                <Pressable onPress={onViewAll}>
                    <Text className="text-sm font-onest text-primary">View all</Text>
                </Pressable>
            </View>

            {activities.map((activity, index) => {
                return (
                    <View
                        key={activity.item_id}
                        className={`flex-row items-center ${index < activities.length - 1 ? 'mb-3' : ''}`}
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
            <Text className="text-2xl text-onest text-black/90 mb-4">
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
                        <Text className="text-sm text-onest text-black/90 mt-2" numberOfLines={1}>
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