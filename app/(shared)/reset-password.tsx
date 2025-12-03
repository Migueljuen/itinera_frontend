import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API_URL from "../../constants/api";

export default function ResetPassword() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const email = params.email as string;

    const [newPassword, setNewPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [errors, setErrors] = useState<{ newPassword?: string; confirm?: string }>({});

    const handleReset = async () => {
        setErrors({});

        if (!newPassword) {
            setErrors({ newPassword: "Password required" });
            return;
        }
        if (newPassword.length < 4) {
            setErrors({ newPassword: "Password must be at least 4 characters" });
            return;
        }
        if (newPassword !== confirm) {
            setErrors({ confirm: "Passwords do not match" });
            return;
        }

        try {
            const res = await axios.post(`${API_URL}/password-reset/reset`, {
                email,
                newPassword,
            });

            console.log(res.data);

            alert("Password updated successfully!");

            // After reset → go back to login
            router.replace("/(shared)/login");
        } catch (err) {
            console.log(err);
            alert("Something went wrong");
        }
    };

    return (
        <SafeAreaView className="bg-white h-full p-12 justify-between">
            <ScrollView>
                <View className="gap-4">
                    {/* Back Button */}
                    <TouchableOpacity onPress={() => router.back()} className="flex flex-row items-center gap-4 pb-6">
                        <Ionicons name={"arrow-back"} size={20} color="#9CA3AF" />
                        <Text>Back</Text>
                    </TouchableOpacity>

                    <Text className="font-onest-semibold text-3xl">Create New Password</Text>
                    <Text className="font-onest text-black/60 mb-6">
                        Set a strong password for your Itinera account.
                    </Text>
                </View>

                {/* New Password Input */}
                <View className="mb-4">
                    <View className="border-[0.5px] border-gray-400 rounded-xl px-4 py-3">
                        <TextInput
                            placeholder="New Password"
                            placeholderTextColor="#9CA3AF"
                            secureTextEntry
                            className="text-lg"
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />
                    </View>
                    {errors.newPassword && (
                        <Text className="text-red-500 text-sm ml-1">{errors.newPassword}</Text>
                    )}
                </View>

                {/* Confirm Password Input */}
                <View>
                    <View className="border-[0.5px] border-gray-400 rounded-xl px-4 py-3">
                        <TextInput
                            placeholder="Confirm Password"
                            placeholderTextColor="#9CA3AF"
                            secureTextEntry
                            className="text-lg"
                            value={confirm}
                            onChangeText={setConfirm}
                        />
                    </View>
                    {errors.confirm && (
                        <Text className="text-red-500 text-sm ml-1">{errors.confirm}</Text>
                    )}
                </View>
            </ScrollView>

            {/* Submit Button */}
            <TouchableOpacity
                onPress={handleReset}
                className="bg-primary py-4 rounded-xl"
            >
                <Text className="text-white text-center text-lg font-bold">
                    Reset Password
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}
