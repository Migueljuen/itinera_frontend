// components/itinerary/tabs/PaymentTab.tsx

import { ActivityPaymentItem } from '@/components/itinerary/ActivityPaymentItem';
import { usePaymentSummary } from '@/hooks/usePaymentSummary';
import { PaymentInfo } from '@/types/itineraryDetails';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

interface Props {
    payments: PaymentInfo[] | undefined;
    onPayNow: () => void;
}

export function PaymentTab({ payments, onPayNow }: Props) {
    const payment = payments?.[0];
    const summary = usePaymentSummary(payment);

    if (!payment || !summary) {
        return <PaymentAwaitingState />;
    }

    const activityPayments = payment.activity_payments || [];
    const showPayButton = !summary.isPaid && summary.remainingBalance > 0;
    const payButtonText = summary.isFailed
        ? 'Retry Payment'
        : `Pay ₱${summary.remainingBalance.toLocaleString()}`;

    return (
        <ScrollView
            className="flex-1 px-6 mx-4 mt-6"
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
        >
            <PaymentStatusCard summary={summary} />

            <PaymentBreakdownSection summary={summary} />

            {activityPayments.length > 0 && (
                <View className="mt-12">
                    <Text className="text-2xl text-onest text-black/90 mb-4">
                        Payment Breakdown
                    </Text>
                    {activityPayments.map((activity, index) => (
                        <View
                            key={activity.booking_id || index}
                            className={index < activityPayments.length - 1 ? 'mb-3' : ''}
                        >
                            <ActivityPaymentItem activity={activity} />
                        </View>
                    ))}
                </View>
            )}

            {showPayButton && (
                <View className="mt-8">
                    <Pressable
                        className={`py-4 rounded-xl flex-row items-center justify-center ${summary.isFailed ? 'bg-red-500' : 'bg-primary'
                            }`}
                        onPress={onPayNow}
                    >
                        <Text className="text-white font-onest-semibold text-base">
                            {payButtonText}
                        </Text>
                        <Ionicons
                            name="arrow-forward"
                            size={18}
                            color="white"
                            style={{ marginLeft: 8 }}
                        />
                    </Pressable>
                </View>
            )}

            <PaymentHistorySection payment={payment} />
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
                Awaiting Payment Details
            </Text>
            <Text className="text-sm font-onest text-black/50 text-center">
                Payment information will appear here once your booking is confirmed.
            </Text>
        </View>
    );
}

function PaymentStatusCard({
    summary,
}: {
    summary: NonNullable<ReturnType<typeof usePaymentSummary>>;
}) {
    const { isPaid, isFailed, totalPaid, totalAmount, remainingBalance, progressPercentage } = summary;

    let statusIcon: keyof typeof Ionicons.glyphMap = 'time-outline';
    let statusColor = 'bg-yellow-100';
    let statusIconColor = '#D97706';
    let statusTitle = 'Payment In Progress';
    let statusSubtitle = `₱${remainingBalance.toLocaleString()} remaining`;

    if (isPaid) {
        statusIcon = 'checkmark-circle';
        statusColor = 'bg-green-100';
        statusIconColor = '#059669';
        statusTitle = 'Payment Complete';
        statusSubtitle = 'All payments have been received';
    } else if (isFailed) {
        statusIcon = 'close-circle';
        statusColor = 'bg-red-100';
        statusIconColor = '#DC2626';
        statusTitle = 'Payment Failed';
        statusSubtitle = 'Please retry your payment';
    }

    const progressText = `${Math.round(progressPercentage)}% paid`;

    return (
        <View>
            {/* Status Header */}
            <View className="flex-row items-center mb-6">
                <View className={`w-12 h-12 rounded-full ${statusColor} items-center justify-center mr-4`}>
                    <Ionicons name={statusIcon} size={24} color={statusIconColor} />
                </View>
                <View className="flex-1">
                    <Text className="text-lg font-onest-semibold text-black/90">
                        {statusTitle}
                    </Text>
                    <Text className="text-sm font-onest text-black/50 mt-0.5">
                        {statusSubtitle}
                    </Text>
                </View>
            </View>

            {/* Amount Display */}
            <View className="flex-row items-end justify-between mb-4">
                <View>
                    <Text className="text-xs font-onest text-black/50 mb-1">Total Paid</Text>
                    <Text className="text-3xl font-onest-semibold text-black/90">
                        {`₱${totalPaid.toLocaleString()}`}
                    </Text>
                </View>
                <View className="items-end">
                    <Text className="text-xs font-onest text-black/50 mb-1">Total Cost</Text>
                    <Text className="text-lg font-onest text-black/50">
                        {`₱${totalAmount.toLocaleString()}`}
                    </Text>
                </View>
            </View>

            {/* Progress Bar */}
            {!isPaid && (
                <View>
                    <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <View
                            className={`h-full rounded-full ${isFailed ? 'bg-red-500' : 'bg-primary'}`}
                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        />
                    </View>
                    <Text className="text-xs font-onest text-black/50 mt-2 text-right">
                        {progressText}
                    </Text>
                </View>
            )}
        </View>
    );
}

