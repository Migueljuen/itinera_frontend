// app/(guide)/itinerary/[id].tsx - Guide's view of itinerary

import API_URL from "@/constants/api";
import { useItinerary } from "@/hooks/useItinerary";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const GuideItineraryScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { loading, itinerary, isGuide, guideInfo } = useItinerary(id);

  const handleCall = () => {
    if (guideInfo?.traveler_contact) {
      Linking.openURL(`tel:${guideInfo.traveler_contact}`);
    }
  };

  const handleMessage = () => {
    // Navigate to conversation with traveler
    router.push(`/(conversations)`);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#1f2937" />
      </View>
    );
  }

  if (!itinerary) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-black/60 font-onest">Itinerary not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 bg-white border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </Pressable>
        <Text className="text-xl font-onest-semibold text-black/90 flex-1">
          Trip Details
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Guide-Specific Header */}
        {isGuide && guideInfo && (
          <View className="bg-blue-50 mx-6 mt-4 p-4 rounded-2xl border border-blue-100">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                {guideInfo.traveler_profile_pic ? (
                  <Image
                    source={{
                      uri: `${API_URL}/${guideInfo.traveler_profile_pic}`,
                    }}
                    className="w-12 h-12 rounded-full mr-3"
                  />
                ) : (
                  <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-3">
                    <Ionicons name="person" size={24} color="#3b82f6" />
                  </View>
                )}
                <View>
                  <Text className="font-onest-medium text-black/90">
                    {guideInfo.traveler_name}
                  </Text>
                  <Text className="text-sm text-black/60 font-onest">
                    Your Client
                  </Text>
                </View>
              </View>

              <View className="items-end">
                <Text className="text-lg font-onest-semibold text-primary">
                  ₱{guideInfo.guide_fee.toLocaleString()}
                </Text>
                <Text className="text-xs text-black/50 font-onest">
                  Your Fee
                </Text>
              </View>
            </View>

            {/* Contact Actions */}
            <View className="flex-row gap-3">
              <Pressable
                onPress={handleCall}
                className="flex-1 bg-white py-3 rounded-xl flex-row items-center justify-center border border-blue-200"
              >
                <Ionicons name="call" size={18} color="#3b82f6" />
                <Text className="font-onest-medium text-blue-600 ml-2">
                  Call
                </Text>
              </Pressable>

              <Pressable
                onPress={handleMessage}
                className="flex-1 bg-blue-600 py-3 rounded-xl flex-row items-center justify-center"
              >
                <Ionicons name="chatbubble" size={18} color="white" />
                <Text className="font-onest-medium text-white ml-2">
                  Message
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Itinerary Title & Dates */}
        <View className="px-6 py-4 bg-white mt-4">
          <Text className="text-2xl font-onest-semibold text-black/90 mb-2">
            {itinerary.title}
          </Text>

          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            <Text className="text-sm text-black/60 font-onest ml-2">
              {new Date(itinerary.start_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
              -{" "}
              {new Date(itinerary.end_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </View>

          {itinerary.notes && (
            <View className="mt-3 p-3 bg-gray-50 rounded-xl">
              <Text className="text-sm text-black/70 font-onest">
                {itinerary.notes}
              </Text>
            </View>
          )}
        </View>

        {/* Activities by Day */}
        <View className="px-6 py-4">
          <Text className="text-lg font-onest-semibold text-black/90 mb-4">
            Itinerary Schedule
          </Text>

          {/* Group items by day */}
          {Object.entries(
            itinerary.items.reduce((acc, item) => {
              if (!acc[item.day_number]) {
                acc[item.day_number] = [];
              }
              acc[item.day_number].push(item);
              return acc;
            }, {} as Record<number, typeof itinerary.items>)
          ).map(([day, items]) => (
            <View key={day} className="mb-6">
              <View className="flex-row items-center mb-3">
                <View className="bg-primary w-8 h-8 rounded-full items-center justify-center">
                  <Text className="text-white font-onest-semibold">{day}</Text>
                </View>
                <Text className="font-onest-semibold text-black/90 ml-3">
                  Day {day}
                </Text>
              </View>

              {items.map((item, index) => (
                <View
                  key={item.item_id}
                  className={`bg-white rounded-2xl p-4 ${
                    index < items.length - 1 ? "mb-3" : ""
                  }`}
                >
                  {item.primary_image && (
                    <Image
                      source={{ uri: `${API_URL}${item.primary_image}` }}
                      className="w-full h-40 rounded-xl mb-3"
                    />
                  )}

                  <Text className="font-onest-semibold text-black/90 mb-1">
                    {item.experience_name}
                  </Text>

                  <View className="flex-row items-center mb-2">
                    <Ionicons name="time-outline" size={14} color="#6b7280" />
                    <Text className="text-sm text-black/60 font-onest ml-1">
                      {item.start_time} - {item.end_time}
                    </Text>
                  </View>

                  {item.destination_city && (
                    <View className="flex-row items-center mb-2">
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color="#6b7280"
                      />
                      <Text className="text-sm text-black/60 font-onest ml-1">
                        {item.destination_city}
                      </Text>
                    </View>
                  )}

                  {item.custom_note && (
                    <View className="mt-2 p-3 bg-gray-50 rounded-xl">
                      <Text className="text-sm text-black/70 font-onest">
                        {item.custom_note}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Note: Payment info is NOT shown to guides */}
        {!isGuide && itinerary.payments && itinerary.payments.length > 0 && (
          <View className="px-6 py-4 bg-white">
            <Text className="text-lg font-onest-semibold text-black/90 mb-2">
              Payment Information
            </Text>
            {/* Payment details here - only visible to owner */}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default GuideItineraryScreen;
