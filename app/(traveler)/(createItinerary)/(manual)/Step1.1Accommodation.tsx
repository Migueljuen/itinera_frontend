import {
  ActivityIntensity,
  Budget,
  Experience,
  ExploreTime,
  TravelCompanion,
} from "@/types/experienceTypes";
import { Ionicons } from "@expo/vector-icons";
import { addDays, differenceInDays, format } from "date-fns";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import MapSearchComponent from "../../../../components/MapSearch"; // Add this import

interface Accommodation {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  check_in?: string;
  check_out?: string;
  booking_link?: string;
}

// Itinerary interfaces
interface ItineraryFormData {
  traveler_id: number;
  start_date: string; // Format: 'YYYY-MM-DD'
  end_date: string; // Format: 'YYYY-MM-DD'
  title: string;
  notes?: string;
  city: string;
  items: ItineraryItem[];
  accommodation?: Accommodation;
  // Additional fields for preferences - ADD activityIntensity
  preferences?: {
    experiences: Experience[];
    travelCompanion: TravelCompanion;
    exploreTime: ExploreTime;
    budget: Budget;
    activityIntensity: ActivityIntensity; // ADD THIS LINE
  };
}

interface ItineraryItem {
  experience_id: number;
  day_number: number; // Must be between 1 and total number of days in the itinerary
  start_time: string; // Format: 'HH:mm'
  end_time: string; // Format: 'HH:mm'
  custom_note?: string;
}

