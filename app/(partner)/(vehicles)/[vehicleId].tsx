// app/(partner)/(vehicles)/[vehicleId].tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API_URL from "../../../constants/api";

type Vehicle = {
    vehicle_id: number;
    plate_number: string;
    vehicle_type?: string;
    brand?: string;
    model?: string;
    year?: number;
    color?: string;
    passenger_capacity?: number;
    price_per_day?: number;
};

type PartnerProfileResponse = {
    success: boolean;
    partner_type?: "Driver" | "Guide";
    data?: {
        vehicles?: Vehicle[];
    };
    message?: string;
};

export default function VehicleInformationScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ vehicleId?: string }>();

    const vehicleId = useMemo(() => {
        const raw = params.vehicleId;
        if (!raw) return null;
        const id = parseInt(Array.isArray(raw) ? raw[0] : raw, 10);
        return Number.isFinite(id) ? id : null;
    }, [params.vehicleId]);

    const [loading, setLoading] = useState(true);
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);

    const formatCurrency = (amount?: number) => {
        if (amount == null) return "—";
        return `₱${amount.toLocaleString()}`;
    };

    const fetchVehicle = async () => {
        try {
            setLoading(true);

            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Error", "Please log in again.");
                router.replace("/(shared)/login");
                return;
            }

            if (!vehicleId) {
                Alert.alert("Error", "Invalid vehicle.");
                router.back();
                return;
            }

            const res = await fetch(`${API_URL}/partner-mobile/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data: PartnerProfileResponse = await res.json();

            if (!res.ok || !data?.success) {
                Alert.alert("Error", data?.message || "Failed to load vehicle details.");
                return;
            }

            const vehicles = data?.data?.vehicles || [];
            const found = vehicles.find((v) => v.vehicle_id === vehicleId) || null;

            if (!found) {
                Alert.alert("Not Found", "Vehicle not found.");
            }

            setVehicle(found);
        } catch (e) {
            console.error("VehicleInformationScreen error:", e);
            Alert.alert("Error", "Failed to load vehicle details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicle();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vehicleId]);

    const Field = ({ label, value }: { label: string; value: string }) => (
        <View className="py-3 border-b border-black/5">
            <Text className="text-xs font-onest text-black/40">{label}</Text>
            <Text className="text-base font-onest text-black/90 mt-1">{value}</Text>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#1f2937" />
                <Text className="mt-3 text-black/50 font-onest">Loading vehicle...</Text>
            </SafeAreaView>
        );
    }

    if (!vehicle) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-row items-center px-6 pt-4 pb-2">
                    <Pressable
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-full items-center justify-center"
                    >
                        <Ionicons name="arrow-back" size={24} color="#191313" />
                    </Pressable>
                    <Text className="ml-2 text-xl font-onest-semibold text-black/90">
                        Vehicle Information
                    </Text>
                </View>

                <View className="flex-1 items-center justify-center px-6">
                    <Ionicons name="car-outline" size={44} color="#9CA3AF" />
                    <Text className="mt-3 text-base font-onest text-black/60 text-center">
                        Vehicle not found.
                    </Text>
                    <Pressable
                        onPress={() => router.back()}
                        className="mt-4 px-5 py-3 rounded-xl bg-black/5"
                    >
                        <Text className="font-onest text-black/80">Go back</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    const title = `${vehicle.brand || "Vehicle"} ${vehicle.model || ""}`.trim();

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}

            {/* Header */}
            <View className="py-6 px-4">
                <View className="flex-row justify-between items-center mb-6">
                    <Pressable className="flex flex-row items-baseline" onPress={() => router.back()}>
                        <Ionicons
                            name="arrow-back"
                            size={24}
                            color="#1f1f1f"
                            style={{ marginRight: 12 }}
                        />
                        <View>
                            <Text className="text-3xl font-onest-semibold text-gray-800">
                                Vehicle Information
                            </Text>
                            <Text className="text-sm font-onest text-black/40 mt-0.5">
                                View-only
                            </Text>
                        </View>
                    </Pressable>
                </View>
            </View>

            <ScrollView
                className="flex-1 px-6"
                contentContainerStyle={{ paddingBottom: 30 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero card */}
                <View className="mt-3 p-4 rounded-2xl  flex-row items-center">
                    <View className="w-12 h-12 rounded-xl bg-white items-center justify-center mr-3">
                        <Ionicons name="car-outline" size={26} color="#6B7280" />
                    </View>

                    <View className="flex-1">
                        <Text className="text-base font-onest-semibold text-black/90">
                            {title || "Vehicle"}
                        </Text>
                        <Text className="text-xs font-onest text-black/50 mt-0.5">
                            Plate No: {vehicle.plate_number || "—"}
                        </Text>
                    </View>

                    <Text className="text-sm font-onest-semibold text-primary">
                        {formatCurrency(vehicle.price_per_day)}/day
                    </Text>
                </View>

                {/* Details */}
                <View className="mt-5 bg-white rounded-2xl">
                    <Field label="Plate Number" value={vehicle.plate_number || "—"} />
                    <Field label="Vehicle Type" value={vehicle.vehicle_type || "—"} />
                    <Field label="Brand" value={vehicle.brand || "—"} />
                    <Field label="Model" value={vehicle.model || "—"} />
                    <Field label="Year" value={vehicle.year != null ? String(vehicle.year) : "—"} />
                    <Field label="Color" value={vehicle.color || "—"} />
                    <Field
                        label="Passenger Capacity"
                        value={
                            vehicle.passenger_capacity != null
                                ? `${vehicle.passenger_capacity} seats`
                                : "—"
                        }
                    />
                    <Field
                        label="Price Per Day"
                        value={`${formatCurrency(vehicle.price_per_day)}/day`}
                    />
                </View>

                {/* Note */}
                {/* <View className="mt-4 p-4 rounded-2xl bg-yellow-50">
                    <Text className="text-sm font-onest text-yellow-800">
                        Editing will be added later.
                    </Text>
                </View> */}
            </ScrollView>
        </SafeAreaView>
    );
}
