import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
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

    const handleMapPress = (event: any) => {
        const { coordinate } = event.nativeEvent;
        setSelectedLocation(coordinate);
        handleChange('latitude', coordinate.latitude);
        handleChange('longitude', coordinate.longitude);

        (async () => {
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
        })();
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
            <ScrollView className="flex-1">
                <View className="px-4 py-6">
                    <Text className="text-xl font-onest-semibold mb-2 text-center">Add Destination</Text>
                    <Text className="text-sm text-gray-500 font-onest mb-6 text-center">Create a new destination for your experience</Text>

                    <View className="flex gap-6 border-t pt-6 border-gray-200">
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
                                <Text className="font-onest-medium mb-2 text-gray-800">Select Location</Text>
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
                                    Tap anywhere on the map to select a location
                                </Text>

                                {selectedLocation && (
                                    <View className="bg-gray-100 p-2 rounded-md mt-2">
                                        <Text className="text-gray-700 text-xs font-onest">
                                            Location: {selectedLocation.latitude.toFixed(5)}, {selectedLocation.longitude.toFixed(5)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ) : null}

                        {/* Essential Information */}
                        <View className="mb-4">
                            <Text className="font-onest-medium mb-2 text-gray-800">Essential Information</Text>

                            <TextInput
                                className="border border-gray-200 rounded-lg p-3 text-gray-800 mb-3"
                                placeholder="Destination Name"
                                value={formData.destination_name}
                                onChangeText={(value) => handleChange('destination_name', value)}
                            />

                            <TextInput
                                className="border border-gray-200 rounded-lg p-3 text-gray-800"
                                placeholder="City"
                                value={formData.city}
                                onChangeText={(value) => handleChange('city', value)}
                            />
                        </View>

                        {/* Description */}
                        <View className="mb-6">
                            <Text className="font-onest-medium mb-2 text-gray-800">Description</Text>

                            <TextInput
                                className="border border-gray-200 rounded-lg p-3 text-gray-800 h-24"
                                placeholder="Tell visitors about this destination..."
                                value={formData.destination_description}
                                onChangeText={(value) => handleChange('destination_description', value)}
                                multiline={true}
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Navigation Buttons - Fixed at bottom */}
                        <View className="flex-row justify-between pt-2">

                            <Pressable onPress={onBack} className="border border-primary p-4 rounded-xl">
                                <Text className="text-gray-800">Previous step</Text>
                            </Pressable>
                            <Pressable
                                onPress={isValid() ? onNext : undefined}
                                className={`p-4 px-6 rounded-xl ${isValid() ? 'bg-primary' : 'bg-gray-200'
                                    }`}
                            >
                                <Text className="text-center font-onest-medium text-base text-gray-300">Next step</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );

    // return (
    //     <KeyboardAvoidingView
    //         behavior={Platform.OS === "ios" ? "padding" : "height"}
    //         className="flex-1 bg-white"
    //     >
    //         <ScrollView className="flex-1">
    //             <View className="text-center py-2">
    //                 <Text className="text-center text-xl font-onest-semibold mb-2">Add Destination</Text>
    //                 <Text className="text-center text-sm text-gray-500 font-onest mb-6 w-3/4 m-auto">Create a new destination by selecting a location and providing details.</Text>

    //                 <View className="flex justify-evenly gap-4 border-t pt-12 border-gray-200">
    //                     <View className="bg-white pb-4">
    //                         <Text className="font-onest-medium py-2 text-gray-800">Destination Location</Text>

    //                         {loading ? (
    //                             <View className="items-center justify-center py-8">
    //                                 <ActivityIndicator size="large" color="#0000ff" />
    //                                 <Text className="text-gray-500 mt-4 font-onest">Loading location...</Text>
    //                             </View>
    //                         ) : errorMsg ? (
    //                             <Text className="text-red-500 py-2">{errorMsg}</Text>
    //                         ) : (
    //                             <>
    //                                 {location && (
    //                                     <View className="w-full h-64 rounded-lg overflow-hidden mb-4 ">
    //                                         <MapView
    //                                             style={{ width: '100%', height: '100%' }}

    //                                             initialRegion={{
    //                                                 latitude: selectedLocation?.latitude || location.latitude,
    //                                                 longitude: selectedLocation?.longitude || location.longitude,
    //                                                 latitudeDelta: 0.01,
    //                                                 longitudeDelta: 0.01,
    //                                             }}
    //                                             onPress={handleMapPress}
    //                                         >
    //                                             {selectedLocation && (
    //                                                 <Marker
    //                                                     coordinate={selectedLocation}
    //                                                     pinColor="red"
    //                                                     title={formData.destination_name || "Selected Location"}
    //                                                     description={formData.destination_description || "This location will be saved"}
    //                                                 />
    //                                             )}
    //                                         </MapView>
    //                                     </View>
    //                                 )}

    //                                 <Text className="text-sm text-gray-500 font-onest mb-4">
    //                                     Tap anywhere on the map to select a location
    //                                 </Text>

    //                                 {selectedLocation && (
    //                                     <View className="bg-gray-100 p-3 rounded-lg mb-4">
    //                                         <Text className="text-gray-700 text-sm font-onest">
    //                                             Location: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
    //                                         </Text>
    //                                     </View>
    //                                 )}
    //                             </>
    //                         )}
    //                     </View>

    //                     <View className="bg-white pb-4">
    //                         <Text className="font-onest-medium py-2 text-gray-800">Destination Details</Text>

    //                         <View className="mb-4">
    //                             <TextInput
    //                                 className="border border-gray-200 rounded-lg p-4 text-gray-800 mb-3"
    //                                 placeholder="Destination Name"
    //                                 placeholderTextColor="#9CA3AF"
    //                                 value={formData.destination_name}
    //                                 onChangeText={(value) => handleChange('destination_name', value)}
    //                             />
    //                         </View>

    //                         <View className="mb-4">
    //                             <TextInput
    //                                 className="border border-gray-200 rounded-lg p-4 text-gray-800 mb-3"
    //                                 placeholder="City"
    //                                 value={formData.city}
    //                                 onChangeText={(value) => handleChange('city', value)}
    //                             />
    //                         </View>

    //                         <View className="mb-4">
    //                             <TextInput
    //                                 className="border border-gray-200 rounded-lg p-4 text-gray-800 h-32"
    //                                 placeholder="Description"
    //                                 value={formData.destination_description}
    //                                 onChangeText={(value) => handleChange('destination_description', value)}
    //                                 multiline={true}
    //                                 numberOfLines={4}
    //                                 textAlignVertical="top"
    //                                 placeholderTextColor="#9CA3AF"
    //                             />
    //                         </View>
    //                     </View>

    //                     <View className="flex-row justify-between mt-4">
    //                         <Pressable onPress={onBack} className="border border-primary p-4 rounded-xl">
    //                             <Text className="text-gray-800">Previous step</Text>
    //                         </Pressable>
    //                         <Pressable
    //                             onPress={isValid() ? onNext : undefined}
    //                             className={`p-4 px-6 rounded-xl ${isValid() ? 'bg-primary' : 'bg-gray-200'
    //                                 }`}
    //                         >
    //                             <Text className="text-center font-onest-medium text-base text-gray-300">Next step</Text>
    //                         </Pressable>
    //                     </View>
    //                 </View>
    //             </View>
    //         </ScrollView>
    //     </KeyboardAvoidingView>
    // );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginBottom: 16,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
    },
    textArea: {
        height: 100,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginBottom: 16,
        paddingHorizontal: 12,
        paddingTop: 8,
        textAlignVertical: 'top',
        backgroundColor: '#fff',
    },
    map: {
        width: '100%',
        height: 250,
        marginBottom: 16,
        borderRadius: 8,
    },
    locationInfo: {
        backgroundColor: '#e6f7ff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    locationText: {
        textAlign: 'center',
    },
    helpText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 16,
    },
    navigationButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    backButton: {
        backgroundColor: '#6c757d',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    nextButton: {
        backgroundColor: '#007bff',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#cccccc',
    },
    buttonText: {
        color: 'white',
        fontWeight: '500',
    },
    loading: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginVertical: 20,
    },
});

export default Step4Destination;
