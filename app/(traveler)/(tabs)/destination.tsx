// App.js (React Native Frontend)
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import type { LocationObjectCoords } from 'expo-location';
import { MapPressEvent } from 'react-native-maps';
import API_URL from '../../../constants/api'; // Adjust the path as necessary
export default function App() {
    // State for location data
    const [location, setLocation] = useState<LocationObjectCoords | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);

    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState('');
    const [city, setCity] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);

                // Request location permissions
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setErrorMsg('Permission to access location was denied');
                    return;
                }

                // Get current location
                let currentLocation = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                });

                setLocation(currentLocation.coords);
                setSelectedLocation({
                    latitude: currentLocation.coords.latitude,
                    longitude: currentLocation.coords.longitude
                });


                // Try to get city name for the current location
                const locationDetails = await Location.reverseGeocodeAsync({
                    latitude: currentLocation.coords.latitude,
                    longitude: currentLocation.coords.longitude,
                });

                if (locationDetails[0] && locationDetails[0].city) {
                    setCity(locationDetails[0].city);
                }
            } catch (error) {
                setErrorMsg('Error getting location: ');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleMapPress = (event: MapPressEvent) => {
        // Update the selected location when the map is pressed
        setSelectedLocation(event.nativeEvent.coordinate);

        // Get city for the selected location
        (async () => {
            try {
                const locationDetails = await Location.reverseGeocodeAsync({
                    latitude: event.nativeEvent.coordinate.latitude,
                    longitude: event.nativeEvent.coordinate.longitude,
                });

                if (locationDetails[0] && locationDetails[0].city) {
                    setCity(locationDetails[0].city);
                }
            } catch (error) {
                console.log('Error getting city:', error);
            }
        })();
    };

    const saveDestination = async () => {
        // Validate all required fields
        if (!name || !city || !description || !selectedLocation) {
            Alert.alert('Error', 'Please fill all fields and select a location');
            return;
        }

        try {
            setLoading(true);

            // Prepare destination data - matching your backend requirements
            const destinationData = {
                name,
                city,
                description,
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude
            };

            // Save to Express/MySQL backend using your existing endpoint
            const response = await axios.post(`${API_URL}/destination/create`, destinationData);

            if (response.status === 201) {
                Alert.alert(
                    'Success',
                    'Destination saved successfully!',
                    [{
                        text: 'OK',
                        onPress: () => {
                            // Reset form after successful save
                            setName('');
                            setDescription('');
                            // Keep city and location as they are for convenience
                        }
                    }]
                );
            } else {
                throw new Error('Server responded with an error');
            }
        } catch (error) {
            let errorMessage = 'Unknown error occurred';

            if (axios.isAxiosError(error)) {
                errorMessage = error.response?.data?.message || error.message;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            Alert.alert('Error', 'Failed to save destination: ' + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#0000ff" />
                <Text className="text-base text-center mt-4">Loading...</Text>
            </View>
        );
    }

    if (errorMsg) {
        return (
            <View className="flex-1 justify-center items-center">
                <Text className="text-base text-red-600 text-center">{errorMsg}</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View className="flex-1">
                    {location ? (
                        <>
                            <MapView
                                style={{ width: '100%', height: 300 }}
                                initialRegion={{
                                    latitude: location.latitude,
                                    longitude: location.longitude,
                                    latitudeDelta: 0.01,
                                    longitudeDelta: 0.01,
                                }}
                                onPress={handleMapPress}
                            >
                                {selectedLocation && (
                                    <Marker
                                        coordinate={{
                                            latitude: selectedLocation.latitude,
                                            longitude: selectedLocation.longitude,
                                        }}
                                        pinColor="red"
                                        title={name || "Selected Location"}
                                        description={description || "This location will be saved"}
                                    />
                                )}
                            </MapView>

                            <View className="p-5 bg-gray-100">
                                <Text className="text-xl font-bold text-center mb-4">
                                    Add New Destination
                                </Text>

                                <TextInput
                                    className="h-12 border border-gray-300 rounded-lg mb-4 px-3 bg-white"
                                    placeholder="Destination Name"
                                    value={name}
                                    onChangeText={setName}
                                />

                                <TextInput
                                    className="h-12 border border-gray-300 rounded-lg mb-4 px-3 bg-white"
                                    placeholder="City"
                                    value={city}
                                    onChangeText={setCity}
                                />

                                <TextInput
                                    className="h-24 border border-gray-300 rounded-lg mb-4 px-3 pt-2 text-top bg-white"
                                    placeholder="Description"
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline={true}
                                    numberOfLines={4}
                                />

                                {selectedLocation && (
                                    <Text className="text-sm text-center bg-blue-100 p-2 rounded-lg mb-4">
                                        Selected Location:{"\n"}
                                        Latitude: {selectedLocation.latitude.toFixed(6)}{"\n"}
                                        Longitude: {selectedLocation.longitude.toFixed(6)}
                                    </Text>
                                )}

                                <TouchableOpacity
                                    className="bg-green-600 py-3 px-6 rounded-lg mb-4 items-center"
                                    onPress={saveDestination}
                                >
                                    <Text className="text-white font-bold text-base">Save Destination</Text>
                                </TouchableOpacity>

                                <Text className="text-sm text-gray-600 text-center">
                                    Tap anywhere on the map to select a location
                                </Text>
                            </View>
                        </>
                    ) : (
                        <Text className="text-base text-center my-4">Getting location...</Text>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}      