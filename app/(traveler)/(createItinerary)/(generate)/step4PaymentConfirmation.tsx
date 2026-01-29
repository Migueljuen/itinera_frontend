import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View
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
  price_estimate?: string | null;
  unit?: string;

  reservation_requires_payment?: boolean | number;

  // optional UI extras you might already send
  slot_remaining_preview?: number | null;

  // ✅ BEST SIGNALS (add at least one of these in backend response)
  category_id?: number | null;
  category_name?: string | null;
  tags?: string[] | string | null;

  // ✅ even better: backend computed flag
  is_food?: boolean | number;
}

interface StepProps {
  formData: {
    traveler_id: number;
    start_date: string;
    end_date: string;
    title: string;
    items: ItineraryItem[];
    preferences?: {
      travelerCount: number;
      guestBreakdown?: any;
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
  totalCost: number; // legacy; Step4 will compute from filtered items instead
  onNext: () => void;
  onBack: () => void;
}

const MIN_ENTER_LOADING_MS = 450;
const FOOD_CATEGORY_ID = 3;

const parsePriceEstimateRange = (
  value: any
): { min: number; max: number } | null => {
  if (!value) return null;
  if (typeof value === "number") return { min: value, max: value };

  const s = String(value).trim();
  const nums = s.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
  if (nums.length === 0) return null;

  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return { min, max };
};

const applyUnitMultiplier = (
  amount: number,
  unit: string | undefined,
  travelerCount: number
) => {
  const u = String(unit || "").toLowerCase();
  const perPerson = u === "entry" || u === "person";
  return perPerson ? amount * travelerCount : amount;
};

const Step4PaymentConfirmation: React.FC<StepProps> = ({
  formData,
  itineraryId,
  totalCost,
  onNext,
  onBack,
}) => {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const [enterLoading, setEnterLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setEnterLoading(false), MIN_ENTER_LOADING_MS);
    return () => clearTimeout(t);
  }, []);

  const travelerCount = formData.preferences?.travelerCount || 1;

  /**
   * ✅ Only Step4 should hide food/category=3
   * IMPORTANT: This only works if items contain category_id OR is_food OR category_name/tags.
   */
  const isFoodOrCategory3 = (item: ItineraryItem) => {
    // Strongest signal if you add it in backend
    if (typeof item.is_food !== "undefined" && item.is_food !== null) {
      return Number(item.is_food) === 1;
    }

    // Next strongest: category_id
    if (typeof item.category_id !== "undefined" && item.category_id !== null) {
      return Number(item.category_id) === FOOD_CATEGORY_ID;
    }

    // Fallback: category_name
    const cname = String(item.category_name || "").toLowerCase();
    if (cname.includes("food") || cname.includes("drink")) return true;

    // Fallback: tags
    const rawTags = item.tags;
    const tagsArr = Array.isArray(rawTags)
      ? rawTags
      : typeof rawTags === "string"
        ? rawTags.split(",").map((t) => t.trim())
        : [];

    if (tagsArr.some((t) => /food|drink|restaurant|cafe|bar/i.test(String(t))))
      return true;

    return false;
  };

  /**
   * ✅ New payment model alignment:
   * - if reservation_requires_payment exists, trust it
   * - else infer: price or price_estimate => requires payment
   */
  const normalizeRequiresPayment = (item: ItineraryItem) => {
    if (typeof item.reservation_requires_payment !== "undefined") {
      return Number(item.reservation_requires_payment) === 1;
    }
    const price = Number(item.price || 0);
    const hasEstimate = !!item.price_estimate;
    return price > 0 || hasEstimate;
  };

  // ✅ Filter items for Step4 UI only
  const { filteredItems, excludedFoodCount } = useMemo(() => {
    const all = formData.items || [];
    const filtered = all.filter((it) => !isFoodOrCategory3(it));
    return { filteredItems: filtered, excludedFoodCount: all.length - filtered.length };
  }, [formData.items]);

  const {
    payNowItems,
    freeReserveItems,
    payNowTotalExact,
    estimatedPayNowBudget,
  } = useMemo(() => {
    const payNow: Array<{
      key: string;
      name: string;
      costExact: number;
      estMin: number;
      estMax: number;
      note?: string | null;
      isEstimateOnly: boolean;
    }> = [];

    const free: Array<{
      key: string;
      name: string;
      note?: string | null;
    }> = [];

    for (const item of filteredItems) {
      const requiresPayment = normalizeRequiresPayment(item);

      const key = `${item.day_number}-${item.experience_id}-${item.start_time}-${item.end_time}`;
      const name = item.experience_name || `Activity #${item.experience_id}`;

      if (!requiresPayment) {
        free.push({
          key,
          name,
          note: "Free reservation (confirmed immediately)",
        });
        continue;
      }

      const unit = item.unit;
      const price = Number(item.price || 0);
      const isExact = price > 0;

      const costExact = isExact
        ? applyUnitMultiplier(price, unit, travelerCount)
        : 0;

      const range = parsePriceEstimateRange(item.price_estimate);
      const estMin = range
        ? applyUnitMultiplier(range.min, unit, travelerCount)
        : costExact;
      const estMax = range
        ? applyUnitMultiplier(range.max, unit, travelerCount)
        : costExact;

      const u = String(unit || "").toLowerCase();
      const isPerPerson = u === "entry" || u === "person";
      const note = isPerPerson
        ? isExact
          ? `₱${price.toLocaleString()} × ${travelerCount}`
          : `Per person × ${travelerCount}`
        : null;

      payNow.push({
        key,
        name,
        costExact: Math.round(costExact),
        estMin: Math.round(estMin),
        estMax: Math.round(estMax),
        note,
        isEstimateOnly: !isExact,
      });
    }

    const payNowTotalExact = payNow.reduce((sum, x) => sum + x.costExact, 0);
    const estMinTotal = payNow.reduce((sum, x) => sum + (x.estMin || 0), 0);
    const estMaxTotal = payNow.reduce((sum, x) => sum + (x.estMax || 0), 0);

    return {
      payNowItems: payNow,
      freeReserveItems: free,
      payNowTotalExact: Math.round(payNowTotalExact),
      estimatedPayNowBudget: {
        min: Math.round(estMinTotal),
        max: Math.round(estMaxTotal),
        hasRange: Math.round(estMinTotal) !== Math.round(estMaxTotal),
      },
    };
  }, [filteredItems, travelerCount]);

