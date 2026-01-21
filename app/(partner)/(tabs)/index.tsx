import socketService from "@/services/socket";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API_URL from "../../../constants/api";
import { useRefresh } from "../../../contexts/RefreshContext";

// ============ TYPES ============
type ItineraryStatus = "pending" | "upcoming" | "ongoing" | "completed" | "cancelled";
type AssignmentStatus = "Pending" | "Accepted" | "Declined" | "Expired" | "Cancelled";
type ServiceType = "Guide" | "Driver";
type PartnerType = "Guide" | "Driver";

type DeclineReason = "Scheduling conflict" | "Health reasons" | "Overlapping booking" | "Weather issues" | "Other";

type Vehicle = {
  vehicle_id: number;
  plate_number: string;
  vehicle_type: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  passenger_capacity: number;
};

// This represents the joined data from itinerary_service_assignments + itinerary + users
type PartnerAssignment = {
  // From itinerary_service_assignments
  assignment_id: number;
  itinerary_id: number;
  service_type: ServiceType;
  provider_id: number;
  provider_profile_id: number;
  status: AssignmentStatus;
  decline_reason?: DeclineReason;
  price: number;
  responded_at?: string;
  created_at: string;
  selected_vehicle_id?: number;

  // From itinerary (joined)
  itinerary_title: string;
  itinerary_status: ItineraryStatus;
  start_date: string;
  end_date: string;
  notes?: string;

  // From users - traveler info (joined)
  traveler_id: number;
  traveler_name: string;
  traveler_profile_pic?: string;

  // Computed/aggregated fields from backend
  total_days: number;
  total_activities: number;
  destinations: string[];
  first_activity_time?: string;

  // Driver-specific
  vehicle?: Vehicle;
};

interface Conversation {
  id: number;
  unreadCount: number;
}

// ============ STATUS CONFIG ============
const ITINERARY_STATUS_CONFIG: Record<ItineraryStatus, { label: string; bgColor: string; textColor: string }> = {
  pending: { label: "Pending", bgColor: "bg-yellow-100", textColor: "text-yellow-700" },
  upcoming: { label: "Upcoming", bgColor: "bg-blue-100", textColor: "text-blue-700" },
  ongoing: { label: "Ongoing", bgColor: "bg-green-100", textColor: "text-green-700" },
  completed: { label: "Completed", bgColor: "bg-gray-100", textColor: "text-gray-600" },
  cancelled: { label: "Cancelled", bgColor: "bg-red-100", textColor: "text-red-600" },
};

const ASSIGNMENT_STATUS_CONFIG: Record<AssignmentStatus, { label: string; bgColor: string; textColor: string }> = {
  Pending: { label: "Pending", bgColor: "bg-yellow-100", textColor: "text-yellow-700" },
  Accepted: { label: "Accepted", bgColor: "bg-green-100", textColor: "text-green-700" },
  Declined: { label: "Declined", bgColor: "bg-gray-100", textColor: "text-gray-600" },
  Expired: { label: "Expired", bgColor: "bg-orange-100", textColor: "text-orange-600" },
  Cancelled: { label: "Cancelled", bgColor: "bg-red-100", textColor: "text-red-600" },
};

// ============ PARTNER CONFIG ============
const PARTNER_CONFIG: Record<PartnerType, {
  label: string;
  requestLabel: string;
  tripLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  emptyMessage: string;
}> = {
  Guide: {
    label: "Tour Guide",
    requestLabel: "Tour Requests",
    tripLabel: "Trip",
    icon: "walk-outline",
    emptyMessage: "Update your availability to receive trip requests",
  },
  Driver: {
    label: "Driver",
    requestLabel: "Transport Requests",
    tripLabel: "Booking",
    icon: "car-outline",
    emptyMessage: "Update your availability to receive transport requests",
  },
};

