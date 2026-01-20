// app/(auth)/steps/Step04VehicleDetails.tsx
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
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
 * ✅ IMPORTANT:
 * These components are OUTSIDE the screen component to prevent remounting on every keystroke,
 * which causes the TextInput to lose focus (keyboard closes).
 */

type InputProps = {
    label: string;
    placeholder?: string;
    value?: string;
    onChangeText: (t: string) => void;
    keyboardType?: "default" | "numeric";
};

const FormInput = React.memo(function FormInput({
    label,
    placeholder,
    value,
    onChangeText,
    keyboardType,
}: InputProps) {
    return (
        <View className="mb-4">
            <Text className="text-sm font-onest-medium text-black/70 mb-2">
                {label}
            </Text>
            <View className="border border-black/10 rounded-xl px-4 py-4 bg-white">
                <TextInput
                    value={value ?? ""}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#9CA3AF"
                    keyboardType={keyboardType ?? "default"}
                    className="text-base text-black/90 font-onest"
                />
            </View>
        </View>
    );
});

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

    // Same shadow setup style as Step02
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
        <SafeAreaView className="bg-gray-50 flex-1">
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 60 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View className="px-10 pt-12 pb-10">
                        <Text className="text-3xl font-onest-semibold text-gray-800">
                            Vehicle Details
                        </Text>

                        <Text className="mt-2 font-onest text-sm text-gray-500">
                            Add your vehicle info so travelers can book transport with confidence.
                        </Text>

                        <View className="mt-8">
                            <FormInput
                                label="Plate Number *"
                                placeholder="e.g., ABC 1234"
                                value={formData.vehicle_plate_number}
                                onChangeText={(t) => handleChange("vehicle_plate_number", t)}
                            />

                            <View className="flex-row gap-3">
                                <View className="flex-1">
                                    <FormInput
                                        label="Vehicle Type"
                                        placeholder="e.g., Sedan, Van, SUV"
                                        value={formData.vehicle_type}
                                        onChangeText={(t) => handleChange("vehicle_type", t)}
                                    />
                                </View>
                                <View className="flex-1">
                                    <FormInput
                                        label="Year"
                                        placeholder="e.g., 2020"
                                        value={formData.vehicle_year}
                                        keyboardType="numeric"
                                        onChangeText={(t) =>
                                            handleChange("vehicle_year", t.replace(/[^0-9]/g, ""))
                                        }
                                    />
                                </View>
                            </View>

                            <View className="flex-row gap-3">
                                <View className="flex-1">
                                    <FormInput
                                        label="Brand"
                                        placeholder="e.g., Toyota"
                                        value={formData.vehicle_brand}
                                        onChangeText={(t) => handleChange("vehicle_brand", t)}
                                    />
                                </View>
                                <View className="flex-1">
                                    <FormInput
                                        label="Model"
                                        placeholder="e.g., Vios"
                                        value={formData.vehicle_model}
                                        onChangeText={(t) => handleChange("vehicle_model", t)}
                                    />
                                </View>
                            </View>

                            <View className="flex-row gap-3">
                                <View className="flex-1">
                                    <FormInput
                                        label="Color"
                                        placeholder="e.g., White"
                                        value={formData.vehicle_color}
                                        onChangeText={(t) => handleChange("vehicle_color", t)}
                                    />
                                </View>
                                <View className="flex-1">
                                    <FormInput
                                        label="Passenger Capacity *"
                                        placeholder="e.g., 4"
                                        value={formData.vehicle_passenger_capacity}
                                        keyboardType="numeric"
                                        onChangeText={(t) =>
                                            handleChange(
                                                "vehicle_passenger_capacity",
                                                t.replace(/[^0-9]/g, "")
                                            )
                                        }
                                    />
                                </View>
                            </View>

                            <FormInput
                                label="Pricing per day *"
                                placeholder="e.g., 1500"
                                value={formData.vehicle_price_per_day}
                                keyboardType="numeric"
                                onChangeText={(t) =>
                                    handleChange("vehicle_price_per_day", t.replace(/[^0-9.]/g, ""))
                                }
                            />

                            <View className="mt-6 gap-4">
                                {/* OR/CR */}
                                <UploadCard
                                    title="Upload OR/CR *"
                                    subtitle="Photo or scanned copy (recommended max 5–10MB)"
                                    onPress={pickORCR}
                                    previewUri={formData.or_cr_document?.uri || null}
                                    loading={busy === "orcr"}
                                    disabled={!!busy}
                                    shadowStyle={shadowStyle}
                                />

                                {/* Vehicle Photos */}
                                <View>
                                    <View className="flex-row items-center justify-between mb-3">
                                        <Text className="text-base font-onest-semibold text-black/90">
                                            Vehicle Photos *
                                        </Text>
                                        <Text className="text-sm text-black/50 font-onest">
                                            {photoCount}/10
                                        </Text>
                                    </View>

                                    <View className="gap-3">
                                        <Pressable
                                            onPress={addVehiclePhotos}
                                            disabled={!!busy}
                                            style={shadowStyle}
                                            className={[
                                                "border border-black/10 rounded-2xl bg-white px-4 py-5",
                                                busy ? "opacity-60" : "opacity-100",
                                            ].join(" ")}
                                        >
                                            <View className="flex-row items-center gap-3">
                                                <View className="w-12 h-12 rounded-xl bg-black/5 items-center justify-center">
                                                    {busy === "photos" ? (
                                                        <ActivityIndicator />
                                                    ) : (
                                                        <Ionicons name="images-outline" size={22} color="#64748B" />
                                                    )}
                                                </View>
                                                <View className="flex-1">
                                                    <Text className="text-base font-onest-semibold text-black/90">
                                                        Add Photos
                                                    </Text>
                                                    <Text className="text-sm text-black/55 mt-0.5 font-onest">
                                                        Add at least 1 clear photo of your vehicle
                                                    </Text>
                                                </View>
                                            </View>
                                        </Pressable>

                                        {/* Thumbnails */}
                                        {photoCount > 0 ? (
                                            <View className="flex-row flex-wrap gap-3">
                                                {formData.vehicle_photos.slice(0, 10).map((p, idx) => (
                                                    <View
                                                        key={`${p.uri}-${idx}`}
                                                        className="border border-black/10 rounded-xl overflow-hidden"
                                                        style={{ width: "48%" }}
                                                    >
                                                        <Image
                                                            source={{ uri: p.uri }}
                                                            style={{ width: "100%", height: 120 }}
                                                            resizeMode="cover"
                                                        />
                                                    </View>
                                                ))}
                                            </View>
                                        ) : (
                                            <Text className="text-sm text-black/50 font-onest">
                                                No vehicle photos added yet.
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </View>

                            {/* ✅ Note UI copied from Step02 */}
                            <View className="mt-10 p-4 rounded-2xl bg-white" style={shadowStyle}>
                                <View className="flex-row items-start">
                                    <Ionicons
                                        name="information-circle-outline"
                                        size={18}
                                        color="#3B82F6"
                                    />
                                    <Text className="text-sm text-gray-700 font-onest ml-2 flex-1">
                                        <Text className="font-onest-semibold">Note:</Text> Your documents
                                        are reviewed before your driver account is approved.
                                    </Text>
                                </View>
                            </View>

                            {/* ✅ Buttons copied from Step02 */}
                            <View className="flex-row mt-6 gap-3">
                                <Pressable
                                    onPress={onBack}
                                    disabled={!!busy}
                                    className="px-6 py-4 rounded-xl flex-1 bg-gray-200"
                                >
                                    <Text className="text-black/70 text-center text-base font-onest-medium">
                                        Back
                                    </Text>
                                </Pressable>

                                <Pressable
                                    onPress={validateThenContinue}
                                    disabled={!!busy}
                                    className="bg-[#191313] py-4 px-8 flex-1 rounded-xl"
                                >
                                    <Text className="text-white/90 text-center text-base font-onest-medium">
                                        Continue
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
