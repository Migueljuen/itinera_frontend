// screens/guide/GuideItineraryDetailScreen.tsx

import API_URL from "@/constants/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Components - reuse from traveler side
import { GuideAssignmentActionBar } from "@/components/guide/GuideAssignmentActionBar";
import { TripPlanTab } from "@/components/itinerary/tabs/TripPlanTab";

// Hooks - reuse navigation hooks
import { useItineraryNavigation } from "@/hooks/useNavigation";

// Utils
import { formatDate } from "@/utils/itinerary-utils";

// Types
import { Itinerary, MeetingPoint } from "@/types/itineraryDetails";

type GuideTabType = "overview" | "tripplan" | "earnings";

/**
 * IMPORTANT:
 * This UI expects the backend to include a service/assignment payment object in:
 * partner_info.earnings.traveler_payment
 *
 * Suggested fields (add what you already have):
 * - payment_status: 'unpaid' | 'submitted' | 'verified' | 'rejected' | 'paid'
 * - payment_proof: string | null  (path/url)
 * - payment_submitted_at: string | null
 * - payment_verified_at: string | null
 * - payment_rejected_at: string | null
 * - payment_reject_reason: string | null
 */
interface TravelerPaymentInfo {
  total_amount: number;
  amount_paid_online: number;
  cash_collected: number;

  // status of the traveler -> service payment
  payment_status: "unpaid" | "submitted" | "verified" | "rejected" | "paid" | string;

  // optional proof + timeline
  payment_proof?: string | null;
  payment_submitted_at?: string | null;
  payment_verified_at?: string | null;
  payment_rejected_at?: string | null;
  payment_reject_reason?: string | null;
}

// Earnings types from backend
interface EarningsBreakdown {
  gross_fee: number;
  platform_fee: number;
  platform_fee_percentage: number;
  net_earnings: number;
  traveler_payment?: TravelerPaymentInfo;
  payment_status: {
    status: "awaiting_acceptance" | "pending" | "upcoming" | "in_progress" | "paid";
    label: string;
    description: string;
    is_paid: boolean;
  };
  trip_dates: {
    start_date: string;
    end_date: string;
    total_days: number;
  };
}

interface GuideInfo {
  traveler_name: string;
  traveler_user_id: string;
  traveler_contact: string;
  traveler_profile_pic: string | null;
  assignment_id: number;
  service_fee: number;
  assignment_status: string;
  assigned_at: string;
  meeting_points?: MeetingPoint[];
  earnings?: EarningsBreakdown | null;
}

interface GuideItineraryResponse {
  itinerary: Itinerary;
  access_level: "partner";
  partner_type: "Guide";
  partner_info: GuideInfo;
  payments: [];
}

function safeDateTimeLabel(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value; // if backend sends a custom string
  return d.toLocaleString();
}

function normalizeProofUrl(proof?: string | null) {
  if (!proof) return null;
  // If backend already returns full URL, keep it
  if (proof.startsWith("http://") || proof.startsWith("https://")) return proof;
  // Otherwise treat as server path
  return `${API_URL}/${proof}`;
}

