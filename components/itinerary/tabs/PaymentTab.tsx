// components/itinerary/tabs/PaymentTab.tsx

import { BookingPaymentItem } from '@/components/itinerary/BookingPaymentItem';
import { useBookingPaymentSummary } from '@/hooks/useBookingPayments';
import { BookingPayment } from '@/types/bookingPayment';
import { Refund } from '@/types/paymentTypes';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

interface Props {
    bookings: BookingPayment[] | undefined;
    refunds?: Refund[];
    onPayNow: (booking: BookingPayment) => void;
}

export function PaymentTab({ bookings, refunds = [], onPayNow }: Props) {
    const summary = useBookingPaymentSummary(bookings);

    if (!bookings || bookings.length === 0 || !summary) {
        return <PaymentAwaitingState />;
    }

    // Filter out cancelled bookings for display
    const activeBookings = bookings.filter(
        (b) => b.status !== 'Cancelled' && b.status !== 'CancellationRequested'
    );

    // Calculate refund totals
    const pendingRefunds = refunds.filter((r) => r.status === 'pending' || r.status === 'processing');
    const completedRefunds = refunds.filter((r) => r.status === 'completed');
    const totalRefundAmount = refunds.reduce((sum, r) => sum + r.refund_amount, 0);

    return (
        <ScrollView
            className="flex-1 px-6 mx-4 mt-6"
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
        >
            <PaymentStatusCard summary={summary} />

            <PaymentProgressSection summary={summary} />

            {/* Refunds Section */}
            {refunds.length > 0 && (
                <RefundsSection
                    refunds={refunds}
                    pendingRefunds={pendingRefunds}
                    completedRefunds={completedRefunds}
                    totalRefundAmount={totalRefundAmount}
                />
            )}

            {/* Bookings List */}
            {activeBookings.length > 0 && (
                <View className="mt-12">
                    <Text className="text-2xl font-onest text-black/90 mb-2">Activities</Text>
                    <Text className="text-sm font-onest text-black/50 mb-4">
                        {summary.paidCount} of {summary.totalCount} paid
                    </Text>

                    <View className="bg-white rounded-xl overflow-hidden">
                        {activeBookings.map((booking, index) => (
                            <View
                                key={booking.booking_id}
                                className={index < activeBookings.length - 1 ? 'border-b border-gray-100' : ''}
                            >
                                <BookingPaymentItem booking={booking} onPayNow={onPayNow} />
                            </View>
                        ))}
                    </View>
                </View>
            )}

            <PaymentHistorySection bookings={bookings} refunds={refunds} />
        </ScrollView>
    );
}

// ============ Sub-Components ============

function PaymentAwaitingState() {
    return (
        <View className="flex-1 items-center justify-center p-8">
            <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
                <Ionicons name="hourglass-outline" size={32} color="#9CA3AF" />
            </View>
            <Text className="text-lg font-onest-medium text-black/90 mb-2">
                No Bookings Yet
            </Text>
            <Text className="text-sm font-onest text-black/50 text-center">
                Payment information will appear here once you have confirmed bookings.
            </Text>
        </View>
    );
}

interface PaymentStatusCardProps {
    summary: NonNullable<ReturnType<typeof useBookingPaymentSummary>>;
}

function PaymentStatusCard({ summary }: PaymentStatusCardProps) {
    const { isFullyPaid, hasPending, totalPaid, totalAmount, remainingBalance } = summary;

    let statusIcon: keyof typeof Ionicons.glyphMap = 'card-outline';
    let statusColor = 'bg-gray-100';
    let statusIconColor = '#6B7280';
    let statusTitle = 'Payment Required';
    let statusSubtitle = `₱${remainingBalance.toLocaleString()} remaining`;

    if (isFullyPaid) {
        statusIcon = 'checkmark-circle';
        statusColor = 'bg-green-100';
        statusIconColor = '#059669';
        statusTitle = 'All Paid';
        statusSubtitle = 'All activities have been paid';
    } else if (hasPending) {
        statusIcon = 'time';
        statusColor = 'bg-yellow-100';
        statusIconColor = '#D97706';
        statusTitle = 'Payment Pending';
        statusSubtitle = 'Awaiting verification from partner';
    }

    return (
        <View>
            {/* Status Header */}
            <View className="flex-row items-center mb-6">
                <View
                    className={`w-12 h-12 rounded-full ${statusColor} items-center justify-center mr-4`}
                >
                    <Ionicons name={statusIcon} size={24} color={statusIconColor} />
                </View>
                <View className="flex-1">
                    <Text className="text-lg font-onest-semibold text-black/90">{statusTitle}</Text>
                    <Text className="text-sm font-onest text-black/50 mt-0.5">{statusSubtitle}</Text>
                </View>
            </View>

            {/* Amount Display */}
            <View className="flex-row items-end justify-between mb-4">
                <View>
                    <Text className="text-xs font-onest text-black/50 mb-1">Total Paid</Text>
                    <Text className="text-3xl font-onest-semibold text-black/90">
                        ₱{totalPaid.toLocaleString()}
                    </Text>
                </View>
                <View className="items-end">
                    <Text className="text-xs font-onest text-black/50 mb-1">Total Cost</Text>
                    <Text className="text-lg font-onest text-black/50">
                        ₱{totalAmount.toLocaleString()}
                    </Text>
                </View>
            </View>
        </View>
    );
}

