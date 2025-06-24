import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AvailabilityDay, ExperienceFormData, TimeSlot } from '../../../../types/types';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const daysShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface StepProps {
    formData: ExperienceFormData;
    setFormData: React.Dispatch<React.SetStateAction<ExperienceFormData>>;
    onNext: () => void;
    onBack: () => void;
    experienceId: number;
}

const Step2EditAvailability: React.FC<StepProps> = ({ formData, setFormData, onNext, onBack, experienceId }) => {
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [loading, setLoading] = useState(true);
    const [originalAvailability, setOriginalAvailability] = useState<AvailabilityDay[]>([]);
    const [expandedDay, setExpandedDay] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);

    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());

    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    // Load existing availability data
    useEffect(() => {
        if (formData.availability && formData.availability.length > 0) {
            setOriginalAvailability([...formData.availability]);
        }
        setLoading(false);
    }, [formData.availability]);

    const onChangeStartTime = (event: DateTimePickerEvent, selectedDate?: Date) => {
        const currentDate = selectedDate || startTime;
        setShowStartPicker(Platform.OS === 'ios');

        if (event.type === 'set' && selectedDate) {
            setStartTime(selectedDate);
            const formatted = dayjs(selectedDate).format('HH:mm');
            setStart(formatted);
        }

        // Close picker on Android after selection
        if (Platform.OS === 'android') {
            setShowStartPicker(false);
        }
    };

    const onChangeEndTime = (event: DateTimePickerEvent, selectedDate?: Date) => {
        const currentDate = selectedDate || endTime;
        setShowEndPicker(Platform.OS === 'ios');

        if (event.type === 'set' && selectedDate) {
            setEndTime(selectedDate);
            const formatted = dayjs(selectedDate).format('HH:mm');
            setEnd(formatted);
        }

        // Close picker on Android after selection
        if (Platform.OS === 'android') {
            setShowEndPicker(false);
        }
    };

    const toggleDaySelection = (d: string) => {
        if (selectedDays.includes(d)) {
            setSelectedDays(selectedDays.filter(day => day !== d));
        } else {
            setSelectedDays([...selectedDays, d]);
        }
    };

    const formatTimeWithSeconds = (time: string): string => {
        return time.length === 5 ? `${time}:00` : time;
    };

    const addAvailability = () => {
        if (!start || !end || selectedDays.length === 0) return;

        const startTimeDate = new Date(`2000-01-01T${start}`);
        const endTimeDate = new Date(`2000-01-01T${end}`);

        if (endTimeDate <= startTimeDate) {
            Alert.alert('Invalid Time', 'End time must be after start time');
            return;
        }

        const newTimeSlot: TimeSlot = {
            start_time: formatTimeWithSeconds(start),
            end_time: formatTimeWithSeconds(end)
        };

        const updatedAvailability = [...formData.availability];

        selectedDays.forEach(day => {
            const dayIndex = updatedAvailability.findIndex(slot => slot.day_of_week === day);

            if (dayIndex !== -1) {
                updatedAvailability[dayIndex] = {
                    ...updatedAvailability[dayIndex],
                    time_slots: [...updatedAvailability[dayIndex].time_slots, newTimeSlot]
                };
            } else {
                updatedAvailability.push({
                    day_of_week: day,
                    time_slots: [newTimeSlot]
                });
            }
        });

        setFormData(prev => ({
            ...prev,
            availability: updatedAvailability
        }));

        // Clear UI selections and close add form
        setSelectedDays([]);
        setStart('');
        setEnd('');
        setShowAddForm(false);
    };

    const removeSlot = (dayIndex: number, slotIndex: number) => {
        const updated = [...formData.availability];
        updated[dayIndex].time_slots.splice(slotIndex, 1);
        if (updated[dayIndex].time_slots.length === 0) {
            updated.splice(dayIndex, 1);
        }
        setFormData({ ...formData, availability: updated });
    };

    const formatTimeForDisplay = (time: string): string => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const hasChanges = () => {
        if (formData.availability.length !== originalAvailability.length) return true;
        return JSON.stringify(formData.availability) !== JSON.stringify(originalAvailability);
    };

    const resetToOriginal = () => {
        Alert.alert(
            'Reset Availability',
            'Are you sure you want to reset all availability changes?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: () => {
                        setFormData(prev => ({
                            ...prev,
                            availability: [...originalAvailability]
                        }));
                    }
                }
            ]
        );
    };

    const toggleDayExpansion = (day: string) => {
        setExpandedDay(expandedDay === day ? null : day);
    };

    const getTotalSlots = () => {
        return formData.availability.reduce((total, day) => total + day.time_slots.length, 0);
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#376a63" />
                <Text className="mt-4 text-gray-600">Loading availability data...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            {/* Fixed Header */}
            <View className="px-4 pt-6 pb-4 bg-white border-b border-gray-200">
                <Text className="text-center text-xl font-onest-semibold mb-2">Edit Availability</Text>
                <Text className="text-center text-sm text-gray-500 font-onest">
                    Modify when this experience will be available
                </Text>
            </View>

            {/* Scrollable Content */}
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="px-4 py-4">
                    {/* Summary Card */}
                    <View className="bg-primary rounded-xl p-4 mb-4">
                        <View className="flex-row justify-between items-center">
                            <View>
                                <Text className="text-white font-onest-semibold text-lg">
                                    {formData.availability.length} Days Active
                                </Text>
                                <Text className="text-white/80 text-sm font-onest">
                                    {getTotalSlots()} total time slots
                                </Text>
                            </View>
                            <View className="bg-white/20 px-3 py-1 rounded-full">
                                {hasChanges() ? (
                                    <Text className="text-white text-sm font-onest-medium">Modified</Text>
                                ) : (
                                    <Text className="text-white text-sm font-onest">Original</Text>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Add New Button */}
                    <TouchableOpacity
                        onPress={() => setShowAddForm(!showAddForm)}
                        className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex-row items-center justify-center"
                    >
                        <Ionicons name={showAddForm ? "close" : "add-circle"} size={24} color="#16a34a" />
                        <Text className="ml-2 text-green-700 font-onest-medium">
                            {showAddForm ? 'Cancel Adding' : 'Add New Time Slots'}
                        </Text>
                    </TouchableOpacity>

                    {/* Add Form - Collapsible */}
                    {showAddForm && (
                        <View className="bg-gray-50 rounded-xl p-4 mb-4">
                            {/* Day Selection - Compact */}
                            <Text className="font-onest-medium mb-2">Select Days</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                                <View className="flex-row gap-2">
                                    {daysOfWeek.map((d, index) => (
                                        <Pressable
                                            key={d}
                                            onPress={() => toggleDaySelection(d)}
                                            className={`px-3 py-2 rounded-full border ${selectedDays.includes(d)
                                                    ? 'bg-primary border-primary'
                                                    : 'bg-white border-gray-300'
                                                }`}
                                        >
                                            <Text className={`font-onest ${selectedDays.includes(d) ? 'text-white' : 'text-gray-700'
                                                }`}>
                                                {daysShort[index]}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </ScrollView>

                            {/* Time Selection - Side by Side */}
                            <View className="flex-row gap-4 mb-4">
                                <View className="flex-1">
                                    <Text className="font-onest-medium mb-2 text-sm">Start Time</Text>
                                    <Pressable
                                        onPress={() => {
                                            setShowEndPicker(false); // Close end picker if open
                                            setShowStartPicker(true);
                                        }}
                                        className="bg-white border border-gray-300 rounded-lg p-3"
                                    >
                                        <Text className="text-center font-onest">
                                            {start || 'Select'}
                                        </Text>
                                    </Pressable>
                                </View>
                                <View className="flex-1">
                                    <Text className="font-onest-medium mb-2 text-sm">End Time</Text>
                                    <Pressable
                                        onPress={() => {
                                            setShowStartPicker(false); // Close start picker if open
                                            setShowEndPicker(true);
                                        }}
                                        className="bg-white border border-gray-300 rounded-lg p-3"
                                    >
                                        <Text className="text-center font-onest">
                                            {end || 'Select'}
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>

                            {/* Add Button */}
                            <Pressable
                                onPress={addAvailability}
                                className={`p-3 rounded-lg ${start && end && selectedDays.length > 0
                                        ? 'bg-green-600'
                                        : 'bg-gray-300'
                                    }`}
                                disabled={!start || !end || selectedDays.length === 0}
                            >
                                <Text className="text-white text-center font-onest-medium">
                                    Add to Selected Days
                                </Text>
                            </Pressable>

                            {/* Time Pickers - Only show one at a time */}
                            {(showStartPicker || showEndPicker) && (
                                <View className={Platform.OS === 'ios' ? 'bg-white rounded-lg mt-2' : ''}>
                                    <DateTimePicker
                                        value={showStartPicker ? startTime : endTime}
                                        mode="time"
                                        is24Hour={false}
                                        display={Platform.OS === 'ios' ? "spinner" : "default"}
                                        onChange={showStartPicker ? onChangeStartTime : onChangeEndTime}
                                        textColor="#000000"
                                        style={Platform.OS === 'ios' ? { height: 150 } : {}}
                                        themeVariant="light"
                                    />
                                </View>
                            )}
                        </View>
                    )}

                    {/* Current Schedule - Compact View */}
                    <View className="mb-20">
                        <Text className="font-onest-semibold text-lg mb-3">Current Schedule</Text>

                        {formData.availability.length === 0 ? (
                            <View className="bg-gray-50 p-6 rounded-xl">
                                <Ionicons name="calendar-outline" size={48} color="#9CA3AF" style={{ alignSelf: 'center', marginBottom: 8 }} />
                                <Text className="text-gray-500 text-center font-onest">
                                    No availability set yet
                                </Text>
                                <Text className="text-gray-400 text-center text-sm mt-1">
                                    Tap "Add New Time Slots" to get started
                                </Text>
                            </View>
                        ) : (
                            <View>
                                {formData.availability.map((item, index) => (
                                    <TouchableOpacity
                                        key={`${item.day_of_week}-${index}`}
                                        onPress={() => toggleDayExpansion(item.day_of_week)}
                                        className="mb-2"
                                    >
                                        <View className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                            {/* Day Header */}
                                            <View className="flex-row justify-between items-center p-4">
                                                <View className="flex-row items-center flex-1">
                                                    <View className="bg-primary/10 p-2 rounded-lg mr-3 w-16 items-center">
                                                        <Text className="text-primary font-onest-semibold">
                                                            {item.day_of_week.substring(0, 3).toUpperCase()}
                                                        </Text>
                                                    </View>
                                                    <View className="flex-1">
                                                        <Text className="font-onest-semibold text-gray-800">
                                                            {item.day_of_week}
                                                        </Text>
                                                        <Text className="text-sm text-gray-500 font-onest">
                                                            {item.time_slots.length} time slot{item.time_slots.length !== 1 ? 's' : ''}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Ionicons
                                                    name={expandedDay === item.day_of_week ? "chevron-up" : "chevron-down"}
                                                    size={20}
                                                    color="#6B7280"
                                                />
                                            </View>

                                            {/* Expanded Time Slots */}
                                            {expandedDay === item.day_of_week && (
                                                <View className="px-4 pb-4 border-t border-gray-100">
                                                    {item.time_slots.map((slot, i) => (
                                                        <View
                                                            key={`${item.day_of_week}-${i}`}
                                                            className="flex-row justify-between items-center py-2"
                                                        >
                                                            <View className="flex-row items-center">
                                                                <Ionicons name="time-outline" size={16} color="#6B7280" />
                                                                <Text className="ml-2 font-onest text-gray-700">
                                                                    {formatTimeForDisplay(slot.start_time)} - {formatTimeForDisplay(slot.end_time)}
                                                                </Text>
                                                            </View>
                                                            <Pressable
                                                                onPress={() => removeSlot(index, i)}
                                                                className="p-1"
                                                            >
                                                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                                            </Pressable>
                                                        </View>
                                                    ))}
                                                </View>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Reset button */}
                        {hasChanges() && (
                            <Pressable
                                onPress={resetToOriginal}
                                className="mt-4 p-3 rounded-xl border border-red-200 bg-red-50"
                            >
                                <Text className="text-center font-onest-medium text-sm text-red-600">
                                    Reset to Original Availability
                                </Text>
                            </Pressable>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Fixed Bottom Navigation */}
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4">
                <View className="flex-row justify-between">
                    <Pressable
                        onPress={onBack}
                        className="flex-1 mr-2 border border-primary p-4 rounded-xl"
                    >
                        <Text className="text-center text-gray-800 font-onest-medium">Previous</Text>
                    </Pressable>
                    <Pressable
                        onPress={formData.availability.length > 0 ? onNext : undefined}
                        className={`flex-1 ml-2 p-4 rounded-xl ${formData.availability.length > 0 ? 'bg-primary' : 'bg-gray-200'
                            }`}
                        disabled={formData.availability.length === 0}
                    >
                        <Text className={`text-center font-onest-medium ${formData.availability.length > 0 ? 'text-white' : 'text-gray-400'
                            }`}>
                            {hasChanges() ? 'Continue' : 'Next'}
                        </Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
};

export default Step2EditAvailability;