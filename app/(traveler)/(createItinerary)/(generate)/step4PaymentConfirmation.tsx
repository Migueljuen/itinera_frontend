import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface TourGuide {
  guide_id: number;
  user_id: number;
  name: string;
  languages: string[] | string;
  bio: string | null;
  areas_covered: string;
  experience_years: number;
  availability_days: string[] | string;
  city: string;
  price_per_day: string | number;
  profile_pic?: string;
  avg_rating: string | number;
  review_count: number;
}

interface CarService {
  vehicle_id: number;
  vehicle_type: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  passenger_capacity: number;
  vehicle_photos?: string[] | string;
  price_per_day: string | number;
  city: string;
  driver_name: string;
  driver_id: number;
  driver_user_id: number;
  avg_rating: string | number;
  review_count: number;
}

interface ItineraryItem {
  experience_id: number;
  day_number: number;
  start_time: string;
  end_time: string;
  custom_note?: string;
  experience_name?: string;
  price?: number;
  unit?: string;
}

interface StepProps {
  formData: {
    traveler_id: number;
    start_date: string;
    end_date: string;
    title: string;
    items: ItineraryItem[];
    // ✅ FIX: add preferences so we can compute per-person pricing correctly
    preferences?: {
      travelerCount: number;
    };
    tourGuide?: TourGuide | null;
    carService?: CarService | null;
    additionalServices?: {
      guideCost: number;
      carCost: number;
      totalAdditionalCost: number;
    };
  };
  itineraryId: number;
  totalCost: number; // you can keep passing this, but we'll compute from breakdown for accuracy
  onNext: () => void;
  onBack: () => void;
}

const MIN_ENTER_LOADING_MS = 450;

