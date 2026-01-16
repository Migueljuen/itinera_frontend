// components/LocationPickerModal.tsx

import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Keyboard,
    Modal,
    Pressable,
    Text,
    TextInput,
    View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';

interface LocationData {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
}

interface SearchResult {
    place_id: string;
    display_name: string;
    name: string;
    lat: string;
    lon: string;
}

interface LocationPickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectLocation: (location: LocationData) => void;
    initialLocation?: LocationData | null;
    title?: string;
}

// Default to Philippines (Metro Manila)
const DEFAULT_REGION: Region = {
    latitude: 14.5995,
    longitude: 120.9842,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
};

export function LocationPickerModal({
    visible,
    onClose,
    onSelectLocation,
    initialLocation,
    title = 'Select Location',
}: LocationPickerModalProps) {
    const mapRef = useRef<MapView>(null);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    // Selected location state
    const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
        initialLocation || null
    );
    const [markerCoordinate, setMarkerCoordinate] = useState<{
        latitude: number;
        longitude: number;
    } | null>(initialLocation ? { latitude: initialLocation.latitude, longitude: initialLocation.longitude } : null);

    // Region state
    const [region, setRegion] = useState<Region>(
        initialLocation
            ? {
                latitude: initialLocation.latitude,
                longitude: initialLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }
            : DEFAULT_REGION
    );

    // Reset state when modal opens
    useEffect(() => {
        if (visible) {
            if (initialLocation) {
                setSelectedLocation(initialLocation);
                setMarkerCoordinate({
                    latitude: initialLocation.latitude,
                    longitude: initialLocation.longitude,
                });
                setRegion({
                    latitude: initialLocation.latitude,
                    longitude: initialLocation.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                });
            }
        }
    }, [visible, initialLocation]);

    // Search places using Nominatim (OpenStreetMap)
    const searchPlaces = async (query: string) => {
        if (query.length < 3) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        setIsSearching(true);
        setShowResults(true);

        try {
            // Bias search to Philippines
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `q=${encodeURIComponent(query)}&` +
                `format=json&` +
                `addressdetails=1&` +
                `limit=10&` +
                `countrycodes=ph&` + // Limit to Philippines
                `viewbox=116.9,4.5,127.0,21.2&` + // Philippines bounding box
                `bounded=1`,
                {
                    headers: {
                        'User-Agent': 'ItineraApp/1.0', // Required by Nominatim
                    },
                }
            );

            const data: SearchResult[] = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error('Error searching places:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    // Debounced search
    const handleSearchChange = (text: string) => {
        setSearchQuery(text);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        searchTimeout.current = setTimeout(() => {
            searchPlaces(text);
        }, 500);
    };

    // Select a search result
    const handleSelectSearchResult = (result: SearchResult) => {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);

        // Extract a cleaner name
        const nameParts = result.display_name.split(',');
        const name = result.name || nameParts[0].trim();
        const address = nameParts.slice(0, 3).join(',').trim();

        const location: LocationData = {
            name,
            address,
            latitude: lat,
            longitude: lon,
        };

        setSelectedLocation(location);
        setMarkerCoordinate({ latitude: lat, longitude: lon });
        setSearchQuery(name);
        setShowResults(false);
        Keyboard.dismiss();

        // Animate map to selected location
        mapRef.current?.animateToRegion(
            {
                latitude: lat,
                longitude: lon,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            },
            500
        );
    };

    // Handle map press (drop pin)
    const handleMapPress = async (event: any) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        setMarkerCoordinate({ latitude, longitude });

        // Reverse geocode to get address
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?` +
                `lat=${latitude}&lon=${longitude}&format=json`,
                {
                    headers: {
                        'User-Agent': 'ItineraApp/1.0',
                    },
                }
            );

            const data = await response.json();

            if (data && data.display_name) {
                const nameParts = data.display_name.split(',');
                const name = data.name || nameParts[0].trim();
                const address = nameParts.slice(0, 3).join(',').trim();

                setSelectedLocation({
                    name,
                    address,
                    latitude,
                    longitude,
                });
                setSearchQuery(name);
            } else {
                setSelectedLocation({
                    name: 'Pinned Location',
                    address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                    latitude,
                    longitude,
                });
            }
        } catch (error) {
            console.error('Error reverse geocoding:', error);
            setSelectedLocation({
                name: 'Pinned Location',
                address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                latitude,
                longitude,
            });
        }
    };

    // Use current location
    const handleUseCurrentLocation = async () => {
        setIsLoadingLocation(true);

        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Permission Denied',
                    'Please enable location permissions to use this feature.'
                );
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const { latitude, longitude } = location.coords;
            setMarkerCoordinate({ latitude, longitude });

            // Reverse geocode
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?` +
                `lat=${latitude}&lon=${longitude}&format=json`,
                {
                    headers: {
                        'User-Agent': 'ItineraApp/1.0',
                    },
                }
            );

            const data = await response.json();

            let name = 'Current Location';
            let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

            if (data && data.display_name) {
                const nameParts = data.display_name.split(',');
                name = data.name || nameParts[0].trim();
                address = nameParts.slice(0, 3).join(',').trim();
            }

            setSelectedLocation({
                name,
                address,
                latitude,
                longitude,
            });
            setSearchQuery(name);

            // Animate map
            mapRef.current?.animateToRegion(
                {
                    latitude,
                    longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                },
                500
            );
        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert('Error', 'Failed to get your current location. Please try again.');
        } finally {
            setIsLoadingLocation(false);
        }
    };

    // Confirm selection
    const handleConfirm = () => {
        if (!selectedLocation) {
            Alert.alert('No Location Selected', 'Please select a location on the map or search for a place.');
            return;
        }

        onSelectLocation(selectedLocation);
        onClose();
    };

    // Render search result item
    const renderSearchResult = ({ item }: { item: SearchResult }) => (
        <Pressable
            onPress={() => handleSelectSearchResult(item)}
            className="flex-row items-start px-4 py-3 border-b border-gray-100"
        >
            <Ionicons name="location-outline" size={20} color="#6B7280" style={{ marginTop: 2 }} />
            <View className="ml-3 flex-1">
                <Text className="font-onest-medium text-gray-900" numberOfLines={1}>
                    {item.name || item.display_name.split(',')[0]}
                </Text>
                <Text className="font-onest text-gray-500 text-xs mt-0.5" numberOfLines={2}>
                    {item.display_name}
                </Text>
            </View>
        </Pressable>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-white">
                {/* Header */}
                <View className="pt-12 pb-4 px-4 border-b border-gray-200">
                    <View className="flex-row items-center justify-between mb-4">
                        <Pressable onPress={onClose} className="p-2 -ml-2">
                            <Ionicons name="close" size={24} color="#374151" />
                        </Pressable>
                        <Text className="text-lg font-onest-semibold text-gray-900">{title}</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Search Input */}
                    <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                        <Ionicons name="search" size={20} color="#9CA3AF" />
                        <TextInput
                            className="flex-1 ml-3 font-onest text-gray-900"
                            placeholder="Search for a place..."
                            placeholderTextColor="#9CA3AF"
                            value={searchQuery}
                            onChangeText={handleSearchChange}
                            onFocus={() => searchQuery.length >= 3 && setShowResults(true)}
                        />
                        {searchQuery.length > 0 && (
                            <Pressable
                                onPress={() => {
                                    setSearchQuery('');
                                    setSearchResults([]);
                                    setShowResults(false);
                                }}
                            >
                                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* Search Results Dropdown */}
                {showResults && (
                    <View className="absolute top-36 left-0 right-0 z-10 bg-white border-b border-gray-200 max-h-64 shadow-lg">
                        {isSearching ? (
                            <View className="py-8 items-center">
                                <ActivityIndicator size="small" color="#6366F1" />
                                <Text className="font-onest text-gray-500 mt-2">Searching...</Text>
                            </View>
                        ) : searchResults.length > 0 ? (
                            <FlatList
                                data={searchResults}
                                keyExtractor={(item) => item.place_id}
                                renderItem={renderSearchResult}
                                keyboardShouldPersistTaps="handled"
                            />
                        ) : searchQuery.length >= 3 ? (
                            <View className="py-8 items-center">
                                <Ionicons name="location-outline" size={32} color="#D1D5DB" />
                                <Text className="font-onest text-gray-500 mt-2">No places found</Text>
                            </View>
                        ) : null}
                    </View>
                )}

                {/* Map */}
                <View className="flex-1">
                    <MapView
                        ref={mapRef}
                        style={{ flex: 1 }}
                        provider={PROVIDER_GOOGLE}
                        initialRegion={region}
                        onPress={handleMapPress}
                        showsUserLocation
                        showsMyLocationButton={false}
                    >
                        {markerCoordinate && (
                            <Marker
                                coordinate={markerCoordinate}
                                draggable
                                onDragEnd={(e) => handleMapPress(e)}
                            >
                                <View className="items-center">
                                    <Ionicons name="location" size={40} color="#6366F1" />
                                </View>
                            </Marker>
                        )}
                    </MapView>

                    {/* Current Location Button */}
                    <Pressable
                        onPress={handleUseCurrentLocation}
                        disabled={isLoadingLocation}
                        className="absolute top-4 right-4 bg-white rounded-full p-3 shadow-md"
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 3,
                        }}
                    >
                        {isLoadingLocation ? (
                            <ActivityIndicator size="small" color="#6366F1" />
                        ) : (
                            <Ionicons name="locate" size={24} color="#6366F1" />
                        )}
                    </Pressable>

                    {/* Instruction Overlay */}
                    {!markerCoordinate && (
                        <View className="absolute top-4 left-4 right-16 bg-white/90 rounded-xl px-4 py-3">
                            <Text className="font-onest text-gray-600 text-sm text-center">
                                Tap on the map to drop a pin or search for a place above
                            </Text>
                        </View>
                    )}
                </View>

                {/* Selected Location Card */}
                {selectedLocation && (
                    <View className="px-4 py-4 border-t border-gray-200 bg-white">
                        <View className="flex-row items-start mb-4">
                            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                                <Ionicons name="location" size={20} color="#6366F1" />
                            </View>
                            <View className="ml-3 flex-1">
                                <Text className="font-onest-semibold text-gray-900">
                                    {selectedLocation.name}
                                </Text>
                                <Text className="font-onest text-gray-500 text-sm mt-0.5">
                                    {selectedLocation.address}
                                </Text>
                            </View>
                        </View>

                        <Pressable
                            onPress={handleConfirm}
                            className="bg-primary rounded-xl py-4 items-center"
                        >
                            <Text className="font-onest-semibold text-white">Confirm Location</Text>
                        </Pressable>
                    </View>
                )}

                {/* Confirm Button (when no location selected) */}
                {!selectedLocation && (
                    <View className="px-4 py-4 border-t border-gray-200 bg-white">
                        <Pressable
                            onPress={handleUseCurrentLocation}
                            disabled={isLoadingLocation}
                            className="bg-gray-100 rounded-xl py-4 flex-row items-center justify-center"
                        >
                            {isLoadingLocation ? (
                                <ActivityIndicator size="small" color="#374151" />
                            ) : (
                                <>
                                    <Ionicons name="locate" size={20} color="#374151" />
                                    <Text className="font-onest-medium text-gray-700 ml-2">
                                        Use My Current Location
                                    </Text>
                                </>
                            )}
                        </Pressable>
                    </View>
                )}
            </View>
        </Modal>
    );
}