interface PaymentProgressSectionProps {
    summary: NonNullable<ReturnType<typeof useBookingPaymentSummary>>;
}

function PaymentProgressSection({ summary }: PaymentProgressSectionProps) {
    const { isFullyPaid, progressPercentage, paidCount, pendingCount, unpaidCount, totalCount } =
        summary;

    if (isFullyPaid) return null;

    return (
        <View className="mt-2">
            {/* Progress Bar */}
            <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <View
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
            </View>

            {/* Progress Stats */}
            <View className="flex-row justify-between mt-3">
                <Text className="text-xs font-onest text-black/50">
                    {Math.round(progressPercentage)}% paid
                </Text>
                <View className="flex-row">
                    {paidCount > 0 && (
                        <Text className="text-xs font-onest text-green-600 mr-3">
                            {paidCount} paid
                        </Text>
                    )}
                    {pendingCount > 0 && (
                        <Text className="text-xs font-onest text-yellow-600 mr-3">
                            {pendingCount} pending
                        </Text>
                    )}
                    {unpaidCount > 0 && (
                        <Text className="text-xs font-onest text-black/40">
                            {unpaidCount} unpaid
                        </Text>
                    )}
                </View>
            </View>
        </View>
    );
}

// ============ Refunds Section (unchanged) ============

interface RefundsSectionProps {
    refunds: Refund[];
    pendingRefunds: Refund[];
    completedRefunds: Refund[];
    totalRefundAmount: number;
}

