// hooks/useNavigation.ts

import { ItineraryItem } from "@/types/itineraryDetails";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Alert, Linking, Platform } from "react-native";

export const useItineraryNavigation = () => {
    const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);

    useEffect(() => {
        requestLocationPermission();
    }, []);

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === "granted") {
                const location = await Location.getCurrentPositionAsync({});
                setUserLocation(location);
            }
        } catch (error) {
            console.log("Location permission denied");
        }
    };

    const createGoogleMapsUrl = (origin: string, items: ItineraryItem[]): string => {
        const destination = `${items[items.length - 1].destination_latitude},${items[items.length - 1].destination_longitude
            }`;
        const waypoints = items
            .slice(0, -1)
            .map((item) => `${item.destination_latitude},${item.destination_longitude}`)
            .join("|");

        return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ""
            }&travelmode=driving`;
    };

    const handleMultiStopNavigation = async (dayItems: ItineraryItem[]) => {
        const itemsWithCoordinates = dayItems.filter(
            (item) => item.destination_latitude && item.destination_longitude
        );

        if (itemsWithCoordinates.length === 0) {
            Alert.alert("No Coordinates", "Location data is not available for these activities.");
            return;
        }

        if (itemsWithCoordinates.length === 1) {
            handleSingleNavigation(itemsWithCoordinates[0]);
            return;
        }

        try {
            let origin = "";
            let currentLocation = userLocation;

            if (!currentLocation) {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === "granted") {
                    currentLocation = await Location.getCurrentPositionAsync({});
                    origin = `${currentLocation.coords.latitude},${currentLocation.coords.longitude}`;
                } else {
                    Alert.alert(
                        "Location Required",
                        "Please enable location access to navigate from your current location.",
                        [
                            { text: "Cancel", style: "cancel" },
                            { text: "Open Settings", onPress: () => Linking.openSettings() },
                        ]
                    );
                    return;
                }
            } else {
                origin = `${currentLocation.coords.latitude},${currentLocation.coords.longitude}`;
            }

            if (Platform.OS === "ios") {
                const destinations = itemsWithCoordinates
                    .map((item) => `${item.destination_latitude},${item.destination_longitude}`)
                    .join("+to:");
                const url = `https://maps.apple.com/?saddr=${origin}&daddr=${destinations}`;
                const supported = await Linking.canOpenURL(url);
                if (supported) {
                    await Linking.openURL(url);
                } else {
                    await Linking.openURL(createGoogleMapsUrl(origin, itemsWithCoordinates));
                }
            } else {
                await Linking.openURL(createGoogleMapsUrl(origin, itemsWithCoordinates));
            }
        } catch (error) {
            console.error("Error opening maps:", error);
            Alert.alert("Error", "Unable to open navigation. Please try again.");
        }
    };

    const handleSingleNavigation = async (item: ItineraryItem) => {
        if (!item.destination_latitude || !item.destination_longitude) {
            Alert.alert("No Coordinates", "Location data is not available for this activity.");
            return;
        }

        try {
            const { destination_latitude, destination_longitude, experience_name } = item;
            const label = encodeURIComponent(experience_name);

            const url = Platform.select({
                ios: `maps://app?daddr=${label}@${destination_latitude},${destination_longitude}`,
                android: `google.navigation:q=${destination_latitude},${destination_longitude}(${label})`,
            });

            const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${destination_latitude},${destination_longitude}`;

            if (url) {
                const supported = await Linking.canOpenURL(url);
                if (supported) {
                    await Linking.openURL(url);
                } else {
                    await Linking.openURL(fallbackUrl);
                }
            }
        } catch (error) {
            Alert.alert("Error", "Unable to open maps");
        }
    };

    const navigateBetweenItems = (item: ItineraryItem, nextItem: ItineraryItem) => {
        const origin = `${item.destination_latitude},${item.destination_longitude}`;
        const destination = `${nextItem.destination_latitude},${nextItem.destination_longitude}`;
        const url = Platform.select({
            ios: `https://maps.apple.com/?saddr=${origin}&daddr=${destination}`,
            android: `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`,
        });
        if (url) Linking.openURL(url);
    };

    return {
        userLocation,
        handleMultiStopNavigation,
        handleSingleNavigation,
        navigateBetweenItems,
    };
};