interface StepProps {
  formData: ItineraryFormData;
  setFormData: React.Dispatch<React.SetStateAction<ItineraryFormData>>;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

const Step1_1Accommodation: React.FC<StepProps> = ({
  formData,
  setFormData,
  onNext,
  onBack,
  onSkip,
}) => {
  const [accommodation, setAccommodation] = useState<Accommodation>(
    formData.accommodation || {
      name: "",
      address: "",
      latitude: undefined,
      longitude: undefined,
      check_in: formData.start_date || "",
      check_out: formData.end_date || "",
      booking_link: "",
    }
  );

  // Map search state
  const [showMapSearch, setShowMapSearch] = useState(false);

  // Calendar states
  const [showCalendar, setShowCalendar] = useState(false);
  const [checkInDate, setCheckInDate] = useState(
    accommodation.check_in || formData.start_date || ""
  );
  const [checkOutDate, setCheckOutDate] = useState(
    accommodation.check_out || formData.end_date || ""
  );
  const [markedDates, setMarkedDates] = useState({});
  const [selectingCheckOut, setSelectingCheckOut] = useState(false);

  // Update accommodation when dates change
  useEffect(() => {
    if (checkInDate || checkOutDate) {
      setAccommodation((prev) => ({
        ...prev,
        check_in: checkInDate,
        check_out: checkOutDate,
      }));
    }
  }, [checkInDate, checkOutDate]);

  // Initialize marked dates if dates already exist
  useEffect(() => {
    if (checkInDate && checkOutDate) {
      setMarkedDates(getDateRange(checkInDate, checkOutDate));
    } else if (checkInDate) {
      setMarkedDates({
        [checkInDate]: {
          selected: true,
          startingDay: true,
          color: "#4F46E5",
        },
      });
    }
  }, []);

  // Initialize dates from formData if available
  useEffect(() => {
    if (formData.start_date && !checkInDate) {
      setCheckInDate(formData.start_date);
    }
    if (formData.end_date && !checkOutDate) {
      setCheckOutDate(formData.end_date);
    }
  }, [formData.start_date, formData.end_date]);

  const handleInputChange = (
    field: keyof Accommodation,
    value: string | number | undefined
  ) => {
    setAccommodation((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle map search location selection
  const handleLocationSelect = async (location: any) => {
    console.log("Location data received:", location);

    // First set the coordinates
    const latitude = location.latitude || location.lat;
    const longitude = location.longitude || location.lng || location.lon;

    setAccommodation((prev) => ({
      ...prev,
      latitude: latitude,
      longitude: longitude,
    }));

    // location api
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      console.log("Reverse geocoding data:", data);

      if (data && data.display_name) {
        const fullAddress = data.display_name;

        // Extract place name - try different approaches
        let placeName = "";

        // Option 1: Use the name field if available
        if (data.name) {
          placeName = data.name;
        }
        // Option 2: Try to get business/place name from address components
        else if (data.address) {
          placeName =
            data.address.tourism ||
            data.address.hotel ||
            data.address.accommodation ||
            data.address.building ||
            data.address.house_name ||
            data.address.amenity ||
            data.address.leisure ||
            "";
        }
        // Option 3: Extract first part of address if it looks like a place name
        if (!placeName) {
          const addressParts = fullAddress.split(",");
          const firstPart = addressParts[0].trim();
          // Only use first part as name if it doesn't look like a street number
          if (firstPart && !/^\d/.test(firstPart)) {
            placeName = firstPart;
          }
        }

        setAccommodation((prev) => ({
          ...prev,
          address: fullAddress,
          name: placeName || prev.name,
        }));
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      Alert.alert(
        "Location Error",
        "Could not fetch address details for selected location."
      );
    }
  };

  // Open map search
  const openMapSearch = () => {
    setShowMapSearch(true);
  };

  // Close map search
  const closeMapSearch = () => {
    setShowMapSearch(false);
  };

  // Toggle calendar visibility
  const toggleCalendar = () => {
    setShowCalendar(!showCalendar);
    Keyboard.dismiss();
  };

  // Format date for display
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return format(date, "MMM dd, yyyy");
  };

  // Handle date selection on calendar
  const handleDayPress = (day: { dateString: string }) => {
    const selectedDate = day.dateString;

    if (!checkInDate || selectingCheckOut) {
      // If no check-in date is selected or we're selecting check-out date
      if (!checkInDate) {
        // Set check-in date
        setCheckInDate(selectedDate);
        setSelectingCheckOut(true);

        // Mark this date
        setMarkedDates({
          [selectedDate]: {
            selected: true,
            startingDay: true,
            color: "#4F46E5",
          },
        });
      } else {
        // Selecting check-out date
        // Ensure check-out date is after check-in date
        if (selectedDate < checkInDate) {
          // If selected date is before check-in date, swap them
          setCheckOutDate(checkInDate);
          setCheckInDate(selectedDate);
        } else {
          setCheckOutDate(selectedDate);
        }

        setSelectingCheckOut(false);
        setShowCalendar(false);

        // Create date range markers
        const markedDateRange = getDateRange(
          checkInDate,
          selectedDate < checkInDate ? checkInDate : selectedDate
        );
        setMarkedDates(markedDateRange);
      }
    } else {
      // Starting a new selection
      setCheckInDate(selectedDate);
      setCheckOutDate("");
      setSelectingCheckOut(true);

      setMarkedDates({
        [selectedDate]: {
          selected: true,
          startingDay: true,
          color: "#4F46E5",
        },
      });
    }
  };

  // Create date range markers for the calendar
  const getDateRange = (startDateStr: string, endDateStr: string) => {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const range: Record<string, any> = {};

    // Calculate the difference in days
    const dayCount = differenceInDays(end, start);

    // Mark start date
    range[startDateStr] = {
      selected: true,
      startingDay: true,
      color: "#4F46E5",
    };

    // Mark dates in between
    for (let i = 1; i < dayCount; i++) {
      const date = format(addDays(start, i), "yyyy-MM-dd");
      range[date] = {
        selected: true,
        color: "#E0E7FF",
      };
    }

    // Mark end date
    range[endDateStr] = {
      selected: true,
      endingDay: true,
      color: "#4F46E5",
    };

    return range;
  };

  const handleNext = () => {
    // Validate required fields if accommodation is being added
    if (accommodation.name || accommodation.address) {
      if (!accommodation.name || !accommodation.address) {
        Alert.alert(
          "Validation Error",
          "Please fill in both accommodation name and address, or skip this step."
        );
        return;
      }
    }

    // Update form data with accommodation info
    setFormData((prev: ItineraryFormData) => ({
      ...prev,
      accommodation:
        accommodation.name || accommodation.address ? accommodation : undefined,
    }));

    onNext();
  };

  const handleSkip = () => {
    // Clear accommodation data and skip
    setFormData((prev: ItineraryFormData) => ({
      ...prev,
      accommodation: undefined,
    }));
    onSkip?.();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 p-4">
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            <View className="text-center py-2">
              <Text className="text-center text-xl font-onest-semibold mb-2">
                Add your accommodation
              </Text>
              <Text className="text-center text-sm text-gray-500 font-onest mb-6 w-11/12 m-auto">
                Help us customize your itinerary around your stay (optional)
              </Text>

              <View className="flex justify-evenly gap-6 border-t pt-8 border-gray-200">
                {/* Accommodation Name */}
                <View className="mb-4">
                  <Text className="font-onest-medium text-base mb-3">
                    Accommodation Name
                  </Text>
                  <View className="relative">
                    <TextInput
                      className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white font-onest pr-12"
                      placeholder="e.g., Grand Hotel Resort"
                      value={accommodation.name}
                      onChangeText={(text) => handleInputChange("name", text)}
                      placeholderTextColor="#9CA3AF"
                    />
                    <Ionicons
                      name="business"
                      size={20}
                      color="#9CA3AF"
                      style={{ position: "absolute", right: 16, top: 12 }}
                    />
                  </View>
                </View>

                {/* Address with Map Search */}
                <View className="mb-4">
                  <Text className="font-onest-medium text-base mb-3">
                    Address
                  </Text>

                  {/* Map Search Button */}
                  <TouchableOpacity
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex-row items-center justify-center"
                    onPress={openMapSearch}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="map" size={20} color="#3B82F6" />
                    <Text className="font-onest-medium text-blue-600 ml-2">
                      Search Location on Map
                    </Text>
                  </TouchableOpacity>

                  {/* Address Input Field */}
                  <View className="relative">
                    <TextInput
                      className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white font-onest pr-12"
                      placeholder="Full address of accommodation"
                      value={accommodation.address}
                      onChangeText={(text) =>
                        handleInputChange("address", text)
                      }
                      multiline
                      numberOfLines={2}
                      textAlignVertical="top"
                      placeholderTextColor="#9CA3AF"
                    />
                    <Ionicons
                      name="location"
                      size={20}
                      color="#9CA3AF"
                      style={{ position: "absolute", right: 16, top: 12 }}
                    />
                  </View>

                  {/* Show location confirmation if coordinates are available */}
                  {accommodation.latitude && accommodation.longitude && (
                    <View className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <Text className="text-sm text-green-700 font-onest">
                        📍 Location mapped successfully
                      </Text>
                    </View>
                  )}
                </View>

                {/* Check-in and Check-out Dates with Calendar */}
                <View className="bg-white pb-4 mt-4 z-9">
                  <Text className="font-onest-medium text-base mb-3">
                    Stay Duration
                  </Text>
                  <TouchableOpacity
                    className={`flex-row items-center justify-between px-3 py-3 border ${
                      showCalendar ? "border-primary" : "border-gray-300"
                    } rounded-md bg-white`}
                    onPress={toggleCalendar}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`text-base ${
                        checkInDate ? "text-black font-onest" : "text-gray-500"
                      }`}
                    >
                      {checkInDate && checkOutDate
                        ? `${formatDisplayDate(
                            checkInDate
                          )} - ${formatDisplayDate(checkOutDate)}`
                        : checkInDate
                        ? `${formatDisplayDate(
                            checkInDate
                          )} - Select check-out date`
                        : "Select check-in and check-out dates"}
                    </Text>
                    <Ionicons
                      name={showCalendar ? "calendar" : "calendar-outline"}
                      size={20}
                      color={showCalendar ? "#4F46E5" : "gray"}
                    />
                  </TouchableOpacity>

                  {/* Calendar popup */}
                  {showCalendar && (
                    <View className="bg-white border border-gray-200 rounded-md mt-1 shadow-sm z-20">
                      <Calendar
                        onDayPress={handleDayPress}
                        markedDates={markedDates}
                        markingType={"period"}
                        minDate={new Date().toISOString().split("T")[0]}
                        theme={{
                          calendarBackground: "#FFFFFF",
                          selectedDayBackgroundColor: "#4F46E5",
                          selectedDayTextColor: "#FFFFFF",
                          todayTextColor: "#4F46E5",
                          textSectionTitleColor: "#6B7280",
                          arrowColor: "#4F46E5",
                        }}
                        style={{
                          height: 350,
                        }}
                      />
                      <View className="p-3 border-t border-gray-200">
                        <Text className="text-center text-sm text-gray-500 font-onest mb-1">
                          {selectingCheckOut
                            ? "Now select your check-out date"
                            : "Select your check-in date"}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Date selection indicator */}
                  {checkInDate && !showCalendar && (
                    <View className="flex-row justify-between mt-2">
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500 font-onest">
                          Check-in Date
                        </Text>
                        <Text className="text-sm font-onest-medium">
                          {formatDisplayDate(checkInDate)}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500 font-onest">
                          Check-out Date
                        </Text>
                        <Text className="text-sm font-onest-medium">
                          {checkOutDate
                            ? formatDisplayDate(checkOutDate)
                            : "Not selected"}
                        </Text>
                      </View>
                      {checkInDate && checkOutDate && (
                        <View className="flex-1">
                          <Text className="text-xs text-gray-500 font-onest">
                            Duration
                          </Text>
                          <Text className="text-sm font-onest-medium">
                            {differenceInDays(
                              new Date(checkOutDate),
                              new Date(checkInDate)
                            ) + 1}{" "}
                            days
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* Booking Link */}
                <View className="mb-4">
                  <Text className="font-onest-medium text-base mb-3">
                    Booking Link (Optional)
                  </Text>
                  <View className="relative">
                    <TextInput
                      className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white font-onest pr-12"
                      placeholder="https://booking.com/..."
                      value={accommodation.booking_link}
                      onChangeText={(text) =>
                        handleInputChange("booking_link", text)
                      }
                      keyboardType="url"
                      autoCapitalize="none"
                      placeholderTextColor="#9CA3AF"
                    />
                    <Ionicons
                      name="link"
                      size={20}
                      color="#9CA3AF"
                      style={{ position: "absolute", right: 16, top: 12 }}
                    />
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Navigation Buttons */}
          <View className="flex-row justify-between mt-4 pt-2 border-t border-gray-200">
            <TouchableOpacity
              onPress={onBack}
              className="py-4 px-6 rounded-xl border border-gray-300"
              activeOpacity={0.7}
            >
              <Text className="text-center font-onest-medium text-base text-gray-700">
                Back
              </Text>
            </TouchableOpacity>

            <View className="flex-row gap-3">
              {onSkip && (
                <TouchableOpacity
                  onPress={handleSkip}
                  className="py-4 px-6 rounded-xl border border-gray-300"
                  activeOpacity={0.7}
                >
                  <Text className="text-center font-onest-medium text-base text-gray-700">
                    Skip
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleNext}
                className="py-4 px-8 rounded-xl bg-primary"
                activeOpacity={0.7}
              >
                <Text className="text-center font-onest-medium text-base text-white">
                  Next step
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Map Search Modal */}
          <MapSearchComponent
            visible={showMapSearch}
            onClose={closeMapSearch}
            onLocationSelect={handleLocationSelect}
            initialLatitude={accommodation.latitude}
            initialLongitude={accommodation.longitude}
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default Step1_1Accommodation;
