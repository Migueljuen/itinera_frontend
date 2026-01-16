// (traveler)/createItinerary/(generate)/MeetingPointStep.tsx

import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { PROVIDER_GOOGLE, Region } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

interface LocationData {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface SearchResult {
  place_id: string;
  display_name: string;
  name: string;
  lat: string;
  lon: string;
}

interface MeetingPointStepProps {
  onConfirm: (location: LocationData) => void;
  onBack: () => void;
  initialLocation?: LocationData | null;
}

// Default to Philippines (Bacolod City)
const DEFAULT_REGION: Region = {
  latitude: 10.6804,
  longitude: 122.955,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const MeetingPointStep: React.FC<MeetingPointStepProps> = ({
  onConfirm,
  onBack,
  initialLocation,
}) => {
  const mapRef = useRef<MapView>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  // Selected location state
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    initialLocation || null
  );

  // Region state
  const [region, setRegion] = useState<Region>(
    initialLocation
      ? {
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }
      : DEFAULT_REGION
  );

  // Get user's current location on mount
  useEffect(() => {
    if (!initialLocation) {
      getCurrentLocation();
    }
  }, []);

  // Get current location
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      mapRef.current?.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      );
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  // Search places using Nominatim (OpenStreetMap)
  const searchPlaces = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(query)}&` +
          `format=json&` +
          `addressdetails=1&` +
          `limit=10&` +
          `countrycodes=ph&` +
          `viewbox=116.9,4.5,127.0,21.2&` +
          `bounded=1`,
        {
          headers: {
            "User-Agent": "ItineraApp/1.0",
          },
        }
      );

      const data: SearchResult[] = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Error searching places:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      searchPlaces(text);
    }, 500);
  };

  // Select a search result
  const handleSelectSearchResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    const nameParts = result.display_name.split(",");
    const name = result.name || nameParts[0].trim();
    const address = nameParts.slice(0, 3).join(",").trim();

    const location: LocationData = {
      name,
      address,
      latitude: lat,
      longitude: lon,
    };

    setSelectedLocation(location);
    setSearchQuery("");
    setShowResults(false);
    Keyboard.dismiss();

    mapRef.current?.animateToRegion(
      {
        latitude: lat,
        longitude: lon,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      500
    );
  };

  // Handle map region change (when user drags the map)
  const handleRegionChangeComplete = async (newRegion: Region) => {
    const { latitude, longitude } = newRegion;

    // Reverse geocode
    setIsLoadingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?` +
          `lat=${latitude}&lon=${longitude}&format=json`,
        {
          headers: {
            "User-Agent": "ItineraApp/1.0",
          },
        }
      );

      const data = await response.json();

      if (data && data.display_name) {
        const nameParts = data.display_name.split(",");
        const name = data.name || nameParts[0].trim();
        const address = nameParts.slice(0, 3).join(",").trim();

        setSelectedLocation({
          name,
          address,
          latitude,
          longitude,
        });
      } else {
        setSelectedLocation({
          name: "Selected Location",
          address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          latitude,
          longitude,
        });
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      setSelectedLocation({
        name: "Selected Location",
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        latitude,
        longitude,
      });
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // Use current location button
  const handleUseCurrentLocation = async () => {
    setIsLoadingLocation(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Please enable location permissions to use this feature."
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      mapRef.current?.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500
      );
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Failed to get your current location.");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedLocation) {
      Alert.alert(
        "No Location Selected",
        "Please select a location on the map."
      );
      return;
    }

    // Pass location back to Step3a
    onConfirm(selectedLocation);
  };

  // Render search result item
  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <Pressable
      onPress={() => handleSelectSearchResult(item)}
      className="flex-row items-start px-4 py-3 border-b border-gray-100 bg-white"
    >
      <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
        <Ionicons name="location-outline" size={20} color="#6B7280" />
      </View>
      <View className="ml-3 flex-1">
        <Text className="font-onest-medium text-gray-900" numberOfLines={1}>
          {item.name || item.display_name.split(",")[0]}
        </Text>
        <Text
          className="font-onest text-gray-500 text-xs mt-0.5"
          numberOfLines={2}
        >
          {item.display_name}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-white ">
      {/* Map - Full Screen */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton={false}
      />

      {/* Fixed Center Pin */}
      <View
        className="absolute items-center justify-center"
        style={{
          top: "45%",
          left: "50%",
          marginLeft: -20,
          marginTop: -40,
        }}
        pointerEvents="none"
      >
        <Ionicons name="location" size={40} color="#6366F1" />
      </View>

      {/* Header Overlay */}
      <SafeAreaView edges={["top"]} className="absolute top-0 left-0 right-0">
        <View className="px-4 pt-2">
          {/* Back Button & Search */}
          <View className="flex-row items-center">
            <Pressable
              onPress={onBack}
              className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-md mr-3"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </Pressable>

            {/* Search Bar */}
            <View
              className="flex-1 flex-row items-center bg-white rounded-xl px-4 py-3 shadow-md"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 font-onest text-gray-900"
                placeholder="Search for a place..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={handleSearchChange}
                onFocus={() => searchQuery.length >= 3 && setShowResults(true)}
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setShowResults(false);
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </Pressable>
              )}
            </View>
          </View>

          {/* Search Results */}
          {showResults && (
            <View
              className="mt-2 bg-white rounded-xl overflow-hidden max-h-64 shadow-lg"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              {isSearching ? (
                <View className="py-8 items-center">
                  <ActivityIndicator size="small" color="#6366F1" />
                  <Text className="font-onest text-gray-500 mt-2">
                    Searching...
                  </Text>
                </View>
              ) : searchResults.length > 0 ? (
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.place_id}
                  renderItem={renderSearchResult}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                />
              ) : searchQuery.length >= 3 ? (
                <View className="py-8 items-center">
                  <Ionicons name="location-outline" size={32} color="#D1D5DB" />
                  <Text className="font-onest text-gray-500 mt-2">
                    No places found
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* Current Location Button */}
      <Pressable
        onPress={handleUseCurrentLocation}
        disabled={isLoadingLocation}
        className="absolute right-4 bg-white rounded-full p-3 shadow-md"
        style={{
          bottom: 180,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        {isLoadingLocation ? (
          <ActivityIndicator size="small" color="#6366F1" />
        ) : (
          <Ionicons name="locate" size={24} color="#6366F1" />
        )}
      </Pressable>

      <View
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-lg"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        }}
      >
        <SafeAreaView edges={["bottom"]}>
          <View className="p-4">
            {/* Drag Handle */}
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />

            {/* Selected Location */}
            <View className="flex-row items-start mb-4">
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                <Ionicons name="location" size={20} color="#6366F1" />
              </View>
              <View className="ml-3 flex-1">
                {isLoadingAddress ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#6366F1" />
                    <Text className="font-onest text-gray-500 ml-2">
                      Finding address...
                    </Text>
                  </View>
                ) : selectedLocation ? (
                  <>
                    <Text
                      className="font-onest-semibold text-gray-900"
                      numberOfLines={1}
                    >
                      {selectedLocation.name}
                    </Text>
                    <Text
                      className="font-onest text-gray-500 text-sm mt-0.5"
                      numberOfLines={2}
                    >
                      {selectedLocation.address}
                    </Text>
                  </>
                ) : (
                  <Text className="font-onest text-gray-500">
                    Move the map to select a location
                  </Text>
                )}
              </View>
            </View>

            {/* Confirm Button - Changed text */}
            <Pressable
              onPress={handleConfirm}
              disabled={!selectedLocation || isLoadingAddress}
              className={`rounded-xl py-4 items-center ${
                selectedLocation && !isLoadingAddress
                  ? "bg-primary"
                  : "bg-gray-300"
              }`}
            >
              <Text
                className={`font-onest-semibold ${
                  selectedLocation && !isLoadingAddress
                    ? "text-white"
                    : "text-gray-500"
                }`}
              >
                Select This Location
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
};

export default MeetingPointStep;
