// AvailabilityCalendar.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import API_URL from '../constants/api';

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

interface AvailabilityCalendarProps {
    experienceId: number;
    tripStartDate: string;
    tripEndDate: string;
    pricePerGuest?: number;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
    experienceId,
    tripStartDate,
    tripEndDate,
    pricePerGuest = 0,
}) => {
    const [availabilityData, setAvailabilityData] = useState<AvailabilityData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const tripStart = new Date(tripStartDate);
    const tripEnd = new Date(tripEndDate);

    useEffect(() => {
        const fetchAvailability = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_URL}/experience/availability/${experienceId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch availability data');
                }
                const data = await response.json();
                setAvailabilityData(data);
            } catch (error) {
                console.error('Error fetching availability data:', error);
                setError('Could not load availability information');
            } finally {
                setLoading(false);
            }
        };

        fetchAvailability();
    }, [experienceId]);

    const formatTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minutes} ${ampm}`;
    };

    const formatTimeRange = (startTime: string, endTime: string) => {
        return `${formatTime(startTime)} – ${formatTime(endTime)}`;
    };

    const timeToMinutes = (timeString: string) => {
        const [hours, minutes] = timeString.split(':').map(num => parseInt(num, 10));
        return hours * 60 + minutes;
    };

    const sortTimeSlots = (slots: TimeSlot[]) => {
        return [...slots].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
    };

    const getTripDates = () => {
        const dates: Date[] = [];
        const currentDate = new Date(tripStart);
        while (currentDate <= tripEnd) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    };

    const tripDates = getTripDates();

    const formatDateHeader = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });
    };

    const getMonthYear = () => {
        return tripStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const formatPrice = (price: number) => {
        return `₱${price.toLocaleString()}`;
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 64 }}>
                <ActivityIndicator size="large" color="#1f2937" />
                <Text style={{ marginTop: 16, color: '#6B7280' }}>Loading availability...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 64 }}>
                <Ionicons name="warning-outline" size={48} color="#EF4444" />
                <Text style={{ color: '#EF4444', fontWeight: '500', textAlign: 'center', marginTop: 16 }}>{error}</Text>
            </View>
        );
    }

    if (!availabilityData?.availability?.length) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 64 }}>
                <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
                <Text style={{ color: '#4B5563', fontWeight: '500', textAlign: 'center', marginTop: 16 }}>
                    No availability found
                </Text>
                <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 8, paddingHorizontal: 32 }}>
                    This experience has no available time slots for your trip dates.
                </Text>
            </View>
        );
    }

    const availabilityMap = new Map<string, TimeSlot[]>();
    availabilityData.availability.forEach(day => {
        availabilityMap.set(day.day_of_week, day.time_slots);
    });

    return (
        <View style={{ flex: 1 }}>
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
                {tripDates.map((date, dateIndex) => {
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                    const daySlots = availabilityMap.get(dayName);
                    const sortedSlots = daySlots ? sortTimeSlots(daySlots) : [];

                    if (sortedSlots.length === 0) return null;

                    return (
                        <View key={dateIndex} style={{ paddingTop: 20 }}>
                            {/* Date Header */}
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 12 }}>
                                {formatDateHeader(date)}
                            </Text>

                            {/* Time Slot Cards - View Only */}
                            {sortedSlots.map((slot, slotIndex) => {
                                const slotPrice = slot.price_per_guest ?? pricePerGuest;

                                return (
                                    <View
                                        key={slotIndex}
                                        style={{
                                            borderWidth: 1,
                                            borderColor: '#E5E7EB',
                                            backgroundColor: '#fff',
                                            borderRadius: 12,
                                            paddingHorizontal: 16,
                                            paddingVertical: 14,
                                            marginBottom: 12,
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 16, fontWeight: '500', color: '#000' }}>
                                                    {formatTimeRange(slot.start_time, slot.end_time)}
                                                </Text>
                                                <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>
                                                    {formatPrice(slotPrice)} / guest
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
};

export default AvailabilityCalendar;