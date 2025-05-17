import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, FlatList, Platform, ScrollView } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Updated interfaces to match backend requirements
interface TimeSlot {
    slot_id?: number;
    availability_id?: number;
    start_time: string;
    end_time: string;
}

interface AvailabilityDay {
    availability_id?: number;
    experience_id?: number;
    day_of_week: string;
    time_slots: TimeSlot[];
}

interface ExperienceFormData {
    title: string;
    description: string;
    price: string;
    unit: string;
    availability: AvailabilityDay[];
    tags: number[];
    useExistingDestination: boolean;
    destination_id: number | null;
    destination_name: string;
    city: string;
    destination_description: string;
    latitude: string;
    longitude: string;
    images: any[];
}

interface StepProps {
    formData: ExperienceFormData;
    setFormData: React.Dispatch<React.SetStateAction<ExperienceFormData>>;
    onNext: () => void;
    onBack: () => void;
}

const Step2Availability: React.FC<StepProps> = ({ formData, setFormData, onNext, onBack }) => {
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');

    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());

    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

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
            // If day is already selected, remove it
            setSelectedDays(selectedDays.filter(day => day !== d));
        } else {
            // If day is not selected, add it
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
            alert('End time must be after start time');
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

    return (
        <View>
            <View className='text-center py-2'>
                <Text className="text-center text-xl font-onest-semibold mb-2">Set Availability</Text>
                <Text className="text-center text-sm text-gray-500 font-onest mb-6 w-3/4 m-auto">Choose the dates and times when this experience will be available to others.</Text>

                <View className="flex justify-evenly gap-4 border-t pt-12 border-gray-200">

                    <View className="bg-white pb-4">
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
                        {/* Start time picker */}
                        <View className='flex flex-row justify-between items-center'>
                            <Pressable onPress={() => setShowStartPicker(true)}>
                                <Text>{start || 'Select Start Time'}</Text>
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
                        {/* End time picker */}
                        <View className='flex flex-row justify-between items-center'>
                            <Pressable onPress={() => setShowEndPicker(true)}>
                                <Text>{end || 'Select End Time'}</Text>
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
                        className={`p-3 rounded-xl ${start && end ? 'bg-green-600' : 'bg-gray-300'}`}
                        disabled={!start || !end}
                    >
                        <Text className="text-white text-center">Add Slot</Text>
                    </Pressable>

                    <View className="h-40">
                        <FlatList
                            data={formData.availability}
                            keyExtractor={(item, index) => `${item.day_of_week}-${index}`}
                            renderItem={({ item, index }) => (
                                <View className="mb-4">
                                    <Text className="font-bold text-lg mb-2">{item.day_of_week}</Text>
                                    {item.time_slots.map((slot, i) => (
                                        <View
                                            key={`${item.day_of_week}-${i}`}
                                            className="flex-row justify-between items-center px-2 py-1 border-b border-gray-200"
                                        >
                                            <Text>
                                                {formatTimeForDisplay(slot.start_time)} - {formatTimeForDisplay(slot.end_time)}
                                            </Text>
                                            <Text
                                                onPress={() => removeSlot(index, i)}
                                                className="text-red-400"
                                            >
                                                Remove
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        />
                    </View>

                    <View className="flex-row justify-between mt-4">
                        <Pressable onPress={onBack} className="border border-primary p-4 rounded-xl">
                            <Text className="text-gray-800">Previous step</Text>
                        </Pressable>
                        <Pressable
                            onPress={formData.availability.length > 0 ? onNext : undefined}
                            className={`p-4 px-6 rounded-xl ${formData.availability.length > 0 ? 'bg-primary' : 'bg-gray-200'}`}
                        >
                            <Text className="text-center font-onest-medium text-base text-gray-300">Next step</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default Step2Availability;