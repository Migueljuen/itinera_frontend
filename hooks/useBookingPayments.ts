// hooks/useBookingPayments.ts

import API_URL from '@/constants/api';
import { BookingPayment, ItineraryPaymentSummary } from '@/types/bookingPayment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';

interface UseBookingPaymentsResult {
    bookings: BookingPayment[];
    summary: ItineraryPaymentSummary | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Hook to fetch booking payments for an itinerary from the API
 */
export function useBookingPayments(
    itineraryId: number | undefined
): UseBookingPaymentsResult {
    const [bookings, setBookings] = useState<BookingPayment[]>([]);
    const [summary, setSummary] = useState<ItineraryPaymentSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBookingPayments = useCallback(async () => {
        if (!itineraryId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                setError('Authentication required');
                setLoading(false);
                return;
            }

            const response = await fetch(
                `${API_URL}/payment/itinerary/${itineraryId}/booking-payments`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setBookings(data.bookings || []);
                setSummary(data.summary || null);
            } else {
                setError(data.message || 'Failed to fetch booking payments');
            }
        } catch (err) {
            console.error('Error fetching booking payments:', err);
            setError('Failed to load payment information');
        } finally {
            setLoading(false);
        }
    }, [itineraryId]);

    // Refetch when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchBookingPayments();
        }, [fetchBookingPayments])
    );

    return {
        bookings,
        summary,
        loading,
        error,
        refetch: fetchBookingPayments,
    };
}

/**
 * Helper hook to calculate summary from bookings array (for local state usage)
 */
export function useBookingPaymentSummary(
    bookings: BookingPayment[] | undefined
): ItineraryPaymentSummary | null {
    return useMemo(() => {
        if (!bookings || bookings.length === 0) return null;

        // Filter out cancelled bookings from payment calculations
        const activeBookings = bookings.filter(
            (b) => b.status !== 'Cancelled' && b.status !== 'CancellationRequested'
        );

        if (activeBookings.length === 0) return null;

        const paidBookings = activeBookings.filter((b) => b.payment_status === 'Paid');
        const pendingBookings = activeBookings.filter((b) => b.payment_status === 'Pending');
        const unpaidBookings = activeBookings.filter((b) => b.payment_status === 'Unpaid');

        const totalAmount = activeBookings.reduce((sum, b) => sum + Number(b.activity_price), 0);
        const totalPaid = paidBookings.reduce((sum, b) => sum + Number(b.activity_price), 0);
        const remainingBalance = totalAmount - totalPaid;

        const progressPercentage = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;

        return {
            totalAmount,
            totalPaid,
            remainingBalance,
            progressPercentage,
            paidCount: paidBookings.length,
            pendingCount: pendingBookings.length,
            unpaidCount: unpaidBookings.length,
            totalCount: activeBookings.length,
            isFullyPaid: unpaidBookings.length === 0 && pendingBookings.length === 0,
            hasPending: pendingBookings.length > 0,
        };
    }, [bookings]);
}