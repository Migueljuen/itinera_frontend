// SaveButton.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity } from 'react-native';
import type { ItineraryItem } from '../../types/itineraryTypes';
import { hasCriticalConflicts } from '../../utils/conflictChecker';

interface Props {
    hasChanges: boolean;
    saving: boolean;
    items: ItineraryItem[];
    onSave: () => Promise<boolean>;
}

export const SaveButton: React.FC<Props> = ({
    hasChanges,
    saving,
    items,
    onSave
}) => {
    const handlePress = async () => {
        if (!hasChanges || saving) return;

        if (hasCriticalConflicts(items)) {
            Alert.alert(
                "Cannot Save",
                "Your schedule has time overlaps. Please fix them before saving.",
                [{ text: "OK" }]
            );
            return;
        }

        const success = await onSave();
        if (success) {
            Alert.alert("Success", "Itinerary updated successfully");
        }
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            disabled={!hasChanges || saving}
            className={`absolute bottom-36 right-6 p-4 rounded-full shadow-md flex-row items-center ${hasChanges && !saving ? 'bg-primary' : 'bg-gray-300'
                }`}
            style={{ zIndex: 999 }}
            activeOpacity={0.7}
        >
            <Ionicons
                name="create-outline"
                size={20}
                color={hasChanges && !saving ? '#FFFFFF' : '#9CA3AF'}
            />
            {saving ? (
                <ActivityIndicator size="small" color="#fff" />
            ) : (
                <Text className={`font-onest-medium ml-2 ${hasChanges && !saving ? 'text-white' : 'text-gray-500'
                    }`}>
                    Save
                </Text>
            )}
        </TouchableOpacity>
    );
};