// app/(traveler)/(payment)/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import API_URL from "../../../constants/api";

interface BookingPaymentInfo {
  booking_id: number;
  itinerary_id: number;
  experience_name: string;
  service_type: 'experience' | 'guide' | 'driver';
  activity_price: number;
  payment_status: 'Unpaid' | 'Pending' | 'Paid';
  payment_proof: string | null;
  payment_submitted_at: string | null;
  payment_verified_at: string | null;
  payment_rejected_at: string | null;
  payment_reject_reason: string | null;
  booking_status: string;
  booking_date: string | null;
  traveler_name: string;
  creator_name: string;
  creator_gcash_number?: string;
  creator_gcash_name?: string;
  creator_qr_code?: string;
}

const PaymentScreen = () => {
  const router = useRouter();
  const { id: booking_id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [bookingInfo, setBookingInfo] = useState<BookingPaymentInfo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [proofImage, setProofImage] = useState<string | null>(null);

  const activityPrice = bookingInfo?.activity_price
    ? parseFloat(String(bookingInfo.activity_price))
    : 0;

  const isPaid = bookingInfo?.payment_status === 'Paid';
  const isPending = bookingInfo?.payment_status === 'Pending';
  const wasRejected = bookingInfo?.payment_rejected_at !== null;

  // Fetch booking payment info
  useEffect(() => {
    const getBookingPayment = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          toast.error("Authentication required");
          router.back();
          return;
        }


        const res = await fetch(`${API_URL}/payment/booking/${booking_id}/payment`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();

        if (data.success) {
          setBookingInfo(data.booking);
        } else {
          toast.error(data.message || "Failed to load payment details");
          router.back();
        }
      } catch (error) {
        console.error("Error fetching booking payment:", error);
        Alert.alert("Error", "Failed to load payment details.");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (booking_id) {
      getBookingPayment();
    }
  }, [booking_id]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      allowsEditing: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
      setProofImage(result.assets[0].uri);
    }
  };

  const handleSubmitPayment = async () => {
    if (!proofImage) {
      toast.error("Please upload your proof of payment");
      return;
    }

    Alert.alert(
      "Submit Payment",
      `Send payment proof of ₱${activityPrice.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} for "${bookingInfo?.experience_name}"?`,
      [
        { text: "Cancel" },
        {
          text: "Submit",
          onPress: async () => {
            setUploading(true);
            try {
              const token = await AsyncStorage.getItem("token");
              if (!token) {
                toast.error("Authentication required");
                setUploading(false);
                return;
              }

              const formData = new FormData();
              formData.append("payment_proof", {
                uri: proofImage,
                name: "payment.jpg",
                type: "image/jpeg",
              } as any);

              const res = await fetch(`${API_URL}/payment/booking/${booking_id}/payment`, {
                method: "POST",
                body: formData,
                headers: {
                  "Content-Type": "multipart/form-data",
                  Authorization: `Bearer ${token}`,
                },
              });

              const data = await res.json();

              if (data.success) {
                toast.success("Payment submitted! Awaiting verification from partner.");
                setTimeout(() => {
                  router.back();
                }, 1500);
              } else {
                toast.error(data.message || "Failed to submit payment");
              }
            } catch (error: any) {
              console.error("Payment submission error:", error);
              toast.error(error.message || "Upload failed");
            } finally {
              setUploading(false);
            }
          },
        },
      ]
    );
  };

  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case 'experience':
        return 'Experience';
      case 'guide':
        return 'Guide Service';
      case 'driver':
        return 'Driver Service';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#4F46E5" />
      </SafeAreaView>
    );
  }

  // If payment is already completed
  if (isPaid) {
    return (
      <View className="flex-1 bg-[#fff]">
        <StatusBar />
        <SafeAreaView className="flex-1 justify-center items-center px-6">
          <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-6">
            <Ionicons name="checkmark" size={40} color="#059669" />
          </View>
          <Text className="text-xl font-onest-semibold text-black/90 mb-2">
            Payment Complete!
          </Text>
          <Text className="text-sm font-onest text-black/60 text-center mb-8">
            Payment for "{bookingInfo?.experience_name}" has been verified.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-primary py-3 px-8 rounded-full"
          >
            <Text className="text-white font-onest-semibold">Go Back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  // If payment is pending verification
  if (isPending && !wasRejected) {
    return (
      <View className="flex-1 bg-[#fff]">
        <StatusBar />
        <SafeAreaView className="flex-1 justify-center items-center px-6">
          <View className="w-20 h-20 rounded-full bg-yellow-100 items-center justify-center mb-6">
            <Ionicons name="time" size={40} color="#D97706" />
          </View>
          <Text className="text-xl font-onest-semibold text-black/90 mb-2">
            Awaiting Verification
          </Text>
          <Text className="text-sm font-onest text-black/60 text-center mb-2">
            Your payment for "{bookingInfo?.experience_name}" is being reviewed.
          </Text>
          <Text className="text-sm font-onest text-black/40 text-center mb-8">
            {bookingInfo?.creator_name} will verify your payment shortly.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-primary py-3 px-8 rounded-full"
          >
            <Text className="text-white font-onest-semibold">Go Back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#fff]">
      <StatusBar />

      {/* Header */}
      <View className="">
        <SafeAreaView>
          <View className="px-4">
            <View className="flex-row justify-between items-center mt-4">
              <TouchableOpacity onPress={() => router.back()} className="p-2">
                <Ionicons name="arrow-back" size={24} color="black" />
              </TouchableOpacity>

              <Text className="text-black/90 text-lg font-onest-semibold w-4/6 text-center">
                {bookingInfo?.experience_name}
              </Text>

              <View className="p-2 w-10" />
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6">
          {/* Rejection Notice */}
          {wasRejected && (
            <View className="mb-6 p-4 bg-red-50 rounded-2xl border border-red-200">
              <View className="flex-row items-start">
                <Ionicons name="close-circle" size={20} color="#DC2626" />
                <View className="ml-3 flex-1">
                  <Text className="font-onest-semibold text-sm text-red-800 mb-1">
                    Payment Rejected
                  </Text>
                  <Text className="font-onest text-sm text-red-700">
                    {bookingInfo?.payment_reject_reason || "Please resubmit with a valid payment proof."}
                  </Text>
                </View>
              </View>
            </View>
          )}





          {/* QR Code */}
          <View className=" mb-6">
            <View className="items-center p-4 rounded-2xl  ">
              {bookingInfo?.creator_qr_code ? (
                <Image
                  source={{ uri: `${API_URL}/${bookingInfo.creator_qr_code}` }}
                  className="w-64 h-64 rounded-lg"
                  resizeMode="contain"
                />
              ) : (
                <Image
                  source={require("@/assets/images/default-qr.jpg")}
                  className="w-64 h-64 rounded-lg"
                  resizeMode="contain"
                />
              )}
            </View>

            <Text className="text-center mt-4 font-onest text-black/60">
              Transfer fees may apply.
            </Text>
          </View>

          {/* Creator Payment Info */}
          <View className="mb-6  ">


            <View className=" flex items-center justify-center mb-4">

              <View className="flex-1">
                <Text className="text-2xl font-onest-semibold text-black/90">
                  {bookingInfo?.creator_gcash_name || bookingInfo?.creator_name || "Itinera Travel"}
                </Text>
                <Text className="text-sm font-onest text-black/60 text-center mt-4">
                  GCash: {bookingInfo?.creator_gcash_number || "09123456789"}
                </Text>
              </View>
            </View>
          </View>

          {/* Amount Summary */}
          <View className="py-6 mb-6 border-b-2 border-dashed border-[#e3e3e3]">
            <View className="flex flex-row items-baseline justify-between">
              <Text className="font-onest-medium text-base text-black/40">
                Amount to Pay
              </Text>
              <Text className="text-2xl font-onest-bold text-[#191313]">
                ₱
                {activityPrice.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>

          {/* Upload Proof */}
          <View className="rounded-2xl mb-6">
            <Text className="font-onest-semibold text-base mb-4 text-black/90">
              Upload Proof of Payment
            </Text>

            {proofImage ? (
              <View className="items-center mb-4">
                <Image
                  source={{ uri: proofImage }}
                  className="w-64 h-64 rounded-xl"
                />
              </View>
            ) : null}

            <Pressable
              onPress={handlePickImage}
              className="bg-blue-50 py-4 px-6 rounded-full flex-row justify-center items-center"
            >
              <Ionicons name="cloud-upload-outline" size={20} color="#3B82F6" />
              <Text className="ml-2 text-blue-600 font-onest-semibold">
                {proofImage ? "Change Image" : "Upload Image"}
              </Text>
            </Pressable>
          </View>

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmitPayment}
            disabled={uploading}
            className="bg-primary py-4 px-6 rounded-full flex-row justify-center items-center mb-8"
            style={{
              shadowColor: "#4F46E5",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            {uploading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="send-outline" size={20} color="white" />
                <Text className="ml-2 font-onest-semibold text-white text-base">
                  {wasRejected ? "Resubmit Payment" : "Submit Payment"}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

export default PaymentScreen;