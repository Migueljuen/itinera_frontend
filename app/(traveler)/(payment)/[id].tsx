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

const PaymentScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [isPartialPayment, setIsPartialPayment] = useState(false);

  const DOWN_PAYMENT_PERCENTAGE = 0.5;

  // Calculate amounts (UPDATED to include cash collected)
  const totalAmount = paymentInfo?.total_amount
    ? parseFloat(paymentInfo.total_amount)
    : 0;

  const amountPaidOnline = paymentInfo?.amount_paid
    ? parseFloat(paymentInfo.amount_paid)
    : 0;

  const totalCashCollected = paymentInfo?.total_creator_cash_collected
    ? parseFloat(paymentInfo.total_creator_cash_collected)
    : 0;

  // Total paid = online + cash collected
  const totalPaid = amountPaidOnline + totalCashCollected;

  // Use actual_remaining_balance from backend (accounts for cash collected)
  const remainingBalance = paymentInfo?.actual_remaining_balance !== undefined
    ? parseFloat(paymentInfo.actual_remaining_balance)
    : totalAmount - totalPaid;

  const downPaymentAmount = totalAmount * DOWN_PAYMENT_PERCENTAGE;
  const remainingAfterDownPayment = totalAmount - downPaymentAmount;

  // Amount to pay online
  const amountToPay = isPartialPayment ? downPaymentAmount : remainingBalance;

  // Check if payment is complete
  const isPaymentComplete = paymentInfo?.is_payment_complete === true;

  // Fetch payment info
  useEffect(() => {
    const getPayment = async () => {
      try {
        const res = await fetch(`${API_URL}/payment/${id}/info`);
        const data = await res.json();
        console.log("Full API Response:", data);
        console.log("Payment Info:", data.payment);
        setPaymentInfo(data.payment);
      } catch (error) {
        console.error("Error fetching payment:", error);
        Alert.alert("Error", "Failed to load payment details.");
      } finally {
        setLoading(false);
      }
    };

    getPayment();
  }, [id]);

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

    const paymentType = isPartialPayment ? "down payment" : totalPaid > 0 ? "remaining balance" : "full payment";
    Alert.alert(
      "Submit Payment",
      `Send ${paymentType} proof of ₱${amountToPay.toFixed(2)} now?`,
      [
        { text: "Cancel" },
        {
          text: "Submit",
          onPress: async () => {
            setUploading(true);
            try {
              // Get auth token
              const token = await AsyncStorage.getItem("token");
              if (!token) {
                toast.error("Authentication required");
                setUploading(false);
                return;
              }

              // Upload to backend — using FormData
              const formData = new FormData();
              formData.append("proof", {
                uri: proofImage,
                name: "payment.jpg",
                type: "image/jpeg",
              } as any);
              formData.append("itinerary_id", id as string);
              formData.append(
                "payment_type",
                isPartialPayment ? "partial" : "full"
              );
              formData.append("amount_paid", amountToPay.toString());

              const res = await fetch(`${API_URL}/payment/upload`, {
                method: "POST",
                body: formData,
                headers: {
                  "Content-Type": "multipart/form-data",
                  Authorization: `Bearer ${token}`,
                },
              });

              const data = await res.json();

              if (data.success) {
                toast.success(
                  isPartialPayment
                    ? `Down payment submitted! Please wait for us to verify it.`
                    : "Payment submitted successfully!"
                );

                // Small delay to show toast before navigation
                setTimeout(() => {
                  router.replace(`/(traveler)/(itinerary)/${id}`);
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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#1f2937" />
      </SafeAreaView>
    );
  }

  // If payment is complete, show message and go back
  if (isPaymentComplete) {
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
            All payments for this itinerary have been completed.
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

              <Text className="text-black/90 text-lg font-onest-semibold">
                QR Payment
              </Text>

              <View className="p-2 w-10" />
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6">
          {/* QR Code */}
          <View className="bg-[#fff] mb-8">
            <View className="items-center">
              <Image
                source={require("../../../assets/images/qr.png")}
                className="w-64 h-64 rounded-lg"
                resizeMode="contain"
              />
            </View>

            <Text className="text-center mt-4 font-onest text-black/60">
              Scan this QR with GCash to pay.
            </Text>
          </View>

          {/* Show already paid amount if exists (UPDATED to include cash) */}
          {totalPaid > 0 && (
            <View className="mb-4 py-4 rounded-2xl">
              <Text className="font-onest-semibold  text-black/90">
                Total Paid: ₱{totalPaid.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>

              {/* Breakdown of online vs cash */}
              {(amountPaidOnline > 0 || totalCashCollected > 0) && (
                <View className="mt-2 pt-2 border-t border-gray-200">
                  {amountPaidOnline > 0 && (
                    <Text className="font-onest text-sm text-black/60">
                      Online: ₱{amountPaidOnline.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                  )}
                  {totalCashCollected > 0 && (
                    <Text className="font-onest text-sm text-black/60">
                      Cash Collected: ₱{totalCashCollected.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                  )}
                </View>
              )}

              <Text className="font-onest text-sm text-black/60 mt-2">
                Remaining Balance: ₱{remainingBalance.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          )}

          {/* Cash Due Notice (NEW) */}
          {/* {paymentInfo?.total_creator_cash_due > 0 &&
            paymentInfo?.total_creator_cash_due > totalCashCollected && (
              <View className="mb-4 p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
                <View className="flex-row items-start">
                  <Ionicons name="information-circle" size={18} color="#D97706" />
                  <View className="ml-2 flex-1">
                    <Text className="font-onest-semibold text-sm text-yellow-800">
                      Cash Payment Required
                    </Text>
                    <Text className="font-onest text-sm text-yellow-700 mt-1">
                      ₱{(paymentInfo.total_creator_cash_due - totalCashCollected).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} will be collected in cash by the creator(s) during your activities.
                    </Text>
                  </View>
                </View>
              </View>
            )} */}

          {/* Payment Options Toggle */}
          <View className="mb-6">
            <Text className="font-onest-semibold text-base mb-3 text-black/90">
              Payment Option
            </Text>

            {/* Full Payment Option */}
            <Pressable
              onPress={() => setIsPartialPayment(false)}
              className={`mb-3 p-4 rounded-2xl border ${!isPartialPayment
                ? "border-primary bg-indigo-50"
                : "border-gray-200 bg-white"
                }`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center mb-1">
                    <View
                      className={`w-5 h-5 rounded-full border mr-3 items-center justify-center ${!isPartialPayment
                        ? "border-primary bg-primary"
                        : "border-gray-300"
                        }`}
                    >
                      {!isPartialPayment && (
                        <View className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </View>
                    <Text className="font-onest-semibold text-base text-black/90">
                      {totalPaid > 0 ? "Pay Remaining Balance" : "Full Payment"}
                    </Text>
                  </View>
                  <Text className="text-black/60 font-onest text-sm ml-8">
                    {totalPaid > 0
                      ? "Complete your payment"
                      : "Pay the complete amount now"
                    }
                  </Text>
                </View>
                <Text className="font-onest-bold text-lg text-black/90">
                  ₱
                  {remainingBalance.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </Pressable>

            {/* Down Payment Option - Only show if nothing paid yet */}
            {totalPaid === 0 && (
              <Pressable
                onPress={() => setIsPartialPayment(true)}
                className={`p-4 rounded-2xl border ${isPartialPayment
                  ? "border-primary bg-indigo-50"
                  : "border-gray-200 bg-white"
                  }`}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <View
                        className={`w-5 h-5 rounded-full border mr-3 items-center justify-center ${isPartialPayment
                          ? "border-primary bg-primary"
                          : "border-gray-300"
                          }`}
                      >
                        {isPartialPayment && (
                          <View className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </View>
                      <Text className="font-onest-semibold text-base text-black/90">
                        Down Payment (50%)
                      </Text>
                    </View>
                    <Text className="text-black/60 font-onest text-sm ml-8">
                      Pay 50% now, rest later
                    </Text>
                  </View>
                  <Text className="font-onest-bold text-lg text-black/90">
                    ₱
                    {downPaymentAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </View>

                {isPartialPayment && (
                  <View className="mt-2 pt-3 border-t border-indigo-200 ml-8">
                    <Text className="text-black/60 font-onest text-sm">
                      Remaining balance: ₱
                      {remainingAfterDownPayment.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                  </View>
                )}
              </Pressable>
            )}
          </View>

          {/* Amount Summary */}
          <View className="py-6 mb-6 border-b-2 border-dashed border-[#e3e3e3]">
            <View className="flex flex-row items-baseline justify-between">
              <Text className="font-onest-medium text-base text-black/40">
                Amount to Pay
              </Text>
              <Text className="text-2xl font-onest-bold text-primary">
                ₱
                {amountToPay.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>

          {/* Upload Proof */}
          <View className="rounded-2xl mb-6">
            <Text className="font-onest-semibold text-base mb-4 text-black/90">
              Upload Proof of Payment :
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
                  Submit {isPartialPayment ? "Down Payment" : totalPaid > 0 ? "Remaining Balance" : "Payment"}
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