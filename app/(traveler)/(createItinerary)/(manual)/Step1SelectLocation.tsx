import type { TravelCompanion } from "@/types/experienceTypes";
import type { ItineraryFormData } from "@/types/itineraryTypes";
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
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import API_URL from "../../../../constants/api";

/* ---------------- Types ---------------- */

type GuestBreakdown = {
  adult: number;
  child: number;
  infant: number;
};

interface StepProps {
  formData: ItineraryFormData;
  setFormData: React.Dispatch<React.SetStateAction<ItineraryFormData>>;
  onNext: () => void;
}

// itinerary type
export interface ItineraryItem {
  experience_id: number;
  day_number: number;
  start_time: string;
  end_time: string;
  custom_note?: string;
}

interface City {
  location: string; // Original location from API
  normalizedCity: string; // Normalized city name
  label: string; // Display name
  value: string; // Value for form
  experienceCount: number; // Number of experiences in this city
}

/* ---------------- Helpers ---------------- */

const normalizeCityName = (location: string): string => {
  if (!location) return "";

  const lower = location.toLowerCase().trim();

  const cityMappings: Record<string, string> = {
    "bacolod city": "Bacolod",
    bacolod: "Bacolod",
    "silay city": "Silay",
    silay: "Silay",
    "manila city": "Manila",
    manila: "Manila",
    "cebu city": "Cebu",
    cebu: "Cebu",
  };

  return cityMappings[lower] || location.charAt(0).toUpperCase() + location.slice(1);
};

