// components/itinerary/ItineraryItemCard.tsx

import { ItineraryItem } from '@/types/itineraryDetails';
import { formatTime } from '@/utils/itinerary-utils';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

interface Props {
    item: ItineraryItem;
    isLast: boolean;
    onPress: () => void;
    onNavigate: () => void;
    onEditTime?: (item: ItineraryItem) => void;
    onRemove?: (item: ItineraryItem) => void;
    isCompleted?: boolean;
    swipeEnabled?: boolean;
}

export function ItineraryItemCard({
    item,
    isLast,
    onPress,
    onNavigate,
    onEditTime,
    onRemove,
    isCompleted = false,
    swipeEnabled = true,
}: Props) {
    const startTimeDisplay = formatTime(item.start_time);
    const endTimeDisplay = formatTime(item.end_time);

    const canSwipe = !isCompleted && swipeEnabled && (onEditTime || onRemove);
    const swipeWidth = onRemove ? 160 : 80;

    // Reanimated shared values
    const translateX = useSharedValue(0);
    const isOpen = useSharedValue(false);

    const closeRow = () => {
        translateX.value = withTiming(0, { duration: 150, easing: Easing.out(Easing.ease) });
        isOpen.value = false;
    };

    const handleEditTime = () => {
        closeRow();
        onEditTime?.(item);
    };

    const handleRemove = () => {
        closeRow();
        onRemove?.(item);
    };

    const handlePress = () => {
        if (isOpen.value) {
            closeRow();
        } else {
            onPress();
        }
    };

    // Pan gesture for swiping
    const panGesture = Gesture.Pan()
        .activeOffsetX([-10, 10])
        .failOffsetY([-5, 5])
        .onUpdate((event) => {
            if (!canSwipe) return;

            let newX = event.translationX;

            // If already open, offset by swipe width
            if (isOpen.value) {
                newX = event.translationX - swipeWidth;
            }

            // Clamp values - only allow left swipe
            if (newX > 0) newX = 0;
            if (newX < -swipeWidth - 20) newX = -swipeWidth - 20;

            translateX.value = newX;
        })
        .onEnd((event) => {
            if (!canSwipe) return;

            const shouldOpen = event.translationX < -50 || (isOpen.value && event.translationX > -50 && event.translationX < 50);

            if (shouldOpen) {
                translateX.value = withTiming(-swipeWidth, { duration: 150, easing: Easing.out(Easing.ease) });
                isOpen.value = true;
            } else {
                translateX.value = withTiming(0, { duration: 150, easing: Easing.out(Easing.ease) });
                isOpen.value = false;
            }
        });

    // Animated style for the card
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const cardContent = (
        <Pressable onPress={handlePress} style={styles.cardPressable}>
            <View className="flex-row ">
                {/* Timeline Column */}
                <View className="w-6 items-center mr-3">
                    {/* Dot */}
                    <View
                        className={`
                            w-3 h-3 rounded-full mt-2 z-10
                            ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}
                        `}
                    />

                    {/* Connecting line */}
                    {!isLast && (
                        <View
                            style={{
                                flex: 1,
                                width: 1,
                                backgroundColor: '#d1d5db',
                                marginTop: 2,
                            }}
                        />
                    )}
                </View>

                {/* Content Column */}
                <View className="flex-1 pb-6">
                    {/* Experience Details */}
                    <Text
                        className={`text-2xl font-onest mb-1 ${isCompleted ? 'text-black/50' : 'text-black/90'
                            }`}
                        numberOfLines={1}
                    >
                        {item.experience_name}
                    </Text>

                    {/* Location */}
                    <View className="flex-row items-center">
                        <Ionicons
                            name="location-outline"
                            size={14}
                            color={isCompleted ? '#9CA3AF' : '#4F46E5'}
                        />
                        <Text
                            className={`text-sm font-onest ml-1 ${isCompleted ? 'text-black/50' : 'text-black/50'
                                }`}
                            numberOfLines={1}
                        >
                            {`${item.destination_name}, ${item.destination_city}`}
                        </Text>
                    </View>

                    {/* Time Details */}
                    <View className="mt-8 flex flex-row items-baseline justify-between">
                        <View className="flex-row items-center">
                            <Text
                                className={`text-2xl font-onest mb-1 ${isCompleted ? 'text-black/50' : 'text-black/90'
                                    }`}
                                numberOfLines={1}
                            >
                                {startTimeDisplay} - {endTimeDisplay}
                            </Text>
                            {/* Swipe hint */}
                            {/* {canSwipe && (
                                <View style={styles.swipeHint}>
                                    <Ionicons
                                        name="chevron-back"
                                        size={14}
                                        color="#C0C0C0"
                                    />
                                </View>
                            )} */}
                        </View>
                        <View
                            style={{ backgroundColor: '#000000cc' }}
                            className="rounded-2xl px-4 py-3"
                        >
                            <Ionicons
                                name="arrow-forward-outline"
                                size={24}
                                color="#ffffffcc"
                            />
                        </View>
                    </View>
                </View>
            </View>
        </Pressable>
    );

    // If swipe is disabled, render without swipe functionality
    if (!canSwipe) {
        return <View style={styles.container}>{cardContent}</View>;
    }

    return (
        <View style={styles.container} >
            {/* Hidden Actions */}
            <View style={styles.hiddenRow} >
                {onEditTime && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.editButton, { borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }]}
                        onPress={handleEditTime}
                        activeOpacity={0.8}
                        className=''
                    >

                        <Text className='font-onest text-white text-sm' >Change</Text>
                        <Text className='font-onest  text-white  text-sm'>Time</Text>
                    </TouchableOpacity>
                )}
                {onRemove && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.removeButton, { borderTopRightRadius: 12, borderBottomRightRadius: 12 }]}
                        onPress={handleRemove}
                        className=''
                    >

                        <Text className='font-onest' style={styles.actionButtonText}>Cancel</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Swipeable Front Row */}
            <GestureDetector gesture={panGesture}>
                <Animated.View style={[styles.frontRow, animatedStyle]}>
                    {cardContent}
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        overflow: 'hidden',
    },
    frontRow: {
        backgroundColor: '#fff',
    },
    cardPressable: {
        backgroundColor: '#fff',
    },
    hiddenRow: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',

    },
    actionButton: {
        width: 72,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',

    },
    editButton: {
        backgroundColor: '#3B82F6',
    },
    removeButton: {
        backgroundColor: '#0000000D',
    },
    actionButtonText: {
        color: '#191313',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    swipeHint: {
        marginLeft: 8,
        opacity: 0.6,
    },
});