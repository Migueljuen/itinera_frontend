// components/guide/GuideAssignmentActionBar.tsx

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface GuideAssignmentActionBarProps {
    assignmentId: number;
    guideFee: number;
    onAccept: (assignmentId: number) => Promise<void>;
    onDecline: (assignmentId: number) => Promise<void>;
}

export function GuideAssignmentActionBar({
    assignmentId,
    guideFee,
    onAccept,
    onDecline,
}: GuideAssignmentActionBarProps) {
    const insets = useSafeAreaInsets();
    const [accepting, setAccepting] = useState(false);
    const [declining, setDeclining] = useState(false);

    const isLoading = accepting || declining;

    const handleAccept = async () => {
        setAccepting(true);
        try {
            await onAccept(assignmentId);
        } finally {
            setAccepting(false);
        }
    };

    const handleDecline = async () => {
        setDeclining(true);
        try {
            await onDecline(assignmentId);
        } finally {
            setDeclining(false);
        }
    };

    return (
        <View
            className="absolute bg-white bottom-0 left-0 right-0"
            style={{
                paddingBottom: insets.bottom || 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -12 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 8,
            }}
        >
            {/* Fee Display */}
            <View className="flex-row items-center justify-center pt-4 pb-2">
                <Text className="text-black/50 font-onest text-sm">Your fee for this trip: </Text>
                <Text className="text-primary font-onest-semibold text-lg">
                    ₱{guideFee?.toLocaleString() || 0}
                </Text>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3 px-6 pt-2 pb-2">
                {/* Decline Button */}
                <Pressable
                    onPress={handleDecline}
                    disabled={isLoading}
                    className={`flex-1 flex-row items-center justify-center py-4 rounded-xl border ${isLoading ? 'border-gray-200 bg-gray-50' : 'border-gray-300 bg-white'
                        }`}
                >
                    {declining ? (
                        <ActivityIndicator size="small" color="#6b7280" />
                    ) : (
                        <>
                            <Ionicons
                                name="close-circle-outline"
                                size={20}
                                color={isLoading ? '#9ca3af' : '#4b5563'}
                            />
                            <Text
                                className={`font-onest-medium ml-2 text-base ${isLoading ? 'text-gray-400' : 'text-gray-600'
                                    }`}
                            >
                                Decline
                            </Text>
                        </>
                    )}
                </Pressable>

                {/* Accept Button */}
                <Pressable
                    onPress={handleAccept}
                    disabled={isLoading}
                    className={`flex-1 flex-row items-center justify-center py-4 rounded-xl ${isLoading ? 'bg-primary/50' : 'bg-primary'
                        }`}
                >
                    {accepting ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <>
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={20}
                                color="#ffffff"
                            />
                            <Text className="text-white font-onest-medium ml-2 text-base">
                                Accept
                            </Text>
                        </>
                    )}
                </Pressable>
            </View>
        </View>
    );
}