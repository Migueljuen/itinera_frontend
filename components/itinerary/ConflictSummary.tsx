// ConflictSummary.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import type { ItineraryItem } from '../../types/itineraryTypes';
import { checkTimeConflicts } from '../../utils/conflictChecker';

interface Props {
    items: ItineraryItem[];
}

export const ConflictSummary: React.FC<Props> = ({ items }) => {
    const conflicts = checkTimeConflicts(items);

    if (conflicts.length === 0) return null;

    return (
        <View className="mx-4 mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <View className="flex-row items-center mb-2">
                <Ionicons name="warning-outline" size={20} color="#EA580C" />
                <Text className="text-orange-700 font-onest-semibold ml-2">
                    Schedule Warnings ({conflicts.length})
                </Text>
            </View>
            {conflicts.map((conflict, index) => (
                <Text key={index} className="text-sm text-orange-600 font-onest mb-1">
                    • Day {conflict.item1.day_number}: {
                        conflict.type === 'overlap'
                            ? `"${conflict.item1.experience_name}" overlaps with "${conflict.item2.experience_name}"`
                            : conflict.type === 'no-gap'
                                ? `No gap between "${conflict.item1.experience_name}" and "${conflict.item2.experience_name}"`
                                : `Only ${conflict.gapMinutes}min between "${conflict.item1.experience_name}" and "${conflict.item2.experience_name}"`
                    }
                </Text>
            ))}
        </View>
    );
};