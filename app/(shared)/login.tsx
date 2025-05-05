import React, { useState } from "react";
import { View, Text, ScrollView, Image, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext"; // Make sure path is correct

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});


  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const result = await login(email, password); // assume result.user.role is available

      if (result.success) {
        if (result.user.role === "Traveler") {
          router.replace("/(traveler)");
        } else if (result.user.role === "Creator") {
          router.replace("/(creator)");
        } else {
          Alert.alert("Login Failed", "Invalid user role.");
        }
      } else {
        Alert.alert("Login Failed", result.error);
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
        <View className="flex justify-center items-start pt-12">
          <Image source={require('../../assets/images/logo.png')} style={{ width: 250, height: 150 }} />
        </View>

        <View className="px-12 gap-4">
          {/* Email input */}
          <View>
            <TextInput
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              className="bg-gray-100 rounded-md p-4 mb-1 text-lg"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text className="text-red-500 text-sm ml-1">{errors.email}</Text>}
          </View>

          {/* Password input */}
          <View>
            <TextInput
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              className="bg-gray-100 rounded-md p-4 text-lg"
              value={password}
              onChangeText={setPassword}
            />
            {errors.password && <Text className="text-red-500 text-sm ml-1">{errors.password}</Text>}
          </View>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isSubmitting}
            className="bg-primary py-4 rounded-md mt-6"
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-center text-lg font-bold">
                Log in
              </Text>
            )}
          </TouchableOpacity>

          <Text className="text-gray-400 text-center text-lg my-1">
            Or
          </Text>

          <TouchableOpacity

            className="bg-white shadow-md shadow-zinc-200 py-4 rounded-md"
          >
            <View className="flex flex-row items-center justify-center">
              <Image source={require('../../assets/images/google.png')} style={{ width: 20, height: 20 }} />
              <Text className="ml-2 text-lg font-medium">
                Continue with Google
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity

            onPress={() => router.replace("/signup")}
            className="flex justify-center items-center"
          >
            <Text className="my-4 font-medium">
              Don't have an account? <Text className="text-blue-400">Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}