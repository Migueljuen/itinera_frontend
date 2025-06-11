import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapSearchComponent from '../../../../components/MapSearch'; // Add this import
import { ExperienceFormData } from '../../../../types/types';

interface StepProps {
    formData: ExperienceFormData;
    setFormData: React.Dispatch<React.SetStateAction<ExperienceFormData>>;
    onNext: () => void;
    onBack: () => void;
}

const Step4Destination: React.FC<StepProps> = ({
    formData,
    setFormData,
    onNext,
    onBack,
}) => {
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    
    // Map search state
    const [showMapSearch, setShowMapSearch] = useState(false);

    const handleChange = (field: keyof ExperienceFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Sync selectedLocation from formData (if returning to this step)
    useEffect(() => {
        if (formData.latitude !== undefined && formData.longitude !== undefined) {
            setSelectedLocation({
                latitude: Number(formData.latitude),
                longitude: Number(formData.longitude),
            });
        }
    }, []);

    useEffect(() => {
        const fetchLocation = async () => {
            try {
                setLoading(true);

                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setErrorMsg('Permission to access location was denied');
                    return;
                }

                let currentLocation = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                });

                setLocation(currentLocation.coords);

                // Only set if formData has no coordinates yet
                if (
                    formData.latitude === undefined ||
                    formData.longitude === undefined
                ) {
                    setSelectedLocation({
                        latitude: currentLocation.coords.latitude,
                        longitude: currentLocation.coords.longitude,
                    });

                    handleChange('latitude', currentLocation.coords.latitude);
                    handleChange('longitude', currentLocation.coords.longitude);
                }

                const locationDetails = await Location.reverseGeocodeAsync({
                    latitude: currentLocation.coords.latitude,
                    longitude: currentLocation.coords.longitude,
                });

                if (locationDetails.length > 0 && locationDetails[0].city && !formData.city) {
                    handleChange('city', locationDetails[0].city);
                }
            } catch (error) {
                setErrorMsg('Error getting location');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchLocation();
    }, []);

    // Handle map search location selection
    const handleLocationSelect = async (location: any) => {
        console.log('Location data received:', location);
        
        // First set the coordinates
        const latitude = location.latitude || location.lat;
        const longitude = location.longitude || location.lng || location.lon;
        
        setSelectedLocation({
            latitude: latitude,
            longitude: longitude,
        });

        handleChange('latitude', latitude);
        handleChange('longitude', longitude);

        // Reverse geocode to get address details
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            console.log('Reverse geocoding data:', data);

            if (data && data.display_name) {
                // Extract place name - try different approaches
                let placeName = '';
                
                // Option 1: Use the name field if available
                if (data.name) {
                    placeName = data.name;
                }
                // Option 2: Try to get business/place name from address components
                else if (data.address) {
                    placeName = data.address.tourism || 
                              data.address.amenity ||
                              data.address.leisure ||
                              data.address.building ||
                              data.address.house_name ||
                              data.address.shop ||
                              data.address.office ||
                              '';
                }
                // Option 3: Extract first part of address if it looks like a place name
                if (!placeName) {
                    const addressParts = data.display_name.split(',');
                    const firstPart = addressParts[0].trim();
                    // Only use first part as name if it doesn't look like a street number
                    if (firstPart && !/^\d/.test(firstPart)) {
                        placeName = firstPart;
                    }
                }

                // Set destination name if we found a place name and it's not already set
                if (placeName && !formData.destination_name) {
                    handleChange('destination_name', placeName);
                }

                // Extract city from address
                if (data.address) {
                    const city = data.address.city || 
                                data.address.town || 
                                data.address.village || 
                                data.address.municipality ||
                                data.address.county ||
                                '';
                    
                    if (city) {
                        handleChange('city', city);
                    }
                }
            }
        } catch (error) {
            console.error('Error reverse geocoding:', error);
            Alert.alert('Location Error', 'Could not fetch address details for selected location.');
        }
    };

    // Open map search
    const openMapSearch = () => {
        setShowMapSearch(true);
    };

    // Close map search
    const closeMapSearch = () => {
        setShowMapSearch(false);
    };

    const handleMapPress = async (event: any) => {
        const { coordinate } = event.nativeEvent;
        setSelectedLocation(coordinate);
        handleChange('latitude', coordinate.latitude);
        handleChange('longitude', coordinate.longitude);

        try {
            const locationDetails = await Location.reverseGeocodeAsync({
                latitude: coordinate.latitude,
                longitude: coordinate.longitude,
            });

            if (locationDetails.length > 0 && locationDetails[0].city) {
                handleChange('city', locationDetails[0].city);
            }
        } catch (error) {
            console.log('Error getting city:', error);
        }
    };

    const isValid = (): boolean => {
        return (
            !!formData.destination_name &&
            !!formData.city &&
            !!formData.destination_description &&
            formData.latitude !== undefined &&
            formData.longitude !== undefined
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-white"
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView className="flex-1">
                    <View className="px-4 py-6">
                        <Text className="text-xl font-onest-semibold mb-2 text-center">Add Destination</Text>
                        <Text className="text-sm text-gray-500 font-onest mb-6 text-center">Create a new destination for your experience</Text>

                        <View className="flex gap-6 border-t pt-6 border-gray-200">
                            {/* Location Selection Section */}
                            <View className="mb-4">
                                <Text className="font-onest-medium text-base mb-3">
                                    Location
                                </Text>
                                
                                {/* Map Search Button */}
                                <TouchableOpacity
                                    className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex-row items-center justify-center"
                                    onPress={openMapSearch}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="search" size={20} color="#3B82F6" />
                                    <Text className="font-onest-medium text-blue-600 ml-2">
                                        Search Location
                                    </Text>
                                </TouchableOpacity>

                                {/* Show location confirmation if coordinates are available */}
                                {selectedLocation && (
                                    <View className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                                        <Text className="text-sm text-green-700 font-onest">
                                            📍 Location selected: {selectedLocation.latitude.toFixed(5)}, {selectedLocation.longitude.toFixed(5)}
                                        </Text>
                                    </View>
                                )}

                                {/* Map Section */}
                                {loading ? (
                                    <View className="items-center justify-center py-8">
                                        <ActivityIndicator size="large" color="#0000ff" />
                                        <Text className="text-gray-500 mt-4 font-onest">Loading location...</Text>
                                    </View>
                                ) : errorMsg ? (
                                    <Text className="text-red-500 py-2">{errorMsg}</Text>
                                ) : location ? (
                                    <View className="mb-2">
                                        <Text className="font-onest-medium mb-2 text-gray-800">Fine-tune Location</Text>
                                        <View className="w-full h-52 rounded-lg overflow-hidden">
                                            <MapView
                                                style={{ width: '100%', height: '100%' }}
                                                initialRegion={{
                                                    latitude: selectedLocation?.latitude || location.latitude,
                                                    longitude: selectedLocation?.longitude || location.longitude,
                                                    latitudeDelta: 0.01,
                                                    longitudeDelta: 0.01,
                                                }}
                                                onPress={handleMapPress}
                                            >
                                                {selectedLocation && (
                                                    <Marker
                                                        coordinate={selectedLocation}
                                                        pinColor="red"
                                                        title={formData.destination_name || "Selected Location"}
                                                    />
                                                )}
                                            </MapView>
                                        </View>

                                        <Text className="text-xs text-gray-500 font-onest mt-2 italic">
                                            Tap anywhere on the map to adjust the location
                                        </Text>
                                    </View>
                                ) : null}
                            </View>

                            {/* Essential Information */}
                            <View className="mb-4">
                                <Text className="font-onest-medium mb-3 text-gray-800">Essential Information</Text>

                                <View className="mb-4">
                                    <Text className="font-onest-medium text-base mb-2">Destination Name</Text>
                                    <View className="relative">
                                        <TextInput
                                            className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white font-onest pr-12"
                                            placeholder="e.g., Rizal Park, SM Mall of Asia"
                                            value={formData.destination_name}
                                            onChangeText={(value) => handleChange('destination_name', value)}
                                            placeholderTextColor="#9CA3AF"
                                        />
                                        <Ionicons 
                                            name="location" 
                                            size={20} 
                                            color="#9CA3AF" 
                                            style={{ position: 'absolute', right: 16, top: 12 }}
                                        />
                                    </View>
                                </View>

                                <View className="mb-4">
                                    <Text className="font-onest-medium text-base mb-2">City</Text>
                                    <View className="relative">
                                        <TextInput
                                            className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white font-onest pr-12"
                                            placeholder="e.g., Manila, Cebu City"
                                            value={formData.city}
                                            onChangeText={(value) => handleChange('city', value)}
                                            placeholderTextColor="#9CA3AF"
                                        />
                                        <Ionicons 
                                            name="business" 
                                            size={20} 
                                            color="#9CA3AF" 
                                            style={{ position: 'absolute', right: 16, top: 12 }}
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Description */}
                            <View className="mb-6">
                                <Text className="font-onest-medium mb-3 text-gray-800">Description</Text>
                                <View className="relative">
                                    <TextInput
                                        className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white font-onest h-24"
                                        placeholder="Tell visitors about this destination..."
                                        value={formData.destination_description}
                                        onChangeText={(value) => handleChange('destination_description', value)}
                                        multiline={true}
                                        textAlignVertical="top"
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>
                            </View>

                            {/* Navigation Buttons */}
                            <View className="flex-row justify-between pt-2">
                                <TouchableOpacity
                                    onPress={onBack}
                                    className="py-4 px-6 rounded-xl border border-gray-300"
                                    activeOpacity={0.7}
                                >
                                    <Text className="text-center font-onest-medium text-base text-gray-700">
                                        Previous step
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={isValid() ? onNext : undefined}
                                    className={`py-4 px-8 rounded-xl ${isValid() ? 'bg-primary' : 'bg-gray-200'}`}
                                    activeOpacity={0.7}
                                    disabled={!isValid()}
                                >
                                    <Text className={`text-center font-onest-medium text-base ${isValid() ? 'text-white' : 'text-gray-400'}`}>
                                        Next step
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Map Search Modal */}
                    <MapSearchComponent
                        visible={showMapSearch}
                        onClose={closeMapSearch}
                        onLocationSelect={handleLocationSelect}
                        initialLatitude={selectedLocation?.latitude}
                        initialLongitude={selectedLocation?.longitude}
                    />
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

export default Step4Destination;