// components/itinerary/TravelIndicator.tsx

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
    const message = timeCheck?.message || '';

    return (
        <View className="flex-row">
            {/* Timeline Column - continues the line */}
            <View className="w-6 items-center mr-3">
                <View
                    style={{
                        width: 1,
                        height: 100, // Fixed height instead of 100%
                        backgroundColor: '#d1d5db',
                    }}
                />
            </View>

            {/* Content Column */}
            <View className="flex-1 h-24 pt-8">
                <View className="flex-row items-center gap-3">

                    {/* <Ionicons name="car-outline" size={16} color="#6B7280" /> */}
                    <Text
                        className={`text-sm font-onest ${hasTimeConflict ? 'text-amber-600' : 'text-black/50'
                            }`}
                    >

                        {message}
                    </Text>
                </View>
            </View>
        </View>
    );
}