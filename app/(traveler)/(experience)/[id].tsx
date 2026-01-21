// (traveler)/(experience)/[id].tsx
import API_URL from "@/constants/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Linking,
  Platform,
  Pressable,
  Text,

  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AvailabilityCalendar from "../../../components/AvailablityCalendar";
import ReviewsSection from "../../../components/ReviewsSection";
import { ItineraryItem } from "../../../types/itineraryTypes";
// Local imports
import AvailabilityModal from "@/components/AvailabilityModal";
import FloatingActions from "@/components/FloatingActions";
import HeroImageCarousel from "@/components/HeroImageCarousel";
import MapPreview from "@/components/MapPreview";
import { useExperience } from "@/hooks/useExperience";
import { useItineraryItem } from "@/hooks/useItineraryItem";
import { useReviews } from "@/hooks/useReviews";
import { Experience } from "@/types/experienceDetails";
import {
  getCurrentDateString,
  getNextWeekDateString,
  getProfilePicUrl,
} from "@/utils/formatters";

export default function ExperienceDetail() {
  const router = useRouter();
  const {
    id,
    tripStartDate: paramTripStart,
    tripEndDate: paramTripEnd,
    itineraryItemId,
    viewOnly: viewOnlyParam
  } = useLocalSearchParams();

  const isViewOnly = viewOnlyParam === "true";

  const experienceId = Number(id);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Custom hooks for data fetching
  const { experience, loading, isSaved, toggleSave } = useExperience(experienceId);
  const { reviews, loading: reviewsLoading } = useReviews(experienceId);

  // NEW: Fetch itinerary context if viewing from itinerary
  const { itineraryItem, loading: itineraryLoading } = useItineraryItem(
    itineraryItemId ? Number(itineraryItemId) : null
  );

  // Determine if viewing from itinerary context
  const isFromItinerary = !!itineraryItem;

  // Local UI state
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);

  // Trip dates state
  const [tripStartDate] = useState<string>(
    (paramTripStart as string) || getCurrentDateString()
  );
  const [tripEndDate] = useState<string>(
    (paramTripEnd as string) || getNextWeekDateString()
  );
  const [selectedItems, setSelectedItems] = useState<ItineraryItem[]>([]);

  // Handlers
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

  const handleConfirmSelection = () => {
    setShowAvailabilityModal(false);
    // Add any additional logic here
  };

  // Loading state
  if (loading || itineraryLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#1f2937" />
        <Text className="mt-4 text-black/60 font-onest">
          Loading experience...
        </Text>
      </SafeAreaView>
    );
  }

  // Error state
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
        <Pressable
          className="mt-6 bg-primary rounded-full px-8 py-3"
          onPress={() => router.back()}
        >
          <Text className="text-white font-onest-medium">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 pb-36">
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        bounces
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* Hero Image Carousel */}
        <HeroImageCarousel images={experience.images} scrollY={scrollY} />

        {/* Content Card */}
        <View className="px-6 pt-2 -mt-5 rounded-3xl bg-white">


          {/* Title and Description */}
          <ExperienceHeader
            title={experience.title}
            description={experience.description}
            tags={experience.tags}
            expanded={expanded}
            onToggleExpanded={() => setExpanded(!expanded)}
          />



          {/* Content based on active tab */}
          {activeTab === "details" ? (
            <View className="py-4">
              {/* Creator Information */}
              {experience.creator && (
                <CreatorSection creator={experience.creator} />
              )}

              {/* Location Information */}
              {experience.destination && (
                <LocationSection destination={experience.destination} />
              )}

              {/* Steps Section */}
              {experience.steps && experience.steps.length > 0 && (
                <StepsSection steps={experience.steps} />
              )}

              {/* Inclusions Section */}
              {experience.inclusions && experience.inclusions.length > 0 && (
                <InclusionsSection inclusions={experience.inclusions} />
              )}

              {/* Reviews Section */}
              {reviewsLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <ReviewsSection reviews={reviews} initialDisplayCount={2} />
              )}

              {/* Location Button */}
              <MapPreview
                destination={experience.destination}
                onPress={handleOpenMap}
              />
              <View className="p-4 my-12">
                <View className="flex-row items-center justify-center mb-2">


                </View>
                <Text className="text-sm font-onest text-center text-black/50 leading-5">
                  All partners of Itinera have been carefully vetted and verified to ensure professional, safe, and quality service for your travels.
                </Text>
              </View>
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

      {/* Floating Action Buttons */}
      <FloatingActions
        price={experience.price}
        unit={experience.unit}
        isSaved={isSaved}
        onSavePress={toggleSave}
        onCalendarPress={() => setShowAvailabilityModal(true)}
        itineraryContext={itineraryItem}
        viewOnly={isViewOnly}
      />

      {/* Availability Modal - Only show when NOT from itinerary */}
      {/* {!isFromItinerary && (
        <AvailabilityModal
          visible={showAvailabilityModal}
          onClose={() => setShowAvailabilityModal(false)}
          experienceId={experienceId}
          tripStartDate={tripStartDate}
          tripEndDate={tripEndDate}
          selectedItems={selectedItems}
          onTimeSlotSelect={handleTimeSlotSelect}
          onTimeSlotDeselect={handleTimeSlotDeselect}
          onConfirm={handleConfirmSelection}
        />
      )} */}
      {!isFromItinerary && !isViewOnly && (
        <AvailabilityModal
          visible={showAvailabilityModal}
          onClose={() => setShowAvailabilityModal(false)}
          experienceId={experienceId}
          tripStartDate={tripStartDate}
          tripEndDate={tripEndDate}
          selectedItems={selectedItems}
          onTimeSlotSelect={handleTimeSlotSelect}
          onTimeSlotDeselect={handleTimeSlotDeselect}
          onConfirm={handleConfirmSelection}
        />
      )}
    </View>
  );
}


