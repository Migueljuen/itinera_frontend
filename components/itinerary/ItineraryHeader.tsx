// ItineraryHeader.tsx
import React from 'react';
import { Text, View } from 'react-native';
import type { Itinerary } from '../../types/itineraryTypes';

interface Props {
    itinerary: Itinerary;
}

export const ItineraryHeader: React.FC<Props> = ({ itinerary }) => (
    <View className="p-4 m-4 bg-white rounded-lg border border-gray-200">
        <Text className="text-xl font-onest-semibold text-gray-800 mb-2">
            {itinerary.title}
        </Text>
        <Text className="text-sm text-gray-600 font-onest">
            Tap on time slots to view available times or remove experiences
        </Text>
        {itinerary.status === 'ongoing' && (
            <Text className="text-xs text-gray-500 font-onest mt-1">
                Note: Past activities cannot be edited
            </Text>
        )}
    </View>
);