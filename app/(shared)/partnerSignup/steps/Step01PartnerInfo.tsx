// app/(auth)/steps/Step01PartnerInfo.tsx
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useRef, useState } from "react";
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
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

import type {
  PartnerOnboardingFormData,
  UploadAsset,
} from "../partnerOnboardingForm";

type Props = {
  formData: PartnerOnboardingFormData;
  setFormData: React.Dispatch<React.SetStateAction<PartnerOnboardingFormData>>;
  onNext: () => void;
  onBack: () => void;
};

type FocusableFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  inputRef: React.RefObject<TextInput | null>;

  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  secureTextEntry?: boolean;
  error?: string;
  isLast?: boolean;
  rightElement?: React.ReactNode;
};

function FocusableField({
  label,
  value,
  onChangeText,
  inputRef,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "words",
  secureTextEntry = false,
  error,
  isLast = false,
  rightElement,
}: FocusableFieldProps) {
  return (
    <View>
      <Pressable
        onPress={() => inputRef.current?.focus()}
        className={`flex flex-col items-start px-4 py-2 ${isLast ? "" : "border-b border-black/40"
          }`}
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
            secureTextEntry={secureTextEntry}
            multiline={false}
          />

          {rightElement ? <View className="ml-2">{rightElement}</View> : null}
        </View>
      </Pressable>

      {error ? (
        <Text className="text-red-500 text-sm ml-1 mt-1">{error}</Text>
      ) : null}
    </View>
  );
}

