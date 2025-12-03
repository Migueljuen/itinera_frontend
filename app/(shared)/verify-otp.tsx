import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API_URL from '../../constants/api.js';

export default function VerifyOtp() {
    const router = useRouter();
    const { email } = useLocalSearchParams();

    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");

    const handleVerify = async () => {
        setError("");

        if (!otp) {
            setError("OTP is required");
            return;
        }

        try {
            const res = await axios.post(`${API_URL}/password-reset/verify`, {
                email,
                otp
            });

            console.log(res.data);

            router.push({
                pathname: "/reset-password",
                params: { email }
            });

        } catch (err: any) {
            if (err.response?.status === 400) {
                setError("Invalid or expired OTP");
            } else {
                alert("Something went wrong");
            }
        }
    };

    return (
        <SafeAreaView className="bg-white h-full p-12">
            <ScrollView>



                <View className='gap-4'>
                    <TouchableOpacity onPress={() => router.back()} className='flex flex-row items-center gap-4 pb-6'>
                        <Ionicons name="arrow-back" size={20} color="#9CA3AF" />
                        <Text>Back</Text>
                    </TouchableOpacity>
                    <Text className="font-onest-semibold text-3xl">Verify OTP</Text>
                    <Text className="font-onest text-black/60">Enter the 6-digit code we sent to {email}</Text>

                </View>
                <View className="mt-8">
                    <View className="border border-gray-400 rounded-xl px-4 py-3">
                        <TextInput
                            placeholder="Enter OTP"
                            keyboardType="numeric"
                            value={otp}
                            onChangeText={setOtp}
                            className="text-lg"
                        />
                    </View>
                    {error ? <Text className="text-red-500 mt-2">{error}</Text> : null}
                </View>

            </ScrollView>

            <TouchableOpacity
                onPress={handleVerify}
                className="bg-primary py-4 rounded-xl mt-6"
            >
                <Text className="text-white text-center text-lg font-bold">Verify</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}
