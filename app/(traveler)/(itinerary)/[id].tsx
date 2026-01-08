// screens/ItineraryDetailScreen.tsx

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import API_URL from "../../../constants/api";

// Types
interface PaymentData {
  payment_id: number;
  itinerary_id: number;
  total_amount: number;
  amount_paid: number;
  payment_status: string;

  // 🆕 NEW FIELDS from backend
  creator_cash_due?: number;
  creator_cash_collected?: boolean;
  creator_cash_collected_at?: string;
  actual_remaining_balance?: number;
  is_payment_complete?: boolean;
  display_status?: string;
  all_cash_collected?: boolean;
  show_pay_button?: boolean;
  payment_complete_message?: string;

  created_at: string;
  updated_at: string;
}

// Hooks
import { useCalendarIntegration } from "@/hooks/useCalendar";
import { useEditCapabilities } from "@/hooks/useEditCapabilities";
import { useItinerary } from "@/hooks/useItinerary";
import { useItineraryNavigation } from "@/hooks/useNavigation";

// Utils
import {
  formatDate,
  formatTime,
  formatTimeRange,
  getDateForDay,
  getDayRange,
  getImageUri,
  groupItemsByDay,
  hasEnoughTimeBetween,
} from "@/utils/itinerary-utils";

export default function ItineraryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // State
  const [isPaymentExpanded, setIsPaymentExpanded] = useState(true);
  const [collapsedDays, setCollapsedDays] = useState<Set<number>>(new Set());

  // Hooks
  const { loading, itinerary } = useItinerary(id);
  const { handleMultiStopNavigation, handleSingleNavigation, navigateBetweenItems } =
    useItineraryNavigation();
  const { addItineraryToCalendar } = useCalendarIntegration();
  const { getEditCapabilities, getDayHeaderStyle } = useEditCapabilities(itinerary);

  // Toggle collapse state for a day
  const toggleDayCollapse = (dayNumber: number) => {
    setCollapsedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dayNumber)) {
        newSet.delete(dayNumber);
      } else {
        newSet.add(dayNumber);
      }
      return newSet;
    });
  };

  const handlePayNow = () => {
    router.push(`/(traveler)/(payment)/${itinerary?.itinerary_id}`);
  };

  const getEditButtonConfig = () => {
    const capabilities = getEditCapabilities();

    if (!capabilities.canEdit) {
      let buttonText = "Cannot Edit";
      if (capabilities.editType === "completed") {
        buttonText = "Trip Completed";
      } else if (capabilities.editType === "all_activities_complete") {
        buttonText = "All Activities Done";
      }

      return {
        disabled: true,
        style: "bg-gray-300",
        textStyle: "text-gray-500",
        iconColor: "#9CA3AF",
        text: buttonText,
      };
    }

    return {
      disabled: false,
      style: "bg-primary",
      textStyle: "text-gray-300",
      iconColor: "#E5E7EB",
      text: capabilities.editType === "full" ? "Edit Trip" : "Edit Schedule",
    };
  };

  const handleEditPress = () => {
    const capabilities = getEditCapabilities();

    if (!capabilities.canEdit) {
      let alertMessage = "";
      let alertTitle = "Cannot Edit";

      switch (capabilities.editType) {
        case "completed":
          alertTitle = "Trip Completed";
          alertMessage =
            "Completed trips cannot be modified. You can create a new trip based on this one if needed.";
          break;
        case "all_activities_complete":
          alertTitle = "All Activities Complete";
          alertMessage =
            "All activities in this itinerary have already occurred and cannot be modified.";
          break;
        case "trip_ending":
          alertTitle = "Trip Ending";
          alertMessage =
            "Your trip is ending today. Future trip modifications are not available.";
          break;
        default:
          alertMessage = "This trip cannot be edited at this time.";
      }

      Alert.alert(alertTitle, alertMessage, [
        { text: "OK", style: "default" as const },
        ...(capabilities.editType === "completed"
          ? [
            {
              text: "Create Similar Trip",
              style: "default" as const,
              onPress: () =>
                router.push(
                  `/(createItinerary)/duplicate/${itinerary!.itinerary_id}` as any
                ),
            },
          ]
          : []),
      ]);
      return;
    }

    router.navigate({
      pathname: `/(traveler)/(itinerary)/edit/[id]`,
      params: {
        id: itinerary!.itinerary_id.toString(),
        editType: capabilities.editType,
        ...(capabilities.editType === "current_and_future" && {
          currentDay: capabilities.currentDay?.toString(),
          editableDays: capabilities.editableDays?.join(","),
        }),
      },
    });
  };

  const getStatusIndicatorWithHint = (status: string) => {
    const baseConfig = {
      pending: { bg: "bg-gray-100", text: "text-gray-600", icon: "⏱️" },
      upcoming: { bg: "bg-indigo-50", text: "text-primary", icon: "📅" },
      ongoing: { bg: "bg-green-50", text: "text-green-600", icon: "✈️" },
      completed: { bg: "bg-gray-100", text: "text-gray-600", icon: "✅" },
    };

    const config = baseConfig[status as keyof typeof baseConfig];

    return (
      <View className="items-end">
        <View className={`px-3 py-1 rounded-md ${config.bg}`}>
          <View className="flex-row items-center">
            <Text className={`text-xs font-onest-medium capitalize ${config.text}`}>
              {status}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="mt-4 text-gray-600 font-onest">Loading itinerary...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Empty state
  if (!itinerary) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <Text className="text-center text-gray-500 py-10 font-onest">
            Itinerary not found
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-primary rounded-lg px-6 py-3"
            activeOpacity={0.7}
          >
            <Text className="text-white font-onest-medium">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const groupedItems = groupItemsByDay(itinerary.items);
  const dayCount = getDayRange(itinerary);

  return (
    <SafeAreaView className="bg-gray-50">
      <View className="w-full h-screen">
        {/* Header */}
        <View className="p-4">
          <Text className="text-normal text-xl font-onest-semibold text-center">
            Trip Details
          </Text>
        </View>

        <View className="w-6 mt-4" />

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 142 }}>
          <View className="mx-6 mb-6 rounded-lg overflow-hidden border border-gray-200">
            <View className="p-6 bg-white">
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1 mr-4">
                  {/* Title */}
                  <Text className="text-2xl font-onest-semibold text-gray-800 mb-2">
                    {itinerary.title}
                  </Text>

                  {/* Dates */}
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <Text className="text-sm text-gray-600 font-onest ml-2">
                      {formatDate(itinerary.start_date)} - {formatDate(itinerary.end_date)}
                    </Text>
                  </View>

                  {/* Duration and activities */}
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="globe-outline" size={16} color="#6B7280" />
                    <Text className="text-sm text-gray-600 font-onest ml-2">
                      {dayCount} day{dayCount > 1 ? "s" : ""} • {itinerary.items.length}{" "}
                      {itinerary.items.length > 1 ? "activities" : "activity"}
                    </Text>
                  </View>
                </View>
                {/* Status Indicator */}
                {getStatusIndicatorWithHint(itinerary.status)}
              </View>

              {/* ==================== PAYMENT SECTION START ==================== */}

              {itinerary.payments && itinerary.payments.length > 0 ? (
                <View className="mt-4 pt-4 border-t border-gray-200">
                  {/* Collapsible Header */}
                  <Pressable
                    onPress={() => setIsPaymentExpanded(!isPaymentExpanded)}
                    className="flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center flex-1">
                      <Ionicons
                        name={isPaymentExpanded ? "chevron-down" : "chevron-forward"}
                        size={20}
                        color="#374151"
                        style={{ marginRight: 8 }}
                      />
                      <Text className="text-base font-onest-semibold text-gray-800">
                        Payment Details
                      </Text>
                    </View>

                    {/* Payment Status Badge */}
                    {(() => {
                      const payment = itinerary.payments[0];
                      const status = payment.display_status || payment.payment_status || "Unknown";
                      const isPaid = status === "Paid" || payment.is_payment_complete === true;
                      const isPartial = status === "Partial" && payment.is_payment_complete !== true;
                      const isFailed = status === "Failed";

                      // ✅ Use specific icon names directly, not variables
                      if (isPaid) {
                        return (
                          <View className="px-3 py-1.5 rounded-full flex-row items-center bg-green-100">
                            <Ionicons name="checkmark-circle" size={14} color="#059669" />
                            <Text className="text-xs font-onest-medium ml-1 text-green-700">
                              {status}
                            </Text>
                          </View>
                        );
                      }

                      if (isFailed) {
                        return (
                          <View className="px-3 py-1.5 rounded-full flex-row items-center bg-red-100">
                            <Ionicons name="close-circle" size={14} color="#DC2626" />
                            <Text className="text-xs font-onest-medium ml-1 text-red-700">
                              {status}
                            </Text>
                          </View>
                        );
                      }

                      if (isPartial) {
                        return (
                          <View className="px-3 py-1.5 rounded-full flex-row items-center bg-yellow-50">
                            <Ionicons name="time" size={14} color="#D97706" />
                            <Text className="text-xs font-onest-medium ml-1 text-yellow-600">
                              {status}
                            </Text>
                          </View>
                        );
                      }

                      // Default/Unknown status
                      return (
                        <View className="px-3 py-1.5 rounded-full flex-row items-center bg-yellow-50">
                          <Ionicons name="alert-circle" size={14} color="#D97706" />
                          <Text className="text-xs font-onest-medium ml-1 text-yellow-600">
                            {status}
                          </Text>
                        </View>
                      );
                    })()}
                  </Pressable>

                  {/* Expandable Content */}
                  {isPaymentExpanded && (
                    <View>
                      {(() => {
                        const payment = itinerary.payments[0];

                        // Safe type checking and defaults
                        const status = payment.display_status || payment.payment_status;
                        const isFailed = status === "Failed";
                        const isPaid = status === "Paid" || payment.is_payment_complete === true;
                        const isPartial = payment.payment_status === "Partial" && payment.is_payment_complete !== true;

                        // Safe number conversions with defaults
                        const totalAmount = Number(payment.total_amount) || 0;
                        const amountPaid = Number(payment.amount_paid) || 0;
                        const creatorCashDue = Number(payment.creator_cash_due || 0);
                        const creatorCashCollected = payment.creator_cash_collected === true;

                        // Calculate progress
                        const effectivePaid = amountPaid + (creatorCashCollected ? creatorCashDue : 0);
                        const progressPercentage = totalAmount > 0 ? (effectivePaid / totalAmount) * 100 : 0;

                        // Use actual_remaining_balance from backend if available
                        const remainingBalance = payment.actual_remaining_balance !== undefined
                          ? Number(payment.actual_remaining_balance)
                          : Math.max(0, totalAmount - effectivePaid);

                        // Determine if pay button should show
                        const shouldShowPayButton =
                          isFailed ||
                          (payment.show_pay_button !== false && !isPaid && remainingBalance > 0);

                        return (
                          <>
                            {/* Progress Bar (for Partial payments only) */}
                            {isPartial && !isFailed && (
                              <View className="mb-3 mt-3">
                                <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <View
                                    className="h-full bg-yellow-500 rounded-full"
                                    style={{
                                      width: `${Math.min(progressPercentage, 100)}%`,
                                    }}
                                  />
                                </View>
                                <Text className="text-xs text-gray-500 font-onest mt-1">
                                  {progressPercentage.toFixed(0)}% paid
                                </Text>
                              </View>
                            )}

                            {/* Failed Payment Warning */}
                            {isFailed && (
                              <View className="bg-red-50 rounded-lg p-3 mb-3 mt-3 flex-row items-start">
                                <Ionicons name="close-circle" size={20} color="#DC2626" />
                                <View className="ml-2 flex-1">
                                  <Text className="text-red-700 font-onest-semibold text-sm">
                                    Payment Declined
                                  </Text>
                                  <Text className="text-red-600 font-onest text-xs mt-1">
                                    Your payment proof was rejected. Please resubmit with a valid payment proof.
                                  </Text>
                                </View>
                              </View>
                            )}

                            {/* Payment Amount Details */}
                            <View className="bg-gray-50 rounded-lg p-3 mb-3 mt-3">
                              {/* Total Amount */}
                              <View className="flex-row items-center justify-between mb-2">
                                <Text className="text-sm text-gray-600 font-onest">Total Amount</Text>
                                <Text className="text-sm font-onest-medium text-gray-800">
                                  ₱{totalAmount.toLocaleString()}
                                </Text>
                              </View>

                              {/* Amount Paid Online - only show if > 0 and not failed */}
                              {amountPaid > 0 && !isFailed && (
                                <View className="flex-row items-center justify-between mb-2">
                                  <Text className="text-sm text-gray-600 font-onest">
                                    Amount Paid (Online)
                                  </Text>
                                  <Text className="text-sm font-onest-medium text-green-600">
                                    ₱{amountPaid.toLocaleString()}
                                  </Text>
                                </View>
                              )}

                              {/* Creator Cash Payment Info */}
                              {creatorCashDue > 0 && !isFailed && (
                                <View className="flex-row items-center justify-between mb-2">
                                  <Text className="text-sm text-gray-600 font-onest">
                                    Cash Payment {creatorCashCollected ? "(✓ Collected)" : "(Due)"}
                                  </Text>
                                  <Text
                                    className={`text-sm font-onest-medium ${creatorCashCollected ? "text-green-600" : "text-yellow-600"
                                      }`}
                                  >
                                    ₱{creatorCashDue.toLocaleString()}
                                  </Text>
                                </View>
                              )}

                              {/* Remaining Balance or Amount to Pay */}
                              {!isPaid && remainingBalance > 0 && (
                                <View className="flex-row items-center justify-between pt-2 border-t border-gray-200">
                                  <Text className="text-sm font-onest-semibold text-gray-800">
                                    {isFailed ? "Amount to Pay" : "Remaining"}
                                  </Text>
                                  <Text
                                    className={`text-base font-onest-bold ${isFailed ? "text-red-600" : "text-yellow-600"
                                      }`}
                                  >
                                    ₱{remainingBalance.toLocaleString()}
                                  </Text>
                                </View>
                              )}
                            </View>

                            {/* Action: Pay Button OR Success Message */}
                            {shouldShowPayButton ? (
                              // Pay/Resubmit Button
                              <TouchableOpacity
                                className={`py-3 px-4 rounded-lg flex-row items-center justify-center bg-primary
                                  `}
                                activeOpacity={0.7}
                                onPress={handlePayNow}
                              >
                                <Ionicons
                                  name={isFailed ? "refresh-outline" : "card-outline"}
                                  size={18}
                                  color="white"
                                />
                                <Text className="text-white font-onest-semibold text-sm ml-2">
                                  {isFailed
                                    ? `Resubmit Payment`
                                    : `Pay Remaining ₱${Math.round(remainingBalance).toLocaleString()}`}
                                </Text>
                              </TouchableOpacity>
                            ) : (
                              // Payment Complete Message
                              <View className="bg-green-50 rounded-lg p-3 flex-row items-start">
                                <Ionicons name="checkmark-circle" size={20} color="#059669" />
                                <View className="ml-2 flex-1">
                                  <Text className="text-green-700 font-onest-semibold text-sm">
                                    Payment Complete
                                  </Text>
                                  {payment.payment_complete_message && (
                                    <Text className="text-green-600 font-onest text-xs mt-1">
                                      {payment.payment_complete_message}
                                    </Text>
                                  )}
                                  {payment.creator_cash_collected_at && (
                                    <Text className="text-green-600 font-onest text-xs mt-0.5">
                                      Collected on{" "}
                                      {new Date(
                                        payment.creator_cash_collected_at
                                      ).toLocaleDateString("en-PH", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </Text>
                                  )}
                                </View>
                              </View>
                            )}
                          </>
                        );
                      })()}
                    </View>
                  )}
                </View>
              ) : (
                // No payment information available
                <View className="mt-4 pt-4 border-t border-gray-200">
                  <TouchableOpacity
                    onPress={() => setIsPaymentExpanded(!isPaymentExpanded)}
                    activeOpacity={0.7}
                    className="flex-row items-center mb-3"
                  >
                    <Ionicons
                      name={isPaymentExpanded ? "chevron-down" : "chevron-forward"}
                      size={20}
                      color="#374151"
                      style={{ marginRight: 8 }}
                    />
                    <Text className="text-base font-onest-semibold text-gray-800">
                      Payment Details
                    </Text>
                  </TouchableOpacity>

                  {isPaymentExpanded && (
                    <View className="bg-blue-50 rounded-lg p-3 flex-row items-start">
                      <Ionicons name="information-circle-outline" size={18} color="#3B82F6" />
                      <Text className="text-xs text-blue-700 font-onest ml-2 flex-1">
                        Payment information will be available once confirmed with your creator.
                      </Text>
                    </View>
                  )}
                </View>
              )}
              {/* ==================== PAYMENT SECTION END ==================== */}
            </View>
          </View>

          {/* Daily Itinerary Section */}
          <View className="px-6">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-normal text-xl font-onest-medium ">Daily Itinerary</Text>
              {/* Add to Calendar */}
              <Pressable
                className="flex flex-row gap-1"
                onPress={() => addItineraryToCalendar(itinerary)}
              >
                <Ionicons name="add-outline" size={16} color="#3b82f6" />
                <Text className="font-onest text-blue-500"> Add to Calendar</Text>
              </Pressable>
            </View>

            {Object.entries(groupedItems)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([day, items]) => {
                const dayStyles = getDayHeaderStyle(parseInt(day));
                const sortedItems = items.sort((a, b) =>
                  a.start_time.localeCompare(b.start_time)
                );
                const hasMultipleStops = sortedItems.length > 1;
                const hasCoordinates = sortedItems.some(
                  (item) => item.destination_latitude && item.destination_longitude
                );
                const isCollapsed = collapsedDays.has(parseInt(day));

                return (
                  <View
                    key={day}
                    className="mb-6 rounded-lg overflow-hidden border border-gray-200"
                  >
                    {/* Enhanced Day Header with Multi-stop Navigation Button */}
                    <TouchableOpacity
                      className={`p-4 border-b border-gray-100 ${dayStyles.container}`}
                      onPress={() => toggleDayCollapse(parseInt(day))}
                      activeOpacity={0.7}
                    >
                      <View>
                        {/* First Row: Day info and chevron */}
                        <View className="flex-row justify-between items-center">
                          <View className="flex-1 flex-row items-center">
                            <Ionicons
                              name={isCollapsed ? "chevron-forward" : "chevron-down"}
                              size={20}
                              color="#6B7280"
                              style={{ marginRight: 8 }}
                            />
                            <View className="flex-1">
                              <View className="flex-row items-center flex-wrap justify-between">
                                <Text
                                  className={`text-lg font-onest-semibold ${dayStyles.text} mr-2`}
                                >
                                  Day {day}
                                </Text>
                                {dayStyles.indicator && (
                                  <Text className="text-xs text-gray-500 font-onest">
                                    {dayStyles.indicator}
                                  </Text>
                                )}
                              </View>
                              <Text className="text-sm text-gray-500 font-onest">
                                {getDateForDay(itinerary, parseInt(day))} •{" "}
                                {sortedItems.length}{" "}
                                {sortedItems.length > 1 ? "activities" : "activity"}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Second Row: Navigation button when expanded */}
                        {hasMultipleStops && hasCoordinates && !isCollapsed && (
                          <TouchableOpacity
                            className="bg-primary rounded-full px-4 py-2 flex-row items-center self-start mt-3"
                            onPress={(e) => {
                              e.stopPropagation();
                              handleMultiStopNavigation(sortedItems);
                            }}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="navigate" size={16} color="#E5E7EB" />
                            <Text className="text-gray-200 font-onest-medium ml-2 text-sm">
                              Navigate All ({sortedItems.length} stops)
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>

                    {/* Day Items with Navigation Links - Only show when not collapsed */}
                    {!isCollapsed &&
                      sortedItems.map((item, index) => {
                        const nextItem = sortedItems[index + 1];
                        const timeCheck = nextItem
                          ? hasEnoughTimeBetween(item, nextItem)
                          : null;

                        return (
                          <React.Fragment key={item.item_id}>
                            <TouchableOpacity
                              className={`bg-white p-4 ${index !== items.length - 1 ? "border-b border-gray-100" : ""
                                }`}
                              activeOpacity={0.7}
                              onPress={() =>
                                router.push(`/(traveler)/(itinerary)/activity/${item.item_id}`)
                              }
                            >
                              <View className="flex-row">
                                {/* Time Column */}
                                <View className="w-20 items-center mr-4">
                                  <View className="bg-indigo-50 rounded-md p-2 items-center">
                                    <Ionicons name="time-outline" size={14} color="#4F46E5" />
                                    <Text className="text-xs font-onest-medium text-primary mt-1">
                                      {formatTime(item.start_time)}
                                    </Text>
                                    <Text className="text-xs text-gray-500 font-onest">
                                      {formatTime(item.end_time)}
                                    </Text>
                                  </View>

                                  {/* Quick Navigation Button */}
                                  {item.destination_latitude &&
                                    item.destination_longitude && (
                                      <TouchableOpacity
                                        className="mt-2 bg-primary/10 p-2 rounded-lg"
                                        onPress={(e) => {
                                          e.stopPropagation();
                                          handleSingleNavigation(item);
                                        }}
                                      >
                                        <Ionicons name="navigate" size={16} color="#4F46E5" />
                                      </TouchableOpacity>
                                    )}
                                </View>

                                {/* Content Column */}
                                <View className="flex-1">
                                  {/* Experience Image */}
                                  {item.primary_image ? (
                                    <Image
                                      source={{
                                        uri: getImageUri(item.primary_image, API_URL),
                                      }}
                                      className="w-full h-32 rounded-md mb-3"
                                      resizeMode="cover"
                                    />
                                  ) : (
                                    <View className="w-full h-32 bg-gray-200 items-center justify-center rounded-md mb-3">
                                      <Ionicons name="image-outline" size={40} color="#A0AEC0" />
                                    </View>
                                  )}

                                  {/* Experience Details */}
                                  <Text className="text-lg font-onest-semibold text-gray-800 mb-1">
                                    {item.experience_name}
                                  </Text>
                                  <Text className="text-sm text-gray-600 font-onest mb-2">
                                    {item.experience_description}
                                  </Text>

                                  {/* Location */}
                                  <View className="flex-row items-center mb-2">
                                    <Ionicons name="location-outline" size={16} color="#4F46E5" />
                                    <Text className="text-sm text-gray-600 font-onest ml-1">
                                      {item.destination_name}, {item.destination_city}
                                    </Text>
                                  </View>

                                  {/* Duration */}
                                  <View className="bg-gray-50 rounded-md p-2 mb-2">
                                    <Text className="text-xs text-gray-500 font-onest">
                                      Duration: {formatTimeRange(item.start_time, item.end_time)}
                                    </Text>
                                  </View>

                                  {/* Custom Note */}
                                  {item.custom_note && (
                                    <View className="bg-indigo-50 rounded-md p-2 mt-2">
                                      <Text className="text-xs font-onest-medium text-primary mb-1">
                                        Note
                                      </Text>
                                      <Text className="text-xs text-primary font-onest">
                                        {item.custom_note}
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              </View>
                            </TouchableOpacity>

                            {/* Travel Time Indicator Between Activities */}
                            {nextItem && index < sortedItems.length - 1 && (
                              <View className="bg-gray-50 px-4 py-3 flex-row items-center justify-between">
                                <View className="flex-row items-center flex-1">
                                  <View className="w-20 items-center mr-4">
                                    <View className="w-0.5 h-8 bg-gray-300" />
                                    <Ionicons
                                      name="car-outline"
                                      size={16}
                                      color="#6B7280"
                                      className="mt-1"
                                    />
                                  </View>
                                  <Text
                                    className={`text-sm font-onest ${timeCheck && !timeCheck.hasTime
                                      ? "text-orange-600"
                                      : "text-gray-600"
                                      }`}
                                  >
                                    {timeCheck?.message || "Travel to next activity"}
                                  </Text>
                                </View>

                                {/* Navigate to Next Button */}
                                {item.destination_latitude &&
                                  item.destination_longitude &&
                                  nextItem.destination_latitude &&
                                  nextItem.destination_longitude && (
                                    <TouchableOpacity
                                      className="bg-white border border-gray-300 rounded-full px-3 py-1.5 flex-row items-center"
                                      onPress={() => navigateBetweenItems(item, nextItem)}
                                    >
                                      <Ionicons
                                        name="navigate-outline"
                                        size={14}
                                        color="#4F46E5"
                                      />
                                      <Text className="text-xs text-primary font-onest-medium ml-1">
                                        Directions
                                      </Text>
                                    </TouchableOpacity>
                                  )}
                              </View>
                            )}
                          </React.Fragment>
                        );
                      })}
                  </View>
                );
              })}
          </View>
        </ScrollView>

        {/* Smart Floating Edit Button */}
        {(() => {
          const editConfig = getEditButtonConfig();
          return (
            <TouchableOpacity
              className={`absolute bottom-48 right-6 rounded-full p-4 shadow-md flex-row items-center ${editConfig.style}`}
              activeOpacity={editConfig.disabled ? 1 : 0.7}
              onPress={editConfig.disabled ? undefined : handleEditPress}
              disabled={editConfig.disabled}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name={editConfig.disabled ? "lock-closed-outline" : "create-outline"}
                  size={20}
                  color={editConfig.iconColor}
                />
                <Text className={`font-onest ml-2 ${editConfig.textStyle}`}>
                  {editConfig.text}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })()}
      </View>
    </SafeAreaView>
  );
}