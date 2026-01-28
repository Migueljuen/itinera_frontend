// screens/ItineraryDetailScreen.tsx

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Components
import { FoodStopsSheet } from "@/components/FoodStopSheet";
import { TabNavigation, TabType } from "@/components/itinerary/TabNavigation";
import { GuideTab } from "@/components/itinerary/tabs/GuideTab";
import { OverviewTab } from "@/components/itinerary/tabs/OverviewTab";
import { PaymentTab } from "@/components/itinerary/tabs/PaymentTab";
import { TripPlanTab } from "@/components/itinerary/tabs/TripPlanTab";

// Hooks
import { useBookingPayments } from "@/hooks/useBookingPayments";
import { useCalendarIntegration } from "@/hooks/useCalendar";
import { useEditCapabilities } from "@/hooks/useEditCapabilities";
import { useFoodStopsAlongRoute } from "@/hooks/useFoodStopsAlongRoutes";
import { useItinerary } from "@/hooks/useItinerary";
import { useItineraryNavigation } from "@/hooks/useNavigation";
import { useRefunds } from "@/hooks/useRefunds";

// Utils
import { formatDate } from "@/utils/itinerary-utils";

// Types
import { BookingPayment } from "@/types/bookingPayment";
import { ItineraryItem } from "@/types/itineraryDetails";