function getTravelerSentPaymentBadge(payment?: TravelerPaymentInfo) {
  const status = (payment?.payment_status || "").toLowerCase();

  if (!payment) {
    return {
      label: "No payment info",
      description: "Waiting for traveler payment details.",
      bg: "bg-gray-50",
      iconBg: "bg-gray-100",
      iconColor: "#9ca3af",
      icon: "help-circle-outline" as const,
      canApprove: false,
    };
  }

  if (status === "verified" || status === "paid") {
    return {
      label: "Payment approved",
      description: payment.payment_verified_at
        ? `Approved on ${safeDateTimeLabel(payment.payment_verified_at)}`
        : "You have already approved this payment.",
      bg: "bg-green-50",
      iconBg: "bg-green-100",
      iconColor: "#16a34a",
      icon: "checkmark-circle" as const,
      canApprove: false,
    };
  }

  if (status === "submitted") {
    return {
      label: "Payment submitted",
      description: payment.payment_submitted_at
        ? `Submitted on ${safeDateTimeLabel(payment.payment_submitted_at)}`
        : "Traveler submitted payment proof.",
      bg: "bg-blue-50",
      iconBg: "bg-blue-100",
      iconColor: "#3b82f6",
      icon: "cloud-upload-outline" as const,
      canApprove: true,
    };
  }

  if (status === "rejected") {
    return {
      label: "Payment rejected",
      description: payment.payment_reject_reason
        ? payment.payment_reject_reason
        : "Traveler payment was rejected.",
      bg: "bg-red-50",
      iconBg: "bg-red-100",
      iconColor: "#dc2626",
      icon: "close-circle" as const,
      canApprove: false,
    };
  }

  // unpaid / unknown
  return {
    label: "Awaiting payment",
    description: "Traveler hasn’t submitted payment yet.",
    bg: "bg-yellow-50",
    iconBg: "bg-yellow-100",
    iconColor: "#eab308",
    icon: "time-outline" as const,
    canApprove: false,
  };
}

