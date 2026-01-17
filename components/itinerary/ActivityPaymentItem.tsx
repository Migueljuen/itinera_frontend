// components/itinerary/ActivityPaymentItem.tsx

import { ActivityPayment } from '@/types/paymentTypes';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

interface Props {
    activity: ActivityPayment;
}

export function ActivityPaymentItem({ activity }: Props) {
    const isActivityPaid = activity.is_fully_paid;

    return (
        <View className="flex-row items-center py-3">
            {/* Status Indicator */}
            <View
                className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isActivityPaid ? 'bg-green-100' : 'bg-gray-50'
                    }`}
            >
                {isActivityPaid ? (
                    <Ionicons name="checkmark" size={18} color="#059669" />
                ) : (
                    <Ionicons name="time-outline" size={18} color="#9CA3AF" />
                )}
            </View>

            {/* Activity Info */}
            <View className="flex-1 mr-3">
                <Text className="text-sm font-onest text-black/90 capitalize" numberOfLines={1}>
                    {activity.activity_name}
                </Text>
                {/* <Text className="text-xs font-onest text-black/50 mt-0.5">
                    {activity.creator_name}
                </Text> */}
            </View>

            {/* Amount */}
            <View className="items-end">
                <Text
                    className={`text-sm font-onest-medium ${isActivityPaid ? 'text-green-600' : 'text-black/90'
                        }`}
                >
                    ₱{activity.activity_price.toLocaleString()}
                </Text>

                {!isActivityPaid && activity.remaining_cash_due > 0 && (
                    <Text className="text-xs font-onest text-yellow-600 mt-0.5">
                        ₱{activity.remaining_cash_due.toLocaleString()} due
                    </Text>
                )}

                {isActivityPaid && activity.creator_cash_collected_at && (
                    <Text className="text-xs font-onest text-black/50 mt-0.5">
                        {new Date(activity.creator_cash_collected_at).toLocaleDateString('en-PH', {
                            month: 'short',
                            day: 'numeric',
                        })}
                    </Text>
                )}
            </View>
        </View>
    );
}