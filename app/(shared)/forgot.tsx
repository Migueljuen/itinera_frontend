import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API_URL from '../../constants/api.js';
import { useAuth } from "../../contexts/AuthContext.js";

export default function ForgotPassword() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");

  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleSendOtp = async () => {
    setErrors({});

    if (!email) {
      setErrors({ email: "Email is required" });
      return;
    }
    console.log("Sending OTP to:", email);
    try {
      const res = await axios.post(`${API_URL}/password-reset/request`, {
        email,
      });

      console.log(res.data);

      // Navigate to OTP screen AND pass the email
      router.push({
        pathname: "/verify-otp",
        params: { email }
      });

    } catch (err: any) {
      if (err.response?.status === 404) {
        setErrors({ email: "Email not found" });
      } else {
        console.log(err);
        alert("Something went wrong");
      }
    }
  };

  return (
    <SafeAreaView className="bg-white h-full flex justify-between p-12">
      <ScrollView>
        <View className=" gap-4">
          <TouchableOpacity onPress={() => router.push("/login")} className='flex flex-row items-center gap-4 pb-6'>
            <Ionicons
              name={"arrow-back"}
              size={20}
              color="#9CA3AF"
            />
            <Text>Back</Text>
          </TouchableOpacity>
          <Text className="font-onest-semibold text-3xl">Reset Your Password</Text>
          <Text className="font-onest text-black/60">Enter the email associated with your account and we'll send an OTP to reset your password</Text>

        </View>

        <View className="mt-8 ">
          {/* Email input */}
          <View>
            <View className="flex-row items-center border-[0.5px] border-gray-400 rounded-xl px-4 py-3" style={{ height: 50 }}>
              <TextInput
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                className=" ml-2 flex-1 text-lg"
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


        </View>
      </ScrollView>

      <TouchableOpacity
        onPress={handleSendOtp}
        className="bg-primary py-4 rounded-xl "
      >
        <View className="flex flex-row items-center justify-center">
          <Text className="text-white text-center text-lg font-bold">
            Send OTP
          </Text>
        </View>
      </TouchableOpacity>

    </SafeAreaView>
  );
}