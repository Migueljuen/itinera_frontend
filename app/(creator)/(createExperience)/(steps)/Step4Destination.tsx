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

    const renderDestinationForm = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Create New Destination</Text>

            {loading ? (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color="#0000ff" />
                    <Text style={styles.loadingText}>Loading location...</Text>
                </View>
            ) : errorMsg ? (
                <Text style={styles.errorText}>{errorMsg}</Text>
            ) : (
                <>
                    {location && (
                        <MapView
                            style={styles.map}
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
                                    description={formData.destination_description || "This location will be saved"}
                                />
                            )}
                        </MapView>
                    )}

                    <TextInput
                        style={styles.input}
                        placeholder="Destination Name"
                        value={formData.destination_name}
                        onChangeText={(value) => handleChange('destination_name', value)}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="City"
                        value={formData.city}
                        onChangeText={(value) => handleChange('city', value)}
                    />

                    <TextInput
                        style={styles.textArea}
                        placeholder="Description"
                        value={formData.destination_description}
                        onChangeText={(value) => handleChange('destination_description', value)}
                        multiline={true}
                        numberOfLines={4}
                    />

                    {selectedLocation && (
                        <View style={styles.locationInfo}>
                            <Text style={styles.locationText}>
                                Location: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                            </Text>
                        </View>
                    )}

                    <Text style={styles.helpText}>
                        Tap anywhere on the map to select a location
                    </Text>
                </>
            )}
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Add Destination</Text>

                {renderDestinationForm()}

                <View style={styles.navigationButtons}>
                    <Pressable style={styles.backButton} onPress={onBack}>
                        <Text style={styles.buttonText}>Back</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.nextButton, !isValid() && styles.disabledButton]}
                        onPress={onNext}
                        disabled={!isValid()}
                    >
                        <Text style={styles.buttonText}>Next</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
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