const fetchDestinations = async (): Promise<City[]> => {
  try {
    const response = await fetch(`${API_URL}/experience/active`);

    if (!response.ok) {
      throw new Error("Failed to fetch experiences");
    }

    const experiences = await response.json();

    const locationMap = new Map<string, { city: City; count: number }>();

    experiences.forEach((experience: any) => {
      if (experience.location) {
        const normalizedCity = normalizeCityName(experience.location);

        if (locationMap.has(normalizedCity)) {
          const existing = locationMap.get(normalizedCity)!;
          existing.count += 1;
        } else {
          locationMap.set(normalizedCity, {
            city: {
              location: experience.location,
              normalizedCity,
              label: normalizedCity,
              value: normalizedCity.toLowerCase().replace(/\s+/g, "_"),
              experienceCount: 1,
            },
            count: 1,
          });
        }
      }
    });

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

/* ---------------- Component ---------------- */

const Step1SelectLocation: React.FC<StepProps> = ({
  formData,
  setFormData,
  onNext,
}) => {
  const companionOptions: TravelCompanion[] = useMemo(
    () => ["Solo", "Partner", "Friends", "Family", "Any"],
    []
  );

  // title + city
  const [title, setTitle] = useState<string>(formData.title || "");
  const [localCity, setLocalCity] = useState<string | null>(formData.city || null);

  // dropdown animation
  const dropdownHeight = useRef(new Animated.Value(0)).current;
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [selectedLabel, setSelectedLabel] = useState<string>("Select a city...");

  // calendar states
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>(formData.start_date || "");
  const [endDate, setEndDate] = useState<string>(formData.end_date || "");
  const [markedDates, setMarkedDates] = useState<any>({});
  const [selectingEndDate, setSelectingEndDate] = useState<boolean>(false);

  // Companion selection
  const [selectedCompanion, setSelectedCompanion] =
    useState<TravelCompanion | null>(formData.preferences?.travelCompanion || null);

  /* ---------- NEW: Guest breakdown ---------- */
  const [guestBreakdown, setGuestBreakdown] = useState<GuestBreakdown>(() => {
    const saved = (formData.preferences as any)?.guestBreakdown as GuestBreakdown | undefined;
    if (saved) return saved;

    const fallback = formData.preferences?.travelerCount || 1;
    return { adult: fallback, child: 0, infant: 0 };
  });

  const totalGuests = useMemo(() => {
    return guestBreakdown.adult + guestBreakdown.child + guestBreakdown.infant;
  }, [guestBreakdown]);

  const updateGuest = (key: keyof GuestBreakdown, delta: number) => {
    setGuestBreakdown((prev) => {
      const next = { ...prev, [key]: prev[key] + delta };

      // no negatives
      next.adult = Math.max(0, next.adult);
      next.child = Math.max(0, next.child);
      next.infant = Math.max(0, next.infant);

      // rule: if child/infant exists -> require 1 adult
      if ((next.child > 0 || next.infant > 0) && next.adult === 0) {
        next.adult = 1;
      }

      // rule: total must be at least 1
      if (next.adult + next.child + next.infant === 0) {
        next.adult = 1;
      }

      // max 20 (keep your old cap)
      if (next.adult + next.child + next.infant > 20) return prev;

      return next;
    });
  };

  /* ---------- Cities ---------- */

  const { height: screenHeight } = Dimensions.get("window");
  const maxDropdownHeight = useMemo(() => screenHeight * 0.4, [screenHeight]);

  const [cities, setCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState<boolean>(true);
  const [cityError, setCityError] = useState<string | null>(null);

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

  /* ---------- Sync to parent formData ---------- */

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      title: title,
    }));
  }, [title]);

  useEffect(() => {
    if (localCity) {
      setFormData({
        ...formData,
        city: localCity,
      });
    }
  }, [localCity]);

  useEffect(() => {
    if (startDate || endDate) {
      setFormData({
        ...formData,
        start_date: startDate,
        end_date: endDate,
      });
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      setStartDate(formData.start_date);
      setEndDate(formData.end_date);
      setMarkedDates(getDateRange(formData.start_date, formData.end_date));
    }
  }, []);

  useEffect(() => {
    if (localCity && cities.length > 0) {
      const selectedCity = cities.find((c) => c.value === localCity);
      if (selectedCity) setSelectedLabel(selectedCity.label);
    }
  }, [localCity, cities]);

  useEffect(() => {
    Animated.timing(dropdownHeight, {
      toValue: dropdownOpen ? maxDropdownHeight : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [dropdownOpen, maxDropdownHeight]);

  /* ---------- UI actions ---------- */

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
    if (showCalendar) setShowCalendar(false);
    Keyboard.dismiss();
  };

  const toggleCalendar = () => {
    setShowCalendar(!showCalendar);
    if (dropdownOpen) setDropdownOpen(false);
    Keyboard.dismiss();
  };

  const isValid = () => {
    return (
      title.trim() !== "" &&
      localCity !== null &&
      startDate !== "" &&
      endDate !== "" &&
      selectedCompanion !== null &&
      totalGuests > 0
    );
  };

  const handleNext = () => {
    if (!isValid()) return;

    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...(prev.preferences ?? { travelerCount: 1, experiences: [] }),
        travelCompanion: selectedCompanion!,
        // NEW
        guestBreakdown,
        travelerCount: totalGuests,
      },
    }));

    onNext();
  };

  const selectCity = (city: City) => {
    setLocalCity(city.value);
    setSelectedLabel(city.label);
    setDropdownOpen(false);
  };

  const selectCompanion = (companion: TravelCompanion) => {
    setSelectedCompanion(companion);

    // Set a sensible default breakdown
    if (companion === "Solo") setGuestBreakdown({ adult: 1, child: 0, infant: 0 });
    else if (companion === "Partner") setGuestBreakdown({ adult: 2, child: 0, infant: 0 });
    else if (companion === "Friends") setGuestBreakdown({ adult: 3, child: 0, infant: 0 });
    else if (companion === "Family") setGuestBreakdown({ adult: 2, child: 1, infant: 0 });
    else setGuestBreakdown({ adult: 1, child: 0, infant: 0 });
  };

  const retryLoadCities = async () => {
    try {
      setLoadingCities(true);
      setCityError(null);
      const fetchedCities = await fetchDestinations();
      setCities(fetchedCities);
    } catch {
      setCityError("Failed to load cities. Please try again.");
    } finally {
      setLoadingCities(false);
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return format(date, "MMM dd, yyyy");
  };

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

        const markedRange = getDateRange(
          startDate,
          selectedDate < startDate ? startDate : selectedDate
        );
        setMarkedDates(markedRange);
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

  const renderCompanionCard = (companion: TravelCompanion) => {
    const selected = selectedCompanion === companion;
    const subtitle =
      companion === "Solo"
        ? "Just you"
        : companion === "Partner"
          ? "Two people"
          : companion === "Friends"
            ? "Small group"
            : companion === "Family"
              ? "Family trip"
              : "We'll adapt";

    return (
      <Pressable
        key={`companion-${companion}`}
        onPress={() => selectCompanion(companion)}
        className={`rounded-2xl px-4 py-2 w-[48%] mb-3 ${selected ? "border-primary bg-indigo-100" : "border-gray-200 bg-gray-50"
          }`}
      >
        <View>
          <View className="flex flex-row items-center justify-between">
            <Text className="text-lg font-onest text-black/90">{companion}</Text>
            {selected && (
              <Ionicons name="checkmark-circle" size={18} color="#4F46E5" />
            )}
          </View>
          <Text className="text-xs text-black/50 font-onest mt-1">{subtitle}</Text>
        </View>
      </Pressable>
    );
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
        onScrollBeginDrag={() => Keyboard.dismiss()}
      >
        <View className="flex-1 p-4">
          <View className="text-center py-2">
            <Text className="text-center text-xl font-onest-semibold mb-2">
              Plan your perfect journey
            </Text>
            <Text className="text-center text-sm text-black/50 font-onest mb-6 w-11/12 m-auto">
              Tell us where you're going, when, and who you're traveling with.
            </Text>

            <View className="flex justify-evenly gap-4 border-t pt-8 border-gray-200 relative">
              {/* Title */}
              <View className="pb-4 z-10">
                <Text className="font-onest-medium py-2">Itinerary Title</Text>
                <TextInput
                  className={`px-3 py-3 border ${title.trim() ? "border-primary" : "border-gray-300"
                    } rounded-xl text-base font-onest`}
                  placeholder="e.g., Summer Adventure in Bacolod"
                  placeholderTextColor="#9CA3AF"
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
                {title.length > 0 && (
                  <Text className="text-xs text-black/50 font-onest mt-1 text-right">
                    {title.length}/100
                  </Text>
                )}
              </View>

              {/* City */}
              <View className="pb-4 z-10">
                <Text className="font-onest-medium py-2">Where are you going?</Text>
                <TouchableOpacity
                  className={`flex-row items-center justify-between px-3 py-3 border ${dropdownOpen ? "border-primary" : "border-gray-300"
                    } rounded-xl`}
                  onPress={toggleDropdown}
                  activeOpacity={0.7}
                  disabled={loadingCities}
                >
                  {loadingCities ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator size="small" color="#4F46E5" />
                      <Text className="text-black/50 ml-2">Loading destinations...</Text>
                    </View>
                  ) : (
                    <Text
                      className={`text-base ${localCity ? "text-black font-onest" : "text-black/50"
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

                {cityError && (
                  <View className="mt-2 p-2 bg-red-50 rounded-xl">
                    <Text className="text-red-600 text-sm font-onest">{cityError}</Text>
                    <TouchableOpacity onPress={retryLoadCities} className="mt-1" activeOpacity={0.7}>
                      <Text className="text-red-600 text-sm font-onest-medium underline">
                        Retry
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

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
                          <Text className="text-black/50 text-base font-onest">
                            No destinations available
                          </Text>
                        </View>
                      ) : (
                        cities.map((city, index) => (
                          <TouchableOpacity
                            key={`${city.value}-${index}`}
                            className={`px-4 py-3 ${index < cities.length - 1 ? "border-b border-gray-200" : ""
                              }`}
                            onPress={() => selectCity(city)}
                            activeOpacity={0.7}
                          >
                            <View className="flex-row justify-between items-center">
                              <Text className="text-base font-onest">{city.label}</Text>
                              <Text className="text-xs text-black/50 font-onest">
                                {city.experienceCount}{" "}
                                {city.experienceCount === 1 ? "Activity" : "Activities"}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Dates */}
              <View className="pb-4 mt-4 z-9">
                <Text className="font-onest-medium py-2">When are you traveling?</Text>
                <TouchableOpacity
                  className={`flex-row items-center justify-between px-3 py-3 border ${showCalendar ? "border-primary" : "border-gray-300"
                    } rounded-xl`}
                  onPress={toggleCalendar}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`text-base ${startDate ? "text-black font-onest" : "text-black/50"
                      }`}
                  >
                    {startDate && endDate
                      ? `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`
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

                {showCalendar && (
                  <View className="border border-gray-200 rounded-xl mt-1 z-20">
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
                      style={{ height: 350 }}
                    />
                    <View className="p-3 border-t border-gray-200">
                      <Text className="text-center text-sm text-black/50 font-onest mb-1">
                        {selectingEndDate ? "Now select your end date" : "Select your travel dates"}
                      </Text>
                    </View>
                  </View>
                )}

                {startDate && !showCalendar && (
                  <View className="flex-row justify-between mt-2">
                    <View className="flex-1">
                      <Text className="text-xs text-black/50 font-onest">Start Date</Text>
                      <Text className="text-sm font-onest-medium">{formatDisplayDate(startDate)}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-black/50 font-onest">End Date</Text>
                      <Text className="text-sm font-onest-medium">
                        {endDate ? formatDisplayDate(endDate) : "Not selected"}
                      </Text>
                    </View>
                    {startDate && endDate && (
                      <View className="flex-1">
                        <Text className="text-xs text-black/50 font-onest">Duration</Text>
                        <Text className="text-sm font-onest-medium">
                          {differenceInDays(new Date(endDate), new Date(startDate)) + 1} days
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Companion */}
              <View className="pb-4 mt-4">
                <Text className="font-onest-medium py-2 text-lg">Who's traveling?</Text>
                <Text className="text-sm text-black/50 font-onest mb-4">
                  Group size affects pricing suggestions.
                </Text>

                <View className="flex-row flex-wrap justify-between">
                  {companionOptions.map((companion) => renderCompanionCard(companion))}
                </View>

                {/* NEW Guest Breakdown UI (replaces old travelerCount stepper) */}
                {selectedCompanion && selectedCompanion !== "Solo" && (
                  <View className="mt-4 py-4">
                    <Text className="font-onest-medium py-2 text-lg">Guest breakdown</Text>
                    <Text className="text-sm text-black/50 font-onest mb-3">
                      Enter the number of adults, children, and infants.
                    </Text>

                    {/* Adults */}
                    <View className="flex-row items-center justify-between py-2">
                      <View>
                        <Text className="font-onest-medium text-base text-black/90">Adults</Text>
                        <Text className="text-xs text-black/50 font-onest">Age 13+</Text>
                      </View>
                      <View className="flex-row items-center gap-3">
                        <Pressable
                          onPress={() => updateGuest("adult", -1)}
                          className="bg-white border border-gray-200 rounded-xl p-3"
                        >
                          <Ionicons name="remove" size={20} color="#374151" />
                        </Pressable>
                        <Text className="font-onest-bold text-lg w-6 text-center">
                          {guestBreakdown.adult}
                        </Text>
                        <Pressable
                          onPress={() => updateGuest("adult", +1)}
                          className="bg-white border border-gray-200 rounded-xl p-3"
                        >
                          <Ionicons name="add" size={20} color="#374151" />
                        </Pressable>
                      </View>
                    </View>

                    {/* Children */}
                    <View className="flex-row items-center justify-between py-2">
                      <View>
                        <Text className="font-onest-medium text-base text-black/90">Children</Text>
                        <Text className="text-xs text-black/50 font-onest">Age 3–12</Text>
                      </View>
                      <View className="flex-row items-center gap-3">
                        <Pressable
                          onPress={() => updateGuest("child", -1)}
                          className="bg-white border border-gray-200 rounded-xl p-3"
                        >
                          <Ionicons name="remove" size={20} color="#374151" />
                        </Pressable>
                        <Text className="font-onest-bold text-lg w-6 text-center">
                          {guestBreakdown.child}
                        </Text>
                        <Pressable
                          onPress={() => updateGuest("child", +1)}
                          className="bg-white border border-gray-200 rounded-xl p-3"
                        >
                          <Ionicons name="add" size={20} color="#374151" />
                        </Pressable>
                      </View>
                    </View>

                    {/* Infants */}
                    <View className="flex-row items-center justify-between py-2">
                      <View>
                        <Text className="font-onest-medium text-base text-black/90">Infants</Text>
                        <Text className="text-xs text-black/50 font-onest">Age 0–2</Text>
                      </View>
                      <View className="flex-row items-center gap-3">
                        <Pressable
                          onPress={() => updateGuest("infant", -1)}
                          className="bg-white border border-gray-200 rounded-xl p-3"
                        >
                          <Ionicons name="remove" size={20} color="#374151" />
                        </Pressable>
                        <Text className="font-onest-bold text-lg w-6 text-center">
                          {guestBreakdown.infant}
                        </Text>
                        <Pressable
                          onPress={() => updateGuest("infant", +1)}
                          className="bg-white border border-gray-200 rounded-xl p-3"
                        >
                          <Ionicons name="add" size={20} color="#374151" />
                        </Pressable>
                      </View>
                    </View>

                    {/* Total */}
                    <View className="mt-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                      <Text className="text-sm text-indigo-700 font-onest">
                        Total guests: <Text className="font-onest-bold">{totalGuests}</Text>
                      </Text>
                      {(guestBreakdown.child > 0 || guestBreakdown.infant > 0) &&
                        guestBreakdown.adult === 0 && (
                          <Text className="text-xs text-indigo-700 font-onest mt-1">
                            At least 1 adult is required when traveling with children or infants.
                          </Text>
                        )}
                    </View>
                  </View>
                )}

                {selectedCompanion === "Solo" && (
                  <View className="mt-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <Text className="text-xs text-indigo-700 font-onest">
                      ✨ Solo travel — costs calculated for 1 person
                    </Text>
                  </View>
                )}
              </View>

              {/* Submit */}
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
