import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Calendar from "../../../assets/icons/calendar.svg";
import API_URL from "../../../constants/api";

// Updated types to match your API response
interface ItineraryItem {
  item_id: number;
  experience_id: number;
  day_number: number;
  start_time: string;
  end_time: string;
  custom_note: string;
  created_at: string;
  updated_at: string;
  experience_name: string;
  experience_description: string;
  destination_name?: string;
  destination_city?: string;
  images?: string[];
  primary_image?: string;
}

interface Itinerary {
  itinerary_id: number;
  traveler_id: number;
  start_date: string;
  end_date: string;
  title: string;
  notes: string;
  created_at: string;
  status: "upcoming" | "ongoing" | "completed" | "pending";
  items: ItineraryItem[];
}

interface ApiResponse {
  itineraries: Itinerary[];
}

export default function TripScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [userName, setUserName] = useState("");

  useFocusEffect(
    React.useCallback(() => {
      fetchItineraries();
      fetchUserData();
    }, [])
  );

  const fetchUserData = async () => {
    try {
      const user = await AsyncStorage.getItem("user");
      if (user) {
        const parsedUser = JSON.parse(user);
        setUserName(parsedUser.first_name);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchItineraries = async () => {
    try {
      const user = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("token");

      if (!user || !token) {
        console.error("User or token not found");
        setInitialLoading(false);
        return;
      }

      const parsedUser = JSON.parse(user);
      const travelerId = parsedUser.user_id;

      const response = await fetch(
        `${API_URL}/itinerary/traveler/${travelerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 404) {
        setItineraries([]);
        setInitialLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      setItineraries(data.itineraries || []);
    } catch (error) {
      console.error("Error fetching itineraries:", error);
      setItineraries([]);
    } finally {
      setInitialLoading(false);
    }
  };

  // Filter for active trips only (ongoing + upcoming + pending)
  const activeItineraries = itineraries.filter(
    (item) => item.status === "ongoing" || item.status === "upcoming" || item.status === "pending"
  );

  // Count completed trips for the history button
  const completedCount = itineraries.filter(
    (item) => item.status === "completed"
  ).length;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchItineraries();
      await fetchUserData();
    } finally {
      setRefreshing(false);
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const startMonth = start.toLocaleString("default", { month: "short" });
    const endMonth = end.toLocaleString("default", { month: "short" });

    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
    } else {
      return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${start.getFullYear()}`;
    }
  };

  const getStatusDisplay = (
    status: "upcoming" | "ongoing" | "completed" | "pending"
  ) => {
    const statusConfig = {
      upcoming: {
        text: "Upcoming",
        bgColor: "bg-blue-50",
        textColor: "text-blue-600",
      },
      ongoing: {
        text: "Ongoing",
        bgColor: "bg-green-50",
        textColor: "text-green-600",
      },
      completed: {
        text: "Completed",
        bgColor: "bg-gray-50",
        textColor: "text-black/50",
      },
      pending: {
        text: "Pending",
        bgColor: "bg-yellow-50",
        textColor: "text-yellow-600",
      },
    };

    const config = statusConfig[status];

    return (
      <View className={`px-3 py-1.5 rounded-full ${config.bgColor}`}>
        <Text className={`text-xs font-onest-medium ${config.textColor}`}>
          {config.text}
        </Text>
      </View>
    );
  };

  const getSmartPreviewText = (itinerary: Itinerary) => {
    if (!itinerary.items || itinerary.items.length === 0) {
      return { title: "No activities planned", subtitle: "" };
    }

    const now = new Date();
    const sortedItems = [...itinerary.items].sort((a, b) => {
      if (a.day_number !== b.day_number) {
        return a.day_number - b.day_number;
      }
      return a.start_time.localeCompare(b.start_time);
    });

    switch (itinerary.status) {
      case "upcoming":
        const firstActivity = sortedItems[0];
        return {
          title: `Starts with: ${firstActivity.experience_name}`,
          subtitle: `Day ${firstActivity.day_number} • ${formatTimeRange(
            firstActivity.start_time,
            firstActivity.end_time
          )}`,
        };

      case "ongoing":
        const startDate = new Date(itinerary.start_date);
        const currentDay =
          Math.floor(
            (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
          ) + 1;

        const currentActivity = sortedItems.find((item) => {
          if (item.day_number !== currentDay) return false;

          const itemStartTime = new Date();
          const [startHours, startMinutes] = item.start_time.split(":");
          itemStartTime.setHours(
            parseInt(startHours),
            parseInt(startMinutes),
            0,
            0
          );

          const itemEndTime = new Date();
          const [endHours, endMinutes] = item.end_time.split(":");
          itemEndTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

          return now >= itemStartTime && now <= itemEndTime;
        });

        if (currentActivity) {
          return {
            title: `Currently: ${currentActivity.experience_name}`,
            subtitle: `Day ${currentActivity.day_number} • Ends at ${formatTime(
              currentActivity.end_time
            )}`,
          };
        }

        const nextActivity = sortedItems.find((item) => {
          if (item.day_number < currentDay) return false;
          if (item.day_number > currentDay) return true;

          const itemStartTime = new Date();
          const [startHours, startMinutes] = item.start_time.split(":");
          itemStartTime.setHours(
            parseInt(startHours),
            parseInt(startMinutes),
            0,
            0
          );

          return now < itemStartTime;
        });

        if (nextActivity) {
          return {
            title: `Next: ${nextActivity.experience_name}`,
            subtitle: `Day ${nextActivity.day_number} • ${formatTimeRange(
              nextActivity.start_time,
              nextActivity.end_time
            )}`,
          };
        }

        return {
          title: "Trip in progress",
          subtitle: "All activities completed",
        };

      case "pending":
        const pendingActivity = sortedItems[0];
        return {
          title: `Planning: ${pendingActivity.experience_name}`,
          subtitle: `Day ${pendingActivity.day_number} • ${formatTimeRange(
            pendingActivity.start_time,
            pendingActivity.end_time
          )}`,
        };

      default:
        return {
          title: `Next: ${sortedItems[0].experience_name}`,
          subtitle: `Day ${sortedItems[0].day_number} • ${formatTimeRange(
            sortedItems[0].start_time,
            sortedItems[0].end_time
          )}`,
        };
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getItineraryImage = (itinerary: Itinerary) => {
    if (itinerary.items && itinerary.items.length > 0) {
      const firstItem = itinerary.items[0];
      if (firstItem.primary_image) {
        return { uri: `${API_URL}${firstItem.primary_image}` };
      }
      if (firstItem.images && firstItem.images.length > 0) {
        return { uri: `${API_URL}${firstItem.images[0]}` };
      }
    }
    return require("../../../assets/images/balay.jpg");
  };

  const getExperiencesCount = (itinerary: Itinerary) => {
    if (!itinerary.items) return 0;
    const uniqueExperiences = new Set(
      itinerary.items.map((item) => item.experience_id)
    );
    return uniqueExperiences.size;
  };

  const formatTimeRange = (startTime: string, endTime: string) => {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  const renderEmptyState = () => {
    return (
      <View className="py-16 items-center">
        <Ionicons name="airplane-outline" size={64} color="#D1D5DB" />
        <Text className="text-center text-black/90 font-onest-semibold text-xl mt-6">
          Build your dream itinerary
        </Text>
        <Text className="text-center text-black/50 px-8 mt-2 font-onest text-base leading-5">
          Explore local activities. Your bookings will appear here.
        </Text>

        <TouchableOpacity
          className="mt-8 bg-[#191313] rounded-full px-8 py-4 flex-row items-center"
          style={{
            shadowColor: "#4F46E5",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 6,
          }}
          onPress={() => router.push("/(createItinerary)/selectionScreen")}
        >

          <Text className="text-white/90 font-onest-medium ">
            Create New Trip
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (initialLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#1f2937" />
        <Text className="mt-4 text-black/50 font-onest">
          Loading your trips...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="w-full h-full">
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#1f2937"]}
              tintColor={"#1f2937"}
            />
          }
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View className="p-6 pb-4">
            <Text className="text-3xl font-onest-semibold text-normal">
              My Trips
            </Text>
            <Text className="text-black/50 font-onest">
              Manage your travel itineraries
            </Text>
          </View>

          {/* Trip History Button - Only show if there are completed trips */}
          {/* {completedCount > 0 && (
            <View className="px-6 mb-4">
              <TouchableOpacity
                onPress={() => router.push("/(itinerary)/history")}
                className="bg-white rounded-xl p-4 flex-row justify-between items-center border border-gray-100"
              >
                <View className="flex-row items-center">
                  <View className="bg-gray-50 p-2 rounded-full">
                    <Ionicons name="time-outline" size={20} color="#6B7280" />
                  </View>
                  <View className="ml-3">
                    <Text className="text-base font-onest-medium text-black/90">
                      Trip History
                    </Text>
                    <Text className="text-sm text-black/50 font-onest">
                      {completedCount} completed {completedCount === 1 ? "trip" : "trips"}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          )} */}

          {/* Active Itineraries List */}
          <View className="px-6">
            {activeItineraries.length === 0 ? (
              renderEmptyState()
            ) : (
              activeItineraries.map((itinerary) => {
                const previewInfo = getSmartPreviewText(itinerary);
                return (
                  <TouchableOpacity
                    key={itinerary.itinerary_id}
                    onPress={() =>
                      router.push(`/(itinerary)/${itinerary.itinerary_id}`)
                    }
                    className="mb-6"
                  >
                    <Image
                      source={getItineraryImage(itinerary)}
                      className="w-full h-60 rounded-xl"
                      resizeMode="cover"
                    />
                    <View className="pt-4">
                      <View className="flex-row justify-between items-start mb-2">
                        <Text className="text-lg font-onest-medium text-black/90 flex-1 mr-3">
                          {itinerary.title}
                        </Text>
                        {getStatusDisplay(itinerary.status)}
                      </View>

                      <View className="flex-row items-center mb-3">
                        <Calendar />
                        <Text className="text-sm text-black/90 font-onest ml-2">
                          {formatDateRange(
                            itinerary.start_date,
                            itinerary.end_date
                          )}
                        </Text>
                      </View>

                      {itinerary.items && itinerary.items.length > 0 && (
                        <View className="pt-3">
                          <Text className="text-sm text-black/80 font-onest">
                            {previewInfo.title}
                          </Text>
                        </View>
                      )}

                      <View className="pt-3 mt-3 border-t border-gray-100 flex-row justify-between items-center">
                        <Text className="text-sm text-black/50 font-onest">
                          {getExperiencesCount(itinerary)}{" "}
                          {getExperiencesCount(itinerary) !== 1
                            ? "activities"
                            : "activity"}
                        </Text>
                        <Text className="text-sm text-primary font-onest-medium">
                          View details →
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}