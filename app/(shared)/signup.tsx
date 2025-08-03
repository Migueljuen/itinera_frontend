import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";

interface SignupFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}

interface FormErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  [key: string]: string | undefined;
}

export default function Signup() {
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState<SignupFormData>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Traveler"
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (field: keyof SignupFormData, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const validate = () => {
    const newErrors: FormErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
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
        Alert.alert(
          "Success",
          "Account created successfully! Please login.",
          [{ text: "OK", onPress: () => router.replace("/login") }]
        );
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
    <SafeAreaView className="bg-white h-full">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >


          <View className="p-12">
            <Text className="text-3xl font-onest-bold mb-12">Create Account</Text>

            {/* Personal Information Section */}
            <View className="mb-6">
              <View className="flex-row items-center mb-4">
                <Ionicons name="person-outline" size={20} color="#6B7280" />
                <Text className="text-lg font-semibold text-gray-700 ml-2">Personal Information</Text>
              </View>

              <View className="gap-4">
                {/* First Name */}
                <View>
                  <View className="flex-row items-center border border-gray-300 rounded-md px-4 py-3" style={{ height: 50 }}>
                    <TextInput
                      placeholder="First Name"
                      placeholderTextColor="#9CA3AF"
                      className="flex-1 ml-3 text-lg"
                      value={formData.first_name}
                      onChangeText={(text) => handleChange("first_name", text)}
                      multiline={false}
                      textAlignVertical="center"
                      style={{ height: '100%' }}
                    />
                  </View>
                  {errors.first_name && <Text className="text-red-500 text-sm ml-1 mt-1">{errors.first_name}</Text>}
                </View>

                {/* Last Name */}
                <View>
                  <View className="flex-row items-center border border-gray-300 rounded-md px-4 py-3" style={{ height: 50 }}>
                    <TextInput
                      placeholder="Last Name"
                      placeholderTextColor="#9CA3AF"
                      className="flex-1 ml-3 text-lg"
                      value={formData.last_name}
                      onChangeText={(text) => handleChange("last_name", text)}
                      multiline={false}
                      textAlignVertical="center"
                      style={{ height: '100%' }}
                    />
                  </View>
                  {errors.last_name && <Text className="text-red-500 text-sm ml-1 mt-1">{errors.last_name}</Text>}
                </View>
              </View>
            </View>

            {/* Account Details Section */}
            <View className="mb-6">
              <View className="flex-row items-center mb-4">
                <Ionicons name="mail-outline" size={20} color="#6B7280" />
                <Text className="text-lg font-semibold text-gray-700 ml-2">Account Details</Text>
              </View>

              <View className="space-y-3">
                {/* Email */}
                <View>
                  <View className="flex-row items-center border border-gray-300 rounded-md px-4 py-3" style={{ height: 50 }}>
                    <TextInput
                      placeholder="Email"
                      placeholderTextColor="#9CA3AF"
                      className="flex-1 ml-3 text-lg"
                      value={formData.email}
                      onChangeText={(text) => handleChange("email", text)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      multiline={false}
                      textAlignVertical="center"
                      style={{ height: '100%' }}
                    />
                  </View>
                  {errors.email && <Text className="text-red-500 text-sm ml-1 mt-1">{errors.email}</Text>}
                </View>
              </View>
            </View>

            {/* Security Section */}
            <View className="mb-6">
              <View className="flex-row items-center mb-4">
                <Ionicons name="shield-checkmark-outline" size={20} color="#6B7280" />
                <Text className="text-lg font-semibold text-gray-700 ml-2">Security</Text>
              </View>

              <View className="gap-4">
                {/* Password */}
                <View>
                  <View className="flex-row items-center border border-gray-300 rounded-md px-4 py-3" style={{ height: 50 }}>
                    <TextInput
                      placeholder="Password"
                      placeholderTextColor="#9CA3AF"
                      className="flex-1 ml-3 text-lg"
                      value={formData.password}
                      onChangeText={(text) => handleChange("password", text)}
                      secureTextEntry={!showPassword}
                      multiline={false}
                      textAlignVertical="center"
                      style={{ height: '100%' }}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      className="ml-2"
                    >
                      <Ionicons
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && <Text className="text-red-500 text-sm ml-1 mt-1">{errors.password}</Text>}
                </View>

                {/* Confirm Password */}
                <View>
                  <View className="flex-row items-center border border-gray-300 rounded-md px-4 py-3" style={{ height: 50 }}>
                    <TextInput
                      placeholder="Confirm Password"
                      placeholderTextColor="#9CA3AF"
                      className="flex-1 ml-3 text-lg"
                      value={formData.confirmPassword}
                      onChangeText={(text) => handleChange("confirmPassword", text)}
                      secureTextEntry={!showConfirmPassword}
                      multiline={false}
                      textAlignVertical="center"
                      style={{ height: '100%' }}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="ml-2"
                    >
                      <Ionicons
                        name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.confirmPassword && <Text className="text-red-500 text-sm ml-1 mt-1">{errors.confirmPassword}</Text>}
                </View>
              </View>
            </View>

            {/* Password Requirements */}
            <View className=" bg-gray-100 rounded-md p-4 mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</Text>
              <View className="space-y-1">
                <View className="flex-row items-center">
                  <Ionicons
                    name={formData.password.length >= 6 ? "checkmark-circle" : "ellipse-outline"}
                    size={16}
                    color={formData.password.length >= 6 ? "#10B981" : "#9CA3AF"}
                  />
                  <Text className={`text-sm ml-2 ${formData.password.length >= 6 ? 'text-green-600' : 'text-gray-500'}`}>
                    At least 6 characters
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons
                    name={formData.password && formData.confirmPassword && formData.password === formData.confirmPassword ? "checkmark-circle" : "ellipse-outline"}
                    size={16}
                    color={formData.password && formData.confirmPassword && formData.password === formData.confirmPassword ? "#10B981" : "#9CA3AF"}
                  />
                  <Text className={`text-sm ml-2 ${formData.password && formData.confirmPassword && formData.password === formData.confirmPassword ? 'text-green-600' : 'text-gray-500'}`}>
                    Passwords match
                  </Text>
                </View>
              </View>
            </View>

            {/* Signup Button */}
            <TouchableOpacity
              onPress={handleSignup}
              disabled={isSubmitting}
              className="bg-primary py-4 rounded-md mt-4"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-center text-lg font-bold">Sign Up</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.replace("/login")}
              className="flex justify-center items-center"
            >
              <Text className="my-4 font-medium">
                Already have an account? <Text className="text-blue-400">Log In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}