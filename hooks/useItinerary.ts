import { Itinerary, ServiceAssignment } from "@/types/itineraryDetails";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import API_URL from "../constants/api";

interface GuideInfo {
  traveler_name: string;
  traveler_contact: string;
  traveler_profile_pic?: string;
  assignment_id: number;
  guide_fee: number;
  assignment_status: string;
  assigned_at: string;
}

interface ItineraryResponse {
  itinerary: Itinerary;
  payments?: any[];
  service_assignments?: ServiceAssignment[];
  access_level?: "owner" | "partner" | "guide" | "driver"; // ✅ allow what backend may return
  guide_info?: GuideInfo;
  currentActivity?: any;
}

export const useItinerary = (id: string | string[] | undefined) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [serviceAssignments, setServiceAssignments] = useState<ServiceAssignment[]>([]);
  const [accessLevel, setAccessLevel] = useState<
    "owner" | "partner" | "guide" | "driver" | null
  >(null);
  const [guideInfo, setGuideInfo] = useState<GuideInfo | null>(null);

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
        if (response.status === 403) {
          Alert.alert("Access Denied", "You don't have permission to view this itinerary");
          router.back();
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ItineraryResponse = await response.json();

      console.log("API Response:", data);
      console.log("Service Assignments from API:", data.service_assignments);

      // ✅ always use data.itinerary shape
      const baseItinerary: any = data.itinerary ?? (data as any).itinerary ?? (data as any);

      // ✅ keep ALL itinerary fields (including food_suggestions) + add payments
      const itineraryWithPayments: Itinerary = {
        ...baseItinerary,
        payments: data.payments ?? baseItinerary?.payments ?? [],
        // ✅ optional: ensure food_suggestions exists as array (won’t crash UI)
        food_suggestions: Array.isArray(baseItinerary?.food_suggestions)
          ? baseItinerary.food_suggestions
          : [],
      } as any;

      setItinerary(itineraryWithPayments);

      setServiceAssignments(Array.isArray(data.service_assignments) ? data.service_assignments : []);
      setAccessLevel((data.access_level as any) ?? null);

      if (data.guide_info) {
        setGuideInfo(data.guide_info);
      } else {
        setGuideInfo(null);
      }
    } catch (error) {
      console.error("Error fetching itinerary details:", error);
      Alert.alert("Error", "Failed to load itinerary details");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useFocusEffect(
    useCallback(() => {
      fetchItineraryDetails();
    }, [fetchItineraryDetails])
  );

  return {
    loading,
    itinerary,
    serviceAssignments,
    accessLevel,
    guideInfo,
    isOwner: accessLevel === "owner",
    isGuide: accessLevel === "guide",
    isDriver: accessLevel === "driver",
    isPartner: accessLevel === "partner" || accessLevel === "guide" || accessLevel === "driver",
    refetch: fetchItineraryDetails,
  };
};
