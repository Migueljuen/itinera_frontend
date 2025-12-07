import { FontAwesome, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { toast } from "sonner-native";

import { SafeAreaView } from "react-native-safe-area-context";
import API_URL from "../../../constants/api";
import { useRefresh } from "../../../contexts/RefreshContext";
import { NotificationEvents } from "../../../utils/notificationEvents";

type NotificationType =
  | "itinerary"
  | "activity"
  | "reminder"
  | "update"
  | "alert"
  | "attendance_confirmation";

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
  booking_id: number | null;
  icon: string;
  icon_color: string;
  action_url: string | null;
  itinerary_title?: string;
  itinerary_start_date?: string;
  experience_name?: string;
}
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const NotificationDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { triggerProfileUpdate } = useRefresh();

  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [isReviewExpanded, setIsReviewExpanded] = useState(false);

  // Review states
  const [showReviewSection, setShowReviewSection] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const fetchUserData = async () => {
    try {
      const user = await AsyncStorage.getItem("user");
      if (user) {
        const parsedUser = JSON.parse(user);
        setUserId(parsedUser.user_id);
      } else {
        console.log("No user found in AsyncStorage.");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Fetch notification details
  const fetchNotificationDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.error("No auth token found");
        router.back();
        return;
      }

      const response = await axios.get(`${API_URL}/notifications/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const notif = response.data.notification;
        setNotification(notif);

        // Check if this is a "Experience Completed" notification
        const isCompletedExperience =
          notif.type === "update" &&
          notif.title === "Experience Completed!" &&
          notif.booking_id;

        setShowReviewSection(isCompletedExperience);

        // Check if user already reviewed this booking
        if (isCompletedExperience && notif.booking_id) {
          await checkExistingReview(notif.booking_id);
        }

        // Mark as read if not already read
        if (!notif.is_read) {
          await markAsRead();
        }
      } else {
        Alert.alert("Error", "Notification not found");
        router.back();
      }
    } catch (error) {
      console.error("Error fetching notification details:", error);
      Alert.alert("Error", "Failed to load notification details");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const toggleReviewSection = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsReviewExpanded(!isReviewExpanded);
  };
  // Check if user already submitted a review for this booking
  const checkExistingReview = async (bookingId: number) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        `${API_URL}/reviews/booking/${bookingId}/check`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.exists) {
        setReviewSubmitted(true);
        setRating(response.data.review.rating);
        setReviewComment(response.data.review.comment);
      }
    } catch (error) {
      console.error("Error checking existing review:", error);
    }
  };

  // Submit review
  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }

    if (reviewComment.trim().length < 10) {
      toast.error("Please write a review (at least 10 characters)");
      return;
    }

    try {
      setSubmittingReview(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const response = await axios.post(
        `${API_URL}/reviews`,
        {
          user_id: userId,
          booking_id: notification?.booking_id,
          experience_id: notification?.experience_id,
          rating: rating,
          comment: reviewComment.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setReviewSubmitted(true);
        toast.success("Thank you for sharing your experience!");
      } else {
        toast.error(response.data.message || "Failed to submit review");
      }
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };
  // Mark notification as read
  const markAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      await axios.put(
        `${API_URL}/notifications/${id}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotification((prev) => (prev ? { ...prev, is_read: true } : null));
      triggerProfileUpdate();
      DeviceEventEmitter.emit(NotificationEvents.NOTIFICATIONS_UPDATED);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Delete notification
  const handleDelete = async () => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              const token = await AsyncStorage.getItem("token");
              if (!token) return;

              const response = await axios.delete(
                `${API_URL}/notifications/${id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (response.data.success) {
                DeviceEventEmitter.emit(
                  NotificationEvents.NOTIFICATIONS_UPDATED
                );
                triggerProfileUpdate();
                router.back();
              } else {
                Alert.alert("Error", "Failed to delete notification");
              }
            } catch (error) {
              console.error("Error deleting notification:", error);
              Alert.alert("Error", "Failed to delete notification");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  // Navigate to related content
  const handleViewDetails = () => {
    if (!notification) return;

    if (notification.experience_id) {
      router.push(`/(traveler)/(experience)/${notification.experience_id}`);
    } else if (notification.itinerary_id) {
      router.push(`/(traveler)/(itinerary)/${notification.itinerary_id}`);
    } else if (notification.itinerary_item_id) {
      router.push(
        `/(traveler)/(itinerary)/activity/${notification.itinerary_item_id}`
      );
    }
  };

  useEffect(() => {
    fetchNotificationDetails();
  }, [id]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const renderStarRating = () => {
    return (
      <View className="flex-row justify-center mb-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => !reviewSubmitted && setRating(star)}
            disabled={reviewSubmitted}
            className="mx-1"
          >
            <FontAwesome
              name={star <= rating ? "star" : "star-o"}
              size={40}
              color={star <= rating ? "#FCD34D" : "#D1D5DB"}
            />
          </Pressable>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#1f2937" />
      </SafeAreaView>
    );
  }

  if (!notification) {
    return null;
  }

  const hasRelatedContent =
    notification.itinerary_id ||
    notification.itinerary_item_id ||
    notification.experience_id;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View className="flex-1 bg-white">
        <StatusBar />

        {/* Header */}
        <View className="">
          <SafeAreaView>
            <View className="px-4">
              <View className="flex-row justify-between items-center  mt-4">
                <TouchableOpacity onPress={() => router.back()} className="p-2">
                  <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>

                <Text className="text-black/90 text-lg font-onest-semibold">
                  Inbox
                </Text>

                <TouchableOpacity
                  onPress={handleDelete}
                  disabled={deleting}
                  className="p-2"
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color="black" />
                  ) : (
                    <Ionicons name="trash-outline" size={24} color="black" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1 rounded-2xl  "
          showsVerticalScrollIndicator={false}
        >
          <View className="  py-8 mt-4 flex justify-around   relative ">
            <View>
              {/* Icon */}
              <View className="absolute -top-12 left-0 right-0 items-center">
                <View
                  className="w-20 h-20 rounded-full border-8 border-white items-center justify-center"
                  style={{ backgroundColor: notification.icon_color }}
                >
                  <Ionicons
                    name={notification.icon as any}
                    size={40}
                    color="white"
                  />
                </View>
              </View>

              {/* Title */}
              <Text className="text-2xl font-onest-bold text-center text-black/90 my-6 border-b py-6 rounded-2xl  border-gray-200">
                {notification.title}
              </Text>

              {/* Description */}
              <Text className="text-black/60 font-onest px-6 text-base leading-6 text-center mb-8">
                {notification.description}
              </Text>
            </View>

            {/* Review Section */}
            {showReviewSection && (
              <View className="bg-white rounded-2xl mb-6 overflow-hidden">
                {/* Collapsible Header */}
                <Pressable
                  onPress={toggleReviewSection}
                  className="p-6 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center flex-1">
                    <View className="bg-yellow-50 rounded-full p-2 mr-3">
                      <Ionicons name="star" size={20} color="#FCD34D" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-onest-semibold text-black/90">
                        {reviewSubmitted
                          ? "Your Review"
                          : "Rate this Experience"}
                      </Text>
                      <Text className="text-black/60 font-onest text-sm">
                        {reviewSubmitted
                          ? "Thank you for your feedback!"
                          : "Share your experience"}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={isReviewExpanded ? "chevron-up" : "chevron-down"}
                    size={24}
                    color="#9CA3AF"
                  />
                </Pressable>

                {/* Collapsible Content */}
                {isReviewExpanded && (
                  <View className="px-6 pb-6">
                    <View className="border-t border-gray-100 pt-4">
                      {/* Star Rating */}
                      {renderStarRating()}

                      {/* Review Text */}
                      <View className="mb-4">
                        <TextInput
                          className="rounded-xl p-4 font-onest text-black/90 min-h-[40px]"
                          placeholder="Type review..."
                          placeholderTextColor="#9CA3AF"
                          multiline
                          numberOfLines={5}
                          textAlignVertical="top"
                          value={reviewComment}
                          onChangeText={setReviewComment}
                          editable={!reviewSubmitted}
                          style={{
                            borderWidth: 1,
                            borderColor: "#f0f0f0",
                          }}
                        />
                        <Text className="text-gray-400 font-onest text-xs mt-2">
                          Minimum 10 characters
                        </Text>
                      </View>

                      {/* Submit Button */}
                      {!reviewSubmitted && (
                        <TouchableOpacity
                          onPress={handleSubmitReview}
                          disabled={submittingReview}
                          className="bg-primary rounded-full py-4 items-center"
                          style={{
                            shadowColor: "#4F46E5",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.2,
                            shadowRadius: 8,
                            elevation: 5,
                          }}
                        >
                          {submittingReview ? (
                            <ActivityIndicator size="small" color="white" />
                          ) : (
                            <Text className="text-white font-onest-semibold text-base">
                              Submit Review
                            </Text>
                          )}
                        </TouchableOpacity>
                      )}

                      {reviewSubmitted && (
                        <View className="bg-green-50 rounded-xl p-4 flex-row items-center">
                          <Ionicons
                            name="checkmark-circle"
                            size={24}
                            color="#10B981"
                          />
                          <Text className="text-green-700 font-onest ml-2 flex-1">
                            Your review has been submitted successfully!
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Bottom Additional Info */}
            <View>
              {/* Additional Context */}
              {notification.itinerary_title && (
                <View className="rounded-xl px-6 mb-6">
                  <View className="flex-row items-center justify-center">
                    <Ionicons name="map-outline" size={20} color="#6B7280" />
                    <Text className="text-black/60 font-onest ml-2">
                      Related to: {notification.itinerary_title}
                    </Text>
                  </View>
                </View>
              )}

              {/* Date/Time */}
              <Text className="text-gray-400 font-onest text-center text-sm mb-4">
                {formatDateTime(notification.created_at)}
              </Text>
              {/* View Details Button */}
              {hasRelatedContent && (
                <View className="px-6 pb-8">
                  <TouchableOpacity
                    onPress={handleViewDetails}
                    className="py-4 items-center"
                  >
                    <Text className="text-blue-500 font-onest-semibold text-base">
                      View Experience Details
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default NotificationDetailScreen;
