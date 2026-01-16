import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner-native";

import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API_URL from "../../../constants/api";
import { useRefresh } from "../../../contexts/RefreshContext";
import { NotificationEvents } from "../../../utils/notificationEvents";

type NotificationType =
  | "itinerary"
  | "activity"
  | "reminder"
  | "update"
  | "alert";

interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  description: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  itinerary_id: number | null;
  itinerary_item_id: number | null;
  experience_id: number | null;
  icon: string;
  icon_color: string;
  action_url: string | null;
  // Additional fields from JOIN
  itinerary_title?: string;
  itinerary_start_date?: string;
  experience_name?: string;
}

const InboxScreen = () => {
  const router = useRouter();
  const { triggerProfileUpdate } = useRefresh(); // Add this to trigger badge refresh

  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(false);

  const filters = ["All", "Itineraries", "Activities", "Updates"];

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (filter?: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.error("No auth token found");
        return;
      }

      const response = await axios.get(`${API_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          filter: filter?.toLowerCase(),
          limit: 50,
        },
      });

      if (response.data.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      Alert.alert("Error", "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  // Track screen focus state and fetch on focus
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      // console.log("Inbox screen focused, fetching notifications...");
      fetchNotifications();

      return () => {
        setIsScreenFocused(false);
        console.log("Inbox screen unfocused");
      };
    }, [fetchNotifications])
  );

  // Smart polling - only when screen is focused AND app is active
  useEffect(() => {
    if (!isScreenFocused) return;

    // start polling
    const interval = setInterval(() => {
      console.log("Polling for notifications (screen active)...");
      fetchNotifications(activeFilter);
    }, 15000);

    // fetch immediately on focus
    fetchNotifications(activeFilter);

    return () => clearInterval(interval);
  }, [isScreenFocused, activeFilter, fetchNotifications]);

  // Listen for notification events to auto-refresh
  useEffect(() => {
    // console.log("Setting up notification event listeners in inbox...");

    const notificationListener = DeviceEventEmitter.addListener(
      NotificationEvents.NOTIFICATIONS_UPDATED,
      () => {
        console.log(
          "Inbox received NOTIFICATIONS_UPDATED event, refreshing..."
        );
        fetchNotifications();
      }
    );

    const refreshListener = DeviceEventEmitter.addListener(
      NotificationEvents.REFRESH_NOTIFICATIONS,
      () => {
        console.log(
          "Inbox received REFRESH_NOTIFICATIONS event, refreshing..."
        );
        fetchNotifications();
      }
    );

    return () => {
      // console.log("Cleaning up notification event listeners in inbox...");
      notificationListener.remove();
      refreshListener.remove();
    };
  }, [fetchNotifications]);

  // Trigger badge refresh when leaving the screen
  useEffect(() => {
    return () => {
      // When unmounting (leaving the screen), trigger refresh
      triggerProfileUpdate();
    };
  }, [triggerProfileUpdate]);

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      await axios.put(
        `${API_URL}/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );

      // Trigger badge refresh
      triggerProfileUpdate();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      setMarkingAsRead(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      await axios.put(
        `${API_URL}/notifications/mark-all-read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

      // Trigger badge refresh
      triggerProfileUpdate();

      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark notifications as read");
    } finally {
      setMarkingAsRead(false);
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Itineraries")
      return (
        notification.type === "reminder" || notification.type === "itinerary"
      );
    if (activeFilter === "Activities") return notification.type === "activity";
    if (activeFilter === "Updates")
      return notification.type === "update" || notification.type === "alert";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotificationPress = async (notification: Notification) => {
    router.push(`/(traveler)/(notification)/${notification.id}`);
    // // Mark as read if unread
    // if (!notification.is_read) {
    //     await markAsRead(notification.id);
    // }

    // // Navigate based on notification type
    // if (notification.itinerary_id) {
    //     router.push(`/(traveler)/(itinerary)/${notification.itinerary_id}`);
    // } else if (notification.itinerary_item_id) {
    //     router.push(`/(traveler)/(itinerary)/activity/${notification.itinerary_item_id}`);
    // } else if (notification.experience_id) {
    //     router.push(`/(traveler)/(experience)/${notification.experience_id}`);
    // }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchNotifications();
      // Also trigger badge refresh on pull-to-refresh
      triggerProfileUpdate();
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) {
      return "Just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      // Less than 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      return formatTime(dateString);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#1f2937" />
        <Text className="mt-4 text-black/50 font-onest">
          Loading notifications...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="p-6">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-3xl font-onest-semibold text-black/90">
              Inbox
            </Text>
            <Text className="text-black/40 font-onest">
              {unreadCount > 0
                ? `${unreadCount} new notifications`
                : "All caught up"}
            </Text>
          </View>
          {unreadCount > 0 && (
            <View className="bg-indigo-50 rounded-full px-3 py-1">
              <Text className="text-primary font-onest-semibold text-sm">
                {unreadCount}
              </Text>
            </View>
          )}
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row "
        >
          {filters.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <Pressable
                key={filter}
                onPress={() => {
                  setActiveFilter(filter); // updates highlight instantly
                  fetchNotifications(filter);
                  setTimeout(() => fetchNotifications(filter), 0);
                  // fetch runs in background
                }}
                className={`px-6 py-2 rounded-full mr-3 ${activeFilter === filter ? "bg-gray-800" : "bg-white"
                  }`}
              >
                <Text
                  className={`text-base font-onest-medium ${activeFilter === filter ? "text-white" : "text-black/40"
                    }`}
                >
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#1f2937"]}
            tintColor={"#1f2937"}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredNotifications.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="mail-open-outline" size={64} color="#D1D5DB" />
            <Text className="text-black/40 font-onest-medium text-lg mt-4">
              No notifications
            </Text>
            <Text className="text-black/40 font-onest text-sm mt-2">
              {activeFilter === "All"
                ? "You'll see your travel updates here"
                : `No ${activeFilter.toLowerCase()} notifications`}
            </Text>
          </View>
        ) : (
          <View className="px-4 pt-4">
            {filteredNotifications.map((notification, index) => {
              const showDateHeader =
                index === 0 ||
                formatDate(notification.created_at) !==
                formatDate(filteredNotifications[index - 1].created_at);

              return (
                <View key={notification.id}>
                  {showDateHeader && (
                    <Text className="text-black/50 font-onest-medium text-sm mb-3 mt-2 px-2">
                      {formatDate(notification.created_at)}
                    </Text>
                  )}

                  <TouchableOpacity
                    onPress={() => handleNotificationPress(notification)}
                    className={`bg-white rounded-2xl p-4 mb-3 ${!notification.is_read ? "border-l-4 border-primary" : ""
                      }`}
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.06,
                      shadowRadius: 8,
                      elevation: 3,
                    }}
                    activeOpacity={1}
                  >
                    <View className="flex-row">
                      {/* Icon */}
                      <View
                        className="w-12 h-12 rounded-full items-center justify-center mr-4"
                        style={{
                          backgroundColor: `${notification.icon_color}20`,
                        }}
                      >
                        <Ionicons
                          name={
                            Ionicons.glyphMap[
                              notification.icon as keyof typeof Ionicons.glyphMap
                            ]
                              ? (notification.icon as keyof typeof Ionicons.glyphMap)
                              : "close-circle"
                          }
                          size={24}
                          color={notification.icon_color}
                        />
                      </View>

                      {/* Content */}
                      <View className="flex-1">
                        <View className="flex-row justify-between items-start mb-1">
                          <Text
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            className={`font-onest-semibold text-base flex-1 mr-2 ${!notification.is_read
                              ? "text-black/90"
                              : "text-black/50"
                              }`}
                          >
                            {notification.title}
                          </Text>
                          <View className="flex-row items-center">
                            <Text className="text-xs text-black/40 font-onest mr-2">
                              {formatRelativeTime(notification.created_at)}
                            </Text>
                            {!notification.is_read && (
                              <View className="w-2 h-2 bg-primary rounded-full" />
                            )}
                          </View>
                        </View>
                        <Text
                          className="text-black/50 font-onest text-sm leading-5"
                          numberOfLines={2}
                        >
                          {notification.description}
                        </Text>

                        {/* Additional context */}
                        {notification.itinerary_title && (
                          <View className="flex-row items-center mt-2">
                            <Ionicons
                              name="map-outline"
                              size={14}
                              color="#9CA3AF"
                            />
                            <Text className="text-xs text-black/40 font-onest ml-1">
                              {notification.itinerary_title}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Mark All as Read FAB */}
      {unreadCount > 0 && (
        <TouchableOpacity
          className="absolute bottom-36 right-6 bg-primary rounded-full p-4 flex-row items-center"
          style={{
            shadowColor: "#4F46E5",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }}
          onPress={markAllAsRead}
          disabled={markingAsRead}
        >
          {markingAsRead ? (
            <ActivityIndicator size="small" color="#E5E7EB" />
          ) : (
            <>
              <Ionicons name="checkmark-done" size={20} color="#E5E7EB" />
              <Text className="ml-2 text-white font-onest">
                Mark all read
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

export default InboxScreen;
