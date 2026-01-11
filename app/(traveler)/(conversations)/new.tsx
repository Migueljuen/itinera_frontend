// app/(traveler)/(conversations)/new.tsx

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { toast } from "sonner-native";

import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API_URL from "../../../constants/api";

interface Experience {
    name: string;
    itineraryTitle: string;
    itineraryId: number;
}

interface Creator {
    id: number;
    firstName: string;
    lastName: string;
    profilePic: string | null;
    experiences: Experience[];
}

const NewConversationScreen = () => {
    const router = useRouter();

    const [creators, setCreators] = useState<Creator[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [startingChat, setStartingChat] = useState<number | null>(null);

    // Fetch creators from user's itineraries
    useEffect(() => {
        const fetchCreators = async () => {
            try {
                const token = await AsyncStorage.getItem("token");
                if (!token) return;

                const response = await axios.get(`${API_URL}/conversations/creators`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.data.success) {
                    setCreators(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching creators:", error);
                toast.error("Failed to load creators");
            } finally {
                setLoading(false);
            }
        };

        fetchCreators();
    }, []);

    const handleStartConversation = async (creator: Creator) => {
        try {
            setStartingChat(creator.id);

            const token = await AsyncStorage.getItem("token");
            if (!token) return;

            // Create or get existing conversation
            const response = await axios.post(
                `${API_URL}/conversations`,
                { participantId: creator.id },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.success) {
                const conversationId = response.data.data.id;

                // Make sure conversationId is valid before navigating
                if (!conversationId) {
                    console.error("No conversation ID returned");
                    toast.error("Failed to start conversation");
                    return;
                }

                // Navigate to the chat - use string for id
                router.replace({
                    pathname: "/(traveler)/(conversations)/[id]",
                    params: {
                        id: String(conversationId), // Ensure it's a string
                        name: `${creator.firstName} ${creator.lastName}`,
                    },
                });
            }
        } catch (error) {
            console.error("Error starting conversation:", error);
            toast.error("Failed to start conversation");
        } finally {
            setStartingChat(null);
        }
    };

    const filteredCreators = creators.filter((creator) => {
        if (!searchQuery) return true;

        const fullName = `${creator.firstName} ${creator.lastName}`.toLowerCase();
        const experienceNames = creator.experiences
            .map((e) => e.name.toLowerCase())
            .join(" ");

        return (
            fullName.includes(searchQuery.toLowerCase()) ||
            experienceNames.includes(searchQuery.toLowerCase())
        );
    });

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#1f2937" />
                <Text className="mt-4 text-gray-600 font-onest">
                    Loading creators...
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text className="flex-1 font-onest-semibold text-lg text-gray-800 ml-2">
                    New Message
                </Text>
            </View>

            {/* Search */}
            <View className="p-4">
                <View className="flex-row items-center bg-white rounded-full px-4 py-3">
                    <Ionicons name="search-outline" size={20} color="#9CA3AF" />
                    <TextInput
                        className="flex-1 ml-3 font-onest text-gray-800"
                        placeholder="Search creators or experiences..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <Pressable onPress={() => setSearchQuery("")}>
                            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                        </Pressable>
                    )}
                </View>
            </View>

            {/* Info Banner */}
            <View className="mx-4 mb-4 bg-indigo-50 rounded-xl p-4 flex-row items-start">
                <Ionicons name="information-circle" size={24} color="#6366F1" />
                <View className="flex-1 ml-3">
                    <Text className="font-onest-medium text-gray-800 text-sm">
                        Message your experience creators
                    </Text>
                    <Text className="font-onest text-gray-500 text-xs mt-1">
                        You can only message creators from experiences in your itineraries.
                    </Text>
                </View>
            </View>

            {/* Creators List */}
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                {filteredCreators.length === 0 ? (
                    <View className="flex-1 items-center justify-center py-20">
                        <Ionicons name="people-outline" size={64} color="#D1D5DB" />
                        <Text className="text-gray-400 font-onest-medium text-lg mt-4">
                            {searchQuery ? "No creators found" : "No creators available"}
                        </Text>
                        <Text className="text-gray-400 font-onest text-sm mt-2 text-center px-8">
                            {searchQuery
                                ? "Try a different search"
                                : "Book an experience to message its creator"}
                        </Text>
                    </View>
                ) : (
                    <View className="px-4">
                        {filteredCreators.map((creator) => (
                            <TouchableOpacity
                                key={creator.id}
                                onPress={() => handleStartConversation(creator)}
                                disabled={startingChat !== null}
                                className="bg-white rounded-2xl p-4 mb-3"
                                style={{
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.06,
                                    shadowRadius: 8,
                                    elevation: 3,
                                }}
                                activeOpacity={0.7}
                            >
                                <View className="flex-row items-start">
                                    {/* Avatar */}
                                    {creator.profilePic ? (
                                        <Image
                                            source={{ uri: `${API_URL}/${creator.profilePic}` }}
                                            className="w-14 h-14 rounded-full"
                                        />
                                    ) : (
                                        <View className="w-14 h-14 rounded-full bg-gray-200 items-center justify-center">
                                            <Text className="text-gray-500 font-onest-semibold text-xl">
                                                {creator.firstName?.[0] || "?"}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Content */}
                                    <View className="flex-1 ml-4">
                                        <View className="flex-row justify-between items-center mb-1">
                                            <Text className="font-onest-semibold text-base text-gray-800">
                                                {creator.firstName} {creator.lastName}
                                            </Text>
                                            {startingChat === creator.id ? (
                                                <ActivityIndicator size="small" color="#6366F1" />
                                            ) : (
                                                <Ionicons
                                                    name="chatbubble-outline"
                                                    size={20}
                                                    color="#6366F1"
                                                />
                                            )}
                                        </View>

                                        {/* Experiences */}
                                        <View className="mt-2">
                                            {creator.experiences.slice(0, 2).map((exp, index) => (
                                                <View
                                                    key={index}
                                                    className="flex-row items-center mt-1"
                                                >
                                                    <Ionicons
                                                        name="compass-outline"
                                                        size={14}
                                                        color="#9CA3AF"
                                                    />
                                                    <Text
                                                        className="font-onest text-xs text-gray-500 ml-1.5 flex-1"
                                                        numberOfLines={1}
                                                    >
                                                        {exp.name}
                                                    </Text>
                                                </View>
                                            ))}
                                            {creator.experiences.length > 2 && (
                                                <Text className="font-onest text-xs text-primary mt-1">
                                                    +{creator.experiences.length - 2} more experiences
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default NewConversationScreen;