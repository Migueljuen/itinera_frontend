import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);

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
      const result = await login(email, password);

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
            <View className="flex-row items-center border border-gray-300 rounded-md px-4 py-3" style={{ height: 50 }}>
              <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
              <TextInput
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-3 text-lg"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                multiline={false}
                textAlignVertical="center"
                style={{ height: '100%' }}
              />
            </View>
            {errors.email && <Text className="text-red-500 text-sm ml-1">{errors.email}</Text>}
          </View>

          {/* Password input */}
          <View>
            <View className="flex-row items-center border border-gray-300 rounded-md px-4 py-3" style={{ height: 50 }}>
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
              <TextInput
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                className="flex-1 ml-3 text-lg"
                value={password}
                onChangeText={setPassword}
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
            {errors.password && <Text className="text-red-500 text-sm ml-1">{errors.password}</Text>}
          </View>

          {/* Forgot Password */}
          <TouchableOpacity className="self-end">
            <Text className="text-blue-400 font-medium">
              Forgot Password?
            </Text>
          </TouchableOpacity>

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
            className="bg-white border border-gray-300  shadow-zinc-200 py-4 rounded-md"
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