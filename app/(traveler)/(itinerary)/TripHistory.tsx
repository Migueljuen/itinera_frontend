import Calendar from "@/assets/icons/calendar.svg";
import API_URL from "@/constants/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Image,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ItineraryItem {
    item_id: number;
    experience_id: number;
    day_number: number;
    start_time: string;
    end_time: string;
    custom_note: string;
    created_at: string;
    updated_at: string;
    experience_name: string;
    experience_description: string;
    destination_name?: string;
    destination_city?: string;
    images?: string[];
    primary_image?: string;
}

interface Itinerary {
    itinerary_id: number;
    traveler_id: number;
    start_date: string;
    end_date: string;
    title: string;
    notes: string;
    created_at: string;
    status: "upcoming" | "ongoing" | "completed" | "pending";
    items: ItineraryItem[];
}

interface ApiResponse {
    itineraries: Itinerary[];
}

const ITEMS_PER_PAGE = 6;

export default function TripHistoryScreen() {
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [itineraries, setItineraries] = useState<Itinerary[]>([]);
    const [currentPage, setCurrentPage] = useState(1);

    useFocusEffect(
        React.useCallback(() => {
            fetchItineraries();
        }, [])
    );

    const fetchItineraries = async () => {
        try {
            const user = await AsyncStorage.getItem("user");
            const token = await AsyncStorage.getItem("token");

            if (!user || !token) {
                console.error("User or token not found");
                setInitialLoading(false);
                return;
            }

            const parsedUser = JSON.parse(user);
            const travelerId = parsedUser.user_id;

            const response = await fetch(
                `${API_URL}/itinerary/traveler/${travelerId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 404) {
                setItineraries([]);
                setInitialLoading(false);
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ApiResponse = await response.json();
            // Filter only completed trips
            const completedTrips = (data.itineraries || []).filter(
                (item) => item.status === "completed"
            );
            setItineraries(completedTrips);
        } catch (error) {
            console.error("Error fetching itineraries:", error);
            setItineraries([]);
        } finally {
            setInitialLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchItineraries();
            setCurrentPage(1);
        } finally {
            setRefreshing(false);
        }
    };

    // Pagination
    const totalPages = Math.ceil(itineraries.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedItineraries = itineraries.slice(startIndex, endIndex);

    const getPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push("...");
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push("...");
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push("...");
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push("...");
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const formatDateRange = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);

        const startMonth = start.toLocaleString("default", { month: "short" });
        const endMonth = end.toLocaleString("default", { month: "short" });
        const year = start.getFullYear();

        if (startMonth === endMonth) {
            return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${year}`;
        } else {
            return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${year}`;
        }
    };

    const getItineraryImage = (itinerary: Itinerary) => {
        if (itinerary.items && itinerary.items.length > 0) {
            const firstItem = itinerary.items[0];
            if (firstItem.primary_image) {
                return { uri: `${API_URL}${firstItem.primary_image}` };
            }
            if (firstItem.images && firstItem.images.length > 0) {
                return { uri: `${API_URL}${firstItem.images[0]}` };
            }
        }
        return require("../../../assets/images/balay.jpg");
    };

    const getExperiencesCount = (itinerary: Itinerary) => {
        if (!itinerary.items) return 0;
        const uniqueExperiences = new Set(
            itinerary.items.map((item) => item.experience_id)
        );
        return uniqueExperiences.size;
    };

    const getDaysCount = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    const renderEmptyState = () => {
        return (
            <View className="py-20 items-center px-6">
                <Ionicons name="earth-outline" size={64} color="#D1D5DB" />
                <Text className="text-center text-black/90 font-onest-semibold text-xl mt-6">
                    No trip memories yet
                </Text>
                <Text className="text-center text-black/50 px-8 mt-2 font-onest text-sm leading-5">
                    Your completed adventures will appear here as cherished memories
                </Text>
            </View>
        );
    };

    if (initialLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#1f2937" />
                <Text className="mt-4 text-black/50 font-onest">
                    Loading your memories...
                </Text>
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="w-full h-full">
                <ScrollView
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={["#1f2937"]}
                            tintColor={"#1f2937"}
                        />
                    }
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Section */}
                    <View className="px-6 pt-6 pb-4">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="mb-4 flex-row items-center"
                        >
                            <Ionicons name="chevron-back" size={24} color="#1f2937" />
                            <Text className="text-base font-onest-medium text-black/90 ml-1">
                                Back
                            </Text>
                        </TouchableOpacity>

                        <Text className="text-3xl font-onest-semibold text-normal">
                            Trip History
                        </Text>
                        <Text className="text-black/40 font-onest">
                            {itineraries.length} completed{" "}
                            {itineraries.length === 1 ? "adventure" : "adventures"}
                        </Text>
                    </View>

                    {/* Completed Trips List */}
                    <View className="px-6">
                        {itineraries.length === 0 ? (
                            renderEmptyState()
                        ) : (
                            <>
                                {paginatedItineraries.map((itinerary) => (
                                    <TouchableOpacity
                                        key={itinerary.itinerary_id}
                                        onPress={() =>
                                            router.push(`/(itinerary)/${itinerary.itinerary_id}`)
                                        }
                                        className="mb-6"
                                    >
                                        <View className="relative">
                                            <Image
                                                source={getItineraryImage(itinerary)}
                                                className="w-full h-52 rounded-xl"
                                                resizeMode="cover"
                                            />
                                            {/* Subtle overlay to indicate completed */}
                                            <View className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                                <Text className="text-white text-xs font-onest-medium">
                                                    ✓ Completed
                                                </Text>
                                            </View>
                                        </View>

                                        <View className="pt-4">
                                            <Text className="text-lg font-onest-medium text-black/90 mb-2">
                                                {itinerary.title}
                                            </Text>

                                            <View className="flex-row items-center mb-3">
                                                <Calendar />
                                                <Text className="text-sm text-black/70 font-onest ml-2">
                                                    {formatDateRange(
                                                        itinerary.start_date,
                                                        itinerary.end_date
                                                    )}
                                                </Text>
                                            </View>

                                            {/* Trip stats */}
                                            <View className="pt-3 mt-3 border-t border-gray-100">
                                                <View className="flex-row justify-between items-center">
                                                    <View className="flex-row items-center">
                                                        <Text className="text-sm text-black/50 font-onest mr-4">
                                                            {getDaysCount(
                                                                itinerary.start_date,
                                                                itinerary.end_date
                                                            )}{" "}
                                                            {getDaysCount(
                                                                itinerary.start_date,
                                                                itinerary.end_date
                                                            ) === 1
                                                                ? "day"
                                                                : "days"}
                                                        </Text>
                                                        <Text className="text-sm text-black/50 font-onest">
                                                            {getExperiencesCount(itinerary)}{" "}
                                                            {getExperiencesCount(itinerary) !== 1
                                                                ? "activities"
                                                                : "activity"}
                                                        </Text>
                                                    </View>
                                                    <Text className="text-sm text-primary font-onest-medium">
                                                        View memories →
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))}

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <View className="mt-6 mb-4">
                                        <Text className="text-center text-black/50 text-sm mb-4 font-onest">
                                            Showing {startIndex + 1}-
                                            {Math.min(endIndex, itineraries.length)} of{" "}
                                            {itineraries.length} trips
                                        </Text>

                                        <View className="flex-row justify-center items-center">
                                            <TouchableOpacity
                                                onPress={() =>
                                                    setCurrentPage((prev) => Math.max(1, prev - 1))
                                                }
                                                disabled={currentPage === 1}
                                                className={`px-3 py-2 mr-2 rounded-xl ${currentPage === 1 ? "bg-gray-100" : "bg-black/90"
                                                    }`}
                                            >
                                                <Ionicons
                                                    name="chevron-back"
                                                    size={20}
                                                    color={currentPage === 1 ? "#9CA3AF" : "#FFFFFF"}
                                                />
                                            </TouchableOpacity>

                                            {getPageNumbers().map((page, index) => (
                                                <TouchableOpacity
                                                    key={index}
                                                    onPress={() =>
                                                        typeof page === "number" && setCurrentPage(page)
                                                    }
                                                    disabled={page === "..."}
                                                    className={`px-3 py-2 mx-1 rounded-xl ${page === currentPage
                                                            ? "bg-primary"
                                                            : page === "..."
                                                                ? "bg-transparent"
                                                                : "bg-gray-50"
                                                        }`}
                                                >
                                                    <Text
                                                        className={`font-onest-medium ${page === currentPage
                                                                ? "text-white"
                                                                : page === "..."
                                                                    ? "text-black/30"
                                                                    : "text-black/80"
                                                            }`}
                                                    >
                                                        {page}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}

                                            <TouchableOpacity
                                                onPress={() =>
                                                    setCurrentPage((prev) =>
                                                        Math.min(totalPages, prev + 1)
                                                    )
                                                }
                                                disabled={currentPage === totalPages}
                                                className={`px-3 py-2 ml-2 rounded-xl ${currentPage === totalPages
                                                        ? "bg-gray-100"
                                                        : "bg-black/90"
                                                    }`}
                                            >
                                                <Ionicons
                                                    name="chevron-forward"
                                                    size={20}
                                                    color={
                                                        currentPage === totalPages ? "#9CA3AF" : "#FFFFFF"
                                                    }
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}