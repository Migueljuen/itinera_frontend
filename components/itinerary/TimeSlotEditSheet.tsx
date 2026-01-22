// components/itinerary/TimeSlotEditSheet.tsx

import API_URL from '@/constants/api';
import { ItineraryItem } from '@/types/itineraryDetails';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.7;

type TimeSlot = {
    slot_id?: number;
    availability_id?: number;
    start_time: string;
    end_time: string;
    price_per_guest?: number;
};

type AvailabilityDay = {
    availability_id?: number;
    experience_id?: number;
    day_of_week: string;
    time_slots: TimeSlot[];
};

type AvailabilityData = {
    availability: AvailabilityDay[];
};

interface TimeSlotEditSheetProps {
    visible: boolean;
    onClose: () => void;
    onSave: (item: ItineraryItem, newStartTime: string, newEndTime: string) => void;
    item: ItineraryItem | null;
    dayDate: Date | null;
    otherItemsOnDay?: ItineraryItem[];

}

export const TimeSlotEditSheet: React.FC<TimeSlotEditSheetProps> = ({
    visible,
    onClose,
    onSave,
    item,
    dayDate,
    otherItemsOnDay = [],
}) => {
    const [availabilityData, setAvailabilityData] = useState<AvailabilityData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (visible && item?.experience_id) {
            fetchAvailability();
        }
        if (visible) {
            setSelectedSlot(null);
        }
    }, [visible, item?.experience_id]);

    const fetchAvailability = async () => {
        if (!item?.experience_id) return;

        try {
            setLoading(true);
            setError(null);
            const response = await fetch(
                `${API_URL}/experience/availability/${item.experience_id}`
            );
            if (!response.ok) {
                throw new Error('Failed to fetch availability data');
            }
            const data = await response.json();
            setAvailabilityData(data);
        } catch (err) {
            console.error('Error fetching availability:', err);
            setError('Could not load available time slots');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timeString: string): string => {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minutes} ${ampm}`;
    };

    const formatTimeRange = (startTime: string, endTime: string): string => {
        return `${formatTime(startTime)} – ${formatTime(endTime)}`;
    };

    const timeToMinutes = (timeString: string): number => {
        const [hours, minutes] = timeString.split(':').map((num) => parseInt(num, 10));
        return hours * 60 + minutes;
    };

    const sortTimeSlots = (slots: TimeSlot[]): TimeSlot[] => {
        return [...slots].sort(
            (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
        );
    };

    const hasConflict = (slot: TimeSlot): boolean => {
        const slotStart = timeToMinutes(slot.start_time);
        const slotEnd = timeToMinutes(slot.end_time);

        return otherItemsOnDay.some((otherItem) => {
            if (otherItem.item_id === item?.item_id) return false;

            const otherStart = timeToMinutes(otherItem.start_time);
            const otherEnd = timeToMinutes(otherItem.end_time);

            return slotStart < otherEnd && slotEnd > otherStart;
        });
    };

    const isCurrentTime = (slot: TimeSlot): boolean => {
        if (!item) return false;
        return slot.start_time === item.start_time && slot.end_time === item.end_time;
    };

    const getAvailableSlotsForDay = (): TimeSlot[] => {
        if (!availabilityData?.availability || !dayDate) return [];

        const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'long' });
        const dayAvailability = availabilityData.availability.find(
            (d) => d.day_of_week === dayName
        );

        if (!dayAvailability?.time_slots) return [];

        return sortTimeSlots(dayAvailability.time_slots);
    };

    const formatDateHeader = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });
    };

    const getMonthYear = () => {
        if (!dayDate) return '';
        return dayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const handleSlotSelect = (slot: TimeSlot) => {
        if (hasConflict(slot)) return;
        setSelectedSlot(slot);
    };

    const handleSave = async () => {
        if (!selectedSlot || !item) return;

        setSaving(true);
        try {
            await onSave(item, selectedSlot.start_time, selectedSlot.end_time);
            onClose();
        } catch (err) {
            console.error('Error saving time slot:', err);
        } finally {
            setSaving(false);
        }
    };

    const availableSlots = getAvailableSlotsForDay();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View
                style={{
                    flex: 1,
                    justifyContent: 'flex-end',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                }}
            >
                <View
                    style={{
                        height: MODAL_HEIGHT,
                        backgroundColor: 'white',
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                    }}
                >
                    {/* Header */}
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: 20,
                            paddingTop: 20,
                            paddingBottom: 16,
                        }}
                    >
                        <Text style={{ fontSize: 24, fontWeight: '600', color: '#000' }}>
                            Change time
                        </Text>
                        <TouchableOpacity
                            onPress={onClose}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View style={{ flex: 1, paddingHorizontal: 20 }}>
                        {loading ? (
                            <View
                                style={{
                                    flex: 1,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    paddingVertical: 64,
                                }}
                            >
                                <ActivityIndicator size="large" color="#1f2937" />
                                <Text style={{ marginTop: 16, color: '#6B7280' }}>
                                    Loading availability...
                                </Text>
                            </View>
                        ) : error ? (
                            <View
                                style={{
                                    flex: 1,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    paddingVertical: 64,
                                }}
                            >
                                <Ionicons name="warning-outline" size={48} color="#EF4444" />
                                <Text
                                    style={{
                                        color: '#EF4444',
                                        fontWeight: '500',
                                        textAlign: 'center',
                                        marginTop: 16,
                                    }}
                                >
                                    {error}
                                </Text>
                            </View>
                        ) : availableSlots.length === 0 ? (
                            <View
                                style={{
                                    flex: 1,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    paddingVertical: 64,
                                }}
                            >
                                <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
                                <Text
                                    style={{
                                        color: '#4B5563',
                                        fontWeight: '500',
                                        textAlign: 'center',
                                        marginTop: 16,
                                    }}
                                >
                                    No availability found
                                </Text>
                                <Text
                                    style={{
                                        color: '#9CA3AF',
                                        textAlign: 'center',
                                        marginTop: 8,
                                        paddingHorizontal: 32,
                                    }}
                                >
                                    This experience has no available time slots for this day.
                                </Text>
                            </View>
                        ) : (
                            <>
                                {/* Month Header */}
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingVertical: 16,
                                        borderBottomWidth: 1,
                                        borderBottomColor: '#E5E7EB',
                                    }}
                                >
                                    <Text style={{ fontSize: 16, fontWeight: '500', color: '#000' }}>
                                        {getMonthYear()}
                                    </Text>
                                    <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                        <Ionicons name="calendar-outline" size={20} color="#000" />
                                    </TouchableOpacity>
                                </View>

                                {/* Scrollable Time Slots */}
                                <ScrollView
                                    style={{ flex: 1 }}
                                    showsVerticalScrollIndicator={true}
                                    contentContainerStyle={{ paddingBottom: 40 }}
                                >
                                    {dayDate && (
                                        <View style={{ paddingTop: 20 }}>
                                            {/* Date Header */}
                                            <Text
                                                style={{
                                                    fontSize: 16,
                                                    fontWeight: '600',
                                                    color: '#000',
                                                    marginBottom: 12,
                                                }}
                                            >
                                                {formatDateHeader(dayDate)}
                                            </Text>

                                            {/* Time Slot Cards */}
                                            {availableSlots.map((slot, slotIndex) => {
                                                const isCurrent = isCurrentTime(slot);
                                                const isConflict = hasConflict(slot);
                                                const isSelected =
                                                    selectedSlot?.start_time === slot.start_time &&
                                                    selectedSlot?.end_time === slot.end_time;
                                                const isDisabled = isConflict;

                                                return (
                                                    <TouchableOpacity
                                                        key={slotIndex}
                                                        onPress={() => handleSlotSelect(slot)}
                                                        disabled={isDisabled}
                                                        activeOpacity={isDisabled ? 1 : 0.7}
                                                        style={{
                                                            borderWidth: isSelected ? 2 : 1,
                                                            borderColor: isSelected
                                                                ? '#3B82F6'
                                                                : '#E5E7EB',
                                                            backgroundColor: isSelected
                                                                ? '#EFF6FF'
                                                                : '#fff',
                                                            borderRadius: 12,
                                                            paddingHorizontal: 16,
                                                            paddingVertical: 14,
                                                            marginBottom: 12,
                                                            opacity: isDisabled ? 0.6 : 1,
                                                        }}
                                                    >
                                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                            {/* Dot indicator */}
                                                            <View
                                                                style={{
                                                                    width: 8,
                                                                    height: 8,
                                                                    borderRadius: 4,
                                                                    backgroundColor: isCurrent
                                                                        ? '#3b82f6'
                                                                        : isConflict
                                                                            ? '#EF4444'
                                                                            : '#22C55E',
                                                                    marginRight: 10,
                                                                }}
                                                            />
                                                            <View style={{ flex: 1 }}>
                                                                <Text
                                                                    style={{
                                                                        fontSize: 16,
                                                                        fontWeight: '500',
                                                                        color: isConflict ? '#9CA3AF' : '#000',
                                                                    }}
                                                                >
                                                                    {formatTimeRange(slot.start_time, slot.end_time)}
                                                                </Text>
                                                                <Text
                                                                    style={{
                                                                        fontSize: 12,
                                                                        color: isCurrent
                                                                            ? '#3b82f6'
                                                                            : isConflict
                                                                                ? '#000000aa'
                                                                                : '#000000cc',
                                                                        marginTop: 2,
                                                                    }}
                                                                >
                                                                    {isCurrent
                                                                        ? 'Current time'
                                                                        : isConflict
                                                                            ? 'Conflicts with another activity'
                                                                            : 'Available'}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    )}
                                </ScrollView>
                            </>
                        )}
                    </View>

                    {/* Bottom Actions */}
                    {availableSlots.length > 0 && (
                        <View
                            style={{
                                paddingHorizontal: 20,
                                paddingTop: 16,
                                paddingBottom: 34,
                                borderTopWidth: 1,
                                borderTopColor: '#E5E7EB',
                            }}
                        >
                            <TouchableOpacity
                                onPress={handleSave}
                                disabled={!selectedSlot || saving}
                                style={{
                                    paddingVertical: 16,
                                    borderRadius: 12,
                                    backgroundColor:
                                        selectedSlot && !saving ? '#3B82F6' : '#E5E7EB',
                                    alignItems: 'center',
                                }}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text
                                        style={{
                                            fontSize: 16,
                                            fontWeight: '600',
                                            color: selectedSlot ? '#fff' : '#9CA3AF',
                                        }}
                                    >
                                        Save Changes
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

export default TimeSlotEditSheet;