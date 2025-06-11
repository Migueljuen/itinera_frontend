import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

interface Accommodation {
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
    check_in?: string;
    check_out?: string;
    booking_link?: string;
    check_in_time?: string;
    check_out_time?: string;
}

interface CheckInOutTimeProps {
    accommodation: Accommodation;
    handleTimeChange: (field: 'check_in_time' | 'check_out_time', value: string) => void;
}

const CheckInOutTime: React.FC<CheckInOutTimeProps> = ({ accommodation, handleTimeChange }) => {
    // State for managing the time picker visibility
    const [showCheckInPicker, setShowCheckInPicker] = useState(false);
    const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);

    // State for managing the actual Date objects for the pickers
    const [checkInTime, setCheckInTime] = useState(() => {
        if (accommodation.check_in_time) {
            // Create a date object with the stored time
            const [hours, minutes] = accommodation.check_in_time.split(':');
            const date = new Date();
            date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            return date;
        }
        // Default to 3:00 PM
        const date = new Date();
        date.setHours(15, 0, 0, 0);
        return date;
    });

    const [checkOutTime, setCheckOutTime] = useState(() => {
        if (accommodation.check_out_time) {
            // Create a date object with the stored time
            const [hours, minutes] = accommodation.check_out_time.split(':');
            const date = new Date();
            date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            return date;
        }
        // Default to 11:00 AM
        const date = new Date();
        date.setHours(11, 0, 0, 0);
        return date;
    });

    const onChangeCheckInTime = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowCheckInPicker(Platform.OS === 'ios');
        if (selectedDate) {
            setCheckInTime(selectedDate);
            const formatted = dayjs(selectedDate).format('HH:mm');
            handleTimeChange('check_in_time', formatted);
        }
    };

    const onChangeCheckOutTime = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowCheckOutPicker(Platform.OS === 'ios');
        if (selectedDate) {
            setCheckOutTime(selectedDate);
            const formatted = dayjs(selectedDate).format('HH:mm');
            handleTimeChange('check_out_time', formatted);
        }
    };

    return (
        <View className="mb-4">
            <Text className="font-onest-medium text-base mb-3">
                Check-in & Check-out Times
            </Text>
            <View className="flex-row gap-4">
                {/* Check-in Time */}
                <View className="flex-1">
                    <Text className="text-sm text-gray-600 font-onest mb-2">
                        Check-in Time 
                    </Text>
                    <Pressable
                        onPress={() => setShowCheckInPicker(true)}
                        className="border border-gray-300 rounded-lg p-3 bg-white flex-row items-center justify-between"
                    >
                                       {(showCheckInPicker || Platform.OS === 'ios') && (
                        <DateTimePicker
                            value={checkInTime}
                            mode="time"
                            is24Hour={false}
                            display={Platform.OS === 'ios' ? "default" : "clock"}
                            onChange={onChangeCheckInTime}
                        />
                    )}
                        
                        <Ionicons 
                            name="time" 
                            size={20} 
                            color="#9CA3AF"
                        />
                        
                    </Pressable>


                </View>

                {/* Check-out Time */}
                <View className="flex-1">
                    <Text className="text-sm text-gray-600 font-onest mb-2">
                        Check-out Time
                    </Text>
                    <Pressable
                        onPress={() => setShowCheckOutPicker(true)}
                        className="border border-gray-300 rounded-lg p-3 bg-white flex-row items-center justify-between"
                    >
                       {(showCheckOutPicker || Platform.OS === 'ios') && (
                        <DateTimePicker
                            value={checkOutTime}
                            mode="time"
                            is24Hour={false}
                            display={Platform.OS === 'ios' ? "default" : "clock"}
                            onChange={onChangeCheckOutTime}
                        
                        />
                    )}
                        <Ionicons 
                            name="time" 
                            size={20} 
                            color="#9CA3AF"
                        />
                    </Pressable>

                   
                </View>
            </View>
            <Text className="text-xs text-gray-500 font-onest mt-2">
                Tap to select time using the time picker
            </Text>
        </View>
    );
};

export default CheckInOutTime;