// ============ EXISTING COMPONENTS (unchanged) ============
type ExperienceHeaderProps = {
  title: string;
  description: string;
  tags?: string[];
  expanded: boolean;
  onToggleExpanded: () => void;
};

const ExperienceHeader: React.FC<ExperienceHeaderProps> = ({
  title,
  description,
  tags = [],
  expanded,
  onToggleExpanded,
}) => (
  <View className="mb-4">
    <View className="flex-row justify-between">
      <Text className="text-2xl font-onest-semibold mt-4 w-9/12 text-black/90">
        {title}
      </Text>
    </View>

    <Text className="mt-4 text-black/60 font-onest">
      {expanded
        ? description
        : description?.length > 100
          ? `${description.substring(0, 100)}...`
          : description}
    </Text>

    {description?.length > 100 && (
      <Pressable onPress={onToggleExpanded}>
        <Text className="text-black/90 mt-2 font-onest-medium">
          {expanded ? "Read Less" : "Read More"}
        </Text>
      </Pressable>
    )}

    {!!tags?.length && (
      <View className="flex-row flex-wrap mt-4">
        {tags.map((tag, idx) => (
          <View
            key={`${tag}-${idx}`}
            className="bg-blue-50 rounded-full px-3 py-1 mr-2 mb-2"
          >
            <Text className="text-blue-600 font-onest text-sm">{tag}</Text>
          </View>
        ))}
      </View>
    )}
  </View>
);

type CreatorSectionProps = {
  creator: Experience["creator"];
};