const PartnerHomeScreen = () => {
  const router = useRouter();
  const { profileUpdated } = useRefresh();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // User state
  const [firstName, setFirstName] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [partnerType, setPartnerType] = useState<PartnerType | null>(null);

  // Assignments state
  const [ongoingTrip, setOngoingTrip] = useState<PartnerAssignment | null>(null);
  const [upcomingTrips, setUpcomingTrips] = useState<PartnerAssignment[]>([]);
  const [requests, setRequests] = useState<PartnerAssignment[]>([]);

  // Stats
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [weekEarnings, setWeekEarnings] = useState(0);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);

  // Get config based on partner type
  const config = partnerType ? PARTNER_CONFIG[partnerType] : PARTNER_CONFIG.Guide;

  // ============ USER DATA ============
  const fetchUserData = async () => {
    try {
      const user = await AsyncStorage.getItem("user");
      if (user) {
        const parsedUser = JSON.parse(user);
        setFirstName(parsedUser.first_name);
        setProfilePic(parsedUser.profile_pic);
        setCurrentUserId(parsedUser.user_id);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  // ============ FETCH ASSIGNMENTS ============
  const fetchAssignments = async () => {

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(`${API_URL}/partner-mobile/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const assignments: PartnerAssignment[] = response.data.data;
        const detectedPartnerType: PartnerType = response.data.partner_type;
        setPartnerType(detectedPartnerType);

        // Pending requests (need accept/decline)
        const pending = assignments.filter((a) => a.status === "Pending");
        setRequests(pending);

        // Accepted assignments only
        const accepted = assignments.filter((a) => a.status === "Accepted");

        // Find ongoing trip (itinerary status is 'ongoing')
        const ongoing = accepted.find((a) => a.itinerary_status === "ongoing");
        setOngoingTrip(ongoing || null);

        // Upcoming trips (itinerary status is 'upcoming' or 'pending')
        const upcoming = accepted.filter(
          (a) => a.itinerary_status === "upcoming" || a.itinerary_status === "pending"
        );
        setUpcomingTrips(upcoming);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);

    }
  };

  // ============ FETCH EARNINGS ============
  const fetchEarnings = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(`${API_URL}/partner-mobile/earnings/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setTodayEarnings(response.data.data.today || 0);
        setWeekEarnings(response.data.data.week || 0);
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
    }
  };

  // ============ UNREAD COUNT ============
  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(`${API_URL}/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const conversations: Conversation[] = response.data.data;
        const total = conversations.reduce(
          (sum, conv) => sum + (conv.unreadCount || 0),
          0
        );
        setTotalUnreadMessages(total);
        conversations.forEach((conv) => {
          socketService.joinConversation(conv.id);
        });
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, []);

  // ============ LOAD ALL DATA ============
  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUserData(),
        fetchAssignments(),
        fetchEarnings(),
        fetchUnreadCount(),
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [profileUpdated]);

  // Socket setup
  useEffect(() => {
    const setupSocket = async () => {
      await socketService.connect();
    };
    setupSocket();
  }, []);

  // Listen for new messages
  useFocusEffect(
    useCallback(() => {
      if (!currentUserId) return;

      const handleNewMessage = (message: { senderId: number }) => {
        if (message.senderId !== currentUserId) {
          setTotalUnreadMessages((prev) => prev + 1);
        }
      };

      socketService.onNewMessage(handleNewMessage);
      return () => {
        socketService.offNewMessage1(handleNewMessage);
      };
    }, [currentUserId])
  );

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
      fetchAssignments();
    }, [fetchUnreadCount])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  // ============ ASSIGNMENT ACTIONS ============
  const handleAcceptRequest = async (assignmentId: number) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.post(
        `${API_URL}/partner-mobile/assignments/${assignmentId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchAssignments();
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const handleDeclineRequest = async (assignmentId: number, reason?: DeclineReason) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.post(
        `${API_URL}/partner-mobile/assignments/${assignmentId}/decline`,
        { decline_reason: reason || "Other" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchAssignments();
    } catch (error) {
      console.error("Error declining request:", error);
    }
  };


  // ============ HELPER FUNCTIONS ============
  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const startMonth = start.toLocaleDateString("en-US", { month: "short" });
    const endMonth = end.toLocaleDateString("en-US", { month: "short" });

    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()} - ${end.getDate()}`;
    }
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const getRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) return "Starts Today";
    if (compareDate.getTime() === tomorrow.getTime()) return "Starts Tomorrow";

    const diffDays = Math.ceil((compareDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) return `Starts in ${diffDays} days`;

    return formatDate(dateStr);
  };

  const getDaysText = (totalDays: number) => {
    if (totalDays === 1) return "1 day";
    return `${totalDays} days`;
  };

  const getVehicleText = (vehicle?: Vehicle) => {
    if (!vehicle) return null;
    return `${vehicle.brand} ${vehicle.model} • ${vehicle.plate_number}`;
  };

  // ============ STATUS CHIP ============
  const ItineraryStatusChip = ({ status }: { status: ItineraryStatus }) => {
    const statusConfig = ITINERARY_STATUS_CONFIG[status];
    return (
      <View className={`px-2 py-1 rounded-full ${statusConfig.bgColor}`}>
        <Text className={`text-xs font-onest-medium ${statusConfig.textColor}`}>
          {statusConfig.label}
        </Text>
      </View>
    );
  };

  // ============ ONGOING TRIP BANNER ============
  const OngoingTripBanner = ({ assignment }: { assignment: PartnerAssignment }) => (
    <View className="mx-6 mb-2">
      <View className="  p-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View className="w-2.5 h-2.5 bg-[#191313] rounded-full mr-2" />
            <Text className="font-onest-semibold text-black/90">
              {config.tripLabel} In Progress
            </Text>
          </View>
          <Text className="text-xs font-onest text-black/50">
            {formatDateRange(assignment.start_date, assignment.end_date)}
          </Text>
        </View>

        <Text className="font-onest-semibold text-lg text-black/90 mb-1">
          {assignment.itinerary_title}
        </Text>

        <View className="flex-row items-center flex-wrap">
          <Ionicons name="location-outline" size={14} color="#6b7280" />
          <Text className="text-black/60 font-onest text-sm ml-1">
            {assignment.destinations?.join(" → ") || "Multiple destinations"}
          </Text>
        </View>

        {/* Vehicle info for drivers */}
        {partnerType === "Driver" && assignment.vehicle && (
          <View className="flex-row items-center mt-2">
            <Ionicons name="car-outline" size={14} color="#6b7280" />
            <Text className="text-black/60 font-onest text-sm ml-1">
              {getVehicleText(assignment.vehicle)}
            </Text>
          </View>
        )}

        <View className="flex-row items-center mt-3">
          {assignment.traveler_profile_pic ? (
            <Image
              source={{ uri: `${API_URL}/${assignment.traveler_profile_pic}` }}
              className="w-7 h-7 rounded-full mr-2"
            />
          ) : (
            <View className="w-7 h-7 rounded-full bg-gray-200 items-center justify-center mr-2">
              <Ionicons name="person" size={14} color="#9CA3AF" />
            </View>
          )}
          <Text className="font-onest text-sm text-black/70">{assignment.traveler_name}</Text>
          <Text className="text-black/40 mx-2">•</Text>
          <Text className="font-onest text-sm text-black/60">
            {getDaysText(assignment.total_days)}
            {partnerType === "Guide" && `, ${assignment.total_activities} activities`}
          </Text>
        </View>

        <View className="flex-row gap-3 mt-8">

          <Pressable
            onPress={() => router.push(`/(partner)/(itinerary)/${assignment.itinerary_id}`)}
            className="flex-1 bg-[#191313] py-4 rounded-xl items-center"
          >
            <Text className="font-onest-medium text-white">View Itinerary</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  // ============ EMPTY ONGOING TRIP BANNER ============
  const EmptyOngoingTripBanner = () => (
    <View className="mx-6 mb-2">
      <View className="bg-gray-50 border border-gray-200 border-dashed rounded-2xl p-6">
        <View className="items-center">
          <View className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center mb-3">
            <Ionicons name={config.icon} size={28} color="#9CA3AF" />
          </View>
          <Text className="font-onest-semibold text-black/70 text-center">
            No Active {config.tripLabel}
          </Text>
          <Text className="font-onest text-sm text-black/40 text-center mt-1">
            Your ongoing {config.tripLabel.toLowerCase()}s will appear here
          </Text>
        </View>
      </View>
    </View>
  );

  // ============ UPCOMING TRIP ITEM ============
  const UpcomingTripItem = ({ assignment, isLast }: { assignment: PartnerAssignment; isLast: boolean }) => (
    <Pressable
      onPress={() => router.push(`/(partner)/(itinerary)/${assignment.itinerary_id}`)}
      className={`flex-row items-center ${!isLast ? "mb-3" : ""}`}
    >
      {assignment.traveler_profile_pic ? (
        <Image
          source={{ uri: `${API_URL}/${assignment.traveler_profile_pic}` }}
          className="w-14 h-14 rounded-lg mr-3"
        />
      ) : (
        <View className="w-14 h-14 rounded-lg bg-gray-100 items-center justify-center mr-3">
          <Ionicons name="calendar" size={22} color="#9CA3AF" />
        </View>
      )}

      <View className="flex-1">
        <Text className="font-onest-medium text-black/90" numberOfLines={1}>
          {assignment.itinerary_title}
        </Text>
        <Text className="text-xs font-onest text-black/50 mt-0.5">
          {assignment.destinations?.slice(0, 2).join(", ") || "Multiple locations"}
        </Text>
        {/* Vehicle info for drivers */}
        {partnerType === "Driver" && assignment.vehicle && (
          <Text className="text-xs font-onest text-black/40 mt-0.5">
            {getVehicleText(assignment.vehicle)}
          </Text>
        )}
      </View>

      <View className="items-end">
        <Text className="text-sm font-onest-medium text-primary">
          {getRelativeDate(assignment.start_date)}
        </Text>
        <Text className="text-xs font-onest text-black/40 mt-0.5">
          {getDaysText(assignment.total_days)}
        </Text>
      </View>
    </Pressable>
  );

  // ============ REQUEST ITEM ============
  const RequestItem = ({ assignment, isLast }: { assignment: PartnerAssignment; isLast: boolean }) => (
    <View className={`${!isLast ? "mb-4 pb-4 border-b border-gray-100" : ""}`}>
      <Pressable
        onPress={() => router.push(`/(partner)/(itinerary)/${assignment.itinerary_id}`)}
        className="flex-row items-start"
      >
        {assignment.traveler_profile_pic ? (
          <Image
            source={{ uri: `${API_URL}/${assignment.traveler_profile_pic}` }}
            className="w-12 h-12 rounded-xl mr-3"
          />
        ) : (
          <View className="w-12 h-12 rounded-xl bg-gray-100 items-center justify-center mr-3">
            <Ionicons name="person" size={20} color="#9CA3AF" />
          </View>
        )}

        <View className="flex-1">
          <Text className="font-onest-medium text-black/90" numberOfLines={1}>
            {assignment.itinerary_title}
          </Text>
          <Text className="text-xs font-onest text-black/50 mt-0.5">
            {formatDateRange(assignment.start_date, assignment.end_date)} • {getDaysText(assignment.total_days)}
          </Text>
          <View className="flex-row items-center mt-1">
            <Ionicons name="location-outline" size={12} color="#9ca3af" />
            <Text className="text-xs font-onest text-black/50 ml-1">
              {assignment.destinations?.slice(0, 2).join(", ") || "Multiple locations"}
            </Text>
          </View>
          {/* Vehicle info for drivers */}
          {partnerType === "Driver" && assignment.vehicle && (
            <View className="flex-row items-center mt-1">
              <Ionicons name="car-outline" size={12} color="#9ca3af" />
              <Text className="text-xs font-onest text-black/50 ml-1">
                {getVehicleText(assignment.vehicle)}
              </Text>
            </View>
          )}
        </View>

        <Text className="font-onest-semibold text-primary">
          ₱{assignment.price?.toLocaleString() || 0}
        </Text>
      </Pressable>

      <View className="flex-row gap-3 mt-3 ml-15">
        <Pressable
          onPress={() => handleDeclineRequest(assignment.assignment_id)}
          className="flex-1 border border-gray-200 py-2.5 rounded-xl items-center"
        >
          <Text className="font-onest-medium text-black/60">Decline</Text>
        </Pressable>

        <Pressable
          onPress={() => handleAcceptRequest(assignment.assignment_id)}
          className="flex-1 bg-primary py-2.5 rounded-xl items-center"
        >
          <Text className="font-onest-medium text-white">Accept</Text>
        </Pressable>
      </View>
    </View>
  );

  // ============ LOADING STATE ============
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#1f2937" />
        <Text className="mt-4 text-black/50 font-onest">Loading your schedule...</Text>
      </View>
    );
  }

  // ============ MAIN RENDER ============
  return (
    <SafeAreaView className="bg-[#fff] flex-1">
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#1f2937"]}
            tintColor={"#1f2937"}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between p-6">
          <View className="flex-row items-center flex-1">
            <Pressable onPress={() => router.push("/(partner)/profile")}>
              {profilePic ? (
                <Image
                  source={{ uri: `${API_URL}/${profilePic}` }}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center">
                  <Ionicons name="person" size={24} color="#9CA3AF" />
                </View>
              )}
            </Pressable>
            <View className="ml-3 flex-1">
              <Text className="text-2xl font-onest-semibold text-black/90">
                Hello, {firstName}
              </Text>
              <Text className="text-black/50 font-onest">
                {ongoingTrip
                  ? `You have a ${config.tripLabel.toLowerCase()} in progress`
                  : requests.length > 0
                    ? `${requests.length} new request${requests.length > 1 ? "s" : ""}`
                    : upcomingTrips.length > 0
                      ? `${upcomingTrips.length} upcoming ${config.tripLabel.toLowerCase()}${upcomingTrips.length > 1 ? "s" : ""}`
                      : `No ${config.tripLabel.toLowerCase()}s scheduled`}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => router.push("/(conversations)")}
            className="bg-gray-100 p-3 rounded-full relative"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={24} color="#1f2937" />
            {totalUnreadMessages > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1">
                <Text className="text-white text-xs font-onest-semibold">
                  {totalUnreadMessages > 9 ? "9+" : totalUnreadMessages}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Ongoing Trip Banner - Always visible */}
        <View className="mt-4">
          <View className="px-6 mb-3">
            <Text className="text-2xl font-onest text-black/90">
              Ongoing {config.tripLabel}
            </Text>
          </View>
          {ongoingTrip ? (
            <OngoingTripBanner assignment={ongoingTrip} />
          ) : (
            <EmptyOngoingTripBanner />
          )}
        </View>

        {/* Main Content Area */}
        <View className="px-6 mt-6">
          {/* Requests - Show first as they need action */}
          {requests.length > 0 && (
            <View className="mb-8">
              <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center">
                  <Text className="text-2xl font-onest text-black/90">{config.requestLabel}</Text>
                  <View className="bg-red-500 rounded-full w-5 h-5 items-center justify-center ml-2">
                    <Text className="text-white text-xs font-onest-semibold">
                      {requests.length}
                    </Text>
                  </View>
                </View>
                <Pressable onPress={() => router.push("/(partner)/requests")}>
                  <Text className="text-sm font-onest text-primary">View all</Text>
                </Pressable>
              </View>

              {requests.slice(0, 3).map((assignment, index) => (
                <RequestItem
                  key={assignment.assignment_id}
                  assignment={assignment}
                  isLast={index === Math.min(requests.length, 3) - 1}
                />
              ))}
            </View>
          )}

          {/* Upcoming Trips */}
          {upcomingTrips.length > 0 && (
            <View className="mb-8">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-2xl font-onest text-black/90">
                  Upcoming {config.tripLabel}s
                </Text>
                <Pressable onPress={() => router.push("/(partner)/itineraries")}>
                  <Text className="text-sm font-onest text-primary">View all</Text>
                </Pressable>
              </View>

              {upcomingTrips.slice(0, 4).map((assignment, index) => (
                <UpcomingTripItem
                  key={assignment.assignment_id}
                  assignment={assignment}
                  isLast={index === Math.min(upcomingTrips.length, 4) - 1}
                />
              ))}
            </View>
          )}

          {/* Empty State - Only when no requests and no upcoming */}
          {/* {requests.length === 0 && upcomingTrips.length === 0 && (
            <View className="items-center py-8">
              <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-3">
                <Ionicons name="calendar-outline" size={32} color="#9CA3AF" />
              </View>
              <Text className="text-base font-onest-medium text-black/70 mb-1">
                No Upcoming {config.tripLabel}s
              </Text>
              <Text className="text-black/50 font-onest text-sm text-center mb-4">
                {config.emptyMessage}
              </Text>
              <Pressable
                onPress={() => router.push("/(partner)/availability")}
                className="bg-primary px-5 py-2.5 rounded-xl"
              >
                <Text className="text-white font-onest-medium">Set Availability</Text>
              </Pressable>
            </View>
          )} */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PartnerHomeScreen;