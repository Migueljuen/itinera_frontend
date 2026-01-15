// // hooks/useItinerary.ts - FIXED VERSION

// import { Itinerary } from "@/types/itineraryDetails";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useFocusEffect } from "@react-navigation/native";
// import { useRouter } from "expo-router";
// import { useCallback, useState } from "react";
// import { Alert } from "react-native";
// import API_URL from "../constants/api";

// export const useItinerary = (id: string | string[] | undefined) => {
//   const router = useRouter();
//   const [loading, setLoading] = useState(true);
//   const [itinerary, setItinerary] = useState<Itinerary | null>(null);

//   const fetchItineraryDetails = useCallback(async () => {
//     if (!id) return;

//     setLoading(true);
//     try {
//       const token = await AsyncStorage.getItem("token");
//       if (!token) {
//         Alert.alert("Error", "Authentication token not found");
//         router.back();
//         return;
//       }

//       const response = await fetch(`${API_URL}/itinerary/${id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
//       const itineraryWithPayments = {
//         ...(data.itinerary || data),
//         payments: data.payments || [],
//       };

//       setItinerary(itineraryWithPayments);
//     } catch (error) {
//       console.error("Error fetching itinerary details:", error);
//       Alert.alert("Error", "Failed to load itinerary details");
//     } finally {
//       setLoading(false);
//     }
//   }, [id, router]);

//   useFocusEffect(
//     useCallback(() => {
//       fetchItineraryDetails();
//     }, [fetchItineraryDetails])
//   );

//   return { loading, itinerary, refetch: fetchItineraryDetails };
// };

// hooks/useItinerary.ts - With Role-Based Access Control

import { Itinerary } from "@/types/itineraryDetails";
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
  payments: any[];
  access_level: "owner" | "guide";
  guide_info?: GuideInfo;
  currentActivity?: any;
}

export const useItinerary = (id: string | string[] | undefined) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [accessLevel, setAccessLevel] = useState<"owner" | "guide" | null>(
    null
  );
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
          Alert.alert(
            "Access Denied",
            "You don't have permission to view this itinerary"
          );
          router.back();
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ItineraryResponse = await response.json();

      const itineraryWithPayments = {
        ...(data.itinerary || data),
        payments: data.payments || [],
      };

      setItinerary(itineraryWithPayments);
      setAccessLevel(data.access_level);

      // Set guide info if available
      if (data.guide_info) {
        setGuideInfo(data.guide_info);
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
    accessLevel,
    guideInfo,
    isOwner: accessLevel === "owner",
    isGuide: accessLevel === "guide",
    refetch: fetchItineraryDetails,
  };
};
