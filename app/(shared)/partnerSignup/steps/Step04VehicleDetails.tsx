// app/(auth)/steps/Step04VehicleDetails.tsx
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

import type {
    PartnerOnboardingFormData,
    UploadAsset,
} from "../partnerOnboardingForm";

/**
 * FocusableField - Same component pattern as Step01
 */
type FocusableFieldProps = {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    inputRef: React.RefObject<TextInput | null>;
    placeholder?: string;
    keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
    autoCapitalize?: "none" | "sentences" | "words" | "characters";
    error?: string;
    isLast?: boolean;
};

function FocusableField({
    label,
    value,
    onChangeText,
    inputRef,
    placeholder,
    keyboardType = "default",
    autoCapitalize = "words",
    error,
    isLast = false,
}: FocusableFieldProps) {
    return (
        <View>
            <Pressable
                onPress={() => inputRef.current?.focus()}
                className={`flex flex-col items-start px-4 py-2 ${isLast ? "" : "border-b border-black/40"}`}
                style={{ height: 55 }}
            >
                <Text className="text-sm font-onest text-black/50">{label}</Text>

                <View className="flex-row items-center w-full flex-1">
                    <TextInput
                        ref={inputRef}
                        className="flex-1 text-lg font-onest text-black/90"
                        value={value}
                        onChangeText={onChangeText}
                        placeholder={placeholder}
                        placeholderTextColor="rgba(0,0,0,0.35)"
                        keyboardType={keyboardType}
                        autoCapitalize={autoCapitalize}
                        multiline={false}
                    />
                </View>
            </Pressable>

            {error ? (
                <Text className="text-red-500 text-sm ml-1 mt-1">{error}</Text>
            ) : null}
        </View>
    );
}

type UploadCardProps = {
    title: string;
    subtitle: string;
    onPress: () => void;
    previewUri?: string | null;
    loading?: boolean;
    disabled?: boolean;
    shadowStyle: any;
};

const UploadCard = React.memo(function UploadCard({
    title,
    subtitle,
    onPress,
    previewUri,
    loading,
    disabled,
    shadowStyle,
}: UploadCardProps) {
    return (
        <Pressable
            onPress={onPress}
            disabled={!!disabled}
            style={shadowStyle}
            className={[
                "border border-black/10 rounded-2xl bg-white overflow-hidden",
                disabled ? "opacity-60" : "opacity-100",
            ].join(" ")}
        >
            {previewUri ? (
                <View>
                    <Image
                        source={{ uri: previewUri }}
                        style={{ width: "100%", height: 190 }}
                        resizeMode="cover"
                    />
                    <View className="px-4 py-4">
                        <Text className="text-base font-onest-semibold text-black/90">
                            {title}
                        </Text>
                        <Text className="text-sm text-black/50 mt-1 font-onest">
                            Tap to replace
                        </Text>
                    </View>
                </View>
            ) : (
                <View className="px-4 py-5">
                    <View className="flex-row items-center gap-3">
                        <View className="w-12 h-12 rounded-xl bg-black/5 items-center justify-center">
                            {loading ? (
                                <ActivityIndicator />
                            ) : (
                                <Ionicons name="cloud-upload-outline" size={22} color="#64748B" />
                            )}
                        </View>
                        <View className="flex-1">
                            <Text className="text-base font-onest-semibold text-black/90">
                                {title}
                            </Text>
                            <Text className="text-sm text-black/55 mt-0.5 font-onest">
                                {subtitle}
                            </Text>
                        </View>
                    </View>
                </View>
            )}
        </Pressable>
    );
});

type Props = {
    formData: PartnerOnboardingFormData;
    setFormData: React.Dispatch<React.SetStateAction<PartnerOnboardingFormData>>;
    onNext: () => void;
    onBack: () => void;
};

