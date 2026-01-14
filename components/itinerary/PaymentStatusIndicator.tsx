// components/itinerary/PaymentStatusIndicator.tsx

import { PaymentSummary } from '@/types/paymentTypes';
import React from 'react';
import { Text, View } from 'react-native';

type StatusType = 'complete' | 'failed' | 'partial' | 'pending';

interface StatusConfig {
    color: string;
    label: string;
}

const STATUS_CONFIG: Record<StatusType, StatusConfig> = {
    complete: { color: 'bg-green-500', label: 'Complete' },
    failed: { color: 'bg-red-500', label: 'Failed' },
    partial: { color: 'bg-yellow-500', label: '' }, // Label set dynamically
    pending: { color: 'bg-blue-500', label: 'Pending' },
};

function getStatusType(summary: PaymentSummary): StatusType {
    if (summary.isPaid) return 'complete';
    if (summary.isFailed) return 'failed';
    if (summary.paidCount > 0 && summary.totalCount > 0) return 'partial';
    return 'pending';
}

interface Props {
    summary: PaymentSummary;
}

export function PaymentStatusIndicator({ summary }: Props) {
    const statusType = getStatusType(summary);
    const config = STATUS_CONFIG[statusType];

    const label = statusType === 'partial'
        ? `${summary.paidCount}/${summary.totalCount}`
        : config.label;

    return (
        <View className="flex-row items-center">
            <View className={`w-2 h-2 rounded-full ${config.color} mr-2`} />
            <Text className="text-xs font-onest text-black/50">{label}</Text>
        </View>
    );
}