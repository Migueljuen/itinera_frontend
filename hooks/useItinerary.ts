// hooks/useItinerary.ts - FIXED VERSION

import { Itinerary } from "@/types/itineraryDetails";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import API_URL from "../constants/api";

export const useItinerary = (id: string | string[] | undefined) => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [itinerary, setItinerary] = useState<Itinerary | null>(null);

    const fetchItineraryDetails = useCallback(async () => {
        if (!id) return;

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Error", "Authentication token not found");
                router.back();
                return;
            }

            const response = await fetch(`${API_URL}/itinerary/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const itineraryWithPayments = {
                ...(data.itinerary || data),
                payments: data.payments || [],
            };

            setItinerary(itineraryWithPayments);
        } catch (error) {
            console.error("Error fetching itinerary details:", error);
            Alert.alert("Error", "Failed to load itinerary details");
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    // ✅ FIX: Refetch data whenever the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchItineraryDetails();
        }, [fetchItineraryDetails])
    );

    return { loading, itinerary, refetch: fetchItineraryDetails };
};