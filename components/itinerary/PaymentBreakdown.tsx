// components/itinerary/PaymentBreakdown.tsx

import { PaymentSummary } from '@/types/paymentTypes';
import React from 'react';
import { Text, View } from 'react-native';

interface Props {
    summary: PaymentSummary;
}

export function PaymentBreakdown({ summary }: Props) {
    const { amountPaid, totalCashCollected, isFailed } = summary;

    if (isFailed || (amountPaid === 0 && totalCashCollected === 0)) {
        return null;
    }

    return (
        <View className="flex-row mt-4 pt-3 border-t border-gray-200">
            {amountPaid > 0 && (
                <View className="flex-1">
                    <Text className="text-xs font-onest text-black/50">Online</Text>
                    <Text className="text-sm font-onest-medium text-black/90">
                        ₱{amountPaid.toLocaleString()}
                    </Text>
                </View>
            )}
            {totalCashCollected > 0 && (
                <View className="flex-1">
                    <Text className="text-xs font-onest text-black/50">Cash</Text>
                    <Text className="text-sm font-onest-medium text-black/90">
                        ₱{totalCashCollected.toLocaleString()}
                    </Text>
                </View>
            )}
        </View>
    );
}