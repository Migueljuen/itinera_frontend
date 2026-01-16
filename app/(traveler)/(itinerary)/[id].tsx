// screens/ItineraryDetailScreen.tsx main file

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Components
import { FoodStopsSheet } from '@/components/FoodStopSheet';
import { TabNavigation, TabType } from '@/components/itinerary/TabNavigation';
import { OverviewTab } from '@/components/itinerary/tabs/OverviewTab';
import { PaymentTab } from '@/components/itinerary/tabs/PaymentTab';
import { TripPlanTab } from '@/components/itinerary/tabs/TripPlanTab';

import { GuideTab } from '@/components/itinerary/tabs/GuideTab';

// Hooks
import { useCalendarIntegration } from '@/hooks/useCalendar';
import { useEditCapabilities } from '@/hooks/useEditCapabilities';
import { useFoodStopsAlongRoute } from '@/hooks/useFoodStopsAlongRoutes';
import { useItinerary } from '@/hooks/useItinerary';
import { useItineraryNavigation } from '@/hooks/useNavigation';
import { usePaymentSummary } from '@/hooks/usePaymentSummary';

// Utils
import { formatDate } from '@/utils/itinerary-utils';

// Types
import { ItineraryItem } from '@/types/itineraryDetails';

export default function ItineraryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Other State
  const [collapsedDays, setCollapsedDays] = useState<Set<number>>(new Set());
  const [foodStopsVisible, setFoodStopsVisible] = useState(false);
  const [selectedDayForFood, setSelectedDayForFood] = useState<number>(1);

  // Hooks
  const { itinerary, serviceAssignments, loading, accessLevel } = useItinerary(id);

  const { addItineraryToCalendar } = useCalendarIntegration();
  const { getEditCapabilities, getDayHeaderStyle } = useEditCapabilities(itinerary);
  const paymentSummary = usePaymentSummary(itinerary?.payments?.[0]);
  const {
    loading: foodStopsLoading,
    routeData: foodStopsRouteData,
    fetchRouteWithFoodStops,
    clearRouteData,
  } = useFoodStopsAlongRoute();
  const {
    userLocation,
    handleMultiStopNavigation,
    handleSingleNavigation,
    navigateBetweenItems,
  } = useItineraryNavigation();

  // Calculate payment badge
  const paymentBadge =
    paymentSummary && !paymentSummary.isPaid
      ? paymentSummary.totalCount - paymentSummary.paidCount
      : 0;

  // Handlers
  const handlePayNow = useCallback(() => {
    router.push(`/(traveler)/(payment)/${itinerary?.itinerary_id}`);
  }, [router, itinerary?.itinerary_id]);

  const handleAddToCalendar = useCallback(() => {
    if (itinerary) {
      addItineraryToCalendar(itinerary);
    }
  }, [addItineraryToCalendar, itinerary]);

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

  const handleShowFoodStops = useCallback(
    (dayNumber: number, dayItems: ItineraryItem[]) => {
      console.log('1. Opening modal');
      setSelectedDayForFood(dayNumber);
      setFoodStopsVisible(true);

      // Force a delay to let the modal render first
      setTimeout(() => {
        console.log('2. Starting fetch (after delay)');
        fetchRouteWithFoodStops(dayItems, userLocation);
      }, 500);
    },
    [fetchRouteWithFoodStops, userLocation]
  );

  const handleCloseFoodStops = useCallback(() => {
    setFoodStopsVisible(false);
    clearRouteData();
  }, [clearRouteData]);

  const handleNavigateToTab = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

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

  // Empty state
  if (!itinerary) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <Text className="text-center text-gray-400 py-10 font-onest">
            Itinerary not found
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="bg-primary rounded-lg px-6 py-3"
          >
            <Text className="text-white font-onest-medium">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            itinerary={itinerary}
            serviceAssignments={serviceAssignments}
            onAddToCalendar={handleAddToCalendar}
            onNavigateToTab={handleNavigateToTab}
          />
        );

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
            onShowFoodStops={handleShowFoodStops}
          />
        );
      case 'guide':
        return (
          <GuideTab
            serviceAssignments={serviceAssignments}
            itineraryId={itinerary.itinerary_id}
          />
        );
      case 'payment':
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

  const dateRangeText = `${formatDate(itinerary.start_date)} - ${formatDate(itinerary.end_date)}`;

  return (
    <SafeAreaView className="flex-1 bg-[#fff]">
      {/* Header Section */}
      <View className="px-6 mt-12 pt-4 pb-4  ">
        {/* Title Row with Edit Button */}
        <View className="flex-row justify-between items-start">
          <View className="flex-1 px-4">
            <Text className="text-3xl font-onest-semibold text-black/90">Trip to</Text>
            <Text className="text-3xl font-onest-semibold text-black/90">
              {itinerary.title}
            </Text>
          </View>
          {/* <EditButton
            itinerary={itinerary}
            getEditCapabilities={getEditCapabilities}
          /> */}
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
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        paymentBadge={paymentBadge}
      />

      {/* Tab Content */}
      <View className="flex-1">{renderTabContent()}</View>

      {/* Food Stops Sheet */}
      <FoodStopsSheet
        visible={foodStopsVisible}
        onClose={handleCloseFoodStops}
        routeData={foodStopsRouteData}
        loading={foodStopsLoading}
        dayNumber={selectedDayForFood}
      />
    </SafeAreaView>
  );
}

// ============ Edit Button Component ============

function EditButton({
  itinerary,
  getEditCapabilities,
}: {
  itinerary: any;
  getEditCapabilities: () => any;
}) {
  const router = useRouter();
  const capabilities = getEditCapabilities();

  if (!capabilities.canEdit) {
    return (
      <View className="bg-gray-100 rounded-full p-2">
        <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
      </View>
    );
  }

  const handlePress = () => {
    router.navigate({
      pathname: `/(traveler)/(itinerary)/edit/[id]`,
      params: {
        id: itinerary.itinerary_id.toString(),
        editType: capabilities.editType,
        ...(capabilities.editType === 'current_and_future' && {
          currentDay: capabilities.currentDay?.toString(),
          editableDays: capabilities.editableDays?.join(','),
        }),
      },
    });
  };

  return (
    <Pressable onPress={handlePress} className="bg-primary rounded-full p-2">
      <Ionicons name="create-outline" size={20} color="white" />
    </Pressable>
  );
}