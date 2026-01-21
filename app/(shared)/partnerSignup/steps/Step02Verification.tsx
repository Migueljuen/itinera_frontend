// app/(auth)/steps/Step02Verification.tsx
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

import type {
  CreatorRole,
  PartnerOnboardingFormData,
  UploadAsset,
} from "../partnerOnboardingForm";

type DocumentKey =
  | "selfie_document"
  | "id_document"
  | "license_document"
  | "guide_certificate_document";

type RequiredDoc = {
  key: DocumentKey;
  label: string;
  required: boolean;
  helper?: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

type Props = {
  formData: PartnerOnboardingFormData;
  setFormData: React.Dispatch<React.SetStateAction<PartnerOnboardingFormData>>;
  onNext: () => void;
  onBack: () => void;
};

export default function Step02Verification({
  formData,
  setFormData,
  onNext,
  onBack,
}: Props) {
  const [uploadingKey, setUploadingKey] = useState<DocumentKey | null>(null);

  const shadowStyle = {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  };

  const requiredDocuments: RequiredDoc[] = useMemo(() => {
    const role: CreatorRole = formData.creator_role;

    const base: RequiredDoc[] = [
      {
        key: "selfie_document",
        label: "Selfie Verification",
        required: true,
        helper: "Clear selfie. No filters. Good lighting.",
        icon: "camera-outline",
      },
      {
        key: "id_document",
        label: "Government ID",
        required: true,
        helper: "Readable and not expired.",
        icon: "card-outline",
      },
    ];

    if (role === "Driver") {
      return [
        ...base,
        {
          key: "license_document",
          label: "Driver's License",
          required: true,
          helper: "Readable and valid.",
          icon: "car-outline",
        },
      ];
    }

    if (role === "Guide") {
      return [
        ...base,
        {
          key: "guide_certificate_document",
          label: "Tour Guide Certificate / License",
          required: true,
          helper: "Upload your certificate or license.",
          icon: "ribbon-outline",
        },
      ];
    }

    return base;
  }, [formData.creator_role]);

  const setUploadForKeyFromUri = (key: DocumentKey, uri: string) => {
    const ext = uri.split(".").pop() || "jpg";
    const upload: UploadAsset = {
      uri,
      name: `${key}-${Date.now()}.${ext}`,
      type: "image/jpeg",
    };

    setFormData((prev) => ({ ...prev, [key]: upload } as any));
    const label = requiredDocuments.find((d) => d.key === key)?.label ?? "File";
    toast.success(`${label} selected`);
  };

  const openCamera = async (key: DocumentKey) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "We need camera permission to take a photo.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
    });

    if (!result.canceled) {
      setUploadForKeyFromUri(key, result.assets[0].uri);
    }
  };

  const openImagePicker = async (key: DocumentKey) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "We need gallery permission to choose a photo."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
    });

    if (!result.canceled) {
      setUploadForKeyFromUri(key, result.assets[0].uri);
    }
  };

  const handlePick = async (key: DocumentKey) => {
    if (uploadingKey) return;

    const run = async (action: "camera" | "gallery") => {
      try {
        setUploadingKey(key);
        if (action === "camera") await openCamera(key);
        if (action === "gallery") await openImagePicker(key);
      } catch (e) {
        console.error(e);
        toast.error("Failed to pick file");
      } finally {
        setUploadingKey(null);
      }
    };

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Take Photo", "Choose from Gallery"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) run("camera");
          if (buttonIndex === 2) run("gallery");
        }
      );
    } else {
      Alert.alert("Upload", "Choose an option", [
        { text: "Cancel", style: "cancel" },
        { text: "Take Photo", onPress: () => run("camera") },
        { text: "Choose from Gallery", onPress: () => run("gallery") },
      ]);
    }
  };

  const handleContinue = () => {
    const missing = requiredDocuments.filter(
      (d) => d.required && !(formData as any)[d.key]
    );
    if (missing.length) {
      toast.error(`Please upload: ${missing.map((m) => m.label).join(", ")}`);
      return;
    }

    onNext();
  };

  const UploadTile = ({ doc }: { doc: RequiredDoc }) => {
    const uploaded = (formData as any)[doc.key] as UploadAsset | null;
    const busy = uploadingKey === doc.key;

    // ✅ Same flow as Profile: preview + pencil edit, but NOT round images.
    return (
      <View className="mt-8">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-xl font-onest-medium text-black/90">
              {doc.label}
            </Text>
            {doc.helper ? (
              <Text className="mt-1 font-onest text-sm text-black/50">
                {doc.helper}
              </Text>
            ) : null}
          </View>

          {doc.required ? (
            <Text className="text-xs font-onest-medium text-red-500">
              Required
            </Text>
          ) : null}
        </View>

        <View
          className=" rounded-2xl mt-4 p-5 items-center"
          style={shadowStyle}
        >
          <View className="relative w-full">
            {busy ? (
              <View className="w-full h-44 rounded-2xl bg-gray-100 items-center justify-center">
                <ActivityIndicator size="large" color="#111827" />
              </View>
            ) : uploaded?.uri ? (
              <Image
                source={{ uri: uploaded.uri }}
                style={{ width: "100%", height: 180, borderRadius: 16 }}
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-44 rounded-2xl bg-black/5 items-center justify-center">
                <Ionicons
                  name={(doc.icon ?? "cloud-upload-outline") as any}
                  size={42}
                  color="#9CA3AF"
                />
              </View>
            )}

            <Pressable
              className="absolute bottom-3 right-3 bg-primary rounded-full p-2"
              onPress={() => handlePick(doc.key)}
              disabled={!!uploadingKey}
              style={{
                shadowColor: "#4F46E5",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Ionicons name="pencil" size={16} color="#E5E7EB" />
            </Pressable>
          </View>

          <Text className="mt-4 font-onest text-sm text-black/60 text-center">
            Tap the pencil to upload a photo.
          </Text>

          {uploaded?.uri ? (
            <Text className="mt-1 font-onest text-xs text-green-600">
              Uploaded
            </Text>
          ) : (
            <Text className="mt-1 font-onest text-xs text-black/40">
              No file uploaded yet
            </Text>
          )}
        </View>
      </View>
    );
  };

  const noteText =
    formData.creator_role === "Driver"
      ? "Drivers must provide a selfie, valid ID, and driver's license."
      : formData.creator_role === "Guide"
        ? "Tour guides must provide a selfie, valid ID, and a tour guide certificate/license."
        : "Partners must provide a selfie and valid government-issued ID.";

  return (
    <SafeAreaView className="bg-[#fff] flex-1">
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
              Identity verification
            </Text>

            <Text className="mt-2 font-onest text-sm text-gray-500">
              Upload the documents required for{" "}
              {formData.creator_role_label || "partner"} approval.
            </Text>

            {requiredDocuments.map((doc) => (
              <UploadTile key={doc.key} doc={doc} />
            ))}

            <View className="mt-10 p-4 rounded-2xl " style={shadowStyle}>
              <View className="flex-row items-start">
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color="#3B82F6"
                />
                <Text className="text-sm text-gray-700 font-onest ml-2 flex-1">
                  <Text className="font-onest-semibold">Note:</Text> {noteText}
                </Text>
              </View>
            </View>

            <View className="flex-row mt-6 gap-3">
              <Pressable
                onPress={onBack}
                disabled={!!uploadingKey}
                className="px-6 py-4 rounded-xl flex-1 bg-gray-200"
              >
                <Text className="text-black/70  text-center text-base font-onest-medium">
                  Back
                </Text>
              </Pressable>

              <Pressable
                onPress={handleContinue}
                disabled={!!uploadingKey}
                className="bg-[#191313] py-4 px-8 flex-1 rounded-xl"
              >
                <Text className="text-white/90 text-center text-base font-onest-medium">
                  Continue
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