export default function GuideItineraryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // State
  const [loading, setLoading] = useState(true);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [guideInfo, setGuideInfo] = useState<GuideInfo | null>(null);
  const [activeTab, setActiveTab] = useState<GuideTabType>("overview");
  const [collapsedDays, setCollapsedDays] = useState<Set<number>>(new Set());
  const [startingChat, setStartingChat] = useState(false);
  const [approvingPayment, setApprovingPayment] = useState(false);

  // Navigation hooks
  const {
    userLocation,
    handleMultiStopNavigation,
    handleSingleNavigation,
    navigateBetweenItems,
  } = useItineraryNavigation();

  const refreshItinerary = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token || !id) return;

      const response = await axios.get<GuideItineraryResponse>(`${API_URL}/itinerary/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data: any = response.data;

      if (
        data.access_level === "partner" &&
        (data.partner_type === "Guide" || data.partner_type === "Driver") &&
        data.partner_info
      ) {
        const pi = data.partner_info;

        setItinerary(data.itinerary);

        setGuideInfo({
          traveler_name: pi.traveler_name,
          traveler_user_id: String(pi.traveler_user_id),
          traveler_contact: pi.traveler_contact,
          traveler_profile_pic: pi.traveler_profile_pic ?? null,
          assignment_id: pi.assignment_id,
          service_fee: pi.service_fee ?? 0,
          assignment_status: pi.assignment_status,
          assigned_at: pi.assigned_at,
          meeting_points: pi.meeting_points ?? [],
          earnings: pi.earnings ?? null,
        });
      }
    } catch (error) {
      console.error("Error fetching itinerary:", error);
    }
  }, [id]);

  // Fetch itinerary data
  useEffect(() => {
    const run = async () => {
      try {
        await refreshItinerary();
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [refreshItinerary]);

  // Handlers
  const handlePayNow = useCallback(() => {
    router.push(`/(traveler)/(payment)/${itinerary?.itinerary_id}`);
  }, [router, itinerary?.itinerary_id]);

  const toggleDayCollapse = useCallback((dayNumber: number) => {
    setCollapsedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dayNumber)) newSet.delete(dayNumber);
      else newSet.add(dayNumber);
      return newSet;
    });
  }, []);

  const handleCallTraveler = useCallback(() => {
    if (guideInfo?.traveler_contact) {
      Linking.openURL(`tel:${guideInfo.traveler_contact}`);
    }
  }, [guideInfo]);

  const handleStartConversation = async () => {
    try {
      if (!guideInfo?.traveler_user_id) {
        Alert.alert("Error", "Traveler information missing");
        return;
      }

      setStartingChat(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const response = await axios.post(
        `${API_URL}/conversations`,
        { participantId: guideInfo.traveler_user_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        router.push({
          pathname: "/(partner)/(conversations)/[id]",
          params: { id: String(response.data.data.id), name: guideInfo.traveler_name },
        });
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      Alert.alert("Error", "Failed to start conversation");
    } finally {
      setStartingChat(false);
    }
  };

  const handleOpenLocation = useCallback((latitude: number, longitude: number, name: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Unable to open maps");
    });
  }, []);

  const handleOpenPaymentProof = useCallback((proof?: string | null) => {
    const url = normalizeProofUrl(proof);
    if (!url) return;
    Linking.openURL(url).catch(() => Alert.alert("Error", "Unable to open payment proof"));
  }, []);

  // ✅ Approve payment (traveler -> service) handler
  const handleApproveTravelerPayment = useCallback(async () => {
    if (!guideInfo?.assignment_id) return;

    Alert.alert(
      "Approve payment?",
      "Only approve if you already received the traveler’s payment.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          style: "default",
          onPress: async () => {
            try {
              setApprovingPayment(true);
              const token = await AsyncStorage.getItem("token");
              if (!token) return;

              /**
               * Backend endpoint you should implement (recommended):
               * POST /partner-mobile/assignments/:assignmentId/approve-payment
               *
               * It should:
               * - verify req.user is the assigned guide/driver
               * - mark traveler->service payment as verified
               * - set payment_verified_at = NOW()
               * - optionally set earnings.payment_status to paid (if that’s your rule)
               */
              await axios.post(
                `${API_URL}/partner-mobile/assignments/${guideInfo.assignment_id}/approve-payment`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );

              // Refresh to get updated payment_status + timestamps
              await refreshItinerary();

              Alert.alert("Approved", "Payment has been marked as received.");
            } catch (error: any) {
              console.log("Approve payment error:", error?.response?.status, error?.response?.data);
              Alert.alert(
                "Error",
                error?.response?.data?.message || "Failed to approve payment. Please try again."
              );
            } finally {
              setApprovingPayment(false);
            }
          },
        },
      ]
    );
  }, [guideInfo?.assignment_id, refreshItinerary]);

  // Accept assignment handler
  const handleAcceptAssignment = useCallback(async (assignmentId: number) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      await axios.post(
        `${API_URL}/partner-mobile/assignments/${assignmentId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setGuideInfo((prev) => (prev ? { ...prev, assignment_status: "Accepted" } : null));

      Alert.alert("Request Accepted", "You have successfully accepted this trip request.", [
        { text: "OK" },
      ]);
    } catch (error: any) {
      console.log("STATUS:", error.response?.status);
      console.log("DATA:", error.response?.data);
      console.log("HEADERS:", error.response?.headers);
    }
  }, []);

  // Decline assignment handler
  const handleDeclineAssignment = useCallback(
    async (assignmentId: number) => {
      Alert.alert("Decline Request", "Are you sure you want to decline this trip request?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              if (!token) return;

              await axios.post(
                `${API_URL}/partner-mobile/assignments/${assignmentId}/decline`,
                { decline_reason: "Other" },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              router.back();
            } catch (error) {
              console.error("Error declining assignment:", error);
              Alert.alert("Error", "Failed to decline the request. Please try again.");
            }
          },
        },
      ]);
    },
    [router]
  );

  // Get day header style (simplified for guide - no edit capabilities)
  const getDayHeaderStyle = useCallback(
    (dayNumber: number) => {
      if (!itinerary) {
        return { container: "bg-white", text: "text-gray-800", indicator: "" };
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
          container: "bg-gray-50 border-l-4 border-gray-300",
          text: "text-gray-500",
          indicator: "✓ Completed",
        };
      } else if (isToday) {
        return {
          container: "bg-blue-50 border-l-4 border-blue-400",
          text: "text-blue-700",
          indicator: "📍 Today",
        };
      }

      return { container: "bg-white", text: "text-gray-800", indicator: "" };
    },
    [itinerary]
  );

  // Get payment status styling (earnings/trip status)
  const getPaymentStatusStyle = (status: string) => {
    switch (status) {
      case "paid":
        return {
          bg: "bg-green-50",
          iconBg: "bg-green-100",
          iconColor: "#16a34a",
          icon: "checkmark-circle" as const,
        };
      case "in_progress":
        return {
          bg: "bg-blue-50",
          iconBg: "bg-blue-100",
          iconColor: "#3b82f6",
          icon: "play-circle" as const,
        };
      case "upcoming":
        return {
          bg: "bg-yellow-50",
          iconBg: "bg-yellow-100",
          iconColor: "#eab308",
          icon: "time" as const,
        };
      case "awaiting_acceptance":
        return {
          bg: "bg-gray-50",
          iconBg: "bg-gray-100",
          iconColor: "#9ca3af",
          icon: "hourglass" as const,
        };
      default:
        return {
          bg: "bg-gray-50",
          iconBg: "bg-gray-100",
          iconColor: "#9ca3af",
          icon: "hourglass" as const,
        };
    }
  };

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
          <Text className="text-lg font-onest-medium text-black/70 mb-2">Itinerary Not Found</Text>
          <Text className="text-black/50 font-onest text-center mb-6">
            This itinerary may have been cancelled or you don't have access.
          </Text>
          <Pressable onPress={() => router.back()} className="bg-primary rounded-xl px-6 py-3">
            <Text className="text-white font-onest-medium">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const dateRangeText = `${formatDate(itinerary.start_date)} - ${formatDate(itinerary.end_date)}`;
  const totalDays =
    Math.ceil(
      (new Date(itinerary.end_date).getTime() - new Date(itinerary.start_date).getTime()) /
      (1000 * 60 * 60 * 24)
    ) + 1;

  const isPending = guideInfo.assignment_status === "Pending";

  // Get earnings data from backend or fallback
  const earnings = guideInfo.earnings;
  const netEarnings = earnings?.net_earnings ?? guideInfo.service_fee * 0.9;

  // Render Overview Tab Content
  const renderOverviewContent = () => (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: isPending ? 160 : 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Traveler Card */}
      <View className="mx-6 px-4 mt-6 ">
        <View className="rounded-2xl pb-8 border-b border-gray-200">
          <View className="flex-row items-start mb-3 ">
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
              <Text className="font-onest-semibold text-black/90 mb-1">{guideInfo.traveler_name}</Text>
              <Text className="text-gray-400 font-onest">Traveler</Text>
            </View>

            {/* Chat Button - Disabled when pending */}
            <Pressable
              onPress={isPending ? undefined : handleStartConversation}
              disabled={isPending}
              className={`p-3 rounded-full ${isPending ? "bg-gray-50" : "bg-gray-100"}`}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={24}
                color={isPending ? "#d1d5db" : "#1f2937"}
              />
            </Pressable>
          </View>

          {/* Call Button - Blurred/Hidden when pending */}
          {guideInfo.traveler_contact &&
            (isPending ? (
              <View className="flex-row items-center justify-center bg-gray-50 py-3 rounded-xl mt-2">
                <Text className="font-onest text-gray-400 ml-2">09{"******"} *****</Text>
              </View>
            ) : (
              <Pressable
                onPress={handleCallTraveler}
                className="flex-row items-center justify-center bg-green-50 py-3 rounded-xl mt-2"
              >
                <Ionicons name="call-outline" size={18} color="#16a34a" />
                <Text className="font-onest-medium text-green-700 ml-2">
                  {guideInfo.traveler_contact}
                </Text>
              </Pressable>
            ))}
        </View>
      </View>

      {/* Meeting Points Section */}
      {!isPending && guideInfo.meeting_points && guideInfo.meeting_points.length > 0 && (
        <View className="mx-6 mt-4 p-4">
          {guideInfo.meeting_points.map((meetingPoint) => {
            const startDate = new Date(itinerary.start_date);
            const meetingDate = new Date(startDate);
            meetingDate.setDate(startDate.getDate() + meetingPoint.day_number - 1);

            return (
              <View key={meetingPoint.id} className="rounded-xl py-4 ">
                <View className="flex flex-row justify-between items-baseline">
                  <Text className="text-2xl font-onest text-black/90 ">Where You'll Meet</Text>
                </View>

                <View className=" border-b border-gray-200 pb-8">
                  <Text className="text-sm font-onest text-black/50 mb-2">
                    Traveler requested to meetup in
                  </Text>
                  <View className="  py-3 flex flex-row gap-2  ">
                    <Ionicons name="pin-outline" size={24} color="#4F46E5" />
                    <View>
                      <Text className="font-onest-medium text-black/90 mb-1">
                        {meetingPoint.requested.name}
                      </Text>
                      <Text className="text-sm font-onest text-black/60 mb-2">
                        {meetingPoint.requested.address}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center justify-center py-3 rounded-xl mt-2">
                    {meetingPoint.requested.latitude && meetingPoint.requested.longitude && (
                      <Pressable
                        onPress={() =>
                          handleOpenLocation(
                            meetingPoint.requested.latitude!,
                            meetingPoint.requested.longitude!,
                            meetingPoint.requested.name
                          )
                        }
                        className="flex-row items-center gap-2"
                      >
                        <Ionicons name="map-outline" size={24} color="#4F46E5" />
                        <Text className="font-onest-medium text-[#4F46E5]">View on Map</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Trip Summary */}
      <View className="mx-6 mt-8 px-4 pb-16 border-b border-gray-200">
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
              ₱{netEarnings.toLocaleString()}
            </Text>
            <Text className="font-onest text-xs text-black/50">Your Earnings</Text>
          </View>
        </View>
      </View>

      {/* Assignment Info */}
      <View className="mx-6 mt-8 mb-6 p-4">
        <Text className="text-2xl font-onest text-black/90 mb-4">Assignment Details</Text>
        <View>
          <View className="flex-row justify-between items-center">
            <Text className="font-onest text-black/50">Status</Text>
            <View
              className={`px-3 py-1 rounded-full ${guideInfo.assignment_status === "Accepted" ? "bg-green-100" : "bg-yellow-100"
                }`}
            >
              <Text
                className={`font-onest-medium text-sm ${guideInfo.assignment_status === "Accepted" ? "text-green-700" : "text-yellow-700"
                  }`}
              >
                {guideInfo.assignment_status}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-100">
            <Text className="font-onest text-black/50">Assigned On</Text>
            <Text className="font-onest text-black/80">
              {guideInfo.assigned_at ? formatDate(guideInfo.assigned_at.split(" ")[0]) : "-"}
            </Text>
          </View>

          <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-100">
            <Text className="font-onest text-black/50">Your Net Earnings</Text>
            <Text className="font-onest-semibold text-primary">
              ₱{netEarnings.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  // Render Earnings Tab Content
  const renderEarningsContent = () => {
    const grossFee = earnings?.gross_fee ?? guideInfo.service_fee;


    const paymentStatus =
      earnings?.payment_status ?? ({
        status: isPending ? "awaiting_acceptance" : "pending",
        label: isPending ? "Awaiting Acceptance" : "Pending",
        description: isPending ? "Accept the assignment to proceed" : "Waiting for trip completion",
        is_paid: false,
      } as EarningsBreakdown["payment_status"]);

    const statusStyle = getPaymentStatusStyle(paymentStatus.status);

    const travelerPaymentBadge = getTravelerSentPaymentBadge(earnings?.traveler_payment);
    const canApprovePayment =
      !isPending &&
      travelerPaymentBadge.canApprove &&
      !approvingPayment;

    const proofUrl = normalizeProofUrl(earnings?.traveler_payment?.payment_proof);

    return (
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        <View className="mx-10 mt-10">
          <Text className="text-2xl font-onest text-black/90">Traveler payment to you</Text>

          <View className={`rounded-2xl mt-4  py-4`}>
            <View className="flex-row items-center">
              <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${travelerPaymentBadge.iconBg}`}>
                <Ionicons name={travelerPaymentBadge.icon} size={20} color={travelerPaymentBadge.iconColor} />
              </View>

              <View className="flex-1">
                <Text className="font-onest text-black/90">{travelerPaymentBadge.label}</Text>
                <Text className="font-onest text-xs text-black/50 mt-0.5">
                  {travelerPaymentBadge.description}
                </Text>
              </View>

              {(earnings?.traveler_payment?.payment_status || "").toLowerCase() === "verified" && (
                <View className="bg-green-100 px-3 py-1 rounded-full">
                  <Text className="text-xs font-onest-medium text-green-700">Approved</Text>
                </View>
              )}
            </View>

            {/* Proof + timestamps */}
            {!!earnings?.traveler_payment && (
              <View className="mt-4">
                <View className="flex-row justify-between py-2 border-t border-black/5">
                  <Text className="font-onest text-black/50 text-sm">Submitted</Text>
                  <Text className="font-onest text-black/80 text-sm">
                    {safeDateTimeLabel(earnings.traveler_payment.payment_submitted_at)}
                  </Text>
                </View>

                <View className="flex-row justify-between py-2 ">
                  <Text className="font-onest text-black/50 text-sm">Approved</Text>
                  <Text className="font-onest text-black/80 text-sm">
                    {safeDateTimeLabel(earnings.traveler_payment.payment_verified_at)}
                  </Text>
                </View>

                {proofUrl && (
                  <Pressable
                    onPress={() => handleOpenPaymentProof(earnings.traveler_payment?.payment_proof)}
                    className="mt-3 flex-row items-center justify-center py-3 rounded-xl bg-white border border-black/5"
                  >
                    <Ionicons name="image-outline" size={18} color="#111827" />
                    <Text className="ml-2 font-onest-medium text-black/80">View proof</Text>
                  </Pressable>
                )}

                {travelerPaymentBadge.canApprove && (
                  <View className="mt-3">
                    <Pressable
                      onPress={canApprovePayment ? handleApproveTravelerPayment : undefined}
                      disabled={!canApprovePayment}
                      className={`py-4 rounded-xl flex-row items-center justify-center ${canApprovePayment ? "bg-primary" : "bg-gray-200"
                        }`}
                    >
                      {approvingPayment ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-done-outline" size={18} color={canApprovePayment ? "white" : "#9CA3AF"} />
                          <Text className={`ml-2 font-onest-semibold ${canApprovePayment ? "text-white" : "text-gray-400"}`}>
                            Approve received payment
                          </Text>
                        </>
                      )}
                    </Pressable>

                    <Text className="mt-2 text-xs font-onest text-black/40 text-center">
                      Only approve when you actually received the payment.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>


        {/* Payment Status (trip/earnings status) */}
        <View className="mx-10 mt-10">
          <Text className="text-2xl font-onest text-black/90 ">Payment status</Text>
          <View className={`rounded-2xl  mt-4 `}>
            <View className="flex-row items-center">
              <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${statusStyle.iconBg}`}>
                <Ionicons name={statusStyle.icon} size={20} color={statusStyle.iconColor} />
              </View>
              <View className="flex-1">
                <Text className="font-onest text-black/90">{paymentStatus.label}</Text>
              </View>
              {paymentStatus.is_paid && (
                <View className="bg-green-100 px-3 py-1 rounded-full">
                  <Text className="text-xs font-onest-medium text-green-700">Paid</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  // Render Tab Content
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverviewContent();
      case "tripplan":
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
            readOnly={true}
          />
        );
      case "earnings":
        return renderEarningsContent();
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
              {isPending ? "Requested by" : `${guideInfo.traveler_name}'s`}
            </Text>
            <Text className="text-3xl font-onest-semibold text-black/90">Itinerary</Text>
          </View>
        </View>

        {/* Date Row */}
        <View className="flex-row items-center my-6 px-4">
          <Ionicons name="calendar-outline" size={16} color="#000000cc" />
          <Text className="text-sm text-black/90 font-onest ml-2">{dateRangeText}</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <GuideTabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <View className="flex-1">{renderTabContent()}</View>

      {/* Action Bar for Pending Assignments */}
      {isPending && (
        <GuideAssignmentActionBar
          assignmentId={guideInfo.assignment_id}
          guideFee={guideInfo.service_fee}
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
    { key: "overview", label: "Overview" },
    { key: "tripplan", label: "Trip Plan" },
    { key: "earnings", label: "Earnings" },
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
                  ? "text-primary border-b-2 border-primary rounded-lg"
                  : "border-b-[#fff] text-gray-400"
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
