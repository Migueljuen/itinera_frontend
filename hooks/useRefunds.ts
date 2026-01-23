// hooks/useRefunds.ts

import API_URL from '@/constants/api';
import { Refund } from '@/types/paymentTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

interface UseRefundsReturn {
    refunds: Refund[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    pendingRefunds: Refund[];
    completedRefunds: Refund[];
    totalPendingAmount: number;
    totalRefundedAmount: number;
}

export function useRefunds(itineraryId: number | string | undefined): UseRefundsReturn {
    const [refunds, setRefunds] = useState<Refund[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRefunds = useCallback(async () => {
        if (!itineraryId) return;

        setIsLoading(true);
        setError(null);

        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                setError('Not authenticated');
                return;
            }

            const response = await fetch(
                `${API_URL}/refunds/itinerary/${itineraryId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch refunds');
            }

            const data = await response.json();
            setRefunds(data);
        } catch (err) {
            console.error('Error fetching refunds:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch refunds');
        } finally {
            setIsLoading(false);
        }
    }, [itineraryId]);

    useEffect(() => {
        fetchRefunds();
    }, [fetchRefunds]);

    // Computed values
    const pendingRefunds = refunds.filter(
        (r) => r.status === 'pending' || r.status === 'processing'
    );
    const completedRefunds = refunds.filter((r) => r.status === 'completed');
    const totalPendingAmount = pendingRefunds.reduce((sum, r) => sum + r.refund_amount, 0);
    const totalRefundedAmount = completedRefunds.reduce((sum, r) => sum + r.refund_amount, 0);

    return {
        refunds,
        isLoading,
        error,
        refetch: fetchRefunds,
        pendingRefunds,
        completedRefunds,
        totalPendingAmount,
        totalRefundedAmount,
    };
}

// Hook for fetching all refunds for the traveler (across all itineraries)
export function useTravelerRefunds(): UseRefundsReturn {
    const [refunds, setRefunds] = useState<Refund[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRefunds = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                setError('Not authenticated');
                return;
            }

            const response = await fetch(`${API_URL}/refunds/traveler`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch refunds');
            }

            const data = await response.json();
            setRefunds(data);
        } catch (err) {
            console.error('Error fetching refunds:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch refunds');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRefunds();
    }, [fetchRefunds]);

    const pendingRefunds = refunds.filter(
        (r) => r.status === 'pending' || r.status === 'processing'
    );
    const completedRefunds = refunds.filter((r) => r.status === 'completed');
    const totalPendingAmount = pendingRefunds.reduce((sum, r) => sum + r.refund_amount, 0);
    const totalRefundedAmount = completedRefunds.reduce((sum, r) => sum + r.refund_amount, 0);

    return {
        refunds,
        isLoading,
        error,
        refetch: fetchRefunds,
        pendingRefunds,
        completedRefunds,
        totalPendingAmount,
        totalRefundedAmount,
    };
}