import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { AvailabilityDay, ExperienceFormData, TimeSlot } from '../../../../types/types';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());

    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    // Load existing availability data
    useEffect(() => {
        // Use data from parent instead of loading independently
        if (formData.availability && formData.availability.length > 0) {
            setOriginalAvailability([...formData.availability]);
        }
        setLoading(false); // Always set loading to false since parent handles data loading
    }, [formData.availability]);

    // Add this after the useEffect
    console.log('Step2 - formData.availability:', formData.availability);
    console.log('Step2 - originalAvailability:', originalAvailability);

    const onChangeStartTime = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowStartPicker(Platform.OS === 'ios');
        if (selectedDate) {
            setStartTime(selectedDate);
            const formatted = dayjs(selectedDate).format('HH:mm');
            setStart(formatted);
        }
    };

    const onChangeEndTime = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowEndPicker(Platform.OS === 'ios');
        if (selectedDate) {
            setEndTime(selectedDate);
            const formatted = dayjs(selectedDate).format('HH:mm');
            setEnd(formatted);
        }
    };

    const toggleDaySelection = (d: string) => {
        if (selectedDays.includes(d)) {
            setSelectedDays(selectedDays.filter(day => day !== d));
        } else {
            setSelectedDays([...selectedDays, d]);
        }
    };

    // Format time with seconds for API consistency
    const formatTimeWithSeconds = (time: string): string => {
        return time.length === 5 ? `${time}:00` : time;
    };

    const addAvailability = () => {
        if (!start || !end || selectedDays.length === 0) return;

        // Validate that end time is after start time
        const startTimeDate = new Date(`2000-01-01T${start}`);
        const endTimeDate = new Date(`2000-01-01T${end}`);

        if (endTimeDate <= startTimeDate) {
            Alert.alert('Invalid Time', 'End time must be after start time');
            return;
        }

        // Format times with seconds for consistency with backend
        const newTimeSlot: TimeSlot = {
            start_time: formatTimeWithSeconds(start),
            end_time: formatTimeWithSeconds(end)
        };

        const updatedAvailability = [...formData.availability];

        selectedDays.forEach(day => {
            const dayIndex = updatedAvailability.findIndex(slot => slot.day_of_week === day);

            if (dayIndex !== -1) {
                // Add to existing time_slots
                updatedAvailability[dayIndex] = {
                    ...updatedAvailability[dayIndex],
                    time_slots: [...updatedAvailability[dayIndex].time_slots, newTimeSlot]
                };
            } else {
                // Create new day with time_slots
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

        // Clear UI selections
        setSelectedDays([]);
        setStart('');
        setEnd('');
    };

    const removeSlot = (dayIndex: number, slotIndex: number) => {
        const updated = [...formData.availability];
        updated[dayIndex].time_slots.splice(slotIndex, 1);
        if (updated[dayIndex].time_slots.length === 0) {
            updated.splice(dayIndex, 1); // Remove whole day if no slots left
        }
        setFormData({ ...formData, availability: updated });
    };

    // Format time for display (convert from HH:MM:SS to HH:MM if needed)
    const formatTimeForDisplay = (time: string): string => {
        return time.length === 8 ? time.substring(0, 5) : time;
    };

    // Check if there are changes from original
    const hasChanges = () => {
        if (formData.availability.length !== originalAvailability.length) return true;

        // Deep comparison of availability
        return JSON.stringify(formData.availability) !== JSON.stringify(originalAvailability);
    };

    // Reset to original availability
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

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#376a63" />
                <Text className="mt-4 text-gray-600">Loading availability data...</Text>
            </View>
        );
    }

    return (
        <ScrollView>
            <View className='text-center py-2'>
                <Text className="text-center text-xl font-onest-semibold mb-2">Edit Availability</Text>
                <Text className="text-center text-sm text-gray-500 font-onest mb-6 w-3/4 m-auto">
                    Modify when this experience will be available. You can add new time slots or remove existing ones.
                </Text>

                <View className="flex justify-evenly gap-4 border-t pt-12 border-gray-200">

                    {/* Current Availability Overview */}
                    {formData.availability.length > 0 && (
                        <View className="bg-blue-50 p-4 rounded-xl mb-4">
                            <Text className="font-onest-semibold text-blue-800 mb-2">Current Availability</Text>
                            <Text className="text-blue-600 text-sm">
                                {formData.availability.length} day(s) with {formData.availability.reduce((total, day) => total + day.time_slots.length, 0)} time slot(s)
                            </Text>
                            {hasChanges() && (
                                <Text className="text-blue-600 text-sm mt-1">
                                    ✓ Changes detected
                                </Text>
                            )}
                        </View>
                    )}

                    <View className="bg-white pb-4">
                        <Text className='font-onest-medium py-2'>Add new availability</Text>
                        <Text className='font-onest-medium py-2'>Day of week</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {daysOfWeek.map((d) => (
                                <Pressable
                                    key={d}
                                    onPress={() => toggleDaySelection(d)}
                                    className={`px-4 py-2 rounded-full border ${selectedDays.includes(d) ? 'bg-gray-700' : 'bg-white border border-gray-200'}`}
                                >
                                    <Text className={selectedDays.includes(d) ? 'text-white' : 'text-gray-800'}>
                                        {d}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    <View className="pb-4">
                        <Text className="font-onest-medium py-2 text-gray-800">Start time</Text>
                        <View className='flex flex-row justify-between items-center'>
                            <Pressable onPress={() => setShowStartPicker(true)}>
                                <Text className="p-3 border border-gray-200 rounded-lg min-w-[120px] text-center">
                                    {start || 'Select Start Time'}
                                </Text>
                            </Pressable>

                            {(showStartPicker || Platform.OS === 'ios') && (
                                <DateTimePicker
                                    value={startTime}
                                    mode="time"
                                    is24Hour={false}
                                    display={Platform.OS === 'ios' ? "default" : "clock"}
                                    onChange={onChangeStartTime}
                                />
                            )}
                        </View>
                    </View>

                    <View className="bg-white pb-4">
                        <Text className="font-onest-medium py-2 text-gray-800">End time</Text>
                        <View className='flex flex-row justify-between items-center'>
                            <Pressable onPress={() => setShowEndPicker(true)}>
                                <Text className="p-3 border border-gray-200 rounded-lg min-w-[120px] text-center">
                                    {end || 'Select End Time'}
                                </Text>
                            </Pressable>

                            {(showEndPicker || Platform.OS === 'ios') && (
                                <DateTimePicker
                                    value={endTime}
                                    mode="time"
                                    is24Hour={false}
                                    display={Platform.OS === 'ios' ? "default" : "clock"}
                                    onChange={onChangeEndTime}
                                />
                            )}
                        </View>
                    </View>

                    <Pressable
                        onPress={addAvailability}
                        className={`p-3 rounded-xl ${start && end && selectedDays.length > 0 ? 'bg-green-600' : 'bg-gray-300'}`}
                        disabled={!start || !end || selectedDays.length === 0}
                    >
                        <Text className="text-white text-center font-onest-medium">Add Time Slot</Text>
                    </Pressable>

                    {/* Existing Availability List */}
                    <View className="mt-6">
                        <Text className="font-onest-semibold text-lg mb-4">Current Time Slots</Text>

                        {formData.availability.length === 0 ? (
                            <View className="bg-gray-50 p-6 rounded-xl">
                                <Text className="text-gray-500 text-center">
                                    No availability set. Add time slots above.
                                </Text>
                            </View>
                        ) : (
                            <View>
                                {formData.availability.map((item, index) => (
                                    <View key={`${item.day_of_week}-${index}`} className="mb-4 bg-white p-4 rounded-xl border border-gray-200">
                                        <Text className="font-onest-semibold text-lg mb-2 text-gray-800">{item.day_of_week}</Text>
                                        {item.time_slots.map((slot, i) => (
                                            <View
                                                key={`${item.day_of_week}-${i}`}
                                                className="flex-row justify-between items-center px-2 py-2 border-b border-gray-100"
                                            >
                                                <Text className="font-onest text-gray-700">
                                                    {formatTimeForDisplay(slot.start_time)} - {formatTimeForDisplay(slot.end_time)}
                                                </Text>
                                                <Pressable
                                                    onPress={() => removeSlot(index, i)}
                                                    className="bg-red-100 px-3 py-1 rounded-full"
                                                >
                                                    <Text className="text-red-600 text-sm font-onest-medium">
                                                        Remove
                                                    </Text>
                                                </Pressable>
                                            </View>
                                        ))}
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Reset button */}
                    {hasChanges() && (
                        <Pressable
                            onPress={resetToOriginal}
                            className="mt-2 p-3 rounded-xl border border-red-200 bg-red-50"
                        >
                            <Text className="text-center font-onest-medium text-sm text-red-600">
                                Reset to Original Availability
                            </Text>
                        </Pressable>
                    )}

                    {/* Navigation buttons */}
                    <View className="flex-row justify-between mt-6">
                        <Pressable onPress={onBack} className="border border-primary p-4 rounded-xl">
                            <Text className="text-gray-800 font-onest-medium">Previous step</Text>
                        </Pressable>
                        <Pressable
                            onPress={formData.availability.length > 0 ? onNext : undefined}
                            className={`p-4 px-6 rounded-xl ${formData.availability.length > 0 ? 'bg-primary' : 'bg-gray-200'}`}
                            disabled={formData.availability.length === 0}
                        >
                            <Text className="text-center font-onest-medium text-base text-gray-300">
                                {hasChanges() ? 'Continue with changes' : 'Next step'}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

export default Step2EditAvailability;