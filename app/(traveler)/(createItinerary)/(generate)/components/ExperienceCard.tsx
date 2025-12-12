// components/ExperienceCard.tsx
import { ItineraryItem } from "@/types/itineraryTypes";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import API_URL from "../../../../../constants/api";
// Helpers
const formatTime = (time?: string) => {
  if (!time) return "";
  const d = new Date(`1970-01-01T${time}`);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

interface ExperienceCardProps {
  item: ItineraryItem;
  isPreview: boolean;
  onRemove: () => void;
  travelerCount?: number;
}

const ExperienceCard: React.FC<ExperienceCardProps> = ({
  item,
  isPreview,
  onRemove,
  travelerCount = 1,
}) => {
  const router = useRouter();
  const handleCardPress = () => {
    // Navigate with modal presentation
    router.push({
      pathname: `../(experience)/${item.experience_id}`,
      params: {
        // Pass any needed data
        fromItinerary: "true",
        experienceId: item.experience_id,
      },
    });
  };

  const isPricedPerPerson =
    item.unit?.toLowerCase() === "entry" ||
    item.unit?.toLowerCase() === "person";

  const displayPrice =
    isPricedPerPerson && travelerCount > 1
      ? (item.price || 0) * travelerCount
      : item.price || 0;

  return (
    <TouchableOpacity
      onPress={handleCardPress}
      className="bg-white rounded-2xl"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 2, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 5,
      }}
    >
      {/* Image */}
      <View className="relative h-72 overflow-hidden">
        {item.primary_image ? (
          <Image
            source={{ uri: `${API_URL}/${item.primary_image}` }}
            className="w-full h-72 absolute rounded-2xl"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-72 bg-gray-200 items-center justify-center absolute">
            <Ionicons name="image-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-400 font-onest text-sm mt-2">
              No image available
            </Text>
          </View>
        )}

        {/* Gradient Overlay */}
        <LinearGradient
          colors={[
            "rgba(0, 0, 0, 0.0)",
            "rgba(0, 0, 0, 0.3)",
            "rgba(0, 0, 0, 0.7)",
          ]}
          style={{ position: "absolute", inset: 0 }}
          pointerEvents="none"
        />

        {/* Title + Location */}
        <View className="absolute bottom-0 left-0 right-0 p-4">
          <Text className="font-onest-semibold text-lg text-white/90 mb-1">
            {item.experience_name || "Not Available"}
          </Text>

          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={14} color="#fff" />
            <Text className="text-white/90 font-onest text-sm ml-1">
              {item.destination_name}
            </Text>
          </View>
        </View>

        {/* Remove button (Preview mode only) */}
        {isPreview && (
          <View className="absolute top-4 right-4">
            <TouchableOpacity
              onPress={onRemove}
              className="p-1.5 rounded-full bg-white/80 "
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color="#1a1a1a" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Content */}
      <View className="p-4 pb-6">
        {/* Time + Price */}
        <View className="flex-row justify-between items-baseline my-2">
          <Text className="font-onest-bold text-black/80">
            {formatTime(item.start_time)} - {formatTime(item.end_time)}
          </Text>

          {/* Price */}
          {item.price && item.price > 0 && (
            <View className="items-end">
              <Text className="font-onest-bold text-gray-900">
                ₱{displayPrice.toLocaleString()}
              </Text>

              {isPricedPerPerson && travelerCount > 1 ? (
                <Text className="text-gray-500 font-onest text-xs">
                  ₱{item.price.toLocaleString()} × {travelerCount}{" "}
                  {travelerCount > 1 ? "people" : "person"}
                </Text>
              ) : (
                item.unit && (
                  <Text className="text-black/40 font-onest text-xs">
                    {item.unit}
                  </Text>
                )
              )}
            </View>
          )}
        </View>

        {/* Description */}
        {item.experience_description && (
          <Text
            numberOfLines={2}
            className="text-black/60 font-onest text-sm mb-2"
          >
            {item.experience_description}
          </Text>
        )}

        {/* Notes */}
        {item.experience_notes && (
          <View className="bg-blue-50 rounded-lg p-2 mt-2">
            <Text className="text-blue-800 font-onest text-xs">
              {item.experience_notes}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ExperienceCard;