  // ✅ Due-now MUST match what Step4 shows (do not use legacy totalCost which may include food)
  const dueNowExact = payNowTotalExact;

  const guideCost = formData.additionalServices?.guideCost || 0;
  const carCost = formData.additionalServices?.carCost || 0;
  const pendingServicesCost = guideCost + carCost;
  const hasPendingServices = pendingServicesCost > 0;

  if (enterLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-3 text-sm font-onest text-black/50">
          Preparing your payment summary...
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
          {/* Header */}
          <View className="items-start mb-8">
            <View className="w-16 h-16 rounded-full bg-indigo-50 items-center justify-center mb-4">
              <Ionicons name="receipt-outline" size={30} color="#4F46E5" />
            </View>
            <Text className="text-2xl font-onest-semibold text-black/90 mb-1">
              Booking Summary
            </Text>

            {/* ✅ Optional note so you know it worked */}
            {excludedFoodCount > 0 && (
              <Text className="text-xs font-onest text-black/40 mt-2">
                {excludedFoodCount} food booking{excludedFoodCount > 1 ? "s" : ""} hidden from this payment summary.
              </Text>
            )}
          </View>

          {/* Pending Services (Guide / Car) */}
          {hasPendingServices && (
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <View className="w-2 h-2 rounded-full bg-amber-400 mr-2" />
                <Text className="text-sm font-onest-medium text-black/70">
                  Additional <Text className="text-black/50 font-onest"> (separate requests)</Text>
                </Text>
              </View>

              {/* Guide */}
              {formData.tourGuide && guideCost > 0 && (
                <View className="flex-row items-center justify-between py-3 border-b border-black/5">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 rounded-xl bg-gray-50 items-center justify-center mr-3">
                      <Ionicons
                        name="person-outline"
                        size={18}
                        color="#9CA3AF"
                      />
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
                      Awaiting acceptance
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
                        {formData.carService.vehicle_type} •{" "}
                        {formData.carService.driver_name}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-sm font-onest-medium text-black/40">
                      ₱{carCost.toLocaleString()}
                    </Text>
                    <Text className="text-xs font-onest text-amber-600 mt-0.5">
                      Awaiting acceptance
                    </Text>
                  </View>
                </View>
              )}

              <Text className="text-xs font-onest text-black/70 mt-3 leading-4">
                These service requests are handled separately. Once accepted,
                you’ll receive a payment request for each.
              </Text>
            </View>
          )}

          {/* Payment Summary */}
          <View className="mb-6">
            <Text className="text-lg font-onest-medium text-black/70 mt-8">
              Payments for Activities
            </Text>

            {payNowItems.length > 0 ? (
              <View className="mt-2 rounded-xl py-3">
                {payNowItems.map((a) => (
                  <View
                    key={a.key}
                    className="flex-row items-start justify-between py-2 "
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
                      {a.isEstimateOnly && (
                        <Text className="text-xs font-onest text-amber-700 mt-0.5">
                          Estimated price
                        </Text>
                      )}
                    </View>

                    <View className="items-end">
                      {a.isEstimateOnly ? (
                        <Text className="text-sm font-onest-medium text-black/70">
                          ₱{a.estMin.toLocaleString()} - ₱{a.estMax.toLocaleString()}
                        </Text>
                      ) : (
                        <Text className="text-sm font-onest-medium text-black/80">
                          ₱{a.costExact.toLocaleString()}
                        </Text>
                      )}
                      <Text className="text-[11px] font-onest text-black/40 mt-0.5">
                        Will be Pending until paid
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="mt-2 rounded-xl p-4">
                <Text className="text-sm font-onest text-black/60">
                  No paid bookings in this itinerary.
                </Text>
              </View>
            )}


            {/* Due now */}
            <View className="pt-4 mt-4 border-t border-black/5">
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-onest-medium text-black/80">
                  Due now
                </Text>
                <Text className="text-xl font-onest-bold text-primary">
                  ₱{dueNowExact.toLocaleString()}
                </Text>
              </View>


            </View>
          </View>

          <View className="bg-blue-50 rounded-xl p-4 mb-6">
            <View className="flex-row items-center">
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="#3B82F6"
              />
              <Text className="flex-1 text-xs font-onest text-blue-600 ml-2 leading-4">
                Unpaid bookings will not be included in the final itinerary.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View className="absolute bottom-0 left-0 right-0 border-t bg-[#fff] border-black/5 px-6 py-4">
        <TouchableOpacity
          onPress={() => {
            if (itineraryId) router.replace(`/(traveler)/(itinerary)/${itineraryId}`);
            else router.replace("/");
          }}
          className="bg-primary py-4 rounded-xl flex-row items-center justify-center mb-3"
          activeOpacity={0.7}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="list-outline" size={18} color="white" />
              <Text className="ml-2 text-white font-onest-semibold text-base">
                View Itinerary
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace("/")}
          className="py-3 flex-row items-center justify-center"
          activeOpacity={0.7}
          disabled={isProcessing}
        >
          <Text className="text-black/50 font-onest-medium text-sm">
            Go to Home
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Step4PaymentConfirmation;
