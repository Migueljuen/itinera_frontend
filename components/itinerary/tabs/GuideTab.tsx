// components/itinerary/tabs/GuideTab.tsx
import API_URL from '@/constants/api';
import { ServiceAssignment } from '@/types/itineraryDetails';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';

interface Props {
    serviceAssignments: ServiceAssignment[];
    itineraryId: number;
}

export function GuideTab({ serviceAssignments, itineraryId }: Props) {
    // Separate assignments by type
    const guideAssignments = serviceAssignments.filter(a => a.service_type === 'Guide');
    const driverAssignments = serviceAssignments.filter(a => a.service_type === 'Driver');

    const hasAssignments = guideAssignments.length > 0 || driverAssignments.length > 0;

    return (
        <ScrollView
            className="flex-1 px-6 mx-4 mt-6"
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
        >
            {/* Tour Guide Section */}
            {guideAssignments.length > 0 && (
                <ServiceSection
                    title="Tour Guide"
                    assignments={guideAssignments}
                    icon="map"
                />
            )}

            {/* Transportation Section */}
            {driverAssignments.length > 0 && (
                <ServiceSection
                    title="Transportation"
                    assignments={driverAssignments}
                    icon="car"
                />
            )}

            {/* Empty State */}
            {!hasAssignments && (
                <View className="flex-1 items-center justify-center py-20">
                    <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
                        <Ionicons name="map-outline" size={40} color="#9CA3AF" />
                    </View>
                    <Text className="text-lg font-onest-medium text-black/70 mb-2">
                        No Guides Assigned Yet
                    </Text>
                    <Text className="text-black/50 font-onest text-center px-8">
                        Your tour guides and drivers will appear here once they're assigned to your trip
                    </Text>
                </View>
            )}

            {/* Trust Badge - Only show when there are assignments */}
            {hasAssignments && (
                <View className="p-4 mt-12">
                    <View className="flex-row items-center justify-center mb-2">


                    </View>
                    <Text className="text-sm font-onest text-center text-black/50 leading-5">
                        All tour guides and drivers on Itinera have been carefully vetted and verified to ensure professional, safe, and quality service for your travels.
                    </Text>
                </View>
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

// ============ Service Section Component ============
function ServiceSection({
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
                    participantId: providerId,
                }),
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(err);
            }

            const data = await response.json();
            const conversationId = data.data.id;

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

    const handleOpenLocation = (latitude: number, longitude: number, name: string) => {
        const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        Linking.openURL(url).catch(() => {
            Alert.alert('Error', 'Unable to open maps');
        });
    };

    return (
        <View className="mb-8">
            {assignments.map((assignment, index) => {
                const statusConfig = getStatusConfig(assignment.status);
                const isDriver = assignment.service_type === 'Driver';
                const isAccepted = assignment.status === 'Accepted';
                const isPending = assignment.status === 'Pending';

                return (
                    <View
                        key={assignment.assignment_id}
                        className={`rounded-xl py-4 ${index < assignments.length - 1 ? 'mb-6' : ''}`}
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

                        {/* Call Button */}
                        {assignment.provider.mobile_number && (
                            <Pressable
                                onPress={() => {
                                    Linking.openURL(`tel:${assignment.provider.mobile_number}`);
                                }}
                                className="flex-row items-center justify-center bg-green-50 py-3 rounded-xl mt-2"
                            >
                                <Ionicons name="call-outline" size={18} color="#16a34a" />
                                <Text className="font-onest-medium text-green-700 ml-2">
                                    {assignment.provider.mobile_number}
                                </Text>
                            </Pressable>
                        )}

                        {/* Meeting Points Section - Guide Only */}
                        {!isDriver && isAccepted && assignment.meeting_points.length > 0 && (
                            <View className="mt-12">
                                {assignment.meeting_points.map((meetingPoint) => {
                                    const hasGuideResponse = meetingPoint.guide_response !== null;
                                    const isConfirmed = meetingPoint.status === 'confirmed';
                                    const isPendingResponse = meetingPoint.status === 'pending';

                                    return (
                                        <View key={meetingPoint.id} className="mb-4">
                                            <View className="flex-row justify-between items-baseline mb-3">
                                                <Text className="text-2xl font-onest text-black/90 ">
                                                    Where you'll meet
                                                </Text>
                                            </View>

                                            {/* Your Requested Location */}
                                            <View className="mb-4">
                                                <View className="py-3">
                                                    <Text className="font-onest-medium text-black/90 mb-1">
                                                        {meetingPoint.requested.name}
                                                    </Text>
                                                    <Text className="text-sm font-onest text-black/60 mb-2">
                                                        {meetingPoint.requested.address}
                                                    </Text>
                                                </View>

                                                {/* View on Map Button */}
                                                {meetingPoint.requested.latitude && meetingPoint.requested.longitude && (
                                                    <View className="flex-row items-center justify-center py-3 rounded-xl mt-2">
                                                        <Pressable
                                                            onPress={() => handleOpenLocation(
                                                                meetingPoint.requested.latitude!,
                                                                meetingPoint.requested.longitude!,
                                                                meetingPoint.requested.name
                                                            )}
                                                            className="flex-row items-center gap-2"
                                                        >
                                                            <Ionicons name="map-outline" size={24} color="#4F46E5" />
                                                            <Text className="font-onest-medium">View on Map</Text>
                                                        </Pressable>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}

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