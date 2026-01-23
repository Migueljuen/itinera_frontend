import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";

interface SignupFormData {
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string; // NEW
  password: string;
  confirmPassword: string;
  role: string;
}

interface FormErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile_number?: string;
  password?: string;
  confirmPassword?: string;
  [key: string]: string | undefined;
}

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

export default function Signup() {
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState<SignupFormData>({
    first_name: "",
    last_name: "",
    email: "",
    mobile_number: "", // NEW
    password: "",
    confirmPassword: "",
    role: "Traveler",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const firstNameRef = useRef<TextInput | null>(null);
  const lastNameRef = useRef<TextInput | null>(null);
  const emailRef = useRef<TextInput | null>(null);
  const phoneRef = useRef<TextInput | null>(null);
  const passwordRef = useRef<TextInput | null>(null);
  const confirmPasswordRef = useRef<TextInput | null>(null);

  const handleChange = (field: keyof SignupFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validate = () => {
    const newErrors: FormErrors = {};

    if (!formData.first_name.trim()) newErrors.first_name = "First name is required";
    if (!formData.last_name.trim()) newErrors.last_name = "Last name is required";

    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";

    if (!formData.mobile_number.trim()) newErrors.mobile_number = "Phone number is required";
    else {
      const cleaned = formData.mobile_number.replace(/[^\d+]/g, "");
      // basic sanity check (you can adjust)
      if (cleaned.replace(/\D/g, "").length < 10) {
        newErrors.mobile_number = "Phone number is invalid";
      }
    }

    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const { confirmPassword, ...userData } = formData;

      const result = await register(userData);

      if (result.success) {
        Alert.alert("Success", "Account created successfully! Please login.", [
          { text: "OK", onPress: () => router.replace("/login") },
        ]);
      } else {
        Alert.alert("Registration Failed", result.error);
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="bg-[#fff] h-full">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-center text-xl py-8 border-b font-onest-semibold border-gray-200">Let's Get Started</Text>
          <View className="px-10 py-12">
            {/* LEGAL NAME */}
            <View className="">
              <Text className="text-xl font-onest-medium text-black/90">
                Legal name
              </Text>
            </View>

            <View className="mt-4 border border-black/40 rounded-lg overflow-hidden">
              <FocusableField
                label="First name on your ID"
                value={formData.first_name}
                onChangeText={(text) => handleChange("first_name", text)}
                inputRef={firstNameRef}
                error={errors.first_name}
              />

              <FocusableField
                label="Last name on your ID"
                value={formData.last_name}
                onChangeText={(text) => handleChange("last_name", text)}
                inputRef={lastNameRef}
                error={errors.last_name}
                isLast
              />


            </View>
            <Text className="mt-2 font-onest text-sm text-black/50">Ensure this matches the name on your government-issued ID. </Text>

            {/* CONTACT INFO */}
            <View className="mt-12">
              <Text className="text-xl font-onest-medium text-black/90">
                Contact info
              </Text>
            </View>

            <View className="mt-4 border border-black/40 rounded-lg overflow-hidden">
              <FocusableField
                label="Email"
                value={formData.email}
                onChangeText={(text) => handleChange("email", text)}
                inputRef={emailRef}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
              />

              <FocusableField
                label="Phone number"
                value={formData.mobile_number}
                onChangeText={(text) => handleChange("mobile_number", text)}
                inputRef={phoneRef}
                keyboardType="phone-pad"
                autoCapitalize="none"
                error={errors.mobile_number}
                isLast
              />
            </View>
            <Text className="mt-2 font-onest text-sm text-black/50">Trip updates will be emailed to you. </Text>

            {/* SECURITY */}
            <View className="mt-12">
              <Text className="text-xl font-onest-medium text-black/90">
                Set password
              </Text>
            </View>

            <View className="mt-4 border border-black/40 rounded-lg overflow-hidden">
              <FocusableField
                label="Password"
                value={formData.password}
                onChangeText={(text) => handleChange("password", text)}
                inputRef={passwordRef}
                autoCapitalize="none"
                secureTextEntry={!showPassword}
                error={errors.password}
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

              <FocusableField
                label="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={(text) => handleChange("confirmPassword", text)}
                inputRef={confirmPasswordRef}
                autoCapitalize="none"
                secureTextEntry={!showConfirmPassword}
                error={errors.confirmPassword}
                isLast
                rightElement={
                  <Pressable
                    onPress={() => {
                      setShowConfirmPassword((prev) => !prev);
                      confirmPasswordRef.current?.focus();
                    }}
                    className="absolute right-0 bottom-0"
                  >
                    <Ionicons
                      name={
                        showConfirmPassword ? "eye-outline" : "eye-off-outline"
                      }
                      size={20}
                      color="#9CA3AF"
                    />
                  </Pressable>
                }
              />
            </View>

            {/* Password Requirements */}
            {/* <View className="mt-8">
              <Text className="text-sm font-medium text-black/90 mb-2">
                Password Requirements:
              </Text>

              <View className="space-y-1">
                <View className="flex-row items-center">
                  <Ionicons
                    name={
                      formData.password.length >= 6
                        ? "checkmark-circle"
                        : "ellipse-outline"
                    }
                    size={16}
                    color={formData.password.length >= 6 ? "#10B981" : "#9CA3AF"}
                  />
                  <Text
                    className={`text-sm ml-2 ${formData.password.length >= 6
                      ? "text-green-600"
                      : "text-gray-500"
                      }`}
                  >
                    At least 6 characters
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Ionicons
                    name={
                      formData.password &&
                        formData.confirmPassword &&
                        formData.password === formData.confirmPassword
                        ? "checkmark-circle"
                        : "ellipse-outline"
                    }
                    size={16}
                    color={
                      formData.password &&
                        formData.confirmPassword &&
                        formData.password === formData.confirmPassword
                        ? "#10B981"
                        : "#9CA3AF"
                    }
                  />
                  <Text
                    className={`text-sm ml-2 ${formData.password &&
                      formData.confirmPassword &&
                      formData.password === formData.confirmPassword
                      ? "text-green-600"
                      : "text-gray-500"
                      }`}
                  >
                    Passwords match
                  </Text>
                </View>
              </View>
            </View> */}


            <Text className="flex-1 font-onest text-sm text-black/90">
              By selecting Agree and continue, I indicate my agreement to Itinera's{" "}
              <Text
                className="text-blue-500 underline font-onest-medium"
                onPress={() => router.push("/(shared)/Terms")}
              >
                Terms of Service
              </Text>
            </Text>
            {/* Signup Button */}
            <Pressable
              onPress={handleSignup}
              disabled={isSubmitting}
              className="bg-[#191313] py-4 rounded-md mt-8"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white/90 text-center text-lg font-bold">
                  Agree and continue
                </Text>
              )}
            </Pressable>

            {/* <Pressable
              onPress={() => router.replace("/login")}
              className="flex justify-center items-center"
            >
              <Text className="my-4 font-medium">
                Already have an account?{" "}
                <Text className="text-blue-400">Log In</Text>
              </Text>
            </Pressable> */}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
