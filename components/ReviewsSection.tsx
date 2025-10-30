import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export type Review = {
  id: number;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
};

interface ReviewsSectionProps {
  reviews: Review[];
  initialDisplayCount?: number;
}

export default function ReviewsSection({
  reviews,
  initialDisplayCount = 2,
}: ReviewsSectionProps) {
  const [showAllReviews, setShowAllReviews] = useState(false);

  const renderStars = (rating: number) => {
    return (
      <View className="flex-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={16}
            color={star <= rating ? "#FDB022" : "#D1D5DB"}
          />
        ))}
      </View>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
      : 0;

  if (reviews.length === 0) {
    return (
      <View className="mt-6">
        <Text className="text-lg font-onest-semibold text-gray-800 mb-4">
          Reviews
        </Text>
        <View className="bg-gray-50 rounded-xl p-8 items-center">
          <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
          <Text className="text-gray-500 font-onest mt-2">No reviews yet</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="mt-6">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-onest-semibold text-gray-800">
          Reviews
        </Text>
        <View className="flex-row items-center">
          {renderStars(Math.round(averageRating))}
          <Text className="ml-2 text-gray-600 font-onest-medium">
            {averageRating.toFixed(1)} ({reviews.length})
          </Text>
        </View>
      </View>

      {/* Review Cards */}
      {reviews
        .slice(0, showAllReviews ? reviews.length : initialDisplayCount)
        .map((review) => (
          <View key={review.id} className="bg-gray-50 rounded-xl p-4 mb-3">
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <View className="w-10 h-10 rounded-full bg-primary items-center justify-center mr-3">
                    <Text className="text-white font-onest-semibold text-lg">
                      {review.userName.charAt(0)}
                    </Text>
                  </View>
                  <View>
                    <Text className="font-onest-semibold text-gray-800">
                      {review.userName}
                    </Text>
                    <View className="flex-row items-center">
                      {renderStars(review.rating)}
                      <Text className="ml-2 text-gray-500 text-xs font-onest">
                        {formatDate(review.date)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <Text className="text-gray-600 font-onest mt-2">
              {review.comment}
            </Text>

            <TouchableOpacity className="flex-row items-center mt-3">
              <Ionicons name="thumbs-up-outline" size={16} color="#6B7280" />
              <Text className="ml-1 text-gray-500 text-sm font-onest">
                {review.helpful} found this helpful
              </Text>
            </TouchableOpacity>
          </View>
        ))}

      {/* View All Reviews Button */}
      {reviews.length > initialDisplayCount && (
        <TouchableWithoutFeedback
          onPress={() => setShowAllReviews(!showAllReviews)}
        >
          <View className="mt-4 py-3 border border-gray-300 rounded-xl items-center flex-row justify-center">
            <Text className="text-gray-700 font-onest-medium">
              {showAllReviews
                ? "Show Less Reviews"
                : `View All ${reviews.length} Reviews`}
            </Text>
            <Ionicons
              name={showAllReviews ? "chevron-up" : "chevron-down"}
              size={20}
              color="#374151"
              style={{ marginLeft: 8 }}
            />
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
}
