import AnimatedHeartButton from "@/components/SaveButton";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

// Itinerary context type (from useItineraryItem hook)
type ItineraryContext = {
    item_id: number;
    day_number: number;
    start_time: string;
    end_time: string;
    custom_note: string | null;
    itinerary: {
        id: number;
        title: string;
        start_date: string;
        end_date: string;
        status: string;
    };
};

type FloatingActionsProps = {
    price: string;
    unit: string;
    isSaved: boolean;
    onSavePress: () => void;
    onCalendarPress: () => void;
    // NEW: Optional itinerary context for when viewing from itinerary
    itineraryContext?: ItineraryContext | null;
};

export const FloatingActions: React.FC<FloatingActionsProps> = ({
    price,
    unit,
    isSaved,
    onSavePress,
    onCalendarPress,
    itineraryContext,
}) => {
    const router = useRouter();
    const isFromItinerary = !!itineraryContext;

    // Format time helper
    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(":");
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    // Get formatted date for itinerary
    const getFormattedDate = () => {
        if (!itineraryContext) return "";
        const start = new Date(itineraryContext.itinerary.start_date);
        start.setDate(start.getDate() + itineraryContext.day_number - 1);
        return start.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    return (
        <>
            {/* Back Button - Top Left */}
            <Pressable
                onPress={() => router.back()}
                style={{
                    position: "absolute",
                    top: 50,
                    left: 24,
                    zIndex: 1000,
                    padding: 8,
                    backgroundColor: "rgba(0,0,0,0.3)",
                    borderRadius: 999,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 5,
                }}
            >
                <Ionicons name="arrow-back" size={24} color="#fff" />
            </Pressable>

            {/* Save Button - Top Right */}
            <View
                style={{
                    position: "absolute",
                    top: 50,
                    right: 24,
                    zIndex: 1000,
                    padding: 8,
                    backgroundColor: "rgba(0,0,0,0.3)",
                    borderRadius: 999,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 5,
                }}
            >
                <AnimatedHeartButton isSaved={isSaved} onPress={onSavePress} size={24} />
            </View>

            {/* Bottom Bar */}
            <View
                className="flex flex-row items-center justify-between"
                style={{
                    position: "absolute",
                    bottom: 50,
                    left: 24,
                    right: 24,
                    zIndex: 1000,
                    padding: 24,
                    backgroundColor: "#fff",
                    borderRadius: 999,
                    shadowColor: "#000000a0",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 5,
                }}
            >
                {isFromItinerary ? (
                    // Show scheduled time and date when viewing from itinerary
                    <View className="flex-row items-center flex-1">

                        <View className="">
                            <Text className="font-onest-semibold text-base text-black/90">
                                {formatTime(itineraryContext.start_time)} - {formatTime(itineraryContext.end_time)}
                            </Text>
                            <Text className="text-black/50 font-onest text-sm">
                                {getFormattedDate()} · Day {itineraryContext.day_number}
                            </Text>
                        </View>
                    </View>
                ) : (
                    // Show price when browsing normally
                    <Text className="font-onest-medium text-lg text-black/90">
                        Starts at ₱{price}{" "}
                        <Text className="text-black/60 font-onest text-base">/ {unit}</Text>
                    </Text>
                )}

                <Pressable onPress={onCalendarPress}>
                    <Ionicons
                        name={isFromItinerary ? "calendar" : "calendar"}
                        size={24}
                        color="#4F46E5"
                    />
                </Pressable>
            </View>
        </>
    );
};

export default FloatingActions;