// components/itinerary/PaymentProgress.tsx

import { PaymentSummary } from '@/types/paymentTypes';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

interface Props {
    summary: PaymentSummary;
}

export function PaymentProgress({ summary }: Props) {
    const { isPaid, isFailed, totalPaid, totalAmount, remainingBalance, progressPercentage } = summary;

    return (
        <View className="rounded-xl p-4 mb-4">
            {/* Amount Display */}
            <View className="flex-row items-center justify-between mb-4">
                <View>
                    <Text className="text-2xl font-onest-semibold text-black/90">
                        ₱{totalPaid.toLocaleString()}
                    </Text>
                    <Text className="text-xs font-onest text-black/50 mt-0.5">
                        of ₱{totalAmount.toLocaleString()}
                    </Text>
                </View>

                {!isPaid && !isFailed && (
                    <View className="items-end">
                        <Text className="text-lg font-onest-semibold text-yellow-600">
                            ₱{remainingBalance.toLocaleString()}
                        </Text>
                        <Text className="text-xs font-onest text-black/50">remaining</Text>
                    </View>
                )}

                {isPaid && (
                    <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center">
                        <Ionicons name="checkmark" size={20} color="#059669" />
                    </View>
                )}
            </View>

            {/* Progress Bar */}
            {!isPaid && !isFailed && (
                <View className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <View
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    />
                </View>
            )}
        </View>
    );
}