export default function ItineraryDetailScreen() {
  const router = useRouter();

  // ✅ allow refresh flag
  const { id, refresh } = useLocalSearchParams<{ id: string; refresh?: string }>();

  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Tooltip State
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Other State
  const [collapsedDays, setCollapsedDays] = useState<Set<number>>(new Set());
  const [foodStopsVisible, setFoodStopsVisible] = useState(false);
  const [selectedDayForFood, setSelectedDayForFood] = useState<number>(1);

  // Hooks
  const { itinerary, serviceAssignments, loading, accessLevel, refetch } = useItinerary(id);

  const {
    bookings: bookingPayments,
    summary: paymentSummary,
    loading: paymentsLoading,
    refetch: refetchPayments,
  } = useBookingPayments(itinerary?.itinerary_id);


  useEffect(() => {
    console.log('=== BOOKING PAYMENTS DEBUG ===');
    console.log('itinerary_id:', itinerary?.itinerary_id);
    console.log('paymentsLoading:', paymentsLoading);
    console.log('bookingPayments:', bookingPayments);
  }, [itinerary?.itinerary_id, paymentsLoading, bookingPayments]);


  const { refunds, refetch: refetchRefunds } = useRefunds(itinerary?.itinerary_id);

  const { addItineraryToCalendar } = useCalendarIntegration();
  const { getEditCapabilities, getDayHeaderStyle } = useEditCapabilities(itinerary);

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

  // ---- IMPORTANT: cancel pending fetch timers ----
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const userLocationRef = useRef<Location.LocationObject | null | undefined>(userLocation);
  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);

  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, []);

  // Tooltip handlers
  const showTooltip = useCallback(() => {
    setTooltipVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const hideTooltip = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setTooltipVisible(false));
  }, [fadeAnim]);

  const tooltipContent = {
    title: "Trip Information",
    description:
      "Here's some helpful information about your trip to ensure you have the best experience.",
    tips: [
      {
        icon: "checkmark-circle-outline" as const,
        title: "Check What's Included",
        text: "Review the activity details to see what's included in the price, such as meals, equipment, or entrance fees.",
      },
      {
        icon: "chatbubble-ellipses-outline" as const,
        title: "Chat with Partners",
        text: "Have questions? You can message your guide or activity provider directly through the chat feature.",
      },
      {
        icon: "time-outline" as const,
        title: "Arrival Times",
        text: "Plan to arrive at least 15 minutes before each scheduled activity to ensure a smooth experience.",
      },
      {
        icon: "card-outline" as const,
        title: "Payment Details",
        text: "Check the Payment tab to view your payment breakdown and any outstanding balances.",
      },
    ],
  };

  const renderTooltip = () => {
    if (!tooltipVisible) return null;

    return (
      <Modal visible transparent animationType="none" onRequestClose={hideTooltip}>
        <TouchableWithoutFeedback onPress={hideTooltip}>
          <View className="flex-1 bg-black/50 justify-center items-center ">
            <TouchableWithoutFeedback>
              <View className="bg-[#fff] rounded-2xl p-6 w-full max-w-md">
                <View className="flex-row items-center mb-4">
                  <Ionicons name="information-circle" size={28} color="#4F46E5" />
                  <Text className="text-xl font-onest-semibold flex-1 text-black/90 ml-3">
                    {tooltipContent.title}
                  </Text>
                </View>

                <Text className="text-black/70 font-onest text-sm mb-8 leading-6">
                  {tooltipContent.description}
                </Text>

                <View className="mb-6">
                  {tooltipContent.tips.map((tip, index) => (
                    <View key={index} className="flex-row items-start mb-4">
                      <View className="bg-primary/10 rounded-full p-2 mr-3">
                        <Ionicons name={tip.icon} size={18} color="#4F46E5" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-black/90 font-onest-medium text-sm mb-1">
                          {tip.title}
                        </Text>
                        <Text className="text-black/60 font-onest text-xs leading-5">
                          {tip.text}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={hideTooltip}
                  className="bg-primary py-3 rounded-xl"
                  activeOpacity={0.8}
                >
                  <Text className="text-white font-onest-semibold text-center text-base">
                    Got it!
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const paymentBadge = paymentSummary
    ? paymentSummary.unpaidCount + paymentSummary.pendingCount
    : 0;

  const handlePayNow = useCallback(
    (booking: BookingPayment) => {
      router.push(`/(traveler)/(payment)/${booking.booking_id}`);
    },
    [router]
  );

  const handleAddToCalendar = useCallback(() => {
    if (itinerary) addItineraryToCalendar(itinerary);
  }, [addItineraryToCalendar, itinerary]);

  const toggleDayCollapse = useCallback((dayNumber: number) => {
    setCollapsedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dayNumber)) newSet.delete(dayNumber);
      else newSet.add(dayNumber);
      return newSet;
    });
  }, []);

  const handleShowFoodStops = useCallback(
    (dayNumber: number, dayItems: ItineraryItem[]) => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }

      clearRouteData();
      setSelectedDayForFood(dayNumber);
      setFoodStopsVisible(true);

      fetchTimeoutRef.current = setTimeout(() => {
        fetchRouteWithFoodStops(dayItems, userLocationRef.current ?? undefined);
        fetchTimeoutRef.current = null;
      }, 300);
    },
    [fetchRouteWithFoodStops, clearRouteData]
  );

  const handleCloseFoodStops = useCallback(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }

    setFoodStopsVisible(false);
    clearRouteData();
  }, [clearRouteData]);

  const handleNavigateToTab = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
    refetchPayments();
    refetchRefunds();
  }, [refetch, refetchPayments, refetchRefunds]);

  /**
   * ✅ IMPORTANT CHANGE:
   * Only refetch on focus if we were explicitly told to refresh (refresh=1).
   * This prevents the annoying reload when simply going back from nested screens.
   */
  useFocusEffect(
    useCallback(() => {
      if (refresh === "1" && itinerary) {
        handleRefresh();

        // consume the flag so it doesn't refresh again next focus
        router.setParams({ refresh: "0" } as any);
      }
    }, [refresh, itinerary?.itinerary_id, handleRefresh, router])
  );

  // ✅ IMPORTANT CHANGE:
  // Only show the full-page loader on FIRST load (when itinerary is not available yet).
  if (loading && !itinerary) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="mt-4 text-gray-400 font-onest">Loading itinerary...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!itinerary) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <Text className="text-center text-gray-400 py-10 font-onest">Itinerary not found</Text>
          <Pressable onPress={() => router.back()} className="bg-primary rounded-lg px-6 py-3">
            <Text className="text-white font-onest-medium">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <OverviewTab
            itinerary={itinerary}
            serviceAssignments={serviceAssignments}
            onAddToCalendar={handleAddToCalendar}
            onNavigateToTab={handleNavigateToTab}
          />
        );

      case "tripplan":
        return (
          <TripPlanTab
            itinerary={itinerary}
            bookingPayments={bookingPayments}
            collapsedDays={collapsedDays}
            getDayHeaderStyle={getDayHeaderStyle}
            onToggleDayCollapse={toggleDayCollapse}
            onNavigateAll={handleMultiStopNavigation}
            onNavigateSingle={handleSingleNavigation}
            onNavigateBetween={navigateBetweenItems}
            onShowFoodStops={handleShowFoodStops}
            onRefresh={handleRefresh}
          />
        );

      case "guide":
        return <GuideTab serviceAssignments={serviceAssignments} itineraryId={itinerary.itinerary_id} />;

      case "payment":
        return (
          <PaymentTab bookings={bookingPayments} refunds={refunds} onPayNow={handlePayNow} />
        );

      default:
        return null;
    }
  };

  const dateRangeText = `${formatDate(itinerary.start_date)} - ${formatDate(itinerary.end_date)}`;

  return (
    <SafeAreaView className="flex-1 bg-[#fff]">
      <View className="px-6 mt-12 pt-4 pb-4 ">
        <View className="flex-row justify-between items-baseline">
          <View className="flex-1 px-4">
            <Text className="text-3xl font-onest-semibold text-black/90">Trip to</Text>
            <Text className="text-3xl font-onest-semibold text-black/90">{itinerary.title}</Text>
          </View>

          <Pressable onPress={showTooltip} className="p-2 rounded-full">
            <Ionicons name="information-circle" size={24} color="#191313" />
          </Pressable>
        </View>

        <View className="flex-row items-center my-6 px-4">
          <Ionicons name="calendar-outline" size={16} color="#000000cc" />
          <Text className="text-sm text-black/90 font-onest ml-2">{dateRangeText}</Text>
        </View>


      </View>

      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} paymentBadge={paymentBadge} />

      <View className="flex-1">{renderTabContent()}</View>

      <FoodStopsSheet
        visible={foodStopsVisible}
        onClose={handleCloseFoodStops}
        routeData={foodStopsRouteData}
        loading={foodStopsLoading}
        dayNumber={selectedDayForFood}
      />

      {renderTooltip()}
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
        ...(capabilities.editType === "current_and_future" && {
          currentDay: capabilities.currentDay?.toString(),
          editableDays: capabilities.editableDays?.join(","),
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