function PaymentBreakdownSection({
    summary,
}: {
    summary: NonNullable<ReturnType<typeof usePaymentSummary>>;
}) {
    const { amountPaid, totalCashCollected, isFailed } = summary;

    if (isFailed || (amountPaid === 0 && totalCashCollected === 0)) {
        return null;
    }

    const breakdownItems: Array<{ label: string; amount: number; icon: keyof typeof Ionicons.glyphMap }> = [];

    if (amountPaid > 0) {
        breakdownItems.push({ label: 'Online Payment', amount: amountPaid, icon: 'card-outline' });
    }
    if (totalCashCollected > 0) {
        breakdownItems.push({ label: 'Cash Collected', amount: totalCashCollected, icon: 'cash-outline' });
    }

    if (breakdownItems.length === 0) {
        return null;
    }

    return (
        <View className="mt-12">
            <Text className="text-2xl text-onest text-black/90 mb-4">
                Payment Methods
            </Text>
            {breakdownItems.map((item, index) => (
                <View
                    key={index}
                    className={`flex-row items-center justify-between py-3 ${index < breakdownItems.length - 1 ? 'border-b border-gray-100' : ''
                        }`}
                >
                    <View className="flex-row items-center">
                        <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-3">
                            <Ionicons name={item.icon} size={18} color="#6B7280" />
                        </View>
                        <Text className="text-sm font-onest text-black/80">{item.label}</Text>
                    </View>
                    <Text className="text-sm font-onest-medium text-black/90">
                        {`₱${item.amount.toLocaleString()}`}
                    </Text>
                </View>
            ))}
        </View>
    );
}

function PaymentHistorySection({ payment }: { payment: PaymentInfo }) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-PH', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const historyItems: Array<{ date: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
        {
            date: payment.created_at,
            label: 'Booking Created',
            icon: 'document-outline',
        },
    ];

    if (payment.amount_paid > 0) {
        historyItems.push({
            date: payment.updated_at,
            label: 'Payment Received',
            icon: 'checkmark-circle-outline',
        });
    }

    return (
        <View className="mt-12">
            <Text className="text-2xl text-onest text-black/90 mb-4">
                Payment History
            </Text>
            {historyItems.map((item, index) => (
                <View
                    key={index}
                    className={`flex-row items-center py-3 ${index < historyItems.length - 1 ? 'border-b border-gray-100' : ''
                        }`}
                >
                    <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-3">
                        <Ionicons name={item.icon} size={18} color="#6B7280" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-sm font-onest text-black/90">{item.label}</Text>
                        <Text className="text-xs font-onest text-black/50 mt-0.5">
                            {formatDate(item.date)}
                        </Text>
                    </View>
                </View>
            ))}
        </View>
    );
}