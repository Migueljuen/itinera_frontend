import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import API_URL from '../../../../constants/api';

// Types matching your API response
interface ItineraryItem {
  item_id: number;
  experience_id: number;
  day_number: number;
  start_time: string;
  end_time: string;
  custom_note: string;
  created_at: string;
  updated_at: string;
  experience_name: string;
  experience_description: string;
  destination_name: string;
  destination_city: string;
  images: string[];
  primary_image: string;
}

interface Itinerary {
  itinerary_id: number;
  traveler_id: number;
  start_date: string;
  end_date: string;
  title: string;
  notes: string;
  created_at: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  items: ItineraryItem[];
}

interface TimeSlot {
  slot_id: number;
  availability_id: number;
  start_time: string;
  end_time: string;
}

interface AvailableTimeSlot extends TimeSlot {
  is_available: boolean;
  conflicting_items?: ItineraryItem[];
}

export default function EditItineraryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [editedItems, setEditedItems] = useState<ItineraryItem[]>([]);
  const [deletedItems, setDeletedItems] = useState<number[]>([]);

  // Modal states
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<AvailableTimeSlot[]>([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);

  useEffect(() => {
    if (id) {
      fetchItineraryDetails();
    }
  }, [id]);

  const fetchItineraryDetails = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "Authentication token not found");
        router.back();
        return;
      }

      const response = await fetch(`${API_URL}/itinerary/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const itineraryData = data.itinerary || data;
      setItinerary(itineraryData);
      setEditedItems([...itineraryData.items]);
    } catch (error) {
      console.error("Error fetching itinerary details:", error);
      Alert.alert("Error", "Failed to load itinerary details");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTimeSlots = async (experienceId: number, dayNumber: number) => {
    setLoadingTimeSlots(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      // Calculate the actual date for the day number
      const startDate = new Date(itinerary!.start_date);
      const targetDate = new Date(startDate);
      targetDate.setDate(startDate.getDate() + dayNumber - 1);
      const dayOfWeek = targetDate
        .toLocaleDateString('en-US', { weekday: 'long' })
        .toLowerCase();

      const response = await fetch(
        `${API_URL}/experience/${experienceId}/availability?day=${dayOfWeek}&date=${targetDate.toISOString().split('T')[0]}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API response:', data);

      // The backend returns: { experience_id, requested_day, availability: [...] }
      let timeSlots: TimeSlot[] = [];

      if (data.availability && Array.isArray(data.availability)) {
        // Each availability object contains a time_slots array
        data.availability.forEach((availability: any) => {
          if (availability.time_slots && Array.isArray(availability.time_slots)) {
            timeSlots = timeSlots.concat(availability.time_slots);
          }
        });
      }

      console.log('Extracted time slots:', timeSlots);

      // Check each time slot for conflicts with existing itinerary items
      const slotsWithAvailability = timeSlots.map((slot: TimeSlot) => {
        const conflictingItems = editedItems.filter(item =>
          item.day_number === dayNumber &&
          item.item_id !== editingItem?.item_id &&
          isTimeOverlapping(slot.start_time, slot.end_time, item.start_time, item.end_time)
        );

        return {
          ...slot,
          is_available: conflictingItems.length === 0,
          conflicting_items: conflictingItems
        };
      });

      setAvailableTimeSlots(slotsWithAvailability);

    } catch (error) {
      console.error("Error fetching available time slots:", error);
      Alert.alert("Error", "Failed to load available time slots");
      setAvailableTimeSlots([]);
    } finally {
      setLoadingTimeSlots(false);
    }
  };


  const isTimeOverlapping = (start1: string, end1: string, start2: string, end2: string) => {
    const s1 = new Date(`2000-01-01T${start1}`);
    const e1 = new Date(`2000-01-01T${end1}`);
    const s2 = new Date(`2000-01-01T${start2}`);
    const e2 = new Date(`2000-01-01T${end2}`);

    return s1 < e2 && s2 < e1;
  };

  const handleEditTime = async (item: ItineraryItem) => {
    setEditingItem(item);
    setShowTimeModal(true);
    await fetchAvailableTimeSlots(item.experience_id, item.day_number);
  };

  const handleTimeSlotSelect = (timeSlot: AvailableTimeSlot) => {
    if (!timeSlot.is_available) {
      // Fix: Use a simple approach to get conflict names without React seeing .map()
      const conflictNames = timeSlot.conflicting_items
        ? timeSlot.conflicting_items.reduce((acc, item, index) => {
          return acc + (index > 0 ? ', ' : '') + item.experience_name;
        }, '')
        : '';

      Alert.alert(
        "Time Conflict",
        `This time slot conflicts with: ${conflictNames}`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Select Anyway",
            onPress: () => confirmTimeSlotSelection(timeSlot)
          }
        ]
      );
      return;
    }

    confirmTimeSlotSelection(timeSlot);
  };

  const confirmTimeSlotSelection = (timeSlot: TimeSlot) => {
    if (!editingItem) return;

    // Update the item in editedItems
    setEditedItems(prev => prev.map(item =>
      item.item_id === editingItem.item_id
        ? { ...item, start_time: timeSlot.start_time, end_time: timeSlot.end_time }
        : item
    ));

    setShowTimeModal(false);
    setEditingItem(null);
  };
  const handleRemoveExperience = (itemId: number) => {
    Alert.alert(
      "Remove Experience",
      "Are you sure you want to remove this experience from your itinerary?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setEditedItems(prev => prev.filter(item => item.item_id !== itemId));
            setDeletedItems(prev => [...prev, itemId]);
          }
        }
      ]
    );
  };

  const handleSaveChanges = async () => {
    console.log('=== Save Button ACTUALLY Pressed ===');
    console.log('hasChanges():', hasChanges());
    console.log('saving state:', saving);

    setSaving(true);
    console.log('Set saving to true');

    try {
      const token = await AsyncStorage.getItem("token");
      console.log('Token retrieved:', token ? 'exists' : 'null');

      if (!token) {
        Alert.alert("Error", "Authentication token not found");
        return;
      }

      // Prepare updates for modified items
      const updates = editedItems
        .filter(item => {
          const original = itinerary?.items.find(orig => orig.item_id === item.item_id);
          return original && (
            original.start_time !== item.start_time ||
            original.end_time !== item.end_time ||
            original.custom_note !== item.custom_note
          );
        })
        .map(item => ({
          item_id: item.item_id,
          start_time: item.start_time,
          end_time: item.end_time,
          custom_note: item.custom_note
        }));

      console.log('Updates to send:', updates);
      console.log('Items to delete:', deletedItems);

      // Send updates to API
      const promises = [];

      // Update modified items
      if (updates.length > 0) {
        console.log('Adding update promise');
        promises.push(
          fetch(`${API_URL}/itinerary/${id}/items/bulk-update`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ updates })
          })
        );
      }

      // Delete removed items
      if (deletedItems.length > 0) {
        console.log('Adding delete promise');
        const deleteUrl = `${API_URL}/itinerary/${id}/items/bulk-delete`;
        console.log('Delete URL:', deleteUrl);
        console.log('Delete payload:', { item_ids: deletedItems });

        promises.push(
          fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ item_ids: deletedItems })
          })
        );
      }

      console.log('Total promises to execute:', promises.length);

      if (promises.length === 0) {
        console.log('No promises to execute - this might be the issue!');
        Alert.alert("Info", "No changes detected to save");
        return;
      }

      console.log('Executing promises...');
      const results = await Promise.all(promises);

      console.log('Promises completed, checking responses...');
      for (let i = 0; i < results.length; i++) {
        const response = results[i];
        console.log(`Response ${i} status:`, response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.log(`Response ${i} error:`, errorText);
          throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }
      }

      console.log('All API calls successful');
      Alert.alert("Success", "Itinerary updated successfully", [
        { text: "OK", onPress: () => router.back() }
      ]);

    } catch (error) {
      console.error("Error saving changes:", error);
      Alert.alert("Error", `Failed to save changes: `);
    } finally {
      console.log('Setting saving to false');
      setSaving(false);
    }
  };

  const formatTime = (time: string | undefined | null) => {
    if (!time) {
      console.warn('formatTime called with invalid time:', time);
      return 'Invalid Time';
    }

    // Handle different time formats
    const timeStr = String(time).trim();

    // Check if it's already formatted (e.g., "2:00 PM")
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      return timeStr;
    }

    // Handle HH:MM or HH:MM:SS format
    const parts = timeStr.split(':');
    if (parts.length < 2) {
      console.warn('Invalid time format:', timeStr);
      return timeStr;
    }

    const hours = parseInt(parts[0]) || 0;
    const minutes = parts[1] || '00';

    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;

    return `${displayHour}:${minutes} ${ampm}`;
  };


  const getImageUri = (imagePath: string) => {
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    return `${API_URL}${imagePath}`;
  };

  const groupItemsByDay = () => {
    return editedItems.reduce((acc, item) => {
      if (!acc[item.day_number]) {
        acc[item.day_number] = [];
      }
      acc[item.day_number].push(item);
      return acc;
    }, {} as Record<number, ItineraryItem[]>);
  };

  const getDateForDay = (dayNumber: number) => {
    if (!itinerary) return '';
    const startDate = new Date(itinerary.start_date);
    const targetDate = new Date(startDate);
    targetDate.setDate(startDate.getDate() + dayNumber - 1);
    return targetDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const hasChanges = () => {
    const hasDeleted = deletedItems.length > 0;
    const hasEdited = editedItems.some(item => {
      const original = itinerary?.items.find(orig => orig.item_id === item.item_id);
      return original && (
        original.start_time !== item.start_time ||
        original.end_time !== item.end_time ||
        original.custom_note !== item.custom_note
      );
    });

    console.log('=== hasChanges Debug ===');
    console.log('Deleted items:', deletedItems);
    console.log('Has deleted:', hasDeleted);
    console.log('Has edited:', hasEdited);
    console.log('Total has changes:', hasDeleted || hasEdited);

    return hasDeleted || hasEdited;
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="mt-4 text-gray-600 font-onest">Loading itinerary...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!itinerary) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <Text className="text-center text-gray-500 py-10 font-onest">Itinerary not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const groupedItems = groupItemsByDay();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-end p-8 bg-white border-b border-gray-200 ">



      </View>

      <ScrollView className="flex-1 " contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Trip Header */}
        <View className="p-4 m-4 bg-white rounded-lg border border-gray-200">
          <Text className="text-xl font-onest-semibold text-gray-800 mb-2">
            {itinerary.title}
          </Text>
          <Text className="text-sm text-gray-600 font-onest">
            Tap on time slots to view available times or remove experiences
          </Text>
        </View>

        {/* Daily Itinerary */}
        <View className="px-4 relative">
          {Object.entries(groupedItems)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([day, items]) => (
              <View key={day} className="mb-6 rounded-lg overflow-hidden border border-gray-200">
                {/* Day Header */}
                <View className="bg-white p-4 border-b border-gray-100">
                  <Text className="text-lg font-onest-semibold text-gray-800">
                    Day {day}
                  </Text>
                  <Text className="text-sm text-gray-500 font-onest">
                    {getDateForDay(parseInt(day))}
                  </Text>
                </View>

                {/* Day Items */}
                {items
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((item, index) => (
                    <View
                      key={`${day}-${item.item_id}-${index}`}
                      className={`bg-white p-4 ${index !== items.length - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                      <View className="flex-row">
                        {/* Time Column */}
                        <TouchableOpacity
                          className="w-20 items-center mr-4"
                          onPress={() => handleEditTime(item)}
                        >
                          <View className="bg-indigo-50 rounded-md p-2 items-center">
                            <Ionicons name="time-outline" size={14} color="#4F46E5" />
                            <Text className="text-xs font-onest-medium text-primary mt-1">
                              {formatTime(item.start_time)}
                            </Text>
                            <Text className="text-xs text-gray-500 font-onest">
                              {formatTime(item.end_time)}
                            </Text>
                          </View>
                          <Text className="text-xs text-primary font-onest mt-1">Change time</Text>
                        </TouchableOpacity>

                        {/* Content Column */}
                        <View className="flex-1">
                          {/* Experience Image */}
                          {item.primary_image ? (
                            <Image
                              source={{ uri: getImageUri(item.primary_image) }}
                              className="w-full h-32 rounded-md mb-3"
                              resizeMode="cover"
                            />
                          ) : (
                            <View className="w-full h-32 bg-gray-200 items-center justify-center rounded-md mb-3">
                              <Ionicons name="image-outline" size={40} color="#A0AEC0" />
                            </View>
                          )}

                          {/* Experience Details */}
                          <View className="flex-row justify-between items-start mb-2">
                            <View className="flex-1 mr-2">
                              <Text className="text-lg font-onest-semibold text-gray-800 mb-1">
                                {item.experience_name}
                              </Text>
                              <Text className="text-sm text-gray-600 font-onest mb-2">
                                {item.experience_description}
                              </Text>
                            </View>

                            {/* Remove Button */}
                            <TouchableOpacity
                              onPress={() => handleRemoveExperience(item.item_id)}
                              className="bg-red-50 p-2 rounded-md"
                            >
                              <Ionicons name="trash-outline" size={16} color="#EF4444" />
                            </TouchableOpacity>
                          </View>

                          {/* Location */}
                          <View className="flex-row items-center mb-2">
                            <Ionicons name="location-outline" size={16} color="#4F46E5" />
                            <Text className="text-sm text-gray-600 font-onest ml-1">
                              {item.destination_name}, {item.destination_city}
                            </Text>
                          </View>

                          {/* Custom Note */}
                          {item.custom_note && (
                            <View className="bg-indigo-50 rounded-md p-2 mt-2">
                              <Text className="text-xs font-onest-medium text-primary mb-1">Note</Text>
                              <Text className="text-xs text-primary font-onest">
                                {item.custom_note}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
              </View>
            ))}

        </View>
      </ScrollView>
      <TouchableOpacity
        onPress={() => {
          if (!hasChanges() || saving) {
            console.log('Button is disabled, not executing handleSaveChanges');
            return;
          }
          handleSaveChanges();
        }}
        disabled={!hasChanges() || saving}
        className={`absolute bottom-36 right-6 p-4 rounded-full shadow-md flex-row items-center ${hasChanges() && !saving ? 'bg-primary' : 'bg-gray-300'
          }`}
        style={{ zIndex: 999 }}
        activeOpacity={0.7}
      >
        {/* Icon color changes based on state */}
        <Ionicons
          name="create-outline"
          size={20}
          color={hasChanges() && !saving ? '#FFFFFF' : '#9CA3AF'} // white or gray-400
        />

        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text
            className={`font-onest-medium ml-2 ${hasChanges() && !saving ? 'text-white' : 'text-gray-500'
              }`}
          >
            Save
          </Text>
        )}
      </TouchableOpacity>


      {/* Time Slot Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showTimeModal}
        onRequestClose={() => setShowTimeModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl h-[32rem]">
            <View className="p-4 border-b border-gray-200">
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-onest-semibold">
                  Select Time Slot
                </Text>
                <TouchableOpacity
                  onPress={() => setShowTimeModal(false)}
                  className="p-1"
                >
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>
              {editingItem && (
                <Text className="text-sm text-gray-600 mt-1 font-onest">
                  {editingItem.experience_name}
                </Text>
              )}
            </View>

            <ScrollView className="flex-1">

              {loadingTimeSlots ? (
                <View className="p-4 items-center">
                  <ActivityIndicator size="large" color="#4F46E5" />
                  <Text className="text-gray-500 font-onest text-center mt-2">
                    Loading available time slots...
                  </Text>
                </View>
              ) : availableTimeSlots.length > 0 ? (
                availableTimeSlots.map((slot, slotIndex) => (
                  <TouchableOpacity
                    key={`timeslot-${slot.slot_id}-${slotIndex}`}
                    className={`p-4 border-b border-gray-100 flex-row items-center justify-between ${!slot.is_available ? 'opacity-60 bg-red-50' : ''}`}
                    onPress={() => handleTimeSlotSelect(slot)}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center flex-1">
                      <Ionicons
                        name="time-outline"
                        size={20}
                        color={slot.is_available ? "#4F46E5" : "#EF4444"}
                      />
                      <View className="ml-3 flex-1">
                        <Text className="text-base font-onest-medium">
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                        </Text>
                        {!slot.is_available && slot.conflicting_items && slot.conflicting_items.length > 0 && (
                          <View className="mt-1">
                            {slot.conflicting_items
                              .filter((item, index, self) =>
                                // Remove duplicates based on item_id or experience_name
                                index === self.findIndex(t =>
                                  (t?.item_id && t.item_id === item?.item_id) ||
                                  (t?.experience_name === item?.experience_name)
                                )
                              )
                              .map((item, conflictIndex) => (
                                <Text
                                  key={`conflict-slot-${slot.slot_id}-item-${conflictIndex}-${item?.item_id || `unnamed-${conflictIndex}`}`}
                                  className="text-xs text-red-500 font-onest"
                                >
                                  Conflicts with: {item?.experience_name || 'Unnamed experience'}
                                </Text>
                              ))}
                          </View>
                        )}
                      </View>
                    </View>
                    <View className="flex-row items-center">
                      {!slot.is_available && (
                        <Ionicons name="warning-outline" size={16} color="#EF4444" className="mr-2" />
                      )}
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View className="p-4 items-center">
                  <Ionicons name="time-outline" size={24} color="#D1D5DB" />
                  <Text className="text-gray-500 font-onest text-center mt-2">
                    No available time slots for this experience on this day
                  </Text>
                </View>
              )}


            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}