import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import API_URL from '../constants/api';

interface ItineraryItemContext {
    item_id: number;
    day_number: number;
    start_time: string;
    end_time: string;
    custom_note: string | null;
    itinerary: {
        id: number;
        title: string;
        start_date: string;
        end_date: string;
        status: string;
    };
}

interface UseItineraryItemReturn {
    itineraryItem: ItineraryItemContext | null;
    loading: boolean;
    error: string | null;
}

export const useItineraryItem = (itemId: number | null): UseItineraryItemReturn => {
    const [itineraryItem, setItineraryItem] = useState<ItineraryItemContext | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!itemId) {
            setItineraryItem(null);
            setLoading(false);
            return;
        }

        const fetchItineraryItem = async () => {
            setLoading(true);
            setError(null);

            try {
                const token = await AsyncStorage.getItem('token');

                if (!token) {
                    setError('Authentication required');
                    setLoading(false);
                    return;
                }

                const response = await fetch(`${API_URL}/itinerary/item/${itemId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    setError(errorData.message || 'Failed to fetch itinerary item');
                    setLoading(false);
                    return;
                }

                const result = await response.json();

                if (result.success && result.data) {
                    // Extract only the context we need for the experience detail screen
                    const context: ItineraryItemContext = {
                        item_id: result.data.item_id,
                        day_number: result.data.day_number,
                        start_time: result.data.start_time,
                        end_time: result.data.end_time,
                        custom_note: result.data.custom_note,
                        itinerary: result.data.itinerary
                    };
                    setItineraryItem(context);
                } else {
                    setError('Invalid response from server');
                }
            } catch (err) {
                console.error('Error fetching itinerary item:', err);
                setError('Failed to load itinerary details');
            } finally {
                setLoading(false);
            }
        };

        fetchItineraryItem();
    }, [itemId]);

    return { itineraryItem, loading, error };
};

export default useItineraryItem;