import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    FlatList,
    Animated,
    Dimensions,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Add this import if using Expo

interface AvailabilitySlot {
    day_of_week: string;
    start_time: string;
    end_time: string;
}

interface ItineraryFormData {
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

        // Close keyboard if open
        Keyboard.dismiss();
    };

    const isValid = () => {
        return localCity !== null;
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

    const renderCityItem = ({ item }: { item: City }) => (
        <TouchableOpacity
            className="px-4 py-3 border-b border-gray-200"
            onPress={() => selectCity(item)}
        >
            <Text className="text-base font-onest">{item.label}</Text>
        </TouchableOpacity>
    );

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
                            {/* Custom Dropdown */}
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