function RefundsSection({
    refunds,
    pendingRefunds,
    completedRefunds,
    totalRefundAmount,
}: RefundsSectionProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-PH', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getStatusBadge = (status: Refund['status']) => {
        switch (status) {
            case 'pending':
                return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' };
            case 'processing':
                return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Processing' };
            case 'completed':
                return { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' };
            case 'rejected':
                return { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' };
            default:
                return { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
        }
    };

    return (
        <View className="mt-12">
            <Text className="text-2xl font-onest text-black/90 mb-4">Refunds</Text>

            {/* Pending Refunds Alert */}
            {pendingRefunds.length > 0 && (
                <View className="bg-amber-50 rounded-xl p-4 mb-4">
                    <View className="flex-row items-start">
                        <Ionicons name="time-outline" size={20} color="#D97706" style={{ marginTop: 2 }} />
                        <View className="flex-1 ml-3">
                            <Text className="text-base font-onest-medium text-amber-800 mb-1">
                                Refund in Progress
                            </Text>
                            <Text className="text-sm font-onest text-amber-700">
                                {pendingRefunds.length === 1
                                    ? 'You have 1 refund being processed. It will be sent to your GCash within 3-5 business days.'
                                    : `You have ${pendingRefunds.length} refunds being processed. They will be sent to your GCash within 3-5 business days.`}
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Completed Refunds Summary */}
            {completedRefunds.length > 0 && (
                <View className="bg-green-50 rounded-xl p-4 mb-4">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                            <Text className="text-base font-onest-medium text-green-800 ml-2">
                                Total Refunded
                            </Text>
                        </View>
                        <Text className="text-lg font-onest-semibold text-green-800">
                            ₱{completedRefunds.reduce((sum, r) => sum + r.refund_amount, 0).toLocaleString()}
                        </Text>
                    </View>
                </View>
            )}

            {/* Individual Refund Items */}
            <View className="rounded-xl overflow-hidden">
                {refunds.map((refund, index) => {
                    const statusBadge = getStatusBadge(refund.status);
                    const isLast = index === refunds.length - 1;

                    return (
                        <View
                            key={refund.refund_id}
                            className={`p-4 ${!isLast ? 'border-b border-gray-200' : ''}`}
                        >
                            <View className="flex-row items-start justify-between mb-2">
                                <View className="flex-1 mr-3">
                                    <Text
                                        className="text-sm font-onest-medium text-black/90"
                                        numberOfLines={1}
                                    >
                                        {refund.experience_name || `Booking #${refund.booking_id}`}
                                    </Text>
                                    <Text className="text-xs font-onest text-black/50 mt-1">
                                        Cancelled on {formatDate(refund.requested_at)}
                                    </Text>
                                </View>
                                <View className={`px-2 py-1 rounded-full ${statusBadge.bg}`}>
                                    <Text className={`text-xs font-onest-medium ${statusBadge.text}`}>
                                        {statusBadge.label}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-row items-center justify-between mt-2">
                                <Text className="text-xs font-onest text-black/50">
                                    Activity price: ₱{refund.activity_price.toLocaleString()}
                                </Text>
                                {refund.refund_amount > 0 ? (
                                    <Text className="text-sm font-onest-semibold text-green-600">
                                        +₱{refund.refund_amount.toLocaleString()}
                                    </Text>
                                ) : (
                                    <Text className="text-sm font-onest text-black/40">No refund</Text>
                                )}
                            </View>

                            {refund.status === 'completed' && refund.completed_at && (
                                <Text className="text-xs font-onest text-green-600 mt-2">
                                    Refunded on {formatDate(refund.completed_at)}
                                </Text>
                            )}
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

// ============ Payment History Section ============

interface PaymentHistorySectionProps {
    bookings: BookingPayment[];
    refunds?: Refund[];
}

function PaymentHistorySection({ bookings, refunds = [] }: PaymentHistorySectionProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-PH', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const historyItems: Array<{
        date: string;
        label: string;
        icon: keyof typeof Ionicons.glyphMap;
        iconColor?: string;
        subLabel?: string;
    }> = [];

    // Add booking creation events
    bookings.forEach((booking) => {
        historyItems.push({
            date: booking.created_at,
            label: 'Booking Created',
            icon: 'document-outline',
            subLabel: booking.experience_name,
        });

        if (booking.payment_status === 'Paid') {
            historyItems.push({
                date: booking.updated_at,
                label: 'Payment Verified',
                icon: 'checkmark-circle-outline',
                iconColor: '#16A34A',
                subLabel: `₱${Number(booking.activity_price).toLocaleString()} - ${booking.experience_name}`,
            });
        }
    });

    // Add refund history items
    refunds.forEach((refund) => {
        historyItems.push({
            date: refund.requested_at,
            label: 'Cancellation Requested',
            icon: 'close-circle-outline',
            iconColor: '#EF4444',
            subLabel: refund.experience_name || `Booking #${refund.booking_id}`,
        });

        if (refund.status === 'completed' && refund.completed_at && refund.refund_amount > 0) {
            historyItems.push({
                date: refund.completed_at,
                label: 'Refund Completed',
                icon: 'cash-outline',
                iconColor: '#16A34A',
                subLabel: `+₱${refund.refund_amount.toLocaleString()}`,
            });
        }
    });

    // Sort by date (newest first)
    historyItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (historyItems.length === 0) return null;

    return (
        <View className="mt-12">
            <Text className="text-2xl font-onest text-black/90 mb-4">History</Text>
            {historyItems.map((item, index) => (
                <View
                    key={`${item.date}-${index}`}
                    className={`flex-row items-center py-3 ${index < historyItems.length - 1 ? 'border-b border-gray-100' : ''
                        }`}
                >
                    <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-3">
                        <Ionicons name={item.icon} size={18} color={item.iconColor || '#6B7280'} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-sm font-onest text-black/90">{item.label}</Text>
                        {item.subLabel && (
                            <Text className="text-xs font-onest text-black/50 mt-0.5" numberOfLines={1}>
                                {item.subLabel}
                            </Text>
                        )}
                        <Text className="text-xs font-onest text-black/40 mt-0.5">
                            {formatDate(item.date)}
                        </Text>
                    </View>
                </View>
            ))}
        </View>
    );
}