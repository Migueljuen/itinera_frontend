import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface StepProps {
  formData: {
    traveler_id: number;
    start_date: string;
    end_date: string;
    title: string;
    items: Array<{
      experience_name?: string;
      price?: number;
    }>;
  };
  itineraryId: number;
  totalCost: number;
  onNext: () => void;
  onBack: () => void;
}

const Step4PaymentConfirmation: React.FC<StepProps> = ({
  formData,
  itineraryId,
  totalCost,
  onNext,
  onBack,
}) => {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handlePayNow = async () => {
    setIsProcessing(true);

    try {
      // Here you would integrate with your payment gateway
      // For now, we'll simulate the payment process

      Alert.alert("Payment Processing", "Redirecting to payment gateway...", [
        {
          text: "OK",
          onPress: () => {
            // Navigate to payment screen or external payment gateway
            // router.push(`/payment/${itineraryId}`);

            // For demo purposes, showing success
            setTimeout(() => {
              Alert.alert(
                "Payment Successful",
                "Your booking has been confirmed! Your creator will be notified shortly.",
                [
                  {
                    text: "View Itinerary",
                    onPress: () => router.replace("/"),
                  },
                ]
              );
            }, 1500);
          },
        },
      ]);
    } catch (error) {
      console.error("Payment error:", error);
      Alert.alert(
        "Payment Failed",
        "Unable to process payment. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayLater = () => {
    Alert.alert(
      "Pay Later",
      "  Your booking will remain pending until payment is completed. You can pay now or choose to pay later.",
      [
        {
          text: "Go to Home",
          onPress: () => router.replace("/"),
        },
        {
          text: "View Itinerary",
          onPress: () => {
            if (itineraryId) {
              router.replace(`/(traveler)/(itinerary)/${itineraryId}`);
            } else {
              router.replace("/"); // fallback
            }
          },
        },
      ]
    );
  };

  const activityCount = formData.items?.length || 0;
  const duration =
    Math.ceil(
      (new Date(formData.end_date).getTime() -
        new Date(formData.start_date).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-6"
      >
        <View className="p-2">
          {/* Success Icon */}
          <View className="items-center mb-6">
            <View className="bg-green-100 rounded-full p-4 mb-4">
              <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            </View>
            <Text className="text-2xl font-onest-bold text-gray-900 text-center mb-2">
              Itinerary Created!
            </Text>
            <Text className="text-base font-onest text-gray-600 text-center px-4">
              Your itinerary has been saved successfully
            </Text>
          </View>

          {/* Payment Info Card */}
          <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
            <View className="gap-4">
              <View className="flex flex-row items-end gap-2">
                <View className="bg-blue-100 rounded-full p-2 ">
                  <Ionicons
                    name="information-circle"
                    size={16}
                    color="#3B82F6"
                  />
                </View>
                <Text className="font-onest-semibold text-base text-gray-900 mb-2">
                  Payment Required
                </Text>
              </View>
              <Text className="font-onest text-sm text-black/60 leading-5">
                Payment is required to confirm your booking. Once paid, your
                creator will be notified and your itinerary will be confirmed.
              </Text>
            </View>
          </View>

          {/* Itinerary Summary Card */}
          <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
            <Text className="font-onest-semibold text-lg text-gray-900 mb-4">
              Booking Summary
            </Text>

            {/* Itinerary Details */}
            <View className="space-y-3">
              <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
                <Text className="font-onest text-sm text-gray-600">
                  Itinerary
                </Text>
                <Text className="font-onest-medium text-sm text-gray-900">
                  {formData.title || "My Trip"}
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
                <Text className="font-onest text-sm text-gray-600">
                  Duration
                </Text>
                <Text className="font-onest-medium text-sm text-gray-900">
                  {duration} {duration === 1 ? "day" : "days"}
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
                <Text className="font-onest text-sm text-gray-600">
                  Travel Dates
                </Text>
                <Text className="font-onest-medium text-sm text-gray-900">
                  {formatDate(formData.start_date)} -{" "}
                  {formatDate(formData.end_date)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
                <Text className="font-onest text-sm text-gray-600">
                  Activities
                </Text>
                <Text className="font-onest-medium text-sm text-gray-900">
                  {activityCount}{" "}
                  {activityCount === 1 ? "activity" : "activities"}
                </Text>
              </View>

              {/* Total Cost */}
              <View className="flex-row justify-between items-center py-3 mt-2">
                <Text className="font-onest-semibold text-base text-gray-900">
                  Total Amount
                </Text>
                <Text className="font-onest-bold text-2xl text-primary">
                  ₱{totalCost.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Payment Status Info */}
          <View className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
            <View className="flex-row items-start">
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color="#3b82f6"
                style={{ marginRight: 8, marginTop: 2 }}
              />
              <View className="flex-1">
                <Text className="font-onest-medium text-sm text-[#3B82F6] mb-1">
                  Current Status: Pending Payment
                </Text>
                <Text className="font-onest text-xs text-blue-400 leading-4">
                  Your booking will remain pending until payment is completed.
                  You can pay now or choose to pay later.
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="space-y-3 gap-4">
            {/* Pay Now Button */}
            <TouchableOpacity
              onPress={handlePayNow}
              className="bg-primary py-4 px-6 rounded-xl flex-row items-center justify-center"
              activeOpacity={0.7}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="card-outline" size={20} color="white" />
                  <Text className="ml-2 text-white font-onest-semibold text-base">
                    Pay Now (₱{totalCost.toLocaleString()})
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Pay Later Button */}
            <TouchableOpacity
              onPress={handlePayLater}
              className="bg-white border border-gray-300 py-4 px-6 rounded-xl flex-row items-center justify-center"
              activeOpacity={0.7}
              disabled={isProcessing}
            >
              <Ionicons name="time-outline" size={20} color="#374151" />
              <Text className="ml-2 text-gray-700 font-onest-semibold text-base">
                Pay Later
              </Text>
            </TouchableOpacity>
          </View>

          {/* Additional Info */}
          <View className="mt-6 px-4">
            <Text className="text-xs text-gray-500 font-onest text-center leading-5">
              By proceeding with payment, you agree to the booking terms and
              conditions. Payment is secure and processed through our trusted
              payment partners.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Step4PaymentConfirmation;
