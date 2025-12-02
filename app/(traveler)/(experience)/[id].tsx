import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AvailabilityCalendar from "../../../components/AvailablityCalendar";
import ReviewsSection, { Review } from "../../../components/ReviewsSection";
import AnimatedHeartButton from "../../../components/SaveButton";
import API_URL from "../../../constants/api";
import { useAuth } from "../../../contexts/AuthContext";
import { ItineraryItem } from "../../../types/itineraryTypes";

type Experience = {
  id: number;
  title: string;
  description: string;
  notes: string;
  price: string;
  unit: string;
  destination_name: string;
  location: string;
  tags: string[];
  images: Array<{
    image_id: number;
    image_url: string;
    experience_id: number;
  }>;
  is_saved?: boolean;
  destination: {
    destination_id: number;
    name: string;
    city: string;
    longitude: number;
    latitude: number;
    description: string;
  };
};

export default function ExperienceDetail() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    id,
    tripStartDate: paramTripStart,
    tripEndDate: paramTripEnd,
  } = useLocalSearchParams();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const screenWidth = Dimensions.get("window").width;
  const fullscreenFlatListRef = useRef<FlatList>(null);
  const experienceId = Number(id);
  const [reviews, setReviews] = useState<Review[]>([]);


  const [experience, setExperience] = useState<Experience | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [isSaved, setIsSaved] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const imageScale = scrollY.interpolate({
    inputRange: [-150, 0],
    outputRange: [1.5, 1],
    extrapolate: "clamp",
  });

  const imageTranslateY = scrollY.interpolate({
    inputRange: [-150, 0, 150],
    outputRange: [-50, 0, -75],
    extrapolate: "clamp",
  });

  const dummyReviews: Review[] = [
    {
      id: 1,
      userName: "Maria Santos",
      rating: 5,
      comment:
        "Amazing experience! The guide was very knowledgeable and friendly. The views were breathtaking and worth every peso. Highly recommend this to anyone visiting the area!",
      date: "2025-06-15",
      helpful: 12,
    },
    {
      id: 2,
      userName: "John Chen",
      rating: 4,
      comment:
        "Great tour overall. The location is beautiful and the activities were fun. Only minor issue was the timing - we felt a bit rushed at some spots. Still, would definitely recommend!",
      date: "2025-06-10",
      helpful: 8,
    },
    {
      id: 3,
      userName: "Ana Reyes",
      rating: 5,
      comment:
        "Perfect day out! Everything was well organized from start to finish. The local insights shared by our guide made the experience even more special. Don't forget to bring your camera!",
      date: "2025-06-05",
      helpful: 15,
    },
    {
      id: 4,
      userName: "Robert Garcia",
      rating: 3,
      comment:
        "The experience itself was good but felt overpriced for what was offered. The location is nice but can get very crowded. Better to go early in the morning if possible.",
      date: "2025-05-28",
      helpful: 5,
    },
    {
      id: 5,
      userName: "Lisa Fernandez",
      rating: 5,
      comment:
        "Absolutely loved it! This was the highlight of our trip. The staff went above and beyond to make sure everyone had a great time. Worth every penny!",
      date: "2025-05-20",
      helpful: 20,
    },
  ];

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(
          `${API_URL}/reviews/experience/${experienceId}`
        );

        const data = await response.json();

        if (data.success && data.reviews.length > 0) {
          const mapped = data.reviews.map((r: any) => ({
            id: r.review_id,
            userName: r.user_name,
            userAvatar: r.profile_pic,
            rating: r.rating,
            comment: r.comment,
            date: r.created_at,
            helpful: r.helpful_count,
          }));

          setReviews(mapped);
        } else {
          // fallback to dummy data
          setReviews(dummyReviews);
        }
      } catch (err) {
        console.log("Error fetching reviews:", err);
        setReviews(dummyReviews); // fallback
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [experienceId]);

  const getCurrentDateString = () => new Date().toISOString().split("T")[0];
  const getNextWeekDateString = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split("T")[0];
  };

  const [tripStartDate, setTripStartDate] = useState<string>(
    (paramTripStart as string) || getCurrentDateString()
  );
  const [tripEndDate, setTripEndDate] = useState<string>(
    (paramTripEnd as string) || getNextWeekDateString()
  );
  const [selectedItems, setSelectedItems] = useState<ItineraryItem[]>([]);

  useEffect(() => {
    const fetchExperience = async () => {
      try {
        const response = await fetch(`${API_URL}/experience/${experienceId}`);
        const data = await response.json();
        setExperience(data);

        let userId = user?.user_id;

        if (!userId) {
          const userData = await AsyncStorage.getItem("user");
          if (userData) {
            try {
              const userObj = JSON.parse(userData);
              userId = userObj.user_id;
            } catch (e) {
              console.error("Error parsing user data:", e);
            }
          }
        }

        if (userId) {
          const savedResponse = await fetch(
            `${API_URL}/saved-experiences/check/${experienceId}?user_id=${userId}`
          );
          if (savedResponse.ok) {
            const savedData = await savedResponse.json();
            setIsSaved(savedData.isSaved);
          }
        }
      } catch (error) {
        console.error("Error fetching experience data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExperience();
  }, [experienceId, user]);

  const handleSaveForLater = async () => {
    try {
      let userId = user?.user_id;

      if (!userId) {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          try {
            const userObj = JSON.parse(userData);
            userId = userObj.user_id;
          } catch (e) {
            console.error("Error parsing user data:", e);
          }
        }
      }

      if (!userId) {
        Alert.alert(
          "Authentication Required",
          "Please login to save experiences"
        );
        return;
      }

      const response = await fetch(`${API_URL}/saved-experiences/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          experience_id: experienceId,
          user_id: userId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsSaved(data.action === "saved");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update saved status");
      }
    } catch (error) {
      console.error("Error saving experience:", error);
      Alert.alert(
        "Error",
        "Failed to save experience. Please check your connection."
      );
    }
  };

  const handleOpenMap = async () => {
    if (!experience?.destination) {
      Alert.alert("Error", "Location not available");
      return;
    }

    const { latitude, longitude, name } = experience.destination;
    const label = encodeURIComponent(`${experience.title} - ${name}`);

    let url = "";

    if (Platform.OS === "ios") {
      url = `maps:0,0?q=${label}@${latitude},${longitude}`;
    } else {
      url = `geo:0,0?q=${latitude},${longitude}(${label})`;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&query_place_id=${label}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error("Error opening map:", error);
      Alert.alert("Error", "Unable to open map application");
    }
  };

  const handleTimeSlotSelect = (item: ItineraryItem) => {
    setSelectedItems((prev) => [...prev, item]);
  };

  const handleTimeSlotDeselect = (item: ItineraryItem) => {
    setSelectedItems((prev) =>
      prev.filter(
        (selected) =>
          !(
            selected.experience_id === item.experience_id &&
            selected.day_number === item.day_number &&
            selected.start_time === item.start_time &&
            selected.end_time === item.end_time
          )
      )
    );
  };

  const getFormattedImageUrl = (imageUrl: string) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith("http")) {
      return imageUrl;
    }
    const formattedPath = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
    return `${API_URL}${formattedPath}`;
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#1f2937" />
        <Text className="mt-4 text-gray-600 font-onest">
          Loading experience...
        </Text>
      </SafeAreaView>
    );
  }

  if (!experience) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text className="text-red-500 font-onest-medium text-lg mt-4">
          Experience not found
        </Text>
        <Text className="text-gray-400 font-onest text-center mt-2 px-8">
          The experience you're looking for doesn't exist or has been removed.
        </Text>
        <TouchableOpacity
          className="mt-6 bg-primary rounded-full px-8 py-3"
          onPress={() => router.back()}
        >
          <Text className="text-white font-onest-medium">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        bounces={true}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* Hero Image Carousel */}
        {experience.images && experience.images.length > 0 && !imageError ? (
          <>
            <Animated.View
              style={{
                height: 320,
                overflow: "hidden",
              }}
            >
              <FlatList
                data={experience.images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(event) => {
                  const { contentOffset, layoutMeasurement } =
                    event.nativeEvent;
                  const index = Math.round(
                    contentOffset.x / layoutMeasurement.width
                  );
                  setActiveImageIndex(index);
                }}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setIsFullscreen(true)}
                  >
                    <Animated.Image
                      source={{
                        uri: getFormattedImageUrl(item.image_url)!,
                      }}
                      style={{
                        width: screenWidth,
                        height: 320,
                        transform: [
                          { translateY: imageTranslateY },
                          { scale: imageScale },
                        ],
                      }}
                      resizeMode="cover"
                      onError={() => setImageError(true)}
                    />
                  </TouchableOpacity>
                )}
              />

              {/* Image Indicators */}
              {experience.images.length > 1 && (
                <View
                  style={{
                    position: "absolute",
                    bottom: 32,
                    left: 0,
                    right: 0,
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {experience.images.map((_, index) => (
                    <View
                      key={index}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor:
                          index === activeImageIndex
                            ? "#FFFFFF"
                            : "rgba(255, 255, 255, 0.5)",
                      }}
                    />
                  ))}
                </View>
              )}
            </Animated.View>

            {/* Fullscreen Modal */}
            <Modal
              visible={isFullscreen}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setIsFullscreen(false)}
            >
              <View style={{ flex: 1, backgroundColor: "black" }}>
                <TouchableOpacity
                  style={{
                    position: "absolute",
                    top: 50,
                    right: 20,
                    zIndex: 10,
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    borderRadius: 20,
                    padding: 8,
                  }}
                  onPress={() => setIsFullscreen(false)}
                >
                  <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>

                <FlatList
                  ref={fullscreenFlatListRef}
                  data={experience.images}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onLayout={() => {
                    // Scroll to the active image after layout is complete
                    if (activeImageIndex > 0 && fullscreenFlatListRef.current) {
                      setTimeout(() => {
                        fullscreenFlatListRef.current?.scrollToOffset({
                          offset: screenWidth * activeImageIndex,
                          animated: false,
                        });
                      }, 50);
                    }
                  }}
                  onScroll={(event) => {
                    const index = Math.round(
                      event.nativeEvent.contentOffset.x / screenWidth
                    );
                    setActiveImageIndex(index);
                  }}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => (
                    <View
                      style={{
                        width: screenWidth,
                        height: "100%",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Image
                        source={{
                          uri: getFormattedImageUrl(item.image_url)!,
                        }}
                        style={{
                          width: screenWidth,
                          height: screenWidth,
                        }}
                        resizeMode="contain"
                      />
                    </View>
                  )}
                />

                {/* Fullscreen Indicators */}
                {experience.images.length > 1 && (
                  <View
                    style={{
                      position: "absolute",
                      bottom: 40,
                      left: 0,
                      right: 0,
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {experience.images.map((_, index) => (
                      <View
                        key={index}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor:
                            index === activeImageIndex
                              ? "#FFFFFF"
                              : "rgba(255, 255, 255, 0.5)",
                        }}
                      />
                    ))}
                  </View>
                )}
              </View>
            </Modal>
          </>
        ) : (
          <View className="w-full h-80 justify-center items-center bg-gray-100">
            <Ionicons name="image-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-500 font-onest mt-2">
              {imageError ? "Failed to load image" : "No image available"}
            </Text>
          </View>
        )}

        {/* Content Card */}
        <View className="px-6 pt-2 -mt-5 rounded-3xl bg-white">
          {/* Title and Location */}
          <View className="mb-4">
            <View className="flex-row justify-between">
              <Text className="text-2xl font-onest-semibold mt-4 w-9/12 text-gray-800">
                {experience.title}
              </Text>
              <Text className="my-4 text-gray-600 font-onest">
                {experience.unit}
              </Text>
            </View>

            <Text className="text-lg font-onest-bold text-primary my-2">
              {experience.price
                ? `₱${experience.price}`
                : "Price not available"}
            </Text>
          </View>

          {/* Tab Navigation */}
          <View className="flex-row border-b border-gray-200 mt-4">
            <TouchableOpacity
              className={`px-4 py-2 ${activeTab === "details" ? "border-b-2 border-primary" : ""
                }`}
              onPress={() => setActiveTab("details")}
            >
              <Text
                className={`font-onest-medium ${activeTab === "details" ? "text-primary" : "text-gray-600"
                  }`}
              >
                Details
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`px-4 py-2 ${activeTab === "availability" ? "border-b-2 border-primary" : ""
                }`}
              onPress={() => setActiveTab("availability")}
            >
              <Text
                className={`font-onest-medium ${activeTab === "availability"
                  ? "text-primary"
                  : "text-gray-600"
                  }`}
              >
                Availability
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content based on active tab */}
          {activeTab === "details" ? (
            <View className="py-4">
              {/* Tags */}
              {experience.tags && experience.tags.length > 0 && (
                <View className="flex-row flex-wrap mb-4">
                  {experience.tags.map((tag) => (
                    <View
                      key={tag}
                      className="bg-indigo-50 px-3 py-1 rounded-full mr-2 mb-2"
                    >
                      <Text className="text-primary text-xs font-onest-medium">
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Description */}
              <Text className="text-lg font-onest-semibold mt-4 mb-2 text-gray-800">
                Description
              </Text>
              <Text className="text-gray-600 font-onest">
                {expanded
                  ? experience.description
                  : experience.description?.length > 150
                    ? `${experience.description.substring(0, 150)}...`
                    : experience.description}
              </Text>

              {experience.description?.length > 150 && (
                <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                  <Text className="text-primary mt-2 font-onest-medium">
                    {expanded ? "Read Less" : "Read More"}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Notes */}
              <Text className="text-lg font-onest-semibold mt-4 mb-2 text-gray-800">
                Additional Notes
              </Text>
              <Text className="text-gray-600 font-onest">
                {expanded
                  ? experience.notes
                  : experience.notes?.length > 150
                    ? `${experience.notes.substring(0, 150)}...`
                    : experience.notes}
              </Text>

              {experience.description?.length > 150 && (
                <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                  <Text className="text-primary mt-2 font-onest-medium">
                    {expanded ? "Read Less" : "Read More"}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Location Information */}
              {experience.destination && (
                <View className="mt-6">
                  <Text className="text-lg font-onest-semibold mb-2 text-gray-800">
                    Location
                  </Text>
                  <View className="bg-gray-50 rounded-xl p-4 ">
                    <View className="flex-row items-start mb-3">
                      <Ionicons name="location" size={20} color="#4F46E5" />
                      <View className="ml-3 flex-1">
                        <Text className="font-onest-semibold text-gray-800 mb-1">
                          {experience.destination.name}
                        </Text>
                        <Text className="text-gray-400 font-onest">
                          {experience.destination.city}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Reviews Section */}
              {loading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <ReviewsSection reviews={reviews} initialDisplayCount={2} />
              )}

              {/* Location Button */}
              <TouchableOpacity
                className={`my-6 py-4 rounded-2xl items-center flex-row justify-center ${experience.destination ? "bg-primary" : "bg-gray-400"
                  }`}
                onPress={handleOpenMap}
                disabled={!experience.destination}
                style={
                  experience.destination
                    ? {
                      shadowColor: "#4F46E5",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 6,
                    }
                    : {}
                }
                activeOpacity={1}
              >
                <Ionicons
                  name="map-outline"
                  size={20}
                  color={experience.destination ? "#E5E7EB" : "#9CA3AF"}
                />
                <Text
                  className={`font-onest-semibold ml-3 ${experience.destination ? "text-gray-200" : "text-gray-500"
                    }`}
                >
                  {experience.destination
                    ? "Open Location on Map"
                    : "Location Not Available"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="py-4">
              <AvailabilityCalendar
                experienceId={experienceId}
                tripStartDate={tripStartDate}
                tripEndDate={tripEndDate}
                selectedItems={selectedItems}
                onTimeSlotSelect={handleTimeSlotSelect}
                onTimeSlotDeselect={handleTimeSlotDeselect}
              />
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* Floating Action Button (FAB) for Save */}
      <View
        className="absolute bottom-24 right-6"
        style={{
          shadowColor: isSaved ? "#EF4444" : "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isSaved ? 0.3 : 0.15,
          shadowRadius: 12,
          elevation: 8,
          backgroundColor: isSaved ? "#EF4444" : "#FFFFFF",
          borderRadius: 30,
        }}
      >
        <AnimatedHeartButton
          isSaved={isSaved}
          onPress={handleSaveForLater}
          size={28}
        />
      </View>
    </View>
  );
}