const CreatorSection: React.FC<CreatorSectionProps> = ({ creator }) => {
  const router = useRouter();
  const [startingChat, setStartingChat] = useState(false);

  const handleStartConversation = async () => {
    try {
      setStartingChat(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "Please log in to send messages");
        return;
      }

      // Create or get existing conversation with this creator
      const response = await axios.post(
        `${API_URL}/conversations`,
        { participantId: creator.user_id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const conversationId = response.data.data.id;

        // Navigate to the chat
        router.push({
          pathname: "/(traveler)/(conversations)/[id]",
          params: {
            id: String(conversationId),
            name: creator.full_name,
          },
        });
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      Alert.alert("Error", "Failed to start conversation");
    } finally {
      setStartingChat(false);
    }
  };

  return (
    <View className="pt-6 border-t border-gray-200">
      <View className="">
        <View className="flex-row items-start mb-3">
          {creator.profile_pic ? (
            <Image
              source={{ uri: getProfilePicUrl(creator.profile_pic)! }}
              style={{ width: 40, height: 40, borderRadius: 20 }}
            />
          ) : (
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#E5E7EB",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="person" size={24} color="#9CA3AF" />
            </View>
          )}
          <View className="ml-3 flex-1">
            <Text className="font-onest-semibold text-black/90 mb-1 capitalize">
              {creator.full_name}
            </Text>
            <Text className="text-gray-400 font-onest">Itinera Partner</Text>
          </View>

          <Pressable
            onPress={handleStartConversation}
            disabled={startingChat}
            className="bg-gray-100 p-3 rounded-full"
          >
            {startingChat ? (
              <ActivityIndicator size="small" color="#1f2937" />
            ) : (
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={24}
                color="#1f2937"
              />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
};

type LocationSectionProps = {
  destination: Experience["destination"];
};

const LocationSection: React.FC<LocationSectionProps> = ({ destination }) => (
  <View className="mt-4 pb-6 border-b border-gray-200">
    <View className="rounded-xl">
      <View className="flex-row items-start mb-3">
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#EEF2FF",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="location" size={20} color="#4F46E5" />
        </View>
        <View className="ml-3 flex-1">
          <Text className="font-onest-semibold text-black/90 mb-1">
            {destination.name}
          </Text>
          <Text className="text-gray-400 font-onest">{destination.city}</Text>
        </View>

      </View>
    </View>
  </View>
);

type InclusionsSectionProps = {
  inclusions: Experience["inclusions"];
};

const InclusionsSection: React.FC<InclusionsSectionProps> = ({ inclusions }) => {
  if (!inclusions || inclusions.length === 0) return null;

  return (
    <View className="border-b border-gray-200 py-12">
      <Text className="text-2xl font-onest-semibold mb-8 text-black/90">
        What's Included
      </Text>
      <View className="space-y-3">
        {inclusions.map((inclusion) => (
          <View key={inclusion.inclusion_id} className="flex-row items-start mb-3">
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: "#eff6ff",
                justifyContent: "center",
                alignItems: "center",
                marginTop: 2,
              }}
            >
              <Ionicons name="checkmark" size={16} color="#3B82F6" />
            </View>
            <Text className="flex-1 ml-3 text-black/70 font-onest leading-6">
              {inclusion.title}
            </Text>
          </View>
        ))}
      </View>

      {/* Disclaimer */}
      <View className="mt-6 py-4 rounded-xl flex-row items-start">
        <Ionicons name="information-circle-outline" size={20} color="#1d1d1d" style={{ marginTop: 2 }} />
        <Text className="flex-1 ml-3 text-black/90 font-onest text-sm leading-5">
          Only items listed above are included in the price. Any additional services or expenses are at your own cost.
        </Text>
      </View>
    </View>
  );
};

type StepsSectionProps = {
  steps: Experience["steps"];
};

const StepsSection: React.FC<StepsSectionProps> = ({ steps }) => {
  if (!steps || steps.length === 0) return null;

  return (
    <View className="border-b border-gray-200 py-12">
      <Text className="text-2xl font-onest-semibold mb-8 text-black/90">
        What You'll Do
      </Text>
      {steps.map((step, index) => (
        <View key={step.step_id}>
          <View className="flex-row">
            <View className="flex-1">
              <Text className="font-onest-medium text-lg text-black/90 mb-1">
                {step.title}
              </Text>
              <Text className="text-black/40 font-onest mb-2">{step.description}</Text>
            </View>
          </View>
          {index < steps.length - 1 && (
            <View className="ml-4 my-1 border-l-2 border-gray-200 h-3" />
          )}
        </View>
      ))}
    </View>
  );
};

