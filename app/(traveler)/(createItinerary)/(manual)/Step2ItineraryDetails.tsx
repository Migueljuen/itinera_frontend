import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface AvailabilitySlot {
    day_of_week: string;
    start_time: string;
    end_time: string;
}

interface ExperienceFormData {
    title: string;
    description: string;
    price: string;
    unit: string;
    availability: AvailabilitySlot[];
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

    const onChangeStartTime = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (selectedDate) {
            setStartTime(selectedDate);
            const formatted = dayjs(selectedDate).format('HH:mm');
            setStart(formatted);
        }
    };

    const onChangeEndTime = (event: DateTimePickerEvent, selectedDate?: Date) => {
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

    const addAvailability = () => {
        if (start && end && selectedDays.length > 0) {
            // Create a slot for each selected day
            const newSlots = selectedDays.map(selectedDay => ({
                day_of_week: selectedDay,
                start_time: start,
                end_time: end
            }));

            setFormData({
                ...formData,
                availability: [...formData.availability, ...newSlots],
            });

            // Reset selection states
            setSelectedDays([]);
            setStart('');
            setEnd('');
        }
    };

    const removeSlot = (index: number) => {
        const updated = formData.availability.filter((_, i) => i !== index);
        setFormData({ ...formData, availability: updated });
    };

    return (
        <View className='text-center py-2 ' >
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
                                className={`px-4 py-2 rounded-full border ${selectedDays.includes(d) ? 'bg-gray-700' : 'bg-white border border-gray-200'
                                    }`}
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
                        <Text>{start || 'Select Start Time'}</Text>

                        <DateTimePicker
                            value={startTime}
                            mode="time"
                            is24Hour={false}
                            display="default"
                            onChange={onChangeStartTime}
                        />
                    </View>
                </View>

                <View className="bg-white pb-4">
                    <Text className="font-onest-medium py-2 text-gray-800">End time</Text>

                    <View className='flex flex-row justify-between items-center'>
                        <Text>{end || 'Select End Time'}</Text>

                        <DateTimePicker
                            value={endTime}
                            mode="time"
                            is24Hour={false}
                            display="default"
                            onChange={onChangeEndTime}
                        />
                    </View>
                </View>

                <Pressable
                    onPress={addAvailability}
                    className={`p-3 rounded-xl ${start && end ? 'bg-green-600' : 'bg-gray-300'}`}
                    disabled={!start || !end}
                >
                    <Text className="text-white text-center">Add Slot</Text>
                </Pressable>

                <FlatList
                    className='h-36'
                    data={formData.availability}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={({ item, index }) => (
                        <View className="flex-row justify-between items-center p-2 py-4 border-b border-gray-200">
                            <Text>{item.day_of_week}: {item.start_time} - {item.end_time}</Text>

                            <Text onPress={() => removeSlot(index)} className="text-red-400">Remove</Text>

                        </View>
                    )}
                />

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
    );
};

export default Step2Availability;