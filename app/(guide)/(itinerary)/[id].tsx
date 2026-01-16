// screens/guide/GuideItineraryDetailScreen.tsx

import API_URL from '@/constants/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';

// Components - reuse from traveler side
import { GuideAssignmentActionBar } from '@/components/guide/GuideAssignmentActionBar';
import { PaymentTab } from '@/components/itinerary/tabs/PaymentTab';
import { TripPlanTab } from '@/components/itinerary/tabs/TripPlanTab';

// Hooks - reuse navigation hooks
import { useItineraryNavigation } from '@/hooks/useNavigation';

// Utils
import { formatDate } from '@/utils/itinerary-utils';

// Types
import { Itinerary } from '@/types/itineraryDetails';

type GuideTabType = 'overview' | 'tripplan' | 'earnings';

interface GuideInfo {
  traveler_name: string;
  traveler_contact: string;
  traveler_profile_pic: string | null;
  assignment_id: number;
  guide_fee: number;
  assignment_status: string;
  assigned_at: string;
}

interface GuideItineraryResponse {
  itinerary: Itinerary;
  access_level: 'guide';
  guide_info: GuideInfo;
  payments: []; // Empty for guides
}

export default function GuideItineraryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // State
  const [loading, setLoading] = useState(true);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [guideInfo, setGuideInfo] = useState<GuideInfo | null>(null);
  const [activeTab, setActiveTab] = useState<GuideTabType>('overview');
  const [collapsedDays, setCollapsedDays] = useState<Set<number>>(new Set());

  // Navigation hooks
  const {
    userLocation,
    handleMultiStopNavigation,
    handleSingleNavigation,
    navigateBetweenItems,
  } = useItineraryNavigation();

  // Fetch itinerary data
  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token || !id) return;

        const response = await axios.get<GuideItineraryResponse>(
          `${API_URL}/itinerary/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.access_level === 'guide') {
          setItinerary(response.data.itinerary);
          setGuideInfo(response.data.guide_info);
        }
      } catch (error) {
        console.error('Error fetching itinerary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItinerary();
  }, [id]);

  // Handlers
  const handlePayNow = useCallback(() => {
    router.push(`/(traveler)/(payment)/${itinerary?.itinerary_id}`);
  }, [router, itinerary?.itinerary_id]);

  const toggleDayCollapse = useCallback((dayNumber: number) => {
    setCollapsedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dayNumber)) {
        newSet.delete(dayNumber);
      } else {
        newSet.add(dayNumber);
      }
      return newSet;
    });
  }, []);

  const handleCallTraveler = useCallback(() => {
    if (guideInfo?.traveler_contact) {
      Linking.openURL(`tel:${guideInfo.traveler_contact}`);
    }
  }, [guideInfo]);

  const handleMessageTraveler = useCallback(() => {
    if (itinerary?.traveler_id) {
      router.push(`/(guide)/(conversations)`);
    }
  }, [router, itinerary]);

  // Accept assignment handler
  const handleAcceptAssignment = useCallback(async (assignmentId: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      await axios.post(
        `${API_URL}/guide/assignments/${assignmentId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setGuideInfo((prev) => prev ? { ...prev, assignment_status: 'Accepted' } : null);

      Alert.alert(
        'Request Accepted',
        'You have successfully accepted this trip request.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error accepting assignment:', error);
      Alert.alert('Error', 'Failed to accept the request. Please try again.');
    }
  }, []);

  // Decline assignment handler
  const handleDeclineAssignment = useCallback(async (assignmentId: number) => {
    Alert.alert(
      'Decline Request',
      'Are you sure you want to decline this trip request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) return;

              await axios.post(
                `${API_URL}/guide/assignments/${assignmentId}/decline`,
                { decline_reason: 'Other' },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              // Navigate back after declining
              router.back();
            } catch (error) {
              console.error('Error declining assignment:', error);
              Alert.alert('Error', 'Failed to decline the request. Please try again.');
            }
          },
        },
      ]
    );
  }, [router]);

  // Get day header style (simplified for guide - no edit capabilities)
  const getDayHeaderStyle = useCallback((dayNumber: number) => {
    if (!itinerary) {
      return {
        container: 'bg-white',
        text: 'text-gray-800',
        indicator: ''
      };
    }

    const startDate = new Date(itinerary.start_date);
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + dayNumber - 1);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dayDate.setHours(0, 0, 0, 0);

    const isPast = dayDate < today;
    const isToday = dayDate.getTime() === today.getTime();

    if (isPast) {
      return {
        container: 'bg-gray-50 border-l-4 border-gray-300',
        text: 'text-gray-500',
        indicator: '✓ Completed'
      };
    } else if (isToday) {
      return {
        container: 'bg-blue-50 border-l-4 border-blue-400',
        text: 'text-blue-700',
        indicator: '📍 Today'
      };
    }

    return {
      container: 'bg-white',
      text: 'text-gray-800',
      indicator: ''
    };
  }, [itinerary]);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="mt-4 text-gray-400 font-onest">Loading itinerary...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Empty/Error state
  if (!itinerary || !guideInfo) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center px-6">
          <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
            <Ionicons name="alert-circle-outline" size={40} color="#9CA3AF" />
          </View>
          <Text className="text-lg font-onest-medium text-black/70 mb-2">
            Itinerary Not Found
          </Text>
          <Text className="text-black/50 font-onest text-center mb-6">
            This itinerary may have been cancelled or you don't have access.
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="bg-primary rounded-xl px-6 py-3"
          >
            <Text className="text-white font-onest-medium">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const dateRangeText = `${formatDate(itinerary.start_date)} - ${formatDate(itinerary.end_date)}`;
  const totalDays = Math.ceil(
    (new Date(itinerary.end_date).getTime() - new Date(itinerary.start_date).getTime()) /
    (1000 * 60 * 60 * 24)
  ) + 1;

  const isPending = guideInfo.assignment_status === 'Pending';

  // Render Overview Tab Content
  const renderOverviewContent = () => (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: isPending ? 160 : 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Traveler Card */}
      <View className="mx-6 mt-6">
        <View className="rounded-2xl p-4">
          <View className="flex-row items-start mb-3">
            {guideInfo.traveler_profile_pic ? (
              <Image
                source={{ uri: `${API_URL}/${guideInfo.traveler_profile_pic}` }}
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
            <View className="ml-3 flex-1">
              <Text className="font-onest-semibold text-black/90 mb-1">
                {guideInfo.traveler_name}
              </Text>
              <Text className="text-gray-400 font-onest">Traveler</Text>
            </View>

            {/* Chat Button - Disabled when pending */}
            <Pressable
              onPress={isPending ? undefined : handleMessageTraveler}
              disabled={isPending}
              className={`p-3 rounded-full ${isPending ? 'bg-gray-50' : 'bg-gray-100'}`}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={24}
                color={isPending ? '#d1d5db' : '#1f2937'}
              />
            </Pressable>
          </View>

          {/* Call Button - Blurred/Hidden when pending */}
          {guideInfo.traveler_contact && (
            isPending ? (
              // Blurred/Locked state for pending
              <View className="flex-row items-center justify-center bg-gray-50 py-3 rounded-xl mt-2">

                <Text className="font-onest text-gray-400 ml-2">
                  09{"******"} *****
                </Text>
              </View>
            ) : (
              // Normal state for accepted
              <Pressable
                onPress={handleCallTraveler}
                className="flex-row items-center justify-center bg-green-50 py-3 rounded-xl mt-2"
              >
                <Ionicons name="call-outline" size={18} color="#16a34a" />
                <Text className="font-onest-medium text-green-700 ml-2">
                  {guideInfo.traveler_contact}
                </Text>
              </Pressable>
            )
          )}

          {/* Info banner for pending */}
          {/* {isPending && (
            <View className="flex-row items-center bg-yellow-50 rounded-xl p-3 mt-3">
              <Ionicons name="information-circle-outline" size={18} color="#ca8a04" />
              <Text className="font-onest text-yellow-700 text-xs ml-2 flex-1">
                Accept this request to unlock contact info and messaging
              </Text>
            </View>
          )} */}
        </View>
      </View>

      {/* Trip Summary */}
      <View className="mx-6 mt-8 p-4">
        <Text className="text-2xl font-onest text-black/90 mb-4">Trip Summary</Text>

        <View className="flex-row gap-3">
          <View className="flex-1 bg-gray-50 rounded-xl p-4 items-center">
            <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mb-2">
              <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
            </View>
            <Text className="font-onest-semibold text-xl text-black/90">{totalDays}</Text>
            <Text className="font-onest text-xs text-black/50">Days</Text>
          </View>

          <View className="flex-1 bg-gray-50 rounded-xl p-4 items-center">
            <View className="w-10 h-10 rounded-full bg-purple-50 items-center justify-center mb-2">
              <Ionicons name="flag-outline" size={20} color="#7c3aed" />
            </View>
            <Text className="font-onest-semibold text-xl text-black/90">
              {itinerary.items?.length || 0}
            </Text>
            <Text className="font-onest text-xs text-black/50">Activities</Text>
          </View>

          <View className="flex-1 bg-gray-50 rounded-xl p-4 items-center">
            <View className="w-10 h-10 rounded-full bg-green-50 items-center justify-center mb-2">
              <Ionicons name="wallet-outline" size={20} color="#16a34a" />
            </View>
            <Text className="font-onest-semibold text-xl text-black/90">
              ₱{guideInfo.guide_fee?.toLocaleString() || 0}
            </Text>
            <Text className="font-onest text-xs text-black/50">Your Fee</Text>
          </View>
        </View>
      </View>

      {/* Assignment Info */}
      <View className="mx-6 mt-8 mb-6 p-4">
        <Text className="text-2xl font-onest text-black/90 mb-4">Assignment Details</Text>
        <View>
          <View className="flex-row justify-between items-center">
            <Text className="font-onest text-black/50">Status</Text>
            <View className={`px-3 py-1 rounded-full ${guideInfo.assignment_status === 'Accepted' ? 'bg-green-100' : 'bg-yellow-100'
              }`}>
              <Text className={`font-onest-medium text-sm ${guideInfo.assignment_status === 'Accepted' ? 'text-green-700' : 'text-yellow-700'
                }`}>
                {guideInfo.assignment_status}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-100">
            <Text className="font-onest text-black/50">Assigned On</Text>
            <Text className="font-onest text-black/80">
              {guideInfo.assigned_at ? formatDate(guideInfo.assigned_at.split(' ')[0]) : '-'}
            </Text>
          </View>

          <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-100">
            <Text className="font-onest text-black/50">Your Earnings</Text>
            <Text className="font-onest-semibold text-primary">
              ₱{guideInfo.guide_fee?.toLocaleString() || 0}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  // Render Tab Content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewContent();
      case 'tripplan':
        return (
          <TripPlanTab
            itinerary={itinerary}
            collapsedDays={collapsedDays}
            getDayHeaderStyle={getDayHeaderStyle}
            onToggleDayCollapse={toggleDayCollapse}
            onNavigateAll={handleMultiStopNavigation}
            onNavigateSingle={handleSingleNavigation}
            onNavigateBetween={navigateBetweenItems}
            onShowFoodStops={() => { }}
          />
        );
      case 'earnings':
        return (
          <PaymentTab
            payments={itinerary.payments}
            onPayNow={handlePayNow}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#fff]">
      {/* Header Section */}
      <View className="px-6 mt-12 pt-4 pb-4">

        {/* Title Row */}
        <View className="flex-row justify-between items-start">
          <View className="flex-1 px-4">
            <Text className="text-3xl font-onest-semibold text-black/90">
              {isPending ? 'Requested by' : 'Trip to'}
            </Text>
            <Text className="text-3xl font-onest-semibold text-black/90">
              {itinerary.title}
            </Text>
          </View>
        </View>

        {/* Date Row */}
        <View className="flex-row items-center my-6 px-4">
          <Ionicons name="calendar-outline" size={16} color="#000000cc" />
          <Text className="text-sm text-black/90 font-onest ml-2">
            {dateRangeText}
          </Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <GuideTabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <View className="flex-1">{renderTabContent()}</View>

      {/* Action Bar for Pending Assignments */}
      {isPending && (
        <GuideAssignmentActionBar
          assignmentId={guideInfo.assignment_id}
          guideFee={guideInfo.guide_fee}
          onAccept={handleAcceptAssignment}
          onDecline={handleDeclineAssignment}
        />
      )}
    </SafeAreaView>
  );
}

interface GuideTabNavigationProps {
  activeTab: GuideTabType;
  onTabChange: (tab: GuideTabType) => void;
}

function GuideTabNavigation({ activeTab, onTabChange }: GuideTabNavigationProps) {
  const tabs: { key: GuideTabType; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'tripplan', label: 'Trip Plan' },
    { key: 'earnings', label: 'Earnings' },
  ];

  return (
    <View className="flex-row">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;

        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            className="flex-1 flex-row items-center relative px-6 mx-4 justify-start pb-4"
          >
            <View>
              <Text
                className={`text-sm font-onest-medium pb-2 ${isActive
                  ? 'text-primary border-b-2 border-primary rounded-lg'
                  : 'border-b-[#fff] text-gray-400'
                  }`}
              >
                {tab.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}