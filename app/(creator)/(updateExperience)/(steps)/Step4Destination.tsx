import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
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

// Experience type for the original data
type Experience = {
    experience_id: number;
    creator_id: number;
    title: string;
    description: string;
    price: string;
    unit: string;
    destination_name: string;
    destination_id: number;
    status: string;
    travel_companion: string;
    created_at: string;
    tags: string[];
    images: string[];
    destination: {
        destination_id: number;
        name: string;
        city: string;
        longitude: number;
        latitude: number;
        description: string;
    };
};

interface StepProps {
    formData: ExperienceFormData;
    setFormData: React.Dispatch<React.SetStateAction<ExperienceFormData>>;
    onNext: () => void;
    onBack: () => void;
    experience: Experience;
}

const Step4EditDestination: React.FC<StepProps> = ({
    formData,
    setFormData,
    onNext,
    onBack,
    experience,
}) => {
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [showMapSearch, setShowMapSearch] = useState(false);
    const [originalData, setOriginalData] = useState({
        destination_name: '',
        city: '',
        destination_description: '',
        latitude: '',
        longitude: ''
    });

    const handleChange = (field: keyof ExperienceFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Initialize with original destination data
    useEffect(() => {
        if (experience.destination) {
            const originalDestination = {
                destination_name: experience.destination.name,
                city: experience.destination.city,
                destination_description: experience.destination.description,
                latitude: experience.destination.latitude.toString(),
                longitude: experience.destination.longitude.toString()
            };

            setOriginalData(originalDestination);
            setSelectedLocation({
                latitude: experience.destination.latitude,
                longitude: experience.destination.longitude,
            });
        }
    }, [experience]);

    // Sync selectedLocation from formData
    useEffect(() => {
        if (formData.latitude && formData.longitude) {
            setSelectedLocation({
                latitude: Number(formData.latitude),
                longitude: Number(formData.longitude),
            });
        }
    }, [formData.latitude, formData.longitude]);

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
            } catch (error) {
                setErrorMsg('Error getting location');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        if (editMode) {
            fetchLocation();
        }
    }, [editMode]);

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

        handleChange('latitude', latitude.toString());
        handleChange('longitude', longitude.toString());

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

                // Set destination name if we found a place name
                if (placeName) {
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

        // Close the search modal
        setShowMapSearch(false);
    };

    const handleMapPress = async (event: any) => {
        if (!editMode) return;

        const { coordinate } = event.nativeEvent;
        setSelectedLocation(coordinate);
        handleChange('latitude', coordinate.latitude.toString());
        handleChange('longitude', coordinate.longitude.toString());

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

    const toggleEditMode = () => {
        if (editMode) {
            // Exiting edit mode - ask for confirmation if there are changes
            if (hasChanges()) {
                Alert.alert(
                    'Discard Changes?',
                    'You have unsaved changes. Do you want to discard them?',
                    [
                        { text: 'Keep Editing', style: 'cancel' },
                        {
                            text: 'Discard',
                            style: 'destructive',
                            onPress: () => {
                                resetToOriginal();
                                setEditMode(false);
                            }
                        }
                    ]
                );
            } else {
                setEditMode(false);
            }
        } else {
            setEditMode(true);
        }
    };

    const hasChanges = (): boolean => {
        return (
            formData.destination_name !== originalData.destination_name ||
            formData.city !== originalData.city ||
            formData.destination_description !== originalData.destination_description ||
            formData.latitude !== originalData.latitude ||
            formData.longitude !== originalData.longitude
        );
    };

    const resetToOriginal = () => {
        setFormData(prev => ({
            ...prev,
            destination_name: originalData.destination_name,
            city: originalData.city,
            destination_description: originalData.destination_description,
            latitude: originalData.latitude,
            longitude: originalData.longitude
        }));

        setSelectedLocation({
            latitude: Number(originalData.latitude),
            longitude: Number(originalData.longitude)
        });
    };

    const isValid = (): boolean => {
        if (!editMode) return true; // If not editing, we can proceed

        return (
            !!formData.destination_name &&
            !!formData.city &&
            !!formData.destination_description &&
            formData.latitude !== undefined &&
            formData.longitude !== undefined
        );
    };

    // Open map search
    const openMapSearch = () => {
        setShowMapSearch(true);
    };

    // Close map search
    const closeMapSearch = () => {
        setShowMapSearch(false);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-white"
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView className="flex-1">
                    <View className="px-4 py-6">
                        <Text className="text-xl font-onest-semibold mb-2 text-center">
                            {editMode ? 'Edit Destination' : 'Destination Details'}
                        </Text>
                        <Text className="text-sm text-gray-500 font-onest mb-6 text-center">
                            {editMode
                                ? 'Modify the destination details for your experience'
                                : 'Current destination information for your experience'
                            }
                        </Text>

                        <View className="flex gap-6 border-t pt-6 border-gray-200">
                            {/* Edit Mode Toggle */}
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="font-onest-semibold text-gray-800">
                                    {editMode ? 'Editing Mode' : 'View Mode'}
                                </Text>
                                <Pressable
                                    onPress={toggleEditMode}
                                    className={`px-4 py-2 rounded-lg ${editMode ? 'bg-red-100' : 'bg-blue-100'}`}
                                >
                                    <Text className={`font-onest-medium ${editMode ? 'text-red-600' : 'text-blue-600'}`}>
                                        {editMode ? 'Cancel Edit' : 'Edit Destination'}
                                    </Text>
                                </Pressable>
                            </View>

                            {/* Changes indicator */}
                            {editMode && hasChanges() && (
                                <View className="bg-blue-50 p-3 rounded-xl mb-4">
                                    <Text className="text-blue-600 text-sm text-center font-onest-medium">
                                        ✓ Changes detected - remember to save
                                    </Text>
                                </View>
                            )}

                            {/* Map Search Button - Only show in edit mode */}
                            {editMode && (
                                <TouchableOpacity
                                    className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex-row items-center justify-center"
                                    onPress={openMapSearch}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="search" size={20} color="#3B82F6" />
                                    <Text className="font-onest-medium text-blue-600 ml-2">
                                        Search for a New Location
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {/* Map Section */}
                            <View className="mb-2">
                                <Text className="font-onest-medium mb-2 text-gray-800">
                                    {editMode ? 'Select New Location' : 'Current Location'}
                                </Text>

                                {selectedLocation && (
                                    <View className="w-full h-52 rounded-lg overflow-hidden">
                                        <MapView
                                            style={{ width: '100%', height: '100%' }}
                                            initialRegion={{
                                                latitude: selectedLocation.latitude,
                                                longitude: selectedLocation.longitude,
                                                latitudeDelta: 0.01,
                                                longitudeDelta: 0.01,
                                            }}
                                            onPress={editMode ? handleMapPress : undefined}
                                            scrollEnabled={editMode}
                                            zoomEnabled={editMode}
                                            pitchEnabled={editMode}
                                            rotateEnabled={editMode}
                                        >
                                            <Marker
                                                coordinate={selectedLocation}
                                                pinColor={editMode ? "red" : "blue"}
                                                title={formData.destination_name || experience.destination.name}
                                            />
                                        </MapView>
                                    </View>
                                )}

                                {editMode && (
                                    <Text className="text-xs text-gray-500 font-onest mt-2 italic">
                                        Tap anywhere on the map to select a new location or use the search button above
                                    </Text>
                                )}

                                {selectedLocation && (
                                    <View className="bg-gray-100 p-2 rounded-md mt-2">
                                        <Text className="text-gray-700 text-xs font-onest">
                                            Location: {selectedLocation.latitude.toFixed(5)}, {selectedLocation.longitude.toFixed(5)}
                                        </Text>
                                        {hasChanges() && editMode && (
                                            <Text className="text-blue-600 text-xs font-onest">
                                                Original: {Number(originalData.latitude).toFixed(5)}, {Number(originalData.longitude).toFixed(5)}
                                            </Text>
                                        )}
                                    </View>
                                )}
                            </View>

                            {/* Essential Information */}
                            <View className="mb-4">
                                <Text className="font-onest-medium mb-2 text-gray-800">Essential Information</Text>

                                <View className="mb-3">
                                    <Text className="text-sm text-gray-600 mb-1">Destination Name</Text>
                                    {editMode ? (
                                        <View className="relative">
                                            <TextInput
                                                className="border border-gray-200 rounded-lg p-3 text-gray-800 pr-12"
                                                placeholder="Destination Name"
                                                value={formData.destination_name}
                                                onChangeText={(value) => handleChange('destination_name', value)}
                                            />
                                            <Ionicons
                                                name="location"
                                                size={20}
                                                color="#9CA3AF"
                                                style={{ position: 'absolute', right: 16, top: 12 }}
                                            />
                                        </View>
                                    ) : (
                                        <View className="bg-gray-50 p-3 rounded-lg">
                                            <Text className="text-gray-800 font-onest">
                                                {formData.destination_name || experience.destination.name}
                                            </Text>
                                        </View>
                                    )}
                                    {editMode && formData.destination_name !== originalData.destination_name && (
                                        <Text className="text-xs text-gray-400 mt-1">
                                            Original: "{originalData.destination_name}"
                                        </Text>
                                    )}
                                </View>

                                <View>
                                    <Text className="text-sm text-gray-600 mb-1">City</Text>
                                    {editMode ? (
                                        <View className="relative">
                                            <TextInput
                                                className="border border-gray-200 rounded-lg p-3 text-gray-800 pr-12"
                                                placeholder="City"
                                                value={formData.city}
                                                onChangeText={(value) => handleChange('city', value)}
                                            />
                                            <Ionicons
                                                name="business"
                                                size={20}
                                                color="#9CA3AF"
                                                style={{ position: 'absolute', right: 16, top: 12 }}
                                            />
                                        </View>
                                    ) : (
                                        <View className="bg-gray-50 p-3 rounded-lg">
                                            <Text className="text-gray-800 font-onest">
                                                {formData.city || experience.destination.city}
                                            </Text>
                                        </View>
                                    )}
                                    {editMode && formData.city !== originalData.city && (
                                        <Text className="text-xs text-gray-400 mt-1">
                                            Original: "{originalData.city}"
                                        </Text>
                                    )}
                                </View>
                            </View>

                            {/* Description */}
                            <View className="mb-6">
                                <Text className="font-onest-medium mb-2 text-gray-800">Description</Text>
                                {editMode ? (
                                    <TextInput
                                        className="border border-gray-200 rounded-lg p-3 text-gray-800 h-24"
                                        placeholder="Tell visitors about this destination..."
                                        value={formData.destination_description}
                                        onChangeText={(value) => handleChange('destination_description', value)}
                                        multiline={true}
                                        textAlignVertical="top"
                                    />
                                ) : (
                                    <View className="bg-gray-50 p-3 rounded-lg min-h-[60px]">
                                        <Text className="text-gray-800 font-onest">
                                            {formData.destination_description || experience.destination.description}
                                        </Text>
                                    </View>
                                )}
                                {editMode && formData.destination_description !== originalData.destination_description && (
                                    <Text className="text-xs text-gray-400 mt-1">
                                        Description modified ✓
                                    </Text>
                                )}
                            </View>

                            {/* Reset button for edit mode */}
                            {editMode && hasChanges() && (
                                <Pressable
                                    onPress={resetToOriginal}
                                    className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50"
                                >
                                    <Text className="text-center font-onest-medium text-sm text-red-600">
                                        Reset to Original Values
                                    </Text>
                                </Pressable>
                            )}

                            {/* Navigation Buttons */}
                            <View className="flex-row justify-between pt-2">
                                <Pressable onPress={onBack} className="border border-primary p-4 rounded-xl">
                                    <Text className="text-gray-800 font-onest-medium">Previous step</Text>
                                </Pressable>
                                <Pressable
                                    onPress={isValid() ? onNext : undefined}
                                    className={`p-4 px-6 rounded-xl ${isValid() ? 'bg-primary' : 'bg-gray-200'
                                        }`}
                                    disabled={!isValid()}
                                >
                                    <Text className="text-center font-onest-medium text-base text-gray-300">
                                        {editMode && hasChanges() ? 'Continue with changes' : 'Next step'}
                                    </Text>
                                </Pressable>
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

export default Step4EditDestination;