import { Experience } from "@/types/experienceTypes";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import API_URL from "../../../../constants/api";
import { ItineraryFormData } from "./Step2Preference";

// ✅ Updated interface with price and unit
interface ItineraryItem {
  experience_id: number;
  experience_name?: string;
  day_number: number;
  start_time: string;
  end_time: string;
  price?: number;
  unit?: string;
  custom_note?: string;
}

interface StepProps {
  formData: ItineraryFormData;
  setFormData: React.Dispatch<React.SetStateAction<ItineraryFormData>>;
  onNext: () => void;
  onBack: () => void;
}

interface AvailabilityInfo {
  availability_id: number;
  experience_id: number;
  day_of_week: string;
  time_slots: TimeSlot[];
}

interface TimeSlot {
  slot_id: number;
  availability_id: number;
  start_time: string;
  end_time: string;
}

interface CalendarDay {
  date: Date;
  dayNumber: number;
  dayName: string;
  items: ItineraryItem[];
  isToday?: boolean;
}

interface UnassignedExperience {
  experience_id: number;
  title: string;
  duration: string;
  isAssigned: boolean;
}

const Step4Calendar: React.FC<StepProps> = ({
  formData,
  setFormData,
  onNext,
  onBack,
}) => {
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [unassignedExperiences, setUnassignedExperiences] = useState<UnassignedExperience[]>([]);
  const [selectedItem, setSelectedItem] = useState<ItineraryItem | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [timeSlotModalVisible, setTimeSlotModalVisible] = useState(false);
  const [daySelectionModalVisible, setDaySelectionModalVisible] = useState(false);
  const [selectedUnassignedExperience, setSelectedUnassignedExperience] = useState<UnassignedExperience | null>(null);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  useEffect(() => {
    const resetItems = (formData.items || []).map((item) => ({
      ...item,
      day_number: 0,
      start_time: "",
      end_time: "",
    }));

    if (resetItems.length > 0) {
      setFormData({
        ...formData,
        items: resetItems,
      });
    }
  }, []);

  useEffect(() => {
    const generateCalendarDays = () => {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      const days: CalendarDay[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let currentDate = new Date(startDate);
      let dayCounter = 1;

      while (currentDate <= endDate) {
        const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][currentDate.getDay()];
        const dayItems = (formData.items || []).filter((item) => item.day_number === dayCounter && item.start_time && item.end_time);

        const calendarDay: CalendarDay = {
          date: new Date(currentDate),
          dayNumber: dayCounter,
          dayName,
          items: dayItems,
          isToday: currentDate.getTime() === today.getTime(),
        };

        days.push(calendarDay);
        currentDate.setDate(currentDate.getDate() + 1);
        dayCounter++;
      }

      setCalendarDays(days);
    };

    generateCalendarDays();
  }, [formData.start_date, formData.end_date, formData.items]);

  useEffect(() => {
    const generateUnassignedExperiences = () => {
      const assignedExperienceIds = (formData.items || [])
        .filter((item) => item.start_time && item.end_time)
        .map((item) => item.experience_id);

      const allSelectedExperiences = formData.items || [];

      const unassigned = allSelectedExperiences
        .filter((item) => !assignedExperienceIds.includes(item.experience_id))
        .map((item) => {
          const experienceData = experiences.find((exp) => exp.id === item.experience_id);
          return {
            experience_id: item.experience_id,
            title: experienceData?.title || item.experience_name || `Experience ${item.experience_id}`,
            duration: "2 hours",
            isAssigned: false,
          };
        });

      const uniqueUnassigned = unassigned.filter(
        (experience, index, self) =>
          index === self.findIndex((e) => e.experience_id === experience.experience_id)
      );

      setUnassignedExperiences(uniqueUnassigned);
    };

    generateUnassignedExperiences();
  }, [formData.items, experiences]);

  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        setLoadingAvailability(true);
        const uniqueExperienceIds = [...new Set((formData.items || []).map((item) => item.experience_id))];

        const experiencePromises = uniqueExperienceIds.map(async (experienceId) => {
          try {
            const experienceResponse = await fetch(`${API_URL}/experience/${experienceId}`);
            let experienceTitle = `Experience ${experienceId}`;

            if (experienceResponse.ok) {
              const experienceData = await experienceResponse.json();
              experienceTitle = experienceData.title || experienceTitle;
            }

            const availabilityResponse = await fetch(`${API_URL}/experience/availability/${experienceId}`);
            let availabilityData = { availability: [] };

            if (availabilityResponse.ok) {
              availabilityData = await availabilityResponse.json();
            }

            return {
              id: experienceId,
              title: experienceTitle,
              description: "",
              price: 0,
              unit: "PHP",
              destination_name: formData.city,
              location: formData.city,
              tags: [],
              images: [],
              availability: availabilityData.availability || [],
              budget_category: "Budget-friendly" as const,
            };
          } catch (error) {
            console.error(`Error fetching data for experience ${experienceId}:`, error);
            return {
              id: experienceId,
              title: `Experience ${experienceId}`,
              description: "",
              price: 0,
              unit: "PHP",
              destination_name: formData.city,
              location: formData.city,
              tags: [],
              images: [],
              availability: [],
              budget_category: "Budget-friendly" as const,
            };
          }
        });

        const fetchedExperiences = await Promise.all(experiencePromises);
        setExperiences(fetchedExperiences);
      } catch (error) {
        console.error("Error fetching experiences:", error);
        setExperiences([]);
      } finally {
        setLoadingAvailability(false);
      }
    };

    if (formData.items && formData.items.length > 0) {
      fetchExperiences();
    }
  }, [formData.items, formData.city]);

  const handleRemoveUnassignedExperience = (experience: UnassignedExperience) => {
    Alert.alert(
      "Remove Experience",
      `Are you sure you want to remove "${experience.title}" from your itinerary?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            const updatedItems = (formData.items || []).filter(
              (item) => item.experience_id !== experience.experience_id
            );
            setFormData({ ...formData, items: updatedItems });
          },
        },
      ]
    );
  };

  const handleUnassignedExperienceClick = (experience: UnassignedExperience) => {
    setSelectedUnassignedExperience(experience);
    setDaySelectionModalVisible(true);
  };

  const handleDaySelection = async (day: CalendarDay) => {
    if (!selectedUnassignedExperience) return;

    setSelectedDay(day);
    setDaySelectionModalVisible(false);

    const experience = experiences.find((exp) => exp.id === selectedUnassignedExperience.experience_id);
    if (!experience) {
      Alert.alert("Error", "Experience data not found");
      return;
    }

    const dayAvailability = experience.availability.find((avail) => avail.day_of_week === day.dayName);

    if (!dayAvailability || !dayAvailability.time_slots || dayAvailability.time_slots.length === 0) {
      Alert.alert("No Availability", `This experience is not available on ${day.dayName}. Please select a different day.`);
      return;
    }

    const dayItems = day.items;
    const availableSlots = dayAvailability.time_slots.filter((slot) => {
      const slotStart = slot.start_time;
      const slotEnd = slot.end_time;
      return !dayItems.some((item) => {
        const itemStart = item.start_time + ":00";
        const itemEnd = item.end_time + ":00";
        return slotStart < itemEnd && slotEnd > itemStart;
      });
    });

    if (availableSlots.length === 0) {
      Alert.alert("No Available Slots", `All time slots for this experience are conflicting with your existing schedule on ${day.dayName}.`);
      return;
    }

    setAvailableTimeSlots(availableSlots);
    setTimeSlotModalVisible(true);
  };

  const handleAssignedItemClick = (item: ItineraryItem, day: CalendarDay) => {
    const experience = experiences.find((exp) => exp.id === item.experience_id);
    if (!experience) {
      Alert.alert("Error", "Experience data not found");
      return;
    }

    setSelectedItem(item);
    setSelectedExperience(experience);
    setSelectedDay(day);

    const dayAvailability = experience.availability.find((avail) => avail.day_of_week === day.dayName);

    if (!dayAvailability || !dayAvailability.time_slots || dayAvailability.time_slots.length === 0) {
      Alert.alert("No Availability", `This experience has no available time slots on ${day.dayName}.`);
      return;
    }

    const otherDayItems = day.items.filter((dayItem) => dayItem.experience_id !== item.experience_id);
    const availableSlots = dayAvailability.time_slots.filter((slot) => {
      const slotStart = slot.start_time;
      const slotEnd = slot.end_time;
      return !otherDayItems.some((dayItem) => {
        const itemStart = dayItem.start_time + ":00";
        const itemEnd = dayItem.end_time + ":00";
        return slotStart < itemEnd && slotEnd > itemStart;
      });
    });

    setAvailableTimeSlots(availableSlots);
    setTimeSlotModalVisible(true);
  };

  // ✅ FIXED: Preserves price, unit, and experience_name
  const handleTimeSlotSelect = (timeSlot: TimeSlot) => {
    if (selectedUnassignedExperience && selectedDay) {
      const originalItem = (formData.items || []).find(
        (item) => item.experience_id === selectedUnassignedExperience.experience_id
      );

      const newItem: ItineraryItem = {
        experience_id: selectedUnassignedExperience.experience_id,
        day_number: selectedDay.dayNumber,
        start_time: timeSlot.start_time.substring(0, 5),
        end_time: timeSlot.end_time.substring(0, 5),
        custom_note: originalItem?.custom_note || "",
        experience_name: originalItem?.experience_name || selectedUnassignedExperience.title,
        price: originalItem?.price,
        unit: originalItem?.unit,
      };

      const updatedItems = [...(formData.items || [])];
      const existingIndex = updatedItems.findIndex(
        (item) => item.experience_id === selectedUnassignedExperience.experience_id
      );

      if (existingIndex >= 0) {
        updatedItems[existingIndex] = newItem;
      } else {
        updatedItems.push(newItem);
      }

      setFormData({ ...formData, items: updatedItems });
      setSelectedUnassignedExperience(null);
    } else if (selectedItem) {
      const updatedItems = (formData.items || []).map((item) => {
        if (item.experience_id === selectedItem.experience_id && item.day_number === selectedItem.day_number) {
          return {
            ...item,
            start_time: timeSlot.start_time.substring(0, 5),
            end_time: timeSlot.end_time.substring(0, 5),
          };
        }
        return item;
      });

      setFormData({ ...formData, items: updatedItems });
      setSelectedItem(null);
      setSelectedExperience(null);
    }

    setSelectedDay(null);
    setTimeSlotModalVisible(false);
  };

  const handleRemoveItem = (item: ItineraryItem) => {
    Alert.alert("Remove Experience", "Are you sure you want to remove this experience from your schedule?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          const updatedItems = (formData.items || []).map((formItem) => {
            if (formItem.experience_id === item.experience_id) {
              return { ...formItem, day_number: 0, start_time: "", end_time: "" };
            }
            return formItem;
          });
          setFormData({ ...formData, items: updatedItems });
        },
      },
    ]);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const formatTime = (timeString: string) => {
    if (timeString.includes(":")) {
      const [hours, minutes] = timeString.split(":");
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${ampm}`;
    }
    return timeString;
  };

  const isScheduleComplete = () => {
    return unassignedExperiences.length === 0;
  };

  const renderUnassignedExperience = (experience: UnassignedExperience) => (
    <TouchableOpacity
      key={experience.experience_id}
      className="p-3 bg-gray-50 rounded-lg mb-2 flex-row items-center justify-between border border-dashed border-gray-300"
      onPress={() => handleUnassignedExperienceClick(experience)}
      activeOpacity={0.7}
    >
      <View className="flex-1">
        <Text className="font-onest-semibold text-base text-gray-800">{experience.title}</Text>
        <View className="flex-row items-center mt-1">
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text className="text-sm text-gray-600 ml-1 font-onest">Duration: {experience.duration}</Text>
        </View>
      </View>
      <View className="flex-row items-center">
        <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleRemoveUnassignedExperience(experience); }} className="p-2 mr-2" activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
        <Text className="text-sm text-primary font-onest-medium mr-2">Add to day</Text>
        <Ionicons name="add-circle-outline" size={20} color="#4F46E5" />
      </View>
    </TouchableOpacity>
  );

  const renderCalendarDay = (day: CalendarDay) => (
    <View key={day.dayNumber} className="mb-4">
      <View className={`p-3 rounded-t-lg ${day.isToday ? "bg-primary" : "bg-gray-100"}`}>
        <Text className={`font-onest-semibold text-base ${day.isToday ? "text-white" : "text-gray-800"}`}>
          Day {day.dayNumber} - {formatDate(day.date)}
        </Text>
        <Text className={`font-onest-medium text-sm ${day.isToday ? "text-white/80" : "text-gray-600"}`}>
          {day.dayName}
        </Text>
      </View>
      <View className="border-l border-r border-b border-gray-200 rounded-b-lg min-h-16">
        {day.items.length > 0 ? (
          day.items.sort((a, b) => a.start_time.localeCompare(b.start_time)).map((item, index) => (
            <View key={`${item.experience_id}-${item.day_number}-${index}`} className="p-3 border-b border-gray-100 last:border-b-0">
              <TouchableOpacity className="flex-row items-center justify-between" onPress={() => handleAssignedItemClick(item, day)} activeOpacity={0.7}>
                <View className="flex-1">
                  <Text className="font-onest-semibold text-base text-gray-800">
                    {experiences.find((exp) => exp.id === item.experience_id)?.title || item.experience_name || `Experience ${item.experience_id}`}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Ionicons name="time-outline" size={16} color="#4F46E5" />
                    <Text className="text-sm text-gray-600 ml-1 font-onest-medium">
                      {formatTime(item.start_time + ":00")} - {formatTime(item.end_time + ":00")}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <TouchableOpacity onPress={() => handleRemoveItem(item)} className="p-1 mr-2" activeOpacity={0.7}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View className="p-4 items-center justify-center flex-1">
            <Ionicons name="calendar-outline" size={24} color="#D1D5DB" />
            <Text className="text-gray-400 font-onest text-sm mt-1">No experiences scheduled</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loadingAvailability) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-2 text-gray-600">Loading availability...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="p-4 flex-1">
          <View className="text-center py-2">
            <Text className="text-center text-xl font-onest-semibold mb-2">Schedule Your Experiences</Text>
            <Text className="text-center text-sm text-gray-500 font-onest mb-6 w-11/12 m-auto">
              Assign your selected experiences to specific days and time slots.
            </Text>
          </View>

          <View className="bg-indigo-50 p-4 rounded-lg mb-6">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="font-onest-semibold text-base text-primary">{calendarDays.length} Days Trip</Text>
                <Text className="font-onest text-sm text-gray-600">{(formData.items || []).length} experiences to schedule</Text>
              </View>
              <View className="items-end">
                <Text className="font-onest-medium text-sm text-gray-600">
                  {formatDate(new Date(formData.start_date))} - {formatDate(new Date(formData.end_date))}
                </Text>
              </View>
            </View>
          </View>

          {unassignedExperiences.length > 0 && (
            <View className="mb-6">
              <Text className="font-onest-semibold text-lg mb-3 text-gray-800">
                Experiences to Schedule ({unassignedExperiences.length})
              </Text>
              {unassignedExperiences.map(renderUnassignedExperience)}
            </View>
          )}

          {unassignedExperiences.length > 0 && (
            <View className="bg-yellow-50 p-3 rounded-lg mb-4 flex-row items-center">
              <Ionicons name="information-circle-outline" size={20} color="#F59E0B" />
              <Text className="text-sm text-yellow-700 ml-2 flex-1 font-onest">
                Tap on unscheduled experiences above to assign them to specific days
              </Text>
            </View>
          )}

          <Text className="font-onest-semibold text-lg mb-3 text-gray-800">Your Itinerary</Text>
          {calendarDays.map(renderCalendarDay)}
        </View>
      </ScrollView>

      <Modal animationType="slide" transparent={true} visible={daySelectionModalVisible} onRequestClose={() => setDaySelectionModalVisible(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl h-[32rem]">
            <View className="p-4 border-b border-gray-200">
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-onest-semibold">Select Day</Text>
                <TouchableOpacity onPress={() => setDaySelectionModalVisible(false)} className="p-1">
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>
              {selectedUnassignedExperience && (
                <Text className="text-sm text-gray-600 mt-1 font-onest">{selectedUnassignedExperience.title}</Text>
              )}
            </View>
            <ScrollView className="flex-1">
              {calendarDays.map((day) => {
                const experience = experiences.find((exp) => exp.id === selectedUnassignedExperience?.experience_id);
                const hasAvailability = experience?.availability.some((avail) => avail.day_of_week === day.dayName) || false;
                return (
                  <TouchableOpacity
                    key={day.dayNumber}
                    className={`p-4 border-b border-gray-100 flex-row items-center justify-between ${!hasAvailability ? "opacity-50" : ""}`}
                    onPress={() => (hasAvailability ? handleDaySelection(day) : null)}
                    activeOpacity={hasAvailability ? 0.7 : 1}
                    disabled={!hasAvailability}
                  >
                    <View>
                      <Text className="text-base font-onest-semibold">Day {day.dayNumber} - {day.dayName}</Text>
                      <Text className="text-sm text-gray-600 font-onest">{formatDate(day.date)}</Text>
                      <Text className="text-xs text-gray-500 font-onest mt-1">
                        {day.items.length} experience{day.items.length !== 1 ? "s" : ""} scheduled
                      </Text>
                      {!hasAvailability && <Text className="text-xs text-red-500 font-onest mt-1">Not available on this day</Text>}
                    </View>
                    {hasAvailability && <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent={true} visible={timeSlotModalVisible} onRequestClose={() => setTimeSlotModalVisible(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl h-[32rem]">
            <View className="p-4 border-b border-gray-200">
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-onest-semibold">Select Time Slot</Text>
                <TouchableOpacity onPress={() => setTimeSlotModalVisible(false)} className="p-1">
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>
              <Text className="text-sm text-gray-600 mt-1 font-onest">
                {selectedUnassignedExperience?.title || `Experience ${selectedItem?.experience_id}`}
              </Text>
              {selectedDay && (
                <Text className="text-xs text-gray-500 mt-1 font-onest">{selectedDay.dayName}, {formatDate(selectedDay.date)}</Text>
              )}
            </View>
            <ScrollView className="flex-1">
              {availableTimeSlots.length > 0 ? (
                availableTimeSlots.map((slot) => (
                  <TouchableOpacity
                    key={slot.slot_id}
                    className="p-4 border-b border-gray-100 flex-row items-center justify-between"
                    onPress={() => handleTimeSlotSelect(slot)}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="time-outline" size={20} color="#4F46E5" />
                      <Text className="text-base font-onest-medium ml-3">
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                ))
              ) : (
                <View className="p-4 items-center">
                  <Ionicons name="time-outline" size={24} color="#D1D5DB" />
                  <Text className="text-gray-500 font-onest text-center mt-2">No available time slots for this day</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View className="p-4 border-t border-gray-200 bg-white">
        <View className="flex-row justify-between">
          <TouchableOpacity onPress={onBack} className="py-4 px-6 rounded-xl border border-gray-300" activeOpacity={0.7}>
            <Text className="text-center font-onest-medium text-base text-gray-700">Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onNext}
            className={`py-4 px-8 rounded-xl ${isScheduleComplete() ? "bg-primary" : "bg-gray-300"}`}
            activeOpacity={0.7}
            disabled={!isScheduleComplete()}
          >
            <Text className={`text-center font-onest-medium text-base ${isScheduleComplete() ? "text-white" : "text-gray-500"}`}>
              Finalize Itinerary
            </Text>
          </TouchableOpacity>
        </View>
        {!isScheduleComplete() && (
          <Text className="text-center text-sm text-gray-500 font-onest mt-2">Schedule all experiences to continue</Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default Step4Calendar;