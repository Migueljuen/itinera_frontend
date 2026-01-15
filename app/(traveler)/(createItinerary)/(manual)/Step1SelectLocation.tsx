import { Ionicons } from "@expo/vector-icons";
import { addDays, differenceInDays, format } from "date-fns";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Calendar } from "react-native-calendars";
import API_URL from "../../../../constants/api";

// step prop
interface StepProps {
  formData: ItineraryFormData;
  setFormData: React.Dispatch<React.SetStateAction<ItineraryFormData>>;
  onNext: () => void;
}

// itinerary type
export interface ItineraryFormData {
  traveler_id: number;
  start_date: string;
  end_date: string;
  title: string;
  notes?: string;
  city: string;
  items: ItineraryItem[];
}

// itinerary type
export interface ItineraryItem {
  experience_id: number;
  day_number: number;
  start_time: string;
  end_time: string;
  custom_note?: string;
}

// Updated city type to match experience API
interface City {
  location: string; // Original location from API
  normalizedCity: string; // Normalized city name
  label: string; // Display name
  value: string; // Value for form
  experienceCount: number; // Number of experiences in this city
}

// Helper function to normalize city names
const normalizeCityName = (location: string): string => {
  if (!location) return "";

  // Convert to lowercase for comparison
  const lower = location.toLowerCase().trim();

  // Handle specific cases - merge similar city names
  const cityMappings: Record<string, string> = {
    "bacolod city": "Bacolod",
    bacolod: "Bacolod",
    "silay city": "Silay",
    silay: "Silay",
    "manila city": "Manila",
    manila: "Manila",
    "cebu city": "Cebu",
    cebu: "Cebu",
    // Add more mappings as needed
  };

  // Return mapped city or capitalize the original
  return (
    cityMappings[lower] || location.charAt(0).toUpperCase() + location.slice(1)
  );
};

// Updated API service function to fetch destinations from experiences
const fetchDestinations = async (): Promise<City[]> => {
  try {
    const response = await fetch(`${API_URL}/experience`);

    if (!response.ok) {
      throw new Error("Failed to fetch experiences");
    }

    const experiences = await response.json();

    // Extract unique locations and normalize them
    const locationMap = new Map<string, { city: City; count: number }>();

    experiences.forEach((experience: any) => {
      if (experience.location) {
        const normalizedCity = normalizeCityName(experience.location);

        // Use normalized city as the key to prevent duplicates
        if (locationMap.has(normalizedCity)) {
          // Increment count if city already exists
          const existing = locationMap.get(normalizedCity)!;
          existing.count += 1;
        } else {
          // Add new city
          locationMap.set(normalizedCity, {
            city: {
              location: experience.location, // Keep original
              normalizedCity: normalizedCity,
              label: normalizedCity, // Use normalized name for display
              value: normalizedCity.toLowerCase().replace(/\s+/g, "_"), // Create slug
              experienceCount: 1,
            },
            count: 1,
          });
        }
      }
    });

    // Convert map to array, set experience counts, and sort alphabetically
    const uniqueCities = Array.from(locationMap.values())
      .map((item) => ({
        ...item.city,
        experienceCount: item.count,
      }))
      .sort((a, b) => a.normalizedCity.localeCompare(b.normalizedCity));

    return uniqueCities;
  } catch (error) {
    console.error("Error fetching destinations:", error);
    return [];
  }
};

