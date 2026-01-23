// app/(traveler)/CancelBookingScreen.tsx

import API_URL from "@/constants/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MotiView } from "moti";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";

interface CancellationResponse {
    success: boolean;
    message: string;
    deleted_count: number;
    refund: {
        is_eligible: boolean;
        amount: number;
        records: Array<{
            refund_id: number;
            booking_id: number;
            activity_price: number;
            refund_amount: number;
        }>;
    };
    updated_itinerary: {
        new_total_amount: number;
        amount_paid: number;
        new_remaining_balance: number;
    };
}

export default function CancelBookingScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        itemId: string;
        itineraryId: string;
        experienceName: string;
        destinationName: string;
        destinationCity: string;
        startTime: string;
        endTime: string;
        activityPrice: string;
        paymentStatus: string;
    }>();
    const [isLoading, setIsLoading] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [cancellationComplete, setCancellationComplete] = useState(false);
    const [cancellationResult, setCancellationResult] = useState<CancellationResponse | null>(null);

    const {
        itemId,
        itineraryId,
        experienceName,
        destinationName,
        destinationCity,
        startTime,
        endTime,
        activityPrice,
        paymentStatus,
    } = params;

    const price = parseFloat(activityPrice || "0");
    const isFullyPaid = paymentStatus === "fully_paid";
    const refundAmount = isFullyPaid ? price * 0.5 : 0;

    const handleCancel = async () => {
        if (!confirmed) return;

        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Error", "Please log in again");
                setIsLoading(false);
                return;
            }

            const response = await fetch(
                `${API_URL}/itinerary/${itineraryId}/items/bulk-delete`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        item_ids: [parseInt(itemId)],
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to cancel booking");
            }

            const result: CancellationResponse = await response.json();
            setCancellationResult(result);
            setCancellationComplete(true);

        } catch (error) {
            console.error("Error cancelling booking:", error);
            Alert.alert("Error", "Failed to cancel booking. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDone = () => {
        // Navigate back - the parent screen should refresh
        router.back();
    };

    // ============ SUCCESS STATE ============
    if (cancellationComplete && cancellationResult) {
        const { refund, updated_itinerary } = cancellationResult;

        return (
            <View className="flex-1 bg-white">
                <ScrollView
                    className="flex-1 px-8"
                    contentContainerStyle={{ paddingBottom: 120 }}
                >
                    <MotiView
                        from={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "timing", duration: 300 }}
                        className="flex-1 items-center justify-center pt-24"
                    >
                        {/* Success Icon */}
                        <View
                            className={`w-20 h-20 rounded-full items-center justify-center mb-6 ${refund.is_eligible ? "bg-green-100" : "bg-gray-100"
                                }`}
                        >
                            <Ionicons
                                name={refund.is_eligible ? "checkmark-circle" : "close-circle"}
                                size={48}
                                color={refund.is_eligible ? "#16A34A" : "#6B7280"}
                            />
                        </View>

                        {/* Title */}
                        <Text className="text-2xl font-onest-semibold text-black/90 text-center mb-2">
                            Booking Cancelled
                        </Text>
                        <Text className="text-base font-onest text-black/50 text-center mb-8 px-4">
                            {experienceName} has been removed from your itinerary.
                        </Text>

                        {/* Refund Status Card */}
                        {refund.is_eligible ? (
                            <View className="w-full bg-green-50 rounded-2xl p-5 mb-4">
                                <View className="flex-row items-center mb-3">
                                    <Ionicons name="cash-outline" size={24} color="#16A34A" />
                                    <Text className="text-lg font-onest-semibold text-green-800 ml-2">
                                        Refund Processing
                                    </Text>
                                </View>
                                <Text className="text-sm font-onest text-green-700 mb-4">
                                    Your refund will be sent to your registered GCash number within 3-5 business days.
                                </Text>
                                <View className=" rounded-xl p-4">
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-sm font-onest text-green-700">
                                            Refund Amount
                                        </Text>
                                        <Text className="text-2xl font-onest-semibold text-green-800">
                                            ₱{refund.amount.toLocaleString()}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <View className="w-full bg-amber-50 rounded-2xl p-5 mb-4">
                                <View className="flex-row items-center mb-3">
                                    <Ionicons name="information-circle" size={24} color="#D97706" />
                                    <Text className="text-lg font-onest-semibold text-amber-800 ml-2">
                                        No Refund
                                    </Text>
                                </View>
                                <Text className="text-sm font-onest text-amber-700">
                                    As per our policy, downpayments are non-refundable. Your remaining balance has been adjusted.
                                </Text>
                            </View>
                        )}

                        {/* Updated Itinerary Summary */}
                        {/* <View className="w-full bg-gray-50 rounded-2xl p-5">
                            <Text className="text-base font-onest-semibold text-black/90 mb-4">
                                Updated Itinerary
                            </Text>

                            <View className="flex-row justify-between mb-2">
                                <Text className="text-sm font-onest text-black/50">
                                    New total
                                </Text>
                                <Text className="text-sm font-onest text-black/70">
                                    ₱{updated_itinerary.new_total_amount.toLocaleString()}
                                </Text>
                            </View>

                            <View className="flex-row justify-between mb-2">
                                <Text className="text-sm font-onest text-black/50">
                                    Amount paid
                                </Text>
                                <Text className="text-sm font-onest text-black/70">
                                    ₱{updated_itinerary.amount_paid.toLocaleString()}
                                </Text>
                            </View>

                            <View className="h-px bg-black/10 my-2" />
                        </View> */}
                    </MotiView>
                </ScrollView>

                {/* Done Button */}
                <View
                    className="absolute bottom-0 left-0 right-0 px-8 pb-10 pt-4 bg-white"
                    style={{
                        shadowColor: "#000",
                        shadowOpacity: 0.1,
                        shadowRadius: 10,
                        shadowOffset: { width: 0, height: -4 },
                        elevation: 10,
                    }}
                >
                    <Pressable
                        onPress={handleDone}
                        className="w-full py-4 rounded-xl items-center bg-[#191313]"
                    >
                        <Text className="font-onest-semibold text-white">
                            Done
                        </Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    // ============ CONFIRMATION STATE ============
    return (
        <View className="flex-1 bg-[#fff]">
            {/* Header */}
            <View className="px-6 mt-12 pt-4 pb-4">

            </View>

            <ScrollView
                className="flex-1 px-8"
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                {/* Title */}
                <MotiView
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "timing", duration: 250 }}
                >
                    <View className="mt-4 mb-6">
                        <Text className="text-3xl font-onest text-black/90 leading-tight">
                            What happens when you cancel
                        </Text>
                        <Text className="mt-2 text-base text-black/50 font-onest">
                            Please review the cancellation details below.
                        </Text>
                    </View>

                    {/* Booking Details Card */}
                    <View className="mt-6">
                        <Text className="text-2xl font-onest mb-1">
                            {experienceName}
                        </Text>
                    </View>

                    {/* Refund Policy Section */}
                    <View className="mb-6 mt-36">
                        {/* Refund Info */}
                        {isFullyPaid ? (
                            <View className="bg-green-50 rounded-xl p-4 mb-4">
                                <View className="flex-row items-start">
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={20}
                                        color="#16A34A"
                                        style={{ marginTop: 2 }}
                                    />
                                    <View className="flex-1 ml-3">
                                        <Text className="text-base font-onest-medium text-green-800 mb-1">
                                            Eligible for partial refund
                                        </Text>
                                        <Text className="text-sm font-onest text-green-700">
                                            You will receive 50% of this activity's cost back to your GCash.
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <View className="bg-amber-50 rounded-xl p-4 mb-4">
                                <View className="flex-row items-start">
                                    <Ionicons
                                        name="alert-circle"
                                        size={20}
                                        color="#D97706"
                                        style={{ marginTop: 2 }}
                                    />
                                    <View className="flex-1 ml-3">
                                        <Text className="text-base font-onest-medium text-amber-800 mb-1">
                                            Non-refundable
                                        </Text>
                                        <Text className="text-sm font-onest text-amber-700">
                                            Downpayments are non-refundable. However, your remaining balance will be adjusted accordingly.
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Summary */}
                        <View className="bg-gray-50 rounded-xl p-4">
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-sm font-onest text-black/50">
                                    Activity cost
                                </Text>
                                <Text className="text-sm font-onest text-black/70">
                                    ₱{price.toLocaleString()}
                                </Text>
                            </View>
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-sm font-onest text-black/50">
                                    Refund rate
                                </Text>
                                <Text className="text-sm font-onest text-black/70">
                                    {isFullyPaid ? "50%" : "0%"}
                                </Text>
                            </View>
                            <View className="h-px bg-black/10 my-2" />
                            <View className="flex-row justify-between">
                                <Text className="text-base font-onest-semibold text-black/90">
                                    {isFullyPaid ? "Refund amount" : "Amount forfeited"}
                                </Text>
                                <Text
                                    className={`text-base font-onest-semibold ${isFullyPaid ? "text-green-600" : "text-black/90"
                                        }`}
                                >
                                    ₱{isFullyPaid ? refundAmount.toLocaleString() : price.toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Policy Reminder */}
                    <View className="mb-6">
                        <View className="flex-row items-start">
                            <Ionicons
                                name="information-circle-outline"
                                size={18}
                                color="#6B7280"
                                style={{ marginTop: 2 }}
                            />
                            <Text className="flex-1 text-sm font-onest text-black/50 ml-2">
                                Refunds are processed back to your GCash number within 3-5 business days. GCash fees are non-refundable.
                            </Text>
                        </View>
                    </View>

                    {/* Confirmation Checkbox */}
                    <Pressable
                        onPress={() => setConfirmed((v) => !v)}
                        className="flex-row items-center mt-2"
                    >
                        <View
                            className={`w-6 h-6 rounded-md items-center justify-center mr-3 ${confirmed ? "bg-[#191313]" : "bg-black/10"
                                }`}
                        >
                            <Ionicons
                                name={confirmed ? "checkmark" : "remove"}
                                size={16}
                                color={confirmed ? "#fff" : "transparent"}
                            />
                        </View>
                        <Text className="flex-1 font-onest text-sm text-black/90">
                            I understand the cancellation policy and want to proceed.
                        </Text>
                    </Pressable>
                </MotiView>
            </ScrollView>

            {/* Bottom Actions */}
            <View
                className="absolute bottom-0 left-0 right-0 px-8 pb-10 pt-4 bg-white"
                style={{
                    shadowColor: "#000",
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: -4 },
                    elevation: 10,
                }}
            >
                <View className="flex-row gap-3">
                    <Pressable
                        onPress={() => router.back()}
                        className="flex-1 rounded-xl py-4 items-center bg-gray-200"
                    >
                        <Text className="font-onest-medium text-black/80">Keep booking</Text>
                    </Pressable>

                    <Pressable
                        onPress={handleCancel}
                        disabled={!confirmed || isLoading}
                        className={`flex-1 py-4 px-6 rounded-xl items-center flex-row justify-center ${confirmed && !isLoading ? "bg-[#191313]" : "bg-[#191313]/50"
                            }`}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text className="font-onest-semibold text-white">
                                Cancel booking
                            </Text>
                        )}
                    </Pressable>
                </View>
            </View>
        </View>
    );
}