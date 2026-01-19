// app/(auth)/steps/Step01PartnerInfo.tsx
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useRef, useState } from "react";
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

import type { PartnerOnboardingFormData, UploadAsset } from "../partnerOnboardingForm";

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
  const [errors] = useState<Partial<Record<keyof PartnerOnboardingFormData, string>>>({});

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

  const pickProfileImage = async () => {
    try {
      setIsPicking(true);

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        toast.error("Permission denied. Please allow photo access.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
        aspect: [1, 1],
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset?.uri) return;

      const filename =
        asset.fileName ??
        `profile-${Date.now()}.${asset.uri.split(".").pop() || "jpg"}`;

      const upload: UploadAsset = {
        uri: asset.uri,
        name: filename,
        type: asset.mimeType || "image/jpeg",
      };

      setFormData((prev) => ({ ...prev, profile_pic: upload }));
      toast.success("Profile photo added");
    } catch (e) {
      console.error(e);
      toast.error("Failed to pick image. Please try again.");
    } finally {
      setIsPicking(false);
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, profile_pic: null }));
    toast.success("Profile photo removed");
  };

  const handleContinue = () => {
    // Keep same behavior as your web version (validations commented out)
    onNext();
  };

  return (
    <SafeAreaView className="bg-[#fff] h-full">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 "
      >
        <ScrollView
          className="flex-1 px-10"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="items-center mt-24">
            <Text className="text-3xl font-onest-semibold text-black/90  leading-tight">
              Tell us a little more about yourself and we'll get going.
            </Text>

          </View>


          <View className=" py-12">
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

            {/* PROFILE PHOTO (same boxy style) */}
            <View className="mt-12">
              <Text className="text-xl font-onest-medium text-black/90">
                Profile photo
              </Text>
            </View>

            <Pressable
              onPress={pickProfileImage}
              disabled={isPicking}
              className={`mt-4  rounded-lg overflow-hidden ${isPicking ? "opacity-60" : ""
                }`}
            >
              <View className="px-4 py-4">
                {formData.profile_pic ? (
                  <View className="items-center">
                    <Image
                      source={{ uri: formData.profile_pic.uri }}
                      style={{ width: 120, height: 120, borderRadius: 60 }}
                    />

                    <View className="flex-row gap-3 mt-4">
                      <Pressable
                        onPress={pickProfileImage}
                        className="bg-[#191313] px-4 py-2 rounded-md"
                      >
                        <Text className="text-white/90 font-onest-medium">
                          Change
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={removeImage}
                        className="bg-gray-200 px-4 py-2 rounded-md"
                      >
                        <Text className="text-black/90 font-onest-medium">
                          Remove
                        </Text>
                      </Pressable>
                    </View>

                    <Text className="mt-3 font-onest text-sm text-black/50">
                      Tap “Change” to pick a new photo. Max 5MB.
                    </Text>
                  </View>
                ) : (
                  <View className="items-center">
                    <View className="w-12 h-12 rounded-full bg-black/5 items-center justify-center">
                      <Ionicons name="cloud-upload-outline" size={22} color="#9CA3AF" />
                    </View>
                    <Text className="text-sm text-black/70 mt-3 font-onest-medium">
                      Tap to upload your profile photo
                    </Text>
                    <Text className="text-xs text-black/50 mt-1 font-onest">
                      Max file size: 5MB
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>

            {/* Terms text like your Signup */}
            {/* <Text className="mt-12 font-onest text-sm text-black/90">
              By selecting Continue, I indicate my agreement to Itinera&apos;s{" "}
              <Text className="text-blue-500 underline font-onest-medium">
                Terms of Service
              </Text>
            </Text> */}

            {/* Action buttons (match your main CTA style) */}
            <View className="flex-row justify-between mt-8">
              <Pressable
                onPress={onBack}
                disabled={isPicking}
                className="px-6 py-4 rounded-md bg-gray-200"
              >
                <Text className="text-black/70 text-center text-base font-onest-medium">
                  Back
                </Text>
              </Pressable>

              <Pressable
                onPress={handleContinue}
                disabled={isPicking}
                className="bg-[#191313] py-4 px-8 rounded-md"
              >
                {isPicking ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white/90 text-center text-lg font-bold">
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
