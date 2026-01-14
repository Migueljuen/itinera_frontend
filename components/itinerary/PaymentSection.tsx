// components/itinerary/PaymentSection.tsx

import { usePaymentSummary } from '@/hooks/usePaymentSummary';
import { PaymentData } from '@/types/paymentTypes';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ActivityPaymentItem } from './ActivityPaymentItem';
import { PaymentBreakdown } from './PaymentBreakdown';
import { PaymentProgress } from './PaymentProgress';
import { PaymentStatusIndicator } from './PaymentStatusIndicator';

interface Props {
    payments: PaymentData[] | undefined;
    onPayNow: () => void;
}

export function PaymentSection({ payments, onPayNow }: Props) {
    const [isExpanded, setIsExpanded] = useState(false);
    const payment = payments?.[0];
    const summary = usePaymentSummary(payment);

    const hasPayments = payments && payments.length > 0;

    return (
        <View className="mt-4 pt-4 border-t border-gray-100">
            {/* Collapsible Header */}
            <Pressable
                onPress={() => setIsExpanded(!isExpanded)}
                className="flex-row items-center justify-between"
            >
                <View className="flex-row items-center flex-1">
                    <Ionicons
                        name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                        size={18}
                        color="#9CA3AF"
                        style={{ marginRight: 6 }}
                    />
                    <Text className="text-sm font-onest-medium text-black/90">Payment</Text>
                </View>

                {summary ? (
                    <PaymentStatusIndicator summary={summary} />
                ) : (
                    <View className="flex-row items-center">
                        <View className="w-2 h-2 rounded-full bg-gray-300 mr-2" />
                        <Text className="text-xs font-onest text-black/50">Awaiting</Text>
                    </View>
                )}
            </Pressable>

            {/* Expanded Content */}
            {isExpanded && (
                <View className="mt-4">
                    {hasPayments && summary ? (
                        <PaymentExpandedContent
                            payment={payment!}
                            summary={summary}
                            onPayNow={onPayNow}
                        />
                    ) : (
                        <PaymentAwaitingState />
                    )}
                </View>
            )}
        </View>
    );
}

// Sub-components for expanded states
function PaymentExpandedContent({
    payment,
    summary,
    onPayNow,
}: {
    payment: PaymentData;
    summary: NonNullable<ReturnType<typeof usePaymentSummary>>;
    onPayNow: () => void;
}) {
    const activityPayments = payment.activity_payments || [];

    return (
        <>
            {/* Failed State Alert */}
            {summary.isFailed && <PaymentFailedAlert />}

            {/* Progress Section */}
            <PaymentProgress summary={summary} />

            {/* Breakdown */}
            <PaymentBreakdown summary={summary} />

            {/* Activity List */}
            {activityPayments.length > 0 && (
                <View className="space-y-2">
                    {activityPayments.map((activity, index) => (
                        <ActivityPaymentItem
                            key={activity.booking_id || index}
                            activity={activity}
                        />
                    ))}
                </View>
            )}

            {/* Action Button */}
            {!summary.isPaid && summary.remainingBalance > 0 && payment.show_pay_button !== false && (
                <Pressable
                    className={`mt-4 py-3.5 rounded-xl flex-row items-center justify-center ${summary.isFailed ? 'bg-red-500' : 'bg-primary'
                        }`}
                    onPress={onPayNow}
                >
                    <Text className="text-white font-onest-medium text-sm">
                        {summary.isFailed ? 'Retry Payment' : `Pay ₱${summary.remainingBalance.toLocaleString()}`}
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color="white" style={{ marginLeft: 6 }} />
                </Pressable>
            )}

            {/* Success Message */}
            {summary.isPaid && (
                <View className="mt-2 flex-row items-center justify-center py-2">
                    <Ionicons name="checkmark-circle" size={14} color="#059669" />
                    <Text className="text-xs font-onest text-green-600 ml-1.5">
                        All payments complete
                    </Text>
                </View>
            )}
        </>
    );
}

function PaymentFailedAlert() {
    return (
        <View className="bg-red-50 rounded-xl p-4 mb-4">
            <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-full bg-red-100 items-center justify-center mr-3">
                    <Ionicons name="close" size={16} color="#DC2626" />
                </View>
                <View className="flex-1">
                    <Text className="text-sm font-onest-medium text-red-700">Payment Declined</Text>
                    <Text className="text-xs font-onest text-red-500 mt-0.5">
                        Please resubmit your payment
                    </Text>
                </View>
            </View>
        </View>
    );
}

function PaymentAwaitingState() {
    return (
        <View className="bg-gray-50 rounded-xl p-4 flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center mr-3">
                <Ionicons name="hourglass-outline" size={16} color="#9CA3AF" />
            </View>
            <Text className="text-xs text-black/50 font-onest flex-1">
                Payment details will appear once your booking is confirmed.
            </Text>
        </View>
    );
}