const Step4PaymentConfirmation: React.FC<StepProps> = ({
  formData,
  itineraryId,
  totalCost,
  onNext,
  onBack,
}) => {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ Minimum loading time on entry (prevents UI flicker)
  const [enterLoading, setEnterLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setEnterLoading(false), MIN_ENTER_LOADING_MS);
    return () => clearTimeout(t);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handlePayNow = () => {
    router.replace(`/(traveler)/(payment)/${itineraryId}`);
  };

  const handlePayLater = () => {
    Alert.alert(
      "Pay Later",
      "Your booking will remain pending until payment is completed.",
      [
        { text: "Go to Home", onPress: () => router.replace("/") },
        {
          text: "View Itinerary",
          onPress: () => {
            if (itineraryId) router.replace(`/(traveler)/(itinerary)/${itineraryId}`);
            else router.replace("/");
          },
        },
      ]
    );
  };

  const activityCount = formData.items?.length || 0;

  const duration =
    Math.ceil(
      (new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) /
      (1000 * 60 * 60 * 24)
    ) + 1;

  const guideCost = formData.additionalServices?.guideCost || 0;
  const carCost = formData.additionalServices?.carCost || 0;
  const pendingServicesCost = guideCost + carCost;
  const hasPendingServices = pendingServicesCost > 0;

  // ✅ Breakdown computation
  const travelerCount = formData.preferences?.travelerCount || 1;

  const { paidActivities, computedActivitiesCost } = useMemo(() => {
    const getItemCost = (item: ItineraryItem) => {
      const price = Number(item.price || 0);
      if (price <= 0) return 0;

      const unit = (item.unit || "").toLowerCase();
      const isPerPerson = unit === "entry" || unit === "person";

      return isPerPerson ? price * travelerCount : price;
    };

    const breakdown = (formData.items || []).map((item) => {
      const basePrice = Number(item.price || 0);
      const unit = (item.unit || "").toLowerCase();
      const isPerPerson = unit === "entry" || unit === "person";
      const cost = getItemCost(item);

      return {
        key: `${item.day_number}-${item.experience_id}-${item.start_time}-${item.end_time}`,
        name: item.experience_name || `Activity #${item.experience_id}`,
        cost,
        note: isPerPerson ? `₱${basePrice.toLocaleString()} × ${travelerCount}` : null,
      };
    });

    const paid = breakdown.filter((b) => b.cost > 0);
    const total = paid.reduce((sum, b) => sum + b.cost, 0);

    return { paidActivities: paid, computedActivitiesCost: total };
  }, [formData.items, travelerCount]);

  // ✅ Use computed total (more reliable than prop totalCost)
  const activitiesCost = computedActivitiesCost || totalCost;

  // ✅ Minimum entry loading view
  if (enterLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-3 text-sm font-onest text-black/50">
          Preparing your summary...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="pt-6">
          {/* Success Header */}
          <View className="items-start mb-8">
            <View className="w-16 h-16 rounded-full bg-green-50 items-center justify-center mb-4">
              <Ionicons name="checkmark" size={32} color="#22C55E" />
            </View>
            <Text className="text-2xl font-onest-semibold text-black/90 mb-1">
              Itinerary Created!
            </Text>
            <Text className="text-base font-onest text-black/50 text-center">
              Your trip has been saved successfully
            </Text>
          </View>

          {/* Trip Info */}
          <View className="mb-6">
            <Text className="text-lg font-onest-semibold text-black/90 mb-1">
              {formData.title || "My Trip"}
            </Text>
            <Text className="text-sm font-onest text-black/50">
              {formatDate(formData.start_date)} - {formatDate(formData.end_date)} •{" "}
              {duration} {duration === 1 ? "day" : "days"}
            </Text>
          </View>

          {/* Pending Services */}
          {hasPendingServices && (
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <View className="w-2 h-2 rounded-full bg-amber-400 mr-2" />
                <Text className="text-sm font-onest-medium text-black/70">
                  Pending Confirmation
                </Text>
              </View>

              {/* Guide */}
              {formData.tourGuide && guideCost > 0 && (
                <View className="flex-row items-center justify-between py-3 border-b border-black/5">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 rounded-xl bg-gray-50 items-center justify-center mr-3">
                      <Ionicons name="person-outline" size={18} color="#9CA3AF" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-onest-medium text-black/80">
                        Tour Guide
                      </Text>
                      <Text className="text-xs font-onest text-black/40">
                        {formData.tourGuide.name}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-sm font-onest-medium text-black/40">
                      ₱{guideCost.toLocaleString()}
                    </Text>
                    <Text className="text-xs font-onest text-amber-600 mt-0.5">
                      Awaiting
                    </Text>
                  </View>
                </View>
              )}

              {/* Transportation */}
              {formData.carService && carCost > 0 && (
                <View className="flex-row items-center justify-between py-3 border-b border-black/5">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 rounded-xl bg-gray-50 items-center justify-center mr-3">
                      <Ionicons name="car-outline" size={18} color="#9CA3AF" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-onest-medium text-black/80">
                        Transportation
                      </Text>
                      <Text className="text-xs font-onest text-black/40">
                        {formData.carService.vehicle_type} • {formData.carService.driver_name}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-sm font-onest-medium text-black/40">
                      ₱{carCost.toLocaleString()}
                    </Text>
                    <Text className="text-xs font-onest text-amber-600 mt-0.5">
                      Awaiting
                    </Text>
                  </View>
                </View>
              )}

              <Text className="text-xs font-onest text-black/40 mt-3 leading-4">
                Service providers will be notified. Once accepted, you'll receive a payment request.
              </Text>
            </View>
          )}

          {/* Cost Breakdown */}
          <View className="mb-6">
            <Text className="text-lg font-onest-medium text-black/70 z">
              Payment Summary
            </Text>



            {/* ✅Activity list */}
            {paidActivities.length > 0 && (
              <View className="mt-2 rounded-xl py-3">
                {paidActivities.map((a) => (
                  <View
                    key={a.key}
                    className="flex-row items-start justify-between py-2 border-b border-black/5"
                  >
                    <View className="flex-1 pr-3">
                      <Text className="text-sm font-onest-medium text-black/80">
                        {a.name}
                      </Text>
                      {!!a.note && (
                        <Text className="text-xs font-onest text-black/40 mt-0.5">
                          {a.note}
                        </Text>
                      )}
                    </View>
                    <Text className="text-sm font-onest-medium text-black/80">
                      ₱{a.cost.toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {hasPendingServices && (
              <View className="flex-row justify-between items-center py-2 mt-2">
                <View className="flex-row items-center">
                  <Text className="text-sm font-onest text-black/30">Services</Text>
                  <View className="ml-2 rounded-full px-2 py-0.5">
                    <Text className="text-xs font-onest text-amber-600">Pending</Text>
                  </View>
                </View>
                <Text className="text-sm font-onest text-black/30 line-through">
                  ₱{pendingServicesCost.toLocaleString()}
                </Text>
              </View>
            )}

            <View className="flex-row justify-between items-center pt-3 mt-2 border-t border-black/5">
              <Text className="text-sm font-onest-medium text-black/80">
                Due Now
              </Text>
              <Text className="text-xl font-onest-bold text-primary">
                ₱{activitiesCost.toLocaleString()}
              </Text>
            </View>

            {hasPendingServices && (
              <View className="flex-row justify-between items-center mt-2 bg-gray-50 rounded-lg px-3 py-2">
                <Text className="text-xs font-onest text-black/40">
                  If all services accepted
                </Text>
                <Text className="text-xs font-onest-medium text-black/50">
                  ₱{(activitiesCost + pendingServicesCost).toLocaleString()}
                </Text>
              </View>
            )}
          </View>

          {/* Info Note */}
          <View className="flex-row items-start bg-blue-50 rounded-xl p-4 mb-6">
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#3B82F6"
              style={{ marginTop: 1 }}
            />
            <Text className="flex-1 text-xs font-onest text-blue-600 ml-2 leading-4">
              {hasPendingServices
                ? "Pay for activities now. Service costs will be added separately once providers confirm."
                : "Complete payment to confirm your booking. Partners will be notified once paid."}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View className="absolute bottom-0 left-0 right-0 border-t bg-[#fff] border-black/5 px-6 py-4">
        <TouchableOpacity
          onPress={handlePayNow}
          className="bg-primary py-4 rounded-xl flex-row items-center justify-center mb-3"
          activeOpacity={0.7}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="card-outline" size={18} color="white" />
              <Text className="ml-2 text-white font-onest-semibold text-base">
                Pay ₱{activitiesCost.toLocaleString()}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePayLater}
          className="py-3 flex-row items-center justify-center"
          activeOpacity={0.7}
          disabled={isProcessing}
        >
          <Text className="text-black/50 font-onest-medium text-sm">Pay Later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Step4PaymentConfirmation;
