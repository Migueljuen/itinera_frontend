import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { toast } from "sonner-native";

import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
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
        const user = result.user;

        // 🚫 Status gate
        if (user.status !== "Approved" && user.role !== "Traveler") {
          toast.error(
            user.status === "Pending"
              ? "Your account is still pending approval."
              : "Your account has been rejected."
          );
          return;
        }

        toast.success(`Welcome back, ${user.first_name}!`);

        switch (user.role) {
          case "Traveler":
            router.replace("/(traveler)");
            break;

          case "Creator":
            router.replace("/(creator)");
            break;

          case "Guide":
            router.replace("/(guide)");
            break;

          case "Driver":
            router.replace("/(driver)");
            break;

          case "Admin":
            router.replace("/(admin)");
            break;

          default:
            toast.error("Invalid user role.");
        }
      }
      else {
        toast.error(result.error || "Invalid email or password");
      }
    } catch (error) {
      toast.error("Error Occurred - Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="bg-white h-full">
      <ScrollView>
        <View className="flex justify-center items-center mt-12 p-12 gap-4">
          {/* <Image source={require('../../assets/images/logo.png')} style={{ width: 250, height: 150 }} /> */}
          <Text className='font-onest-semibold'>Itinera</Text>
          <Text className='text-3xl'>Let's get you logged in</Text>
          <Text className='text-black/60 text-lg'>We're glad to have you back—let’s get started.</Text>
        </View>

        <View className="px-12 gap-4">
          {/* Email input */}
          <View>
            <View className="flex-row items-center border-[0.5px] border-gray-400 rounded-xl px-4 py-3" style={{ height: 50 }}>
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
            <View className="flex-row items-center border-[0.5px] border-gray-400 rounded-xl px-4 py-3" style={{ height: 50 }}>
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
          <TouchableOpacity className="self-end" onPress={() => router.push("/forgot")}>
            <Text className="text-blue-400 font-medium">
              Forgot Password?
            </Text>
          </TouchableOpacity>

          {/* Login Button */}
          <Pressable
            onPress={handleLogin}
            disabled={isSubmitting}
            className="bg-primary py-4 rounded-xl mt-6"
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-center text-lg font-bold">
                Log in
              </Text>
            )}
          </Pressable>

          {/* <Text className="text-gray-400 text-center text-lg my-1">
            Or
          </Text>

          <TouchableOpacity
            className="bg-white border border-gray-300 shadow-zinc-200 py-4 rounded-xl"
          >
            <View className="flex flex-row items-center justify-center">
              <Image source={require('../../assets/images/google.png')} style={{ width: 20, height: 20 }} />
              <Text className="ml-2 text-lg font-medium">
                Continue with Google
              </Text>
            </View>
          </TouchableOpacity> */}

          <TouchableOpacity
            onPress={() => router.push("/signup")}
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