export default function Step04VehicleDetails({
    formData,
    setFormData,
    onNext,
    onBack,
}: Props) {
    const [busy, setBusy] = useState<"orcr" | "photos" | null>(null);

    // Input refs for focus management
    const plateNumberRef = useRef<TextInput | null>(null);
    const vehicleTypeRef = useRef<TextInput | null>(null);
    const yearRef = useRef<TextInput | null>(null);
    const brandRef = useRef<TextInput | null>(null);
    const modelRef = useRef<TextInput | null>(null);
    const colorRef = useRef<TextInput | null>(null);
    const capacityRef = useRef<TextInput | null>(null);
    const priceRef = useRef<TextInput | null>(null);

    const shadowStyle = useMemo(
        () => ({
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
        }),
        []
    );

    const requestPermission = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            toast.error("Permission denied. Please allow photo access.");
            return false;
        }
        return true;
    };

    const toUploadAsset = (
        asset: ImagePicker.ImagePickerAsset,
        key: string
    ): UploadAsset => {
        const ext = asset.uri.split(".").pop() || "jpg";
        const name = asset.fileName ?? `${key}-${Date.now()}.${ext}`;
        return {
            uri: asset.uri,
            name,
            type: asset.mimeType || "image/jpeg",
        };
    };

    const pickORCR = async () => {
        try {
            const ok = await requestPermission();
            if (!ok) return;

            setBusy("orcr");

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.9,
            });

            if (result.canceled) return;

            const asset = result.assets?.[0];
            if (!asset?.uri) return;

            const upload = toUploadAsset(asset, "or_cr_document");

            setFormData((prev) => ({
                ...prev,
                or_cr_document: upload,
            }));

            toast.success("OR/CR uploaded");
        } catch (e) {
            console.error(e);
            toast.error("Failed to upload OR/CR");
        } finally {
            setBusy(null);
        }
    };

    const addVehiclePhotos = async () => {
        try {
            const ok = await requestPermission();
            if (!ok) return;

            setBusy("photos");

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.9,
                allowsMultipleSelection: true,
            });

            if (result.canceled) return;

            const assets = result.assets || [];
            if (!assets.length) return;

            const mapped = assets.map((a) => toUploadAsset(a, "vehicle_photo"));
            setFormData((prev) => ({
                ...prev,
                vehicle_photos: [...(prev.vehicle_photos || []), ...mapped].slice(0, 10),
            }));

            toast.success(`Added ${mapped.length} photo${mapped.length > 1 ? "s" : ""}`);
        } catch (e) {
            console.error(e);
            toast.error("Failed to add vehicle photos");
        } finally {
            setBusy(null);
        }
    };

    const handleChange = <K extends keyof PartnerOnboardingFormData>(
        field: K,
        value: PartnerOnboardingFormData[K]
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const validateThenContinue = () => {
        if (!formData.vehicle_plate_number?.trim()) {
            toast.error("Plate number is required.");
            return;
        }

        if (!formData.vehicle_passenger_capacity?.trim()) {
            toast.error("Passenger capacity is required.");
            return;
        }

        if (!formData.vehicle_price_per_day?.trim()) {
            toast.error("Price per day is required.");
            return;
        }

        if (!formData.or_cr_document?.uri) {
            toast.error("Please upload OR/CR.");
            return;
        }

        if (!formData.vehicle_photos?.length) {
            toast.error("Please upload at least 1 vehicle photo.");
            return;
        }

        onNext();
    };

    const photoCount = formData.vehicle_photos?.length || 0;

    return (
        <SafeAreaView className="bg-[#fff] h-full">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1 px-10"
                    contentContainerStyle={{ paddingBottom: 40 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View className="items-center mt-12">
                        <Text className="text-3xl font-onest-semibold text-black/90 leading-tight">
                            Add your vehicle details so travelers can book with confidence.
                        </Text>
                    </View>

                    <View className="py-12">
                        {/* VEHICLE IDENTIFICATION */}
                        <Text className="text-xl font-onest-medium text-black/90">
                            Vehicle identification
                        </Text>

                        <View className="mt-4 border border-black/40 rounded-lg overflow-hidden">
                            <FocusableField
                                label="Plate number"
                                value={formData.vehicle_plate_number || ""}
                                onChangeText={(t) => handleChange("vehicle_plate_number", t)}
                                inputRef={plateNumberRef}
                                placeholder="e.g., ABC 1234"
                                autoCapitalize="characters"
                            />

                            <FocusableField
                                label="Vehicle type"
                                value={formData.vehicle_type || ""}
                                onChangeText={(t) => handleChange("vehicle_type", t)}
                                inputRef={vehicleTypeRef}
                                placeholder="e.g., Sedan, Van, SUV"
                            />

                            <FocusableField
                                label="Year"
                                value={formData.vehicle_year || ""}
                                onChangeText={(t) => handleChange("vehicle_year", t.replace(/[^0-9]/g, ""))}
                                inputRef={yearRef}
                                placeholder="e.g., 2020"
                                keyboardType="numeric"
                                isLast
                            />
                        </View>

                        <Text className="mt-2 font-onest text-sm text-black/50">
                            Ensure the plate number matches your vehicle registration.
                        </Text>

                        {/* VEHICLE DETAILS */}
                        <View className="mt-12">
                            <Text className="text-xl font-onest-medium text-black/90">
                                Vehicle details
                            </Text>
                        </View>

                        <View className="mt-4 border border-black/40 rounded-lg overflow-hidden">
                            <FocusableField
                                label="Brand"
                                value={formData.vehicle_brand || ""}
                                onChangeText={(t) => handleChange("vehicle_brand", t)}
                                inputRef={brandRef}
                                placeholder="e.g., Toyota"
                            />

                            <FocusableField
                                label="Model"
                                value={formData.vehicle_model || ""}
                                onChangeText={(t) => handleChange("vehicle_model", t)}
                                inputRef={modelRef}
                                placeholder="e.g., Vios"
                            />

                            <FocusableField
                                label="Color"
                                value={formData.vehicle_color || ""}
                                onChangeText={(t) => handleChange("vehicle_color", t)}
                                inputRef={colorRef}
                                placeholder="e.g., White"
                                isLast
                            />
                        </View>

                        {/* CAPACITY & PRICING */}
                        <View className="mt-12">
                            <Text className="text-xl font-onest-medium text-black/90">
                                Capacity & pricing
                            </Text>
                        </View>

                        <View className="mt-4 border border-black/40 rounded-lg overflow-hidden">
                            <FocusableField
                                label="Passenger capacity"
                                value={formData.vehicle_passenger_capacity || ""}
                                onChangeText={(t) => handleChange("vehicle_passenger_capacity", t.replace(/[^0-9]/g, ""))}
                                inputRef={capacityRef}
                                placeholder="e.g., 4"
                                keyboardType="numeric"
                            />

                            <FocusableField
                                label="Price per day (₱)"
                                value={formData.vehicle_price_per_day || ""}
                                onChangeText={(t) => handleChange("vehicle_price_per_day", t.replace(/[^0-9.]/g, ""))}
                                inputRef={priceRef}
                                placeholder="e.g., 1500"
                                keyboardType="numeric"
                                isLast
                            />
                        </View>

                        <Text className="mt-2 font-onest text-sm text-black/50">
                            Set a competitive daily rate for your vehicle.
                        </Text>

                        {/* DOCUMENTS */}
                        <View className="mt-12">
                            <Text className="text-xl font-onest-medium text-black/90">
                                Documents & photos
                            </Text>
                            <Text className="mt-2 font-onest text-sm text-black/50">
                                Upload your OR/CR and photos of your vehicle.
                            </Text>
                        </View>

                        <View className="mt-4 gap-4">
                            {/* OR/CR */}
                            <UploadCard
                                title="Upload OR/CR"
                                subtitle="Photo or scanned copy (max 5-10MB)"
                                onPress={pickORCR}
                                previewUri={formData.or_cr_document?.uri || null}
                                loading={busy === "orcr"}
                                disabled={!!busy}
                                shadowStyle={shadowStyle}
                            />

                            {/* Vehicle Photos */}
                            <View
                                className="rounded-2xl p-5"
                                style={shadowStyle}
                            >
                                <View className="flex-row items-center justify-between mb-4">
                                    <Text className="text-base font-onest-semibold text-black/90">
                                        Vehicle Photos
                                    </Text>
                                    <Text className="text-sm text-black/50 font-onest">
                                        {photoCount}/10
                                    </Text>
                                </View>

                                <Pressable
                                    onPress={addVehiclePhotos}
                                    disabled={!!busy}
                                    className={[
                                        "border border-dashed border-black/20 rounded-xl px-4 py-5 items-center justify-center",
                                        busy ? "opacity-60" : "opacity-100",
                                    ].join(" ")}
                                >
                                    {busy === "photos" ? (
                                        <ActivityIndicator />
                                    ) : (
                                        <>
                                            <Ionicons name="images-outline" size={28} color="#9CA3AF" />
                                            <Text className="text-sm text-black/50 mt-2 font-onest text-center">
                                                Tap to add photos
                                            </Text>
                                        </>
                                    )}
                                </Pressable>

                                {/* Thumbnails */}
                                {photoCount > 0 && (
                                    <View className="flex-row flex-wrap gap-3 mt-4">
                                        {formData.vehicle_photos.slice(0, 10).map((p, idx) => (
                                            <View
                                                key={`${p.uri}-${idx}`}
                                                className="border border-black/10 rounded-xl overflow-hidden"
                                                style={{ width: "30%", aspectRatio: 1 }}
                                            >
                                                <Image
                                                    source={{ uri: p.uri }}
                                                    style={{ width: "100%", height: "100%" }}
                                                    resizeMode="cover"
                                                />
                                            </View>
                                        ))}
                                    </View>
                                )}

                                <Text className="mt-4 font-onest text-sm text-black/60 text-center">
                                    Add at least 1 clear photo of your vehicle.
                                </Text>
                            </View>
                        </View>

                        {/* Action buttons */}
                        <View className="flex-row gap-3 mt-6">
                            <Pressable
                                onPress={onBack}
                                disabled={!!busy}
                                className="flex-1 px-6 py-4 rounded-xl bg-gray-200"
                            >
                                <Text className="text-black/70 text-center text-base font-onest-medium">
                                    Back
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={validateThenContinue}
                                disabled={!!busy}
                                className="bg-[#191313] py-4 px-8 rounded-xl flex-1"
                            >
                                {busy ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text className="text-white/90 text-center text-base font-onest-medium">
                                        Continue
                                    </Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}