export default function Step01PartnerInfo({
  formData,
  setFormData,
  onNext,
  onBack,
}: Props) {
  const [isPicking, setIsPicking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // optional errors (you can wire your validations later)
  const [errors] = useState<
    Partial<Record<keyof PartnerOnboardingFormData, string>>
  >({});

  const firstNameRef = useRef<TextInput | null>(null);
  const lastNameRef = useRef<TextInput | null>(null);
  const emailRef = useRef<TextInput | null>(null);
  const phoneRef = useRef<TextInput | null>(null);
  const passwordRef = useRef<TextInput | null>(null);
  const shortDescRef = useRef<TextInput | null>(null);

  const handleChange = <K extends keyof PartnerOnboardingFormData>(
    field: K,
    value: PartnerOnboardingFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ----------------------------
  // ✅ Profile-like photo picker
  // ----------------------------
  const setProfileAssetFromUri = async (imageUri: string) => {
    const ext = imageUri.split(".").pop() || "jpg";
    const upload: UploadAsset = {
      uri: imageUri,
      name: `profile-${Date.now()}.${ext}`,
      type: "image/jpeg",
    };

    setFormData((prev) => ({ ...prev, profile_pic: upload }));
    toast.success("Profile photo updated");
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "We need camera permissions to take a photo.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled) {
      await setProfileAssetFromUri(result.assets[0].uri);
    }
  };

  const openImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "We need gallery permissions to choose a photo."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled) {
      await setProfileAssetFromUri(result.assets[0].uri);
    }
  };

  const removePhoto = () => {
    setFormData((prev) => ({ ...prev, profile_pic: null }));
    toast.success("Profile photo removed");
  };

  const handleEditProfilePicture = async () => {
    if (isPicking) return;

    const hasPhoto = !!formData.profile_pic?.uri;

    const run = async (action: "camera" | "gallery" | "remove") => {
      try {
        setIsPicking(true);
        if (action === "camera") await openCamera();
        if (action === "gallery") await openImagePicker();
        if (action === "remove") removePhoto();
      } catch (e) {
        console.error(e);
        toast.error("Failed to update photo. Please try again.");
      } finally {
        setIsPicking(false);
      }
    };

    if (Platform.OS === "ios") {
      const options = hasPhoto
        ? ["Cancel", "Take Photo", "Choose from Gallery", "Remove Photo"]
        : ["Cancel", "Take Photo", "Choose from Gallery"];

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
          destructiveButtonIndex: hasPhoto ? 3 : undefined,
        },
        (buttonIndex) => {
          // 0 Cancel
          if (buttonIndex === 1) run("camera");
          if (buttonIndex === 2) run("gallery");
          if (hasPhoto && buttonIndex === 3) run("remove");
        }
      );
    } else {
      const buttons: any[] = [
        { text: "Cancel", style: "cancel" },
        { text: "Take Photo", onPress: () => run("camera") },
        { text: "Choose from Gallery", onPress: () => run("gallery") },
      ];

      if (hasPhoto) {
        buttons.push({
          text: "Remove Photo",
          onPress: () => run("remove"),
          style: "destructive",
        });
      }

      Alert.alert("Change Profile Photo", "Choose an option", buttons, {
        cancelable: true,
      });
    }
  };

  const handleContinue = () => {
    onNext();
  };

  // Same shadow style used in your Profile screen
  const shadowStyle = {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  };

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
          <View className="items-center mt-24">
            <Text className="text-3xl font-onest-semibold text-black/90 leading-tight">
              Tell us a little more about yourself and we'll get going.
            </Text>
          </View>

          <View className="py-12">
            {/* LEGAL NAME */}
            <Text className="text-xl font-onest-medium text-black/90">
              Legal name
            </Text>

            <View className="mt-4 border border-black/40 rounded-lg overflow-hidden">
              <FocusableField
                label="First name on your ID"
                value={formData.first_name || ""}
                onChangeText={(t) => handleChange("first_name", t)}
                inputRef={firstNameRef}
                error={errors.first_name}
              />

              <FocusableField
                label="Last name on your ID"
                value={formData.last_name || ""}
                onChangeText={(t) => handleChange("last_name", t)}
                inputRef={lastNameRef}
                error={errors.last_name}
                isLast
              />
            </View>

            <Text className="mt-2 font-onest text-sm text-black/50">
              Ensure this matches the name on your government-issued ID.
            </Text>

            {/* CONTACT INFO */}
            <View className="mt-12">
              <Text className="text-xl font-onest-medium text-black/90">
                Contact info
              </Text>
            </View>

            <View className="mt-4 border border-black/40 rounded-lg overflow-hidden">
              <FocusableField
                label="Email"
                value={formData.email || ""}
                onChangeText={(t) => handleChange("email", t)}
                inputRef={emailRef}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
              />

              <FocusableField
                label="Phone number"
                value={formData.mobile_number || ""}
                onChangeText={(t) => handleChange("mobile_number", t)}
                inputRef={phoneRef}
                keyboardType="phone-pad"
                autoCapitalize="none"
                error={errors.mobile_number as any}
                isLast
              />
            </View>

            <Text className="mt-2 font-onest text-sm text-black/50">
              We’ll email you application updates and receipts.
            </Text>

            {/* SECURITY */}
            <View className="mt-12">
              <Text className="text-xl font-onest-medium text-black/90">
                Set password
              </Text>
            </View>

            <View className="mt-4 border border-black/40 rounded-lg overflow-hidden">
              <FocusableField
                label="Password"
                value={formData.password || ""}
                onChangeText={(t) => handleChange("password", t)}
                inputRef={passwordRef}
                autoCapitalize="none"
                secureTextEntry={!showPassword}
                error={errors.password as any}
                isLast
                rightElement={
                  <Pressable
                    onPress={() => {
                      setShowPassword((prev) => !prev);
                      passwordRef.current?.focus();
                    }}
                    className="absolute right-0 bottom-0"
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#9CA3AF"
                    />
                  </Pressable>
                }
              />
            </View>

            {/* SHORT DESCRIPTION */}
            <View className="mt-12">
              <Text className="text-xl font-onest-medium text-black/90">
                About you
              </Text>
            </View>

            <View className="mt-4 border border-black/40 rounded-lg overflow-hidden">
              <View>
                <Pressable
                  onPress={() => shortDescRef.current?.focus()}
                  className="flex flex-col items-start px-4 py-3"
                >
                  <Text className="text-sm font-onest text-black/50">
                    Short description about yourself
                  </Text>

                  <TextInput
                    ref={shortDescRef}
                    className="w-full text-lg font-onest text-black/90 mt-2"
                    value={formData.short_description || ""}
                    onChangeText={(t) => handleChange("short_description", t)}
                    multiline
                    style={{ minHeight: 80, textAlignVertical: "top" }}
                  />
                </Pressable>
              </View>
            </View>

            {/* ✅ PROFILE PHOTO (now matches your Profile screen UX) */}
            <View className="mt-12">
              <Text className="text-xl font-onest-medium text-black/90">
                Profile photo
              </Text>
              <Text className="mt-2 font-onest text-sm text-black/50">
                This will be shown to travelers. Use a clear face photo.
              </Text>
            </View>

            <View
              className="bg-white rounded-2xl mt-4 p-5 items-center"
              style={shadowStyle}
            >
              <View className="relative">
                {isPicking ? (
                  <View className="w-28 h-28 rounded-full bg-gray-100 items-center justify-center">
                    <ActivityIndicator size="large" color="#111827" />
                  </View>
                ) : formData.profile_pic?.uri ? (
                  <Image
                    source={{ uri: formData.profile_pic.uri }}
                    style={{ width: 112, height: 112, borderRadius: 56 }}
                  />
                ) : (
                  <View className="w-28 h-28 rounded-full bg-gray-200 items-center justify-center">
                    <Ionicons name="person" size={48} color="#9CA3AF" />
                  </View>
                )}

                <Pressable
                  className="absolute bottom-0 right-0 bg-primary rounded-full p-2"
                  onPress={handleEditProfilePicture}
                  disabled={isPicking}
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Ionicons name="pencil" size={16} color="#E5E7EB" />
                </Pressable>
              </View>

              <Text className="mt-4 font-onest text-sm text-black/60 text-center">
                Tap the pencil to take a photo, choose from gallery, or remove.
              </Text>

              {/* {!!formData.profile_pic?.uri && (
                <Pressable
                  onPress={removePhoto}
                  disabled={isPicking}
                  className="mt-4 px-4 py-2 rounded-xl bg-gray-100"
                >
                  <Text className="font-onest-medium text-gray-800">Remove Photo</Text>
                </Pressable>
              )} */}
            </View>

            {/* Action buttons */}
            <View className="flex-row gap-3 mt-6">
              <Pressable
                onPress={onBack}
                disabled={isPicking}
                className="flex-1 px-6 py-4 rounded-xl bg-gray-200"
              >
                <Text className="text-black/70 text-center text-base font-onest-medium">
                  Back
                </Text>
              </Pressable>

              <Pressable
                onPress={handleContinue}
                disabled={isPicking}
                className="bg-[#191313] py-4 px-8 rounded-xl flex-1"
              >
                {isPicking ? (
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
