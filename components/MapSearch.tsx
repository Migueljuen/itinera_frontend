import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Modal,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

interface SearchResult {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
}

interface LocationCoordinate {
  latitude: number;
  longitude: number;
}

interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface MapSearchComponentProps {
  onLocationSelect: (location: LocationCoordinate) => void;
  initialLatitude?: number;
  initialLongitude?: number;
  visible: boolean;
  onClose: () => void;
}

const MapSearchComponent: React.FC<MapSearchComponentProps> = ({ 
  onLocationSelect, 
  initialLatitude, 
  initialLongitude,
  visible,
  onClose 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationCoordinate | null>(null);
  const [region, setRegion] = useState<MapRegion>({
    latitude: initialLatitude || 10.3157,  // Default to Cebu City
    longitude: initialLongitude || 123.8854,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  
  const mapRef = useRef<MapView>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (initialLatitude && initialLongitude) {
      setRegion({
        latitude: initialLatitude,
        longitude: initialLongitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      setSelectedLocation({
        latitude: initialLatitude,
        longitude: initialLongitude,
      });
    }
  }, [initialLatitude, initialLongitude]);

  // Get user's current location
  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const newRegion: MapRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      
      setRegion(newRegion);
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setLoading(false);
    }
  };

  // Search for places using a geocoding service
  const searchPlaces = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      
      // Using OpenStreetMap Nominatim (free geocoding service)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      
      const data = await response.json();
      
      const results: SearchResult[] = data.map((item: any) => ({
        id: item.place_id.toString(),
        title: item.display_name.split(',')[0],
        description: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      }));
      
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search locations');
    } finally {
      setLoading(false);
    }
  };

  // Handle search input with debouncing
  const handleSearchInput = (text: string) => {
    setSearchQuery(text);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      searchPlaces(text);
    }, 500);
  };

  // Handle search result selection
  const handleSearchResultSelect = (result: SearchResult) => {
    const newRegion: MapRegion = {
      latitude: result.latitude,
      longitude: result.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
    
    setRegion(newRegion);
    setSelectedLocation({
      latitude: result.latitude,
      longitude: result.longitude,
    });
    setSearchResults([]);
    setSearchQuery(result.title);
    
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 1000);
    }
  };

  // Handle map press
  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
  };

  // Confirm location selection
  const handleConfirmLocation = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      onClose();
    } else {
      Alert.alert('No Location Selected', 'Please select a location on the map');
    }
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      className="p-4 border-b border-gray-200 bg-white"
      onPress={() => handleSearchResultSelect(item)}
      activeOpacity={0.7}
    >
      <Text className="font-onest-medium text-base text-gray-800" numberOfLines={1}>
        {item.title}
      </Text>
      <Text className="font-onest text-sm text-gray-500 mt-1" numberOfLines={2}>
        {item.description}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="bg-white pt-12 pb-4 px-4 border-b border-gray-200">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="font-onest-semibold text-lg">Select Location</Text>
            <TouchableOpacity 
              onPress={handleConfirmLocation}
              className="bg-blue-500 px-4 py-2 rounded-lg"
            >
              <Text className="font-onest-medium text-white">Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View className="p-4 bg-white border-b border-gray-200">
          <View className="flex-row items-center bg-gray-100 rounded-lg px-4 py-3">
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              className="flex-1 ml-3 font-onest text-base"
              placeholder="Search for a place..."
              value={searchQuery}
              onChangeText={handleSearchInput}
              placeholderTextColor="#9CA3AF"
            />
            {loading && <ActivityIndicator size="small" color="#6B7280" />}
          </View>
          
          {/* Current Location Button */}
          <TouchableOpacity
            className="flex-row items-center mt-3 p-2"
            onPress={getCurrentLocation}
          >
            <Ionicons name="location" size={20} color="#3B82F6" />
            <Text className="font-onest-medium text-blue-500 ml-2">
              Use Current Location
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id.toString()}
            className="max-h-48 bg-white"
            keyboardShouldPersistTaps="handled"
          />
        )}

        {/* Map */}
        <View className="flex-1">
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            region={region}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={false}
          >
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                title="Selected Location"
                pinColor="#3B82F6"
              />
            )}
          </MapView>
        </View>

        {/* Selected Location Info */}
        {selectedLocation && (
          <View className="bg-white p-4 border-t border-gray-200">
            <Text className="font-onest-medium text-base mb-2">Selected Coordinates:</Text>
            <Text className="font-onest text-sm text-gray-600">
              Lat: {selectedLocation.latitude.toFixed(6)}, 
              Lng: {selectedLocation.longitude.toFixed(6)}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

export default MapSearchComponent;