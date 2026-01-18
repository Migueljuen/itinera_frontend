
import socketService from "@/services/socket";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,

  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Adjustment from "../../../assets/icons/adjustment.svg";
import API_URL from "../../../constants/api";
import { useRefresh } from "../../../contexts/RefreshContext";

type Experience = {
  id: number;
  title: string;
  description: string;
  price: string;
  unit: string;
  destination_name: string;
  location: string;
  tags: string[];
  images: string[];
};

interface Conversation {
  id: number;
  unreadCount: number;
}

const App = () => {
  const router = useRouter();
  const { profileUpdated } = useRefresh();
  const [refreshing, setRefreshing] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [firstName, setFirstName] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState("Silay"); // Default or from user profile

  // Section states
  const [recentlyViewed, setRecentlyViewed] = useState<Experience[]>([]);
  const [weekendExperiences, setWeekendExperiences] = useState<Experience[]>([]);
  const [tomorrowExperiences, setTomorrowExperiences] = useState<Experience[]>([]);
  const [popularExperiences, setPopularExperiences] = useState<Experience[]>([]);
  const [todayExperiences, setTodayExperiences] = useState<Experience[]>([]);

  // Unread messages state
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // ============ USER DATA ============
  const fetchUserData = async () => {
    try {
      const user = await AsyncStorage.getItem("user");
      if (user) {
        const parsedUser = JSON.parse(user);
        setFirstName(parsedUser.first_name);
        setProfilePic(parsedUser.profile_pic);
        setCurrentUserId(parsedUser.user_id);
        // If user has a location saved, use it
        if (parsedUser.city) {
          setUserLocation(parsedUser.city);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  // ============ UNREAD COUNT ============
  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(`${API_URL}/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const conversations: Conversation[] = response.data.data;
        const total = conversations.reduce(
          (sum, conv) => sum + (conv.unreadCount || 0),
          0
        );
        setTotalUnreadMessages(total);
        conversations.forEach((conv) => {
          socketService.joinConversation(conv.id);
        });
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, []);

  // ============ RECENTLY VIEWED ============
  const fetchRecentlyViewed = async () => {
    try {
      const viewed = await AsyncStorage.getItem("recentlyViewed");
      if (viewed) {
        const viewedIds: number[] = JSON.parse(viewed);
        if (viewedIds.length > 0) {
          const response = await axios.post(`${API_URL}/experience/by-ids`, {
            ids: viewedIds.slice(0, 10),
          });
          setRecentlyViewed(response.data);
        }
      }
    } catch (error) {
      console.error("Error fetching recently viewed:", error);
    }
  };

  // Save to recently viewed when navigating to experience
  const addToRecentlyViewed = async (experienceId: number) => {
    try {
      const viewed = await AsyncStorage.getItem("recentlyViewed");
      let viewedIds: number[] = viewed ? JSON.parse(viewed) : [];

      // Remove if already exists (to move to front)
      viewedIds = viewedIds.filter((id) => id !== experienceId);

      // Add to front
      viewedIds.unshift(experienceId);

      // Keep only last 20
      viewedIds = viewedIds.slice(0, 20);

      await AsyncStorage.setItem("recentlyViewed", JSON.stringify(viewedIds));
    } catch (error) {
      console.error("Error saving recently viewed:", error);
    }
  };

  // ============ SECTION FETCHERS ============
  const fetchWeekendExperiences = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/experience/active?filter=weekend&limit=10`
      );
      setWeekendExperiences(response.data);
    } catch (error) {
      console.error("Error fetching weekend experiences:", error);
    }
  };

  const fetchTomorrowExperiences = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/experience/active?filter=tomorrow&location=${userLocation}&limit=10`
      );
      setTomorrowExperiences(response.data);
    } catch (error) {
      console.error("Error fetching tomorrow experiences:", error);
    }
  };

  const fetchTodayExperiences = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/experience/active?filter=today&limit=10`
      );
      setTodayExperiences(response.data);
    } catch (error) {
      console.error("Error fetching today experiences:", error);
    }
  };

  const fetchPopularExperiences = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/experience/active?filter=popular&limit=10`
      );
      setPopularExperiences(response.data);
    } catch (error) {
      console.error("Error fetching popular experiences:", error);
    }
  };

  // ============ LOAD ALL DATA ============
  const loadAllSections = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUserData(),
        fetchRecentlyViewed(),
        fetchWeekendExperiences(),
        fetchTomorrowExperiences(),
        fetchTodayExperiences(),
        fetchPopularExperiences(),
        fetchUnreadCount(),
      ]);
    } catch (error) {
      console.error("Error loading sections:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllSections();
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [profileUpdated]);

  // Refetch tomorrow experiences when user location changes
  useEffect(() => {
    if (!loading) {
      fetchTomorrowExperiences();
    }
  }, [userLocation]);

  // Socket setup
  useEffect(() => {
    const setupSocket = async () => {
      await socketService.connect();
    };
    setupSocket();
  }, []);

  // Listen for new messages
  useFocusEffect(
    useCallback(() => {
      if (!currentUserId) return;

      const handleNewMessage = (message: { senderId: number }) => {
        if (message.senderId !== currentUserId) {
          setTotalUnreadMessages((prev) => prev + 1);
        }
      };

      socketService.onNewMessage(handleNewMessage);
      return () => {
        socketService.offNewMessage1(handleNewMessage);
      };
    }, [currentUserId])
  );

  // Fetch unread count on focus
  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
    }, [fetchUnreadCount])
  );
  useEffect(() => {
    fetchRecentlyViewed();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllSections();
    setRefreshing(false);
  };

  // ============ EXPERIENCE CARD COMPONENT ============
  const ExperienceCard = ({ item }: { item: Experience }) => (
    <Pressable
      onPress={() => {
        addToRecentlyViewed(item.id);
        router.push(`/(experience)/${item.id}`);
      }}

      className="mr-4 "
      style={{ width: 240 }}
    >
      <View
        className=" "
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <View className="h-48 rounded-2xl overflow-hidden">
          {item.images && item.images.length > 0 ? (
            <Image
              source={{ uri: `${API_URL}/${item.images[0]}` }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full bg-gray-200 items-center justify-center">
              <Ionicons name="image-outline" size={40} color="#9CA3AF" />
            </View>
          )}

        </View>

        <View className="py-3">
          <Text
            className="font-onest-semibold text-base text-black/90"
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <View className="flex-row items-center mt-1">

            <Text
              className="text-black/60 font-onest text-sm "
              numberOfLines={1}
            >
              {item.location}, {item.destination_name}
            </Text>
          </View>
          {item.price && item.price !== "0" && (
            <Text className="text-black/60 font-onest text-sm mt-2">
              From ₱{parseFloat(item.price).toLocaleString()}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );

  // ============ SECTION COMPONENT ============
  const Section = ({
    title,
    data,
    onSeeAll,
    emptyMessage,
  }: {
    title: string;
    data: Experience[];
    onSeeAll?: () => void;
    emptyMessage?: string;
  }) => {
    // Don't render section if no data and no empty message
    if (data.length === 0 && !emptyMessage) return null;

    return (
      <View className="mt-6">
        <View className="flex-row justify-between items-center px-6 mb-4">
          <Text className="text-xl font-onest-semibold text-black/90">
            {title}
          </Text>
          {onSeeAll && data.length > 0 && (
            <Pressable onPress={onSeeAll}>
              <Text className="text-primary font-onest-medium">See all</Text>
            </Pressable>
          )}
        </View>

        {data.length > 0 ? (
          <FlatList
            horizontal
            data={data}
            renderItem={({ item }) => <ExperienceCard item={item} />}
            keyExtractor={(item) => item.id.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
          />
        ) : (
          <View className="px-6">
            <View className="rounded-xl p-6 items-center">
              <Ionicons name="calendar-outline" size={32} color="#9CA3AF" />
              <Text className="text-black/50 font-onest mt-2 text-center">
                {emptyMessage}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  // ============ LOADING STATE ============
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#1f2937" />
        <Text className="mt-4 text-black/50 font-onest">
          Loading experiences...
        </Text>
      </View>
    );
  }

  // ============ MAIN RENDER ============
  return (
    <SafeAreaView className="bg-[#fff] flex-1">
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#1f2937"]}
            tintColor={"#1f2937"}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between p-6">
          <View>
            <Text className="text-3xl font-onest-semibold text-black/90">
              Hello, {firstName}
            </Text>
            <Text className="text-black/50 font-onest">Welcome to Itinera</Text>
          </View>

          <Pressable
            onPress={() => router.push(`/(conversations)`)}
            className="bg-gray-100 p-3 rounded-full relative"
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={24}
              color="#1f2937"
            />
            {totalUnreadMessages > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1">
                <Text className="text-white text-xs font-onest-semibold">
                  {totalUnreadMessages > 9 ? "9+" : totalUnreadMessages}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Search Bar */}
        <Pressable
          onPress={() => router.push("/(search)")}

          className="flex-row items-center mx-6 p-4 bg-white rounded-xl"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Image
            source={require("../../../assets/images/search.png")}
            className="w-5 h-5 mr-3 opacity-60"
            resizeMode="contain"
          />
          <Text className="flex-1 text-base text-black/50 font-onest">
            Search activities
          </Text>
          <Adjustment className="w-5 h-5 mr-3 opacity-60" />
        </Pressable>

        {/* Recently Viewed - Only show if user has viewed experiences */}
        {recentlyViewed.length > 0 && (
          <Section
            title="Recently Viewed"
            data={recentlyViewed}
            onSeeAll={() => router.push("/(recently-viewed)")}
          />
        )}

        {/* Happening Today */}
        <Section
          title="Happening Today"
          data={todayExperiences}
          onSeeAll={() => router.push("/(experiences)?filter=today")}
          emptyMessage="No experiences scheduled for today"
        />

        {/* Tomorrow in [Location] */}
        <Section
          title={`Tomorrow in ${userLocation}`}
          data={tomorrowExperiences}
          onSeeAll={() =>
            router.push(`/(experiences)?filter=tomorrow&location=${userLocation}`)
          }
        />

        {/* This Weekend */}
        <Section
          title="This Weekend"
          data={weekendExperiences}
          onSeeAll={() => router.push("/(experiences)?filter=weekend")}
          emptyMessage="No weekend experiences available"
        />

        {/* Popular Experiences */}
        <Section
          title="Popular Experiences"
          data={popularExperiences}
          onSeeAll={() => router.push("/(experiences)?filter=popular")}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default App;