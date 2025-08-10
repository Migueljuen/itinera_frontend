import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { Alert } from 'react-native';
import API_URL from '../constants/api';
import type { AvailableTimeSlot, Itinerary, ItineraryItem, TimeSlot } from '../types/itineraryTypes';
import { checkTimeConflicts } from '../utils/conflictChecker';

export const useTimeSlotModal = (
    itinerary: Itinerary | null,
    editedItems: ItineraryItem[],
    setEditedItems: React.Dispatch<React.SetStateAction<ItineraryItem[]>>
) => {
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
    const [availableTimeSlots, setAvailableTimeSlots] = useState<AvailableTimeSlot[]>([]);
    const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);

    const isTimeOverlapping = (start1: string, end1: string, start2: string, end2: string) => {
        const s1 = new Date(`2000-01-01T${start1}`);
        const e1 = new Date(`2000-01-01T${end1}`);
        const s2 = new Date(`2000-01-01T${start2}`);
        const e2 = new Date(`2000-01-01T${end2}`);
        return s1 < e2 && s2 < e1;
    };

    const fetchAvailableTimeSlots = async (experienceId: number, dayNumber: number, currentItemId?: number) => {
        setLoadingTimeSlots(true);
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) return;

            const startDate = new Date(itinerary!.start_date);
            const targetDate = new Date(startDate);
            targetDate.setDate(startDate.getDate() + dayNumber - 1);
            const dayOfWeek = targetDate
                .toLocaleDateString('en-US', { weekday: 'long' })
                .toLowerCase();

            const response = await fetch(
                `${API_URL}/experience/${experienceId}/availability?day=${dayOfWeek}&date=${targetDate.toISOString().split('T')[0]}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            let timeSlots: TimeSlot[] = [];

            if (data.availability && Array.isArray(data.availability)) {
                data.availability.forEach((availability: any) => {
                    if (availability.time_slots && Array.isArray(availability.time_slots)) {
                        timeSlots = timeSlots.concat(availability.time_slots);
                    }
                });
            }

            const slotsWithAvailability = timeSlots.map((slot: TimeSlot) => {
                const conflictingItems = editedItems.filter(item =>
                    item.day_number === dayNumber &&
                    item.item_id !== currentItemId && // Use the passed currentItemId instead of editingItem?.item_id
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

    const handleEditTime = async (item: ItineraryItem) => {
        // Check if the item is in the past or ongoing
        if (!itinerary) return;

        const startDate = new Date(itinerary.start_date);
        const itemDate = new Date(startDate);
        itemDate.setDate(startDate.getDate() + item.day_number - 1);

        const itemStartDate = new Date(itemDate);
        const [startHours, startMinutes] = item.start_time.split(':').map(Number);
        itemStartDate.setHours(startHours, startMinutes, 0, 0);

        const itemEndDate = new Date(itemDate);
        const [endHours, endMinutes] = item.end_time.split(':').map(Number);
        itemEndDate.setHours(endHours, endMinutes, 0, 0);

        const now = new Date();

        if (now >= itemStartDate) {
            const message = now < itemEndDate
                ? "This activity is currently in progress and cannot be edited."
                : "This activity has already occurred and cannot be edited.";

            Alert.alert("Cannot Edit Activity", message, [{ text: "OK" }]);
            return;
        }

        setEditingItem(item);
        setShowTimeModal(true);
        // Pass the item's ID to fetchAvailableTimeSlots to ensure consistent conflict checking
        await fetchAvailableTimeSlots(item.experience_id, item.day_number, item.item_id);
    };

    const handleTimeSlotSelect = (timeSlot: AvailableTimeSlot) => {
        if (!timeSlot.is_available) {
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
                    { text: "Select Anyway", onPress: () => confirmTimeSlotSelection(timeSlot) }
                ]
            );
            return;
        }

        confirmTimeSlotSelection(timeSlot);
    };

    const confirmTimeSlotSelection = (timeSlot: TimeSlot) => {
        if (!editingItem) return;

        const tempItems = editedItems.map(item =>
            item.item_id === editingItem.item_id
                ? { ...item, start_time: timeSlot.start_time, end_time: timeSlot.end_time }
                : item
        );

        const conflicts = checkTimeConflicts(tempItems);
        const relevantConflicts = conflicts.filter(
            c => c.item1.item_id === editingItem.item_id || c.item2.item_id === editingItem.item_id
        );

        if (relevantConflicts.length > 0) {
            let warningMessage = '';
            relevantConflicts.forEach(conflict => {
                const otherItem = conflict.item1.item_id === editingItem.item_id ? conflict.item2 : conflict.item1;

                switch (conflict.type) {
                    case 'overlap':
                        warningMessage += `⚠️ This time overlaps with "${otherItem.experience_name}"!\n\n`;
                        break;
                    case 'no-gap':
                        warningMessage += `⚠️ No time gap between this and "${otherItem.experience_name}". You'll need to travel directly from one activity to the next.\n\n`;
                        break;
                    case 'insufficient-gap':
                        warningMessage += `⚠️ Only ${conflict.gapMinutes} minutes between this and "${otherItem.experience_name}". This might not be enough time for travel.\n\n`;
                        break;
                }
            });

            Alert.alert(
                "Schedule Warning",
                warningMessage + "Do you want to proceed anyway?",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Proceed Anyway",
                        style: "destructive",
                        onPress: () => {
                            setEditedItems(tempItems);
                            setShowTimeModal(false);
                            setEditingItem(null);
                        }
                    }
                ]
            );
        } else {
            setEditedItems(tempItems);
            setShowTimeModal(false);
            setEditingItem(null);
        }
    };

    const closeModal = () => {
        setShowTimeModal(false);
        setEditingItem(null);
        setAvailableTimeSlots([]);
    };

    return {
        showTimeModal,
        editingItem,
        availableTimeSlots,
        loadingTimeSlots,
        handleEditTime,
        handleTimeSlotSelect,
        closeModal
    };
};