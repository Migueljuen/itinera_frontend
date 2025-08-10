import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import API_URL from '../constants/api';
import type { Itinerary, ItineraryItem } from '../types/itineraryTypes';
import { emitNotificationUpdate } from '../utils/notificationEvents';

export const useItineraryEditor = (id: string) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [itinerary, setItinerary] = useState<Itinerary | null>(null);
    const [editedItems, setEditedItems] = useState<ItineraryItem[]>([]);
    const [deletedItems, setDeletedItems] = useState<number[]>([]);

    const fetchItineraryDetails = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Error", "Authentication token not found");
                return;
            }

            const response = await fetch(`${API_URL}/itinerary/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
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

    const saveChanges = async (): Promise<boolean> => {
        setSaving(true);
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Error", "Authentication token not found");
                return false;
            }

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

            const promises = [];

            if (updates.length > 0) {
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

            if (deletedItems.length > 0) {
                promises.push(
                    fetch(`${API_URL}/itinerary/${id}/items/bulk-delete`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ item_ids: deletedItems })
                    })
                );
            }

            if (promises.length === 0) {
                Alert.alert("Info", "No changes detected to save");
                return false;
            }

            const results = await Promise.all(promises);

            for (const response of results) {
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
                }
            }

            if (updates.length > 0 || deletedItems.length > 0) {
                emitNotificationUpdate();
            }

            return true;
        } catch (error) {
            console.error("Error saving changes:", error);
            Alert.alert("Error", "Failed to save changes");
            return false;
        } finally {
            setSaving(false);
        }
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
        return hasDeleted || hasEdited;
    };

    const removeItem = (itemId: number) => {
        setEditedItems(prev => prev.filter(item => item.item_id !== itemId));
        setDeletedItems(prev => [...prev, itemId]);
    };

    const updateItem = (itemId: number, updates: Partial<ItineraryItem>) => {
        setEditedItems(prev => prev.map(item =>
            item.item_id === itemId ? { ...item, ...updates } : item
        ));
    };

    useEffect(() => {
        if (id) fetchItineraryDetails();
    }, [id]);

    return {
        loading,
        saving,
        itinerary,
        editedItems,
        deletedItems,
        saveChanges,
        hasChanges,
        removeItem,
        updateItem,
        setEditedItems
    };
};
