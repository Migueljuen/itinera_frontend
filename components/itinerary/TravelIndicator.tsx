// components/itinerary/TravelIndicator.tsx

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

interface TimeCheck {
    hasTime: boolean;
    message: string;
}

interface Props {
    timeCheck: TimeCheck | null;
    canNavigate: boolean;
    onNavigate: () => void;
}

export function TravelIndicator({ timeCheck, canNavigate, onNavigate }: Props) {
    const hasTimeConflict = timeCheck && !timeCheck.hasTime;
    const message = timeCheck?.message || 'Travel to next activity';

    return (
        <View className="px-4 py-3 my-4 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
                <View className="w-20 items-center ">
                    {/* Use border instead of width for thin lines */}
                    <View className="h-8 border-l border-gray-300" />
                    <Ionicons name="car-outline" size={16} color="#000000cc" />
                    <View className="h-8 border-l border-gray-300" />
                </View>
                <Text
                    className={`text-sm font-onest ${hasTimeConflict ? 'text-orange-600' : 'text-black/50'
                        }`}
                >
                    {message}
                </Text>
            </View>
        </View>
    );
}