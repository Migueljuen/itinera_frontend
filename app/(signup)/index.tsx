import React, { useState } from "react";
import { View, Text, ScrollView, Image, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext"; // Ensure path is correct

interface SignupFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}
// Define the interface for your errors (matching your form fields)
interface FormErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  [key: string]: string | undefined; // Allow for any additional error fields

}

export default function Signup() {
  const router = useRouter();
  const { register } = useAuth();

  // Add this interface above your component


  // Then update your useState like this:
  const [formData, setFormData] = useState<SignupFormData>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Traveler" // Default role
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      <ScrollView>
        <View className="flex justify-center items-start pt-8">
          <Image source={require('../../assets/images/logo.png')} style={{ width: 250, height: 150 }} />
        </View>

        <View className="px-12 gap-3">
          <Text className="text-2xl font-bold mb-2">Create Account</Text>

          {/* First Name */}
          <View>
            <TextInput
              placeholder="First Name"
              placeholderTextColor="#9CA3AF"
              className="bg-gray-100 rounded-md p-4 mb-1 text-lg"
              value={formData.first_name}
              onChangeText={(text) => handleChange("first_name", text)}
            />
            {errors.first_name && <Text className="text-red-500 text-sm ml-1">{errors.first_name}</Text>}
          </View>

          {/* Last Name */}
          <View>
            <TextInput
              placeholder="Last Name"
              placeholderTextColor="#9CA3AF"
              className="bg-gray-100 rounded-md p-4 mb-1 text-lg"
              value={formData.last_name}
              onChangeText={(text) => handleChange("last_name", text)}
            />
            {errors.last_name && <Text className="text-red-500 text-sm ml-1">{errors.last_name}</Text>}
          </View>

          {/* Email */}
          <View>
            <TextInput
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              className="bg-gray-100 rounded-md p-4 mb-1 text-lg"
              value={formData.email}
              onChangeText={(text) => handleChange("email", text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text className="text-red-500 text-sm ml-1">{errors.email}</Text>}
          </View>

          {/* Password */}
          <View>
            <TextInput
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              className="bg-gray-100 rounded-md p-4 mb-1 text-lg"
              value={formData.password}
              onChangeText={(text) => handleChange("password", text)}
              secureTextEntry
            />
            {errors.password && <Text className="text-red-500 text-sm ml-1">{errors.password}</Text>}
          </View>

          {/* Confirm Password */}
          <View>
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor="#9CA3AF"
              className="bg-gray-100 rounded-md p-4 mb-1 text-lg"
              value={formData.confirmPassword}
              onChangeText={(text) => handleChange("confirmPassword", text)}
              secureTextEntry
            />
            {errors.confirmPassword && <Text className="text-red-500 text-sm ml-1">{errors.confirmPassword}</Text>}
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
            onPress={() => router.replace("/(login)")}
            className="flex justify-center items-center"
          >
            <Text className="my-4 font-medium">
              Already have an account? <Text className="text-blue-400">Log In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
