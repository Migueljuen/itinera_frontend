import dayjs from 'dayjs';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import API_URL from '../../../../constants/api';

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

export default function EditItineraryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [selectedItem, setSelectedItem] = useState<ItineraryItem | null>(null);
  const [availableSlots, setAvailableSlots] = useState<{ start_time: string; end_time: string }[]>([]);
  const [slotModalVisible, setSlotModalVisible] = useState(false);

  useEffect(() => {
    if (id) fetchItineraryDetails();
  }, [id]);

  const fetchItineraryDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/itinerary/${id}`);
      const data = await response.json();
      setItinerary(data.itinerary || data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load itinerary details');
    } finally {
      setLoading(false);
    }
  };

  const openSlotModal = async (item: ItineraryItem) => {
    const targetDate = dayjs(itinerary!.start_date).add(item.day_number - 1, 'day').format('YYYY-MM-DD');
    try {
      const res = await fetch(`${API_URL}/experience/${item.experience_id}/available-slots?date=${targetDate}&itinerary_id=${itinerary!.itinerary_id}&item_id=${item.item_id}`);
      const data = await res.json();
      setAvailableSlots(data.available_slots);
      setSelectedItem(item);
      setSlotModalVisible(true);
    } catch (err) {
      Alert.alert('Error', 'Could not load available time slots');
    }
  };

  const updateSlot = (slot: { start_time: string; end_time: string }) => {
    if (!selectedItem) return;
    const updatedItems = itinerary!.items.map(i =>
      i.item_id === selectedItem.item_id
        ? { ...i, start_time: slot.start_time, end_time: slot.end_time }
        : i
    );
    setItinerary({ ...itinerary!, items: updatedItems });
    setSlotModalVisible(false);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatTimeRange = (start: string, end: string) => `${formatTime(start)} - ${formatTime(end)}`;

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_URL}/itinerary/${id}/update-items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itinerary_id: itinerary!.itinerary_id,
          items: itinerary!.items.map(i => ({
            item_id: i.item_id,
            start_time: i.start_time,
            end_time: i.end_time,
            day_number: i.day_number,
            custom_note: i.custom_note
          }))
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save');
      Alert.alert('Success', 'Itinerary updated');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  if (loading || !itinerary) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-2 text-gray-600">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text className="text-xl font-bold mb-4">Edit Itinerary</Text>

        {itinerary.items.map(item => (
          <View key={item.item_id} className="bg-white p-4 mb-4 rounded-lg shadow-sm">
            <Text className="font-semibold text-lg mb-1">{item.experience_name}</Text>
            <Text className="text-sm text-gray-600 mb-2">{formatTimeRange(item.start_time, item.end_time)}</Text>
            <TextInput
              placeholder="Custom Note"
              value={item.custom_note}
              onChangeText={text => {
                const updated = itinerary.items.map(i =>
                  i.item_id === item.item_id ? { ...i, custom_note: text } : i
                );
                setItinerary({ ...itinerary, items: updated });
              }}
              className="border p-2 rounded mb-2 text-sm"
            />
            <TouchableOpacity
              className="bg-primary px-4 py-2 rounded"
              onPress={() => openSlotModal(item)}
            >
              <Text className="text-white text-sm text-center">Change Time Slot</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          className="mt-6 bg-green-600 py-3 rounded"
          onPress={handleSave}
        >
          <Text className="text-white text-center font-semibold">Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={slotModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSlotModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black bg-opacity-30">
          <View className="bg-white p-4 rounded-t-2xl max-h-[60%]">
            <Text className="text-lg font-bold mb-4">Select a Time Slot</Text>
            {availableSlots.length === 0 ? (
              <Text className="text-gray-500">No available slots</Text>
            ) : (
              availableSlots.map((slot, index) => (
                <TouchableOpacity
                  key={index}
                  className="p-3 border rounded mb-2"
                  onPress={() => updateSlot(slot)}
                >
                  <Text className="text-sm text-center">
                    {formatTimeRange(slot.start_time, slot.end_time)}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
