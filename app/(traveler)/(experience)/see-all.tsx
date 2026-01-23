// app/(experiences)/index.tsx

import API_URL from "@/constants/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Experience = {
  id: number;
  title: string;
  description: string;
  price: string;
  price_estimate: string;
  unit: string;
  destination_name: string;
  location: string;
  tags: string[];
  images: string[];
};

function asString(v: string | string[] | undefined) {
  if (!v) return "";
  return Array.isArray(v) ? v[0] : v;
}

export default function ExperiencesSeeAllScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    title?: string;
    filter?: string;
    location?: string;
    limit?: string;
    source?: string; // optional: "recentlyViewed"
  }>();

  const title = useMemo(() => asString(params.title) || "Experiences", [params.title]);
  const filter = useMemo(() => asString(params.filter), [params.filter]);
  const location = useMemo(() => asString(params.location), [params.location]);
  const source = useMemo(() => asString(params.source), [params.source]);

  const limit = useMemo(() => {
    const n = Number(asString(params.limit));
    return Number.isFinite(n) && n > 0 ? n : 50;
  }, [params.limit]);

  const [data, setData] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const emptyMessage = useMemo(() => {
    if (source === "recentlyViewed") return "You haven’t viewed any experiences yet.";
    if (filter === "today") return "No experiences scheduled for today";
    if (filter === "tomorrow")
      return location
        ? `No experiences available for tomorrow in ${location}`
        : "No experiences available for tomorrow";
    if (filter === "weekend") return "No weekend experiences available";
    if (filter === "popular") return "No popular experiences available";
    return "No experiences found";
  }, [filter, location, source]);

  const addToRecentlyViewed = async (experienceId: number) => {
    try {
      const viewed = await AsyncStorage.getItem("recentlyViewed");
      let viewedIds: number[] = viewed ? JSON.parse(viewed) : [];

      viewedIds = viewedIds.filter((id) => id !== experienceId);
      viewedIds.unshift(experienceId);
      viewedIds = viewedIds.slice(0, 20);

      await AsyncStorage.setItem("recentlyViewed", JSON.stringify(viewedIds));
    } catch (e) {
      console.error("Error saving recently viewed:", e);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      // Optional: support "Recently Viewed" via same screen
      if (source === "recentlyViewed") {
        const viewed = await AsyncStorage.getItem("recentlyViewed");
        const viewedIds: number[] = viewed ? JSON.parse(viewed) : [];
        if (!viewedIds.length) {
          setData([]);
          return;
        }
        const res = await axios.post(`${API_URL}/experience/by-ids`, {
          ids: viewedIds.slice(0, limit),
        });
        setData(res.data || []);
        return;
      }

      // Default: fetch by filter
      const url =
        filter === "tomorrow"
          ? `${API_URL}/experience/active?filter=${filter}&location=${encodeURIComponent(
            location
          )}&limit=${limit}`
          : `${API_URL}/experience/active?filter=${filter}&limit=${limit}`;

      const res = await axios.get(url);
      setData(res.data || []);
    } catch (e) {
      console.error("Error fetching experiences:", e);
      setData([]);
    }
  }, [filter, location, limit, source]);

  const load = useCallback(async () => {
    setLoading(true);
    await fetchData();
    setLoading(false);
  }, [fetchData]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const ExperienceRow = ({ item }: { item: Experience }) => {
    const priceNum =
      item.price != null && item.price !== "" ? Number(item.price) : null;

    return (
      <Pressable
        onPress={() => {
          addToRecentlyViewed(item.id);
          router.push(`/(experience)/${item.id}`);
        }}
        className="px-4 mb-4"
      >
        <View
          className="bg-white rounded-2xl overflow-hidden flex-row"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View className="w-28 h-28 bg-gray-100">
            {item.images && item.images.length > 0 ? (
              <Image
                source={{ uri: `${API_URL}/${item.images[0]}` }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full items-center justify-center">
                <Ionicons name="image-outline" size={28} color="#9CA3AF" />
              </View>
            )}
          </View>

          <View className="flex-1 p-4">
            <Text
              className="text-base font-onest-semibold text-black/90"
              numberOfLines={1}
            >
              {item.title}
            </Text>

            {(() => {
              if (priceNum != null && !Number.isNaN(priceNum) && priceNum > 0) {
                return (
                  <Text className="mt-1 text-black/70 font-onest text-sm">
                    From ₱{priceNum.toLocaleString()} {item.unit ? `/ person` : ""}
                  </Text>
                );
              }
              if (item.price_estimate) {
                return (
                  <Text className="mt-1 text-black/60 font-onest text-sm">
                    Around ₱{item.price_estimate}
                  </Text>
                );
              }
              return null;
            })()}

            {/* Optional: show location line */}
            {/* <Text className="mt-1 text-black/50 font-onest text-xs" numberOfLines={1}>
              {item.location}, {item.destination_name}
            </Text> */}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header (styled like your Account settings header) */}
      <View className="py-6 px-4">
        <View className="flex-row justify-between items-center mb-6">
          <Pressable
            className="flex flex-row items-baseline"
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#1f1f1f"
              style={{ marginRight: 12 }}
            />
            <View>
              <Text className="text-3xl font-onest-semibold text-gray-800">
                {title}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1f2937" />
          <Text className="mt-3 text-black/50 font-onest">
            Loading experiences...
          </Text>
        </View>
      ) : data.length > 0 ? (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <ExperienceRow item={item} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#1f2937"]}
              tintColor={"#1f2937"}
            />
          }
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="calendar-outline" size={36} color="#9CA3AF" />
          <Text className="mt-3 text-black/50 font-onest text-center">
            {emptyMessage}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