const Step1SelectLocation: React.FC<StepProps> = ({
  formData,
  setFormData,
  onNext,
}) => {
  // Add title state
  const [title, setTitle] = useState<string>(formData.title || "");
  const [localCity, setLocalCity] = useState<string | null>(
    formData.city || null
  );
  // Animation value for dropdown height - DECLARE THIS FIRST
  const dropdownHeight = useRef(new Animated.Value(0)).current;

  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  const [selectedLabel, setSelectedLabel] =
    useState<string>("Select a city...");

  // Calendar states
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>(formData.start_date || "");
  const [endDate, setEndDate] = useState<string>(formData.end_date || "");
  const [markedDates, setMarkedDates] = useState<any>({});
  const [selectingEndDate, setSelectingEndDate] = useState<boolean>(false);

  // Screen dimensions for dropdown max height - memoized
  const { height: screenHeight } = Dimensions.get("window");
  const maxDropdownHeight = useMemo(() => screenHeight * 0.4, [screenHeight]);
  // Dynamic cities state
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState<boolean>(true);
  const [cityError, setCityError] = useState<string | null>(null);

  // Fetch cities from experiences on component mount
  useEffect(() => {
    const loadCities = async () => {
      try {
        setLoadingCities(true);
        setCityError(null);
        const fetchedCities = await fetchDestinations();
        setCities(fetchedCities);
      } catch (error) {
        setCityError("Failed to load cities. Please try again.");
        console.error("Error loading cities:", error);
      } finally {
        setLoadingCities(false);
      }
    };

    loadCities();
  }, []);

  // Update parent formData when title changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      title: title,
    }));
  }, [title]);

  // Update parent formData when localCity changes
  useEffect(() => {
    if (localCity) {
      setFormData({
        ...formData,
        city: localCity,
      });
    }
  }, [localCity]);

  // Update formData when dates change
  useEffect(() => {
    if (startDate || endDate) {
      setFormData({
        ...formData,
        start_date: startDate,
        end_date: endDate,
      });
    }
  }, [startDate, endDate]);

  // Initialize marked dates if dates already exist in formData
  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      setStartDate(formData.start_date);
      setEndDate(formData.end_date);
      setMarkedDates(getDateRange(formData.start_date, formData.end_date));
    }
  }, []);

  // Update selected label when component mounts or city changes
  useEffect(() => {
    if (localCity && cities.length > 0) {
      const selectedCity = cities.find((city) => city.value === localCity);
      if (selectedCity) {
        setSelectedLabel(selectedCity.label);
      }
    }
  }, [localCity, cities]);

  // Animate dropdown opening and closing
  useEffect(() => {
    Animated.timing(dropdownHeight, {
      toValue: dropdownOpen ? maxDropdownHeight : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [dropdownOpen, maxDropdownHeight]);

  const toggleDropdown = () => {
    console.log("Before toggle:", dropdownOpen);
    console.log("Max height:", maxDropdownHeight);

    setDropdownOpen((prev) => {
      console.log("Setting to:", !prev);
      return !prev;
    });

    if (showCalendar) {
      setShowCalendar(false);
    }
    Keyboard.dismiss();
  };

  const toggleCalendar = () => {
    setShowCalendar(!showCalendar);
    if (dropdownOpen) {
      setDropdownOpen(false);
    }
    Keyboard.dismiss();
  };

  const isValid = () => {
    return (
      title.trim() !== "" &&
      localCity !== null &&
      startDate !== "" &&
      endDate !== ""
    );
  };

  const handleNext = () => {
    if (isValid()) {
      onNext();
    }
  };

  const selectCity = (city: City) => {
    setLocalCity(city.value);
    setSelectedLabel(city.label);
    setDropdownOpen(false);
  };

  // Retry loading cities
  const retryLoadCities = async () => {
    const loadCities = async () => {
      try {
        setLoadingCities(true);
        setCityError(null);
        const fetchedCities = await fetchDestinations();
        setCities(fetchedCities);
      } catch (error) {
        setCityError("Failed to load cities. Please try again.");
      } finally {
        setLoadingCities(false);
      }
    };
    await loadCities();
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

    if (!startDate || selectingEndDate) {
      if (!startDate) {
        setStartDate(selectedDate);
        setSelectingEndDate(true);

        setMarkedDates({
          [selectedDate]: {
            selected: true,
            startingDay: true,
            color: "#4F46E5",
          },
        });
      } else {
        if (selectedDate < startDate) {
          setEndDate(startDate);
          setStartDate(selectedDate);
        } else {
          setEndDate(selectedDate);
        }

        setSelectingEndDate(false);
        setShowCalendar(false);

        const markedDateRange = getDateRange(
          startDate,
          selectedDate < startDate ? startDate : selectedDate
        );
        setMarkedDates(markedDateRange);
      }
    } else {
      setStartDate(selectedDate);
      setEndDate("");
      setSelectingEndDate(true);

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

    const dayCount = differenceInDays(end, start);

    range[startDateStr] = {
      selected: true,
      startingDay: true,
      color: "#4F46E5",
    };

    for (let i = 1; i < dayCount; i++) {
      const date = format(addDays(start, i), "yyyy-MM-dd");
      range[date] = {
        selected: true,
        color: "#E0E7FF",
      };
    }

    range[endDateStr] = {
      selected: true,
      endingDay: true,
      color: "#4F46E5",
    };

    return range;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
        onScrollBeginDrag={() => {
          Keyboard.dismiss();
        }}
      >
        <View className="flex-1 p-4">
          <View className="text-center py-2">
            <Text className="text-center text-xl font-onest-semibold mb-2">
              Plan your perfect journey
            </Text>
            <Text className="text-center text-sm text-gray-500 font-onest mb-6 w-11/12 m-auto">
              Give your itinerary a memorable title and choose your
              destination and travel dates.
            </Text>

            <View className="flex justify-evenly gap-4 border-t pt-12 border-gray-200 relative">
              {/* Title Input Field */}
              <View className=" pb-4 z-10">
                <Text className="font-onest-medium py-2">
                  Itinerary Title
                </Text>
                <TextInput
                  className={`px-3 py-3 border ${title.trim() ? "border-primary" : "border-gray-300"
                    } rounded-md  text-base font-onest`}
                  placeholder="e.g., Summer Adventure in Bacolod"
                  placeholderTextColor="#9CA3AF"
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
                {title.length > 0 && (
                  <Text className="text-xs text-gray-500 font-onest mt-1 text-right">
                    {title.length}/100
                  </Text>
                )}
              </View>

              {/* Custom Dropdown for City Selection */}
              <View className=" pb-4 z-10">
                <Text className="font-onest-medium py-2">
                  Select Available Destination
                </Text>
                {/* Dropdown Button */}
                <TouchableOpacity
                  className={`flex-row items-center justify-between px-3 py-3 border ${dropdownOpen ? "border-primary" : "border-gray-300"
                    } rounded-md `}
                  onPress={toggleDropdown}
                  activeOpacity={0.7}
                  disabled={loadingCities}
                >
                  {loadingCities ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator size="small" color="#4F46E5" />
                      <Text className="text-gray-500 ml-2">
                        Loading destinations...
                      </Text>
                    </View>
                  ) : (
                    <Text
                      className={`text-base ${localCity ? "text-black font-onest" : "text-gray-500"
                        }`}
                    >
                      {selectedLabel}
                    </Text>
                  )}
                  <Ionicons
                    name={dropdownOpen ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={dropdownOpen ? "#4F46E5" : "gray"}
                  />
                </TouchableOpacity>
                {/* Error Message */}
                {cityError && (
                  <View className="mt-2 p-2 bg-red-50 rounded-md">
                    <Text className="text-red-600 text-sm font-onest">
                      {cityError}
                    </Text>
                    <TouchableOpacity
                      onPress={retryLoadCities}
                      className="mt-1"
                      activeOpacity={0.7}
                    >
                      <Text className="text-red-600 text-sm font-onest-medium underline">
                        Retry
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                {/* Dropdown List */}
                {dropdownOpen && (
                  <View
                    style={{
                      position: "absolute",
                      top: 100,
                      left: 0,
                      right: 0,
                      maxHeight: 300,
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      borderBottomLeftRadius: 6,
                      borderBottomRightRadius: 6,
                      backgroundColor: "white",
                      zIndex: 9999,
                      elevation: 10,
                    }}
                  >
                    <ScrollView nestedScrollEnabled={true}>
                      {cities.length === 0 && !loadingCities ? (
                        <View className="px-4 py-8 text-center">
                          <Text className="text-gray-500 text-base font-onest">
                            No destinations available
                          </Text>
                        </View>
                      ) : (
                        cities.map((city, index) => (
                          <TouchableOpacity
                            key={`${city.value}-${index}`}
                            className={`px-4 py-3 ${index < cities.length - 1
                              ? "border-b border-gray-200"
                              : ""
                              }`}
                            onPress={() => selectCity(city)}
                            activeOpacity={0.7}
                          >
                            <View className="flex-row justify-between items-center">
                              <Text className="text-base font-onest">
                                {city.label}
                              </Text>
                              <Text className="text-xs text-gray-500 font-onest">
                                {city.experienceCount}{" "}
                                {city.experienceCount === 1
                                  ? "Activity"
                                  : "Activities"}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Date Selection */}
              <View className=" pb-4 mt-4 z-9">
                <Text className="font-onest-medium py-2">Travel Dates</Text>
                <TouchableOpacity
                  className={`flex-row items-center justify-between px-3 py-3 border ${showCalendar ? "border-primary" : "border-gray-300"
                    } rounded-md `}
                  onPress={toggleCalendar}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`text-base ${startDate ? "text-black font-onest" : "text-gray-500"
                      }`}
                  >
                    {startDate && endDate
                      ? `${formatDisplayDate(
                        startDate
                      )} - ${formatDisplayDate(endDate)}`
                      : startDate
                        ? `${formatDisplayDate(startDate)} - Select end date`
                        : "Select travel dates"}
                  </Text>
                  <Ionicons
                    name={showCalendar ? "calendar" : "calendar-outline"}
                    size={20}
                    color={showCalendar ? "#4F46E5" : "gray"}
                  />
                </TouchableOpacity>

                {/* Calendar popup */}
                {showCalendar && (
                  <View className=" border border-gray-200 rounded-md mt-1 shadow-sm z-20">
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
                        {selectingEndDate
                          ? "Now select your end date"
                          : "Select your travel dates"}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Date selection indicator */}
                {startDate && !showCalendar && (
                  <View className="flex-row justify-between mt-2">
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500 font-onest">
                        Start Date
                      </Text>
                      <Text className="text-sm font-onest-medium">
                        {formatDisplayDate(startDate)}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500 font-onest">
                        End Date
                      </Text>
                      <Text className="text-sm font-onest-medium">
                        {endDate
                          ? formatDisplayDate(endDate)
                          : "Not selected"}
                      </Text>
                    </View>
                    {startDate && endDate && (
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500 font-onest">
                          Duration
                        </Text>
                        <Text className="text-sm font-onest-medium">
                          {differenceInDays(
                            new Date(endDate),
                            new Date(startDate)
                          ) + 1}{" "}
                          days
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleNext}
                className={`mt-4 p-4 rounded-xl ${isValid() ? "bg-primary" : "bg-gray-200"
                  }`}
                disabled={!isValid()}
                activeOpacity={0.7}
              >
                <Text className="text-center font-onest-medium text-base text-white">
                  Next step
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Step1SelectLocation;
