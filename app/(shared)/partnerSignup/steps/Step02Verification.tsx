// app/(auth)/steps/Step02Verification.tsx
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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

import type {
  CreatorRole,
  PartnerOnboardingFormData,
  UploadAsset,
} from "../partnerOnboardingForm";

type DocumentKey = "id_document" | "license_document";

type RequiredDoc = {
  key: DocumentKey;
  label: string;
  required: boolean;
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

  const requiredDocuments: RequiredDoc[] = useMemo(() => {
    const role: CreatorRole = formData.creator_role;

    if (role === "Driver") {
      return [
        { key: "id_document", label: "Valid ID", required: true },
        { key: "license_document", label: "Driver's License", required: true },
      ];
    }

    // Guide + Creator both require ID only
    return [{ key: "id_document", label: "Valid ID", required: true }];
  }, [formData.creator_role]);

  const pickImage = async (documentKey: DocumentKey) => {
    try {
      setUploadingKey(documentKey);

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        toast.error("Permission denied. Please allow photo access.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // images only
        allowsEditing: false, // keep it “normal”
        quality: 0.9,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset?.uri) return;

      const filename =
        asset.fileName ??
        `${documentKey}-${Date.now()}.${asset.uri.split(".").pop() || "jpg"}`;

      const upload: UploadAsset = {
        uri: asset.uri,
        name: filename,
        type: asset.mimeType || "image/jpeg",
      };

      setFormData((prev) => ({
        ...prev,
        [documentKey]: upload,
      }));

      const docLabel = requiredDocuments.find((d) => d.key === documentKey)?.label;
      toast.success(`${docLabel ?? "Document"} uploaded successfully`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to upload document");
    } finally {
      setUploadingKey(null);
    }
  };

  const removeFile = (documentKey: DocumentKey) => {
    setFormData((prev) => ({ ...prev, [documentKey]: null }));
    const docLabel = requiredDocuments.find((d) => d.key === documentKey)?.label;
    toast.success(`${docLabel ?? "Document"} removed`);
  };

  const handleContinue = () => {
    // If you want to enforce required docs, uncomment:
    // const missing = requiredDocuments.filter((d) => d.required && !formData[d.key]);
    // if (missing.length) {
    //   toast.error(`Please upload: ${missing.map((m) => m.label).join(", ")}`);
    //   return;
    // }

    onNext();
  };

  const DocCard = ({ doc }: { doc: RequiredDoc }) => {
    const uploaded = formData[doc.key] as UploadAsset | null;
    const isUploading = uploadingKey === doc.key;

    return (
      <View className="border border-black/15 rounded-2xl p-4 bg-white">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-base font-onest-semibold text-black/90">
            {doc.label}
          </Text>
          {doc.required && (
            <Text className="text-xs font-onest-medium text-red-500">
              Required
            </Text>
          )}
        </View>

        <Pressable
          onPress={() => pickImage(doc.key)}
          disabled={!!uploadingKey}
          className={[
            "border border-black/40 rounded-lg overflow-hidden",
            uploadingKey ? "opacity-60" : "opacity-100",
          ].join(" ")}
        >
          <View className="px-4 py-4">
            {isUploading ? (
              <View className="items-center py-6">
                <ActivityIndicator />
                <Text className="text-sm text-black/60 mt-2">Uploading...</Text>
              </View>
            ) : uploaded ? (
              <View className="w-full">
                <Image
                  source={{ uri: uploaded.uri }}
                  style={{ width: "100%", height: 180, borderRadius: 12 }}
                  resizeMode="cover"
                />

                <Text className="text-xs text-green-600 mt-3 text-center">
                  Uploaded
                </Text>

                <View className="flex-row gap-3 mt-4 justify-center">
                  <Pressable
                    onPress={() => pickImage(doc.key)}
                    className="bg-[#191313] px-4 py-2 rounded-md"
                  >
                    <Text className="text-white/90 font-onest-medium">
                      Replace
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => removeFile(doc.key)}
                    className="bg-red-500 px-4 py-2 rounded-md"
                  >
                    <Text className="text-white/90 font-onest-medium">
                      Remove
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View className="items-center py-6">
                <View className="w-12 h-12 rounded-full bg-black/5 items-center justify-center">
                  <Ionicons name="cloud-upload-outline" size={22} color="#9CA3AF" />
                </View>
                <Text className="text-sm text-black/70 mt-3 font-onest-medium">
                  Tap to upload
                </Text>
                <Text className="text-xs text-black/50 mt-1 font-onest">
                  Images only (Max 5MB recommended)
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </View>
    );
  };

  const noteText =
    formData.creator_role === "Driver"
      ? "Drivers must provide both a valid ID and driver's license for verification."
      : "Tour guides must provide a valid government-issued ID for verification.";

  return (
    <SafeAreaView className="bg-[#fff] h-full">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >


          <View className="px-10 py-12">
            <Text className="text-3xl font-onest-medium text-black/90">
              Verify your identity
            </Text>
            <Text className="mt-2 font-onest text-sm text-black/50">
              Upload the necessary documents to complete your{" "}
              {formData.creator_role_label || "partner"} verification.
            </Text>

            <View className="mt-6 gap-4">
              {requiredDocuments.map((doc) => (
                <DocCard key={doc.key} doc={doc} />
              ))}
            </View>

            <View className="mt-6 p-4 rounded-lg border border-blue-200 bg-blue-50">
              <Text className="text-sm text-blue-900">
                <Text className="font-onest-semibold">Note:</Text> {noteText}
              </Text>
            </View>

            <View className="flex-row justify-between mt-8">
              <Pressable
                onPress={onBack}
                disabled={!!uploadingKey}
                className="px-6 py-4 rounded-md bg-gray-200"
              >
                <Text className="text-black/70 text-center text-base font-onest-medium">
                  Back
                </Text>
              </Pressable>

              <Pressable
                onPress={handleContinue}
                disabled={!!uploadingKey}
                className="bg-[#191313] py-4 px-8 rounded-md"
              >
                <Text className="text-white/90 text-center text-lg font-bold">
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
