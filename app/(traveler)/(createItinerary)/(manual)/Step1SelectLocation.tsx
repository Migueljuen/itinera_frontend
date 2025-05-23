import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Animated,
    Dimensions,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { format, addDays, differenceInDays } from 'date-fns';

export interface ItineraryFormData {
    traveler_id: number;
    start_date: string;
    end_date: string;
    title: string;
    notes?: string;
    city: string;
    items: ItineraryItem[];
}

export interface ItineraryItem {
    experience_id: number;
    day_number: number;         // Must be between 1 and total number of days in the itinerary
    start_time: string;         // Format: 'HH:mm'
    end_time: string;           // Format: 'HH:mm'
    custom_note?: string;
}

interface StepProps {
    formData: ItineraryFormData;
    setFormData: React.Dispatch<React.SetStateAction<ItineraryFormData>>;
    onNext: () => void;
}

interface City {
    label: string;
    value: string;
}

const Step1SelectLocation: React.FC<StepProps> = ({ formData, setFormData, onNext }) => {
    // Use formData.city instead of a separate state
    const [localCity, setLocalCity] = useState<string | null>(formData.city || null);
    const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
    const [selectedLabel, setSelectedLabel] = useState<string>('Select a city...');

    // Calendar states
    const [showCalendar, setShowCalendar] = useState<boolean>(false);
    const [startDate, setStartDate] = useState<string>(formData.start_date || '');
    const [endDate, setEndDate] = useState<string>(formData.end_date || '');
    const [markedDates, setMarkedDates] = useState<any>({});
    const [selectingEndDate, setSelectingEndDate] = useState<boolean>(false);

    // Animation value for dropdown height
    const dropdownHeight = useRef(new Animated.Value(0)).current;

    // Screen dimensions for dropdown max height
    const { height: screenHeight } = Dimensions.get('window');
    const maxDropdownHeight = screenHeight * 0.4; // 40% of screen height

    // All cities and municipalities in Negros Occidental, alphabetically ordered
    const cities = useMemo(() => [
        { label: 'Bacolod City', value: 'bacolod' },
        { label: 'Bago City', value: 'bago' },
        { label: 'Binalbagan', value: 'binalbagan' },
        { label: 'Cadiz City', value: 'cadiz' },
        { label: 'Calatrava', value: 'calatrava' },
        { label: 'Candoni', value: 'candoni' },
        { label: 'Cauayan', value: 'cauayan' },
        { label: 'Enrique B. Magalona', value: 'eb_magalona' },
        { label: 'Escalante City', value: 'escalante' },
        { label: 'Himamaylan City', value: 'himamaylan' },
        { label: 'Hinigaran', value: 'hinigaran' },
        { label: 'Hinoba-an', value: 'hinoba_an' },
        { label: 'Ilog', value: 'ilog' },
        { label: 'Isabela', value: 'isabela' },
        { label: 'Kabankalan City', value: 'kabankalan' },
        { label: 'La Carlota City', value: 'la_carlota' },
        { label: 'La Castellana', value: 'la_castellana' },
        { label: 'Manapla', value: 'manapla' },
        { label: 'Moises Padilla', value: 'moises_padilla' },
        { label: 'Murcia', value: 'murcia' },
        { label: 'Pontevedra', value: 'pontevedra' },
        { label: 'Pulupandan', value: 'pulupandan' },
        { label: 'Sagay City', value: 'sagay' },
        { label: 'Salvador Benedicto', value: 'salvador_benedicto' },
        { label: 'San Carlos City', value: 'san_carlos' },
        { label: 'San Enrique', value: 'san_enrique' },
        { label: 'Silay City', value: 'silay' },
        { label: 'Sipalay City', value: 'sipalay' },
        { label: 'Talisay City', value: 'talisay' },
        { label: 'Toboso', value: 'toboso' },
        { label: 'Valladolid', value: 'valladolid' },
        { label: 'Victorias City', value: 'victorias' }
    ], []);

    // Update parent formData when localCity changes
    useEffect(() => {
        if (localCity) {
            setFormData({
                ...formData,
                city: localCity
            });
        }
    }, [localCity]);

    // Update formData when dates change
    useEffect(() => {
        if (startDate || endDate) {
            setFormData({
                ...formData,
                start_date: startDate,
                end_date: endDate
            });
        }
    }, [startDate, endDate]);

    // Initialize marked dates if dates already exist in formData
    useEffect(() => {
        if (formData.start_date && formData.end_date) {
            setStartDate(formData.start_date);
            setEndDate(formData.end_date);
            setMarkedDates(getDateRange(formData.start_date, formData.end_date));
        }
    }, []);

    // Update selected label when component mounts or city changes
    useEffect(() => {
        if (localCity) {
            const selectedCity = cities.find(city => city.value === localCity);
            if (selectedCity) {
                setSelectedLabel(selectedCity.label);
            }
        }
    }, [localCity, cities]);

    // Animate dropdown opening and closing
    useEffect(() => {
        Animated.timing(dropdownHeight, {
            toValue: dropdownOpen ? maxDropdownHeight : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [dropdownOpen, maxDropdownHeight]);

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
        if (showCalendar) {
            setShowCalendar(false);
        }
        // Close keyboard if open
        Keyboard.dismiss();
    };

    // Toggle calendar visibility
    const toggleCalendar = () => {
        setShowCalendar(!showCalendar);
        if (dropdownOpen) {
            setDropdownOpen(false);
        }
        // Close keyboard if open
        Keyboard.dismiss();
    };

    const isValid = () => {
        return localCity !== null && startDate !== '' && endDate !== '';
    };

    const handleNext = () => {
        if (isValid()) {
            onNext();
        }
    };

    const selectCity = (city: City) => {
        setLocalCity(city.value);
        setSelectedLabel(city.label);
        setDropdownOpen(false);
    };

    // Format date for display
    const formatDisplayDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return format(date, 'MMM dd, yyyy');
    };

    // Handle date selection on calendar
    const handleDayPress = (day: { dateString: string }) => {
        const selectedDate = day.dateString;

        if (!startDate || selectingEndDate) {
            // If no start date is selected or we're selecting end date
            if (!startDate) {
                // Set start date
                setStartDate(selectedDate);
                setSelectingEndDate(true);

                // Mark this date
                setMarkedDates({
                    [selectedDate]: {
                        selected: true,
                        startingDay: true,
                        color: '#4F46E5'
                    }
                });
            } else {
                // Selecting end date
                // Ensure end date is after start date
                if (selectedDate < startDate) {
                    // If selected date is before start date, swap them
                    setEndDate(startDate);
                    setStartDate(selectedDate);
                } else {
                    setEndDate(selectedDate);
                }

                setSelectingEndDate(false);
                setShowCalendar(false);

                // Create date range markers
                const markedDateRange = getDateRange(
                    startDate,
                    selectedDate < startDate ? startDate : selectedDate
                );
                setMarkedDates(markedDateRange);
            }
        } else {
            // Starting a new selection
            setStartDate(selectedDate);
            setEndDate('');
            setSelectingEndDate(true);

            setMarkedDates({
                [selectedDate]: {
                    selected: true,
                    startingDay: true,
                    color: '#4F46E5'
                }
            });
        }
    };

    // Create date range markers for the calendar
    const getDateRange = (startDateStr: string, endDateStr: string) => {
        const start = new Date(startDateStr);
        const end = new Date(endDateStr);
        const range: Record<string, any> = {};

        // Calculate the difference in days
        const dayCount = differenceInDays(end, start);

        // Mark start date
        range[startDateStr] = {
            selected: true,
            startingDay: true,
            color: '#4F46E5'
        };

        // Mark dates in between
        for (let i = 1; i < dayCount; i++) {
            const date = format(addDays(start, i), 'yyyy-MM-dd');
            range[date] = {
                selected: true,
                color: '#E0E7FF'
            };
        }

        // Mark end date
        range[endDateStr] = {
            selected: true,
            endingDay: true,
            color: '#4F46E5'
        };

        return range;
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
        >
            <TouchableWithoutFeedback onPress={() => {
                Keyboard.dismiss();
                if (dropdownOpen) {
                    setDropdownOpen(false);
                }
                if (showCalendar) {
                    setShowCalendar(false);
                }
            }}>
                <View className="flex-1 p-4">
                    <View className="text-center py-2">
                        <Text className="text-center text-xl font-onest-semibold mb-2">
                            Where and when are you traveling?
                        </Text>
                        <Text className="text-center text-sm text-gray-500 font-onest mb-6 w-11/12 m-auto">
                            Choose your destination and travel dates. This will help us find the best experiences for you.
                        </Text>

                        <View className="flex justify-evenly gap-4 border-t pt-12 border-gray-200 relative">
                            {/* Custom Dropdown for City Selection */}
                            <View className="bg-white pb-4 z-10">
                                <Text className="font-onest-medium py-2">Select City in Negros Occidental</Text>

                                {/* Dropdown Button */}
                                <TouchableOpacity
                                    className={`flex-row items-center justify-between px-3 py-3 border ${dropdownOpen ? 'border-primary' : 'border-gray-300'} rounded-md bg-white`}
                                    onPress={toggleDropdown}
                                    activeOpacity={0.7}
                                >
                                    <Text className={`text-base ${localCity ? 'text-black font-onest' : 'text-gray-500'}`}>
                                        {selectedLabel}
                                    </Text>
                                    <Ionicons
                                        name={dropdownOpen ? "chevron-up" : "chevron-down"}
                                        size={20}
                                        color={dropdownOpen ? "#4F46E5" : "gray"}
                                    />
                                </TouchableOpacity>

                                {/* Dropdown List */}
                                <Animated.View
                                    style={{
                                        position: 'absolute',
                                        top: 100, // adjust this to be right below the dropdown button
                                        left: 0,
                                        right: 0,
                                        height: dropdownHeight,
                                        overflow: 'hidden',
                                        borderWidth: 1,
                                        borderColor: '#E5E7EB',
                                        borderBottomLeftRadius: 6,
                                        borderBottomRightRadius: 6,
                                        backgroundColor: 'white',
                                        zIndex: 999,
                                    }}
                                >
                                    <ScrollView>
                                        {cities.map((city, index) => (
                                            <TouchableOpacity
                                                key={city.value}
                                                className={`px-4 py-3 ${index < cities.length - 1 ? 'border-b border-gray-200' : ''}`}
                                                onPress={() => selectCity(city)}
                                            >
                                                <Text className="text-base font-onest">{city.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </Animated.View>
                            </View>

                            {/* Date Selection */}
                            <View className="bg-white pb-4 mt-4 z-9">
                                <Text className="font-onest-medium py-2">Travel Dates</Text>
                                <TouchableOpacity
                                    className={`flex-row items-center justify-between px-3 py-3 border ${showCalendar ? 'border-primary' : 'border-gray-300'} rounded-md bg-white`}
                                    onPress={toggleCalendar}
                                    activeOpacity={0.7}
                                >
                                    <Text className={`text-base ${startDate ? 'text-black font-onest' : 'text-gray-500'}`}>
                                        {startDate && endDate
                                            ? `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`
                                            : startDate
                                                ? `${formatDisplayDate(startDate)} - Select end date`
                                                : "Select travel dates"}
                                    </Text>
                                    <Ionicons
                                        name={showCalendar ? "calendar" : "calendar-outline"}
                                        size={20}
                                        color={showCalendar ? "#4F46E5" : "gray"}
                                    />
                                </TouchableOpacity>

                                {/* Calendar popup */}
                                {showCalendar && (
                                    <View className="bg-white border border-gray-200 rounded-md mt-1 shadow-sm z-20">
                                        <Calendar
                                            onDayPress={handleDayPress}
                                            markedDates={markedDates}
                                            markingType={'period'}
                                            minDate={new Date().toISOString().split('T')[0]}
                                            theme={{
                                                calendarBackground: '#FFFFFF',
                                                selectedDayBackgroundColor: '#4F46E5',
                                                selectedDayTextColor: '#FFFFFF',
                                                todayTextColor: '#4F46E5',
                                                textSectionTitleColor: '#6B7280',
                                                arrowColor: '#4F46E5',
                                            }}
                                            // @ts-ignore - stylesheet.day.period is valid but not in type definitions
                                            style={{
                                                height: 350
                                            }}
                                        />
                                        <View className="p-3 border-t border-gray-200">
                                            <Text className="text-center text-sm text-gray-500 font-onest mb-1">
                                                {selectingEndDate
                                                    ? 'Now select your end date'
                                                    : 'Select your travel dates'}
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                {/* Date selection indicator */}
                                {startDate && !showCalendar && (
                                    <View className="flex-row justify-between mt-2">
                                        <View className="flex-1">
                                            <Text className="text-xs text-gray-500 font-onest">Start Date</Text>
                                            <Text className="text-sm font-onest-medium">{formatDisplayDate(startDate)}</Text>
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-xs text-gray-500 font-onest">End Date</Text>
                                            <Text className="text-sm font-onest-medium">
                                                {endDate ? formatDisplayDate(endDate) : 'Not selected'}
                                            </Text>
                                        </View>
                                        {startDate && endDate && (
                                            <View className="flex-1">
                                                <Text className="text-xs text-gray-500 font-onest">Duration</Text>
                                                <Text className="text-sm font-onest-medium">
                                                    {differenceInDays(new Date(endDate), new Date(startDate)) + 1} days
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>

                            {/* Submit Button */}
                            <TouchableOpacity
                                onPress={handleNext}
                                className={`mt-4 p-4 rounded-xl ${isValid() ? 'bg-primary' : 'bg-gray-200'}`}
                                disabled={!isValid()}
                            >
                                <Text className="text-center font-onest-medium text-base text-white">
                                    Next step
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

export default Step1SelectLocation;