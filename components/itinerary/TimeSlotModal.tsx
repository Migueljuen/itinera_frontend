
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import type { AvailableTimeSlot, ItineraryItem } from '../../types/itineraryTypes';
import { formatTime } from '../../utils/itineraryUtils';

interface Props {
    showTimeModal: boolean;
    editingItem: ItineraryItem | null;
    availableTimeSlots: AvailableTimeSlot[];
    loadingTimeSlots: boolean;
    handleTimeSlotSelect: (slot: AvailableTimeSlot) => void;
    closeModal: () => void;
}

export const TimeSlotModal: React.FC<Props> = ({
    showTimeModal,
    editingItem,
    availableTimeSlots,
    loadingTimeSlots,
    handleTimeSlotSelect,
    closeModal
}) => (
    <Modal
        animationType="slide"
        transparent={true}
        visible={showTimeModal}
        onRequestClose={closeModal}
    >
        <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-3xl h-[32rem]">
                <View className="p-4 border-b border-gray-200">
                    <View className="flex-row justify-between items-center">
                        <Text className="text-lg font-onest-semibold">Select Time Slot</Text>
                        <TouchableOpacity onPress={closeModal} className="p-1">
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>
                    {editingItem && (
                        <Text className="text-sm text-gray-600 mt-1 font-onest">
                            {editingItem.experience_name}
                        </Text>
                    )}
                </View>

                <ScrollView className="flex-1">
                    {loadingTimeSlots ? (
                        <View className="p-4 items-center">
                            <ActivityIndicator size="large" color="#4F46E5" />
                            <Text className="text-gray-500 font-onest text-center mt-2">
                                Loading available time slots...
                            </Text>
                        </View>
                    ) : availableTimeSlots.length > 0 ? (
                        availableTimeSlots.map((slot, slotIndex) => (
                            <TouchableOpacity
                                key={`timeslot-${slot.slot_id}-${slotIndex}`}
                                className={`p-4 border-b border-gray-100 flex-row items-center justify-between ${!slot.is_available ? 'opacity-60 bg-red-50' : ''
                                    }`}
                                onPress={() => handleTimeSlotSelect(slot)}
                                activeOpacity={0.7}
                            >
                                <View className="flex-row items-center flex-1">
                                    <Ionicons
                                        name="time-outline"
                                        size={20}
                                        color={slot.is_available ? "#4F46E5" : "#EF4444"}
                                    />
                                    <View className="ml-3 flex-1">
                                        <Text className="text-base font-onest-medium">
                                            {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                        </Text>
                                        {!slot.is_available && slot.conflicting_items && slot.conflicting_items.length > 0 && (
                                            <View className="mt-1">
                                                {slot.conflicting_items
                                                    .filter((item, index, self) =>
                                                        index === self.findIndex(t =>
                                                            (t?.item_id && t.item_id === item?.item_id) ||
                                                            (t?.experience_name === item?.experience_name)
                                                        )
                                                    )
                                                    .map((item, conflictIndex) => (
                                                        <Text
                                                            key={`conflict-slot-${slot.slot_id}-item-${conflictIndex}-${item?.item_id || `unnamed-${conflictIndex}`}`}
                                                            className="text-xs text-red-500 font-onest"
                                                        >
                                                            Conflicts with: {item?.experience_name || 'Unnamed experience'}
                                                        </Text>
                                                    ))}
                                            </View>
                                        )}
                                    </View>
                                </View>
                                <View className="flex-row items-center">
                                    {!slot.is_available && (
                                        <Ionicons name="warning-outline" size={16} color="#EF4444" className="mr-2" />
                                    )}
                                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View className="p-4 items-center">
                            <Ionicons name="time-outline" size={24} color="#D1D5DB" />
                            <Text className="text-gray-500 font-onest text-center mt-2">
                                No available time slots for this experience on this day
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </View>
    </Modal>
);