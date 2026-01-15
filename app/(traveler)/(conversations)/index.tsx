// app/(traveler)/(conversations)/index.tsx

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";

import {
    ActivityIndicator,
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API_URL from "../../../constants/api";
import socketService from "../../../services/socket";

interface Participant {
    id: number;
    firstName: string;
    lastName: string;
    profilePic: string | null;
}

interface Conversation {
    id: number;
    createdAt: string;
    lastMessage: string | null;
    lastMessageAt: string | null;
    unreadCount: number;
    participants: Participant[];
}

interface Message {
    id: number;
    conversationId: number;
    senderId: number;
    content: string;
    createdAt: string;
}

const ConversationsScreen = () => {
    const router = useRouter();

    const [refreshing, setRefreshing] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    // Refs to track state without causing re-renders
    const conversationsRef = useRef<Conversation[]>([]);
    const currentUserIdRef = useRef<number | null>(null);

    // Keep refs in sync with state
    useEffect(() => {
        conversationsRef.current = conversations;
    }, [conversations]);

    useEffect(() => {
        currentUserIdRef.current = currentUserId;
    }, [currentUserId]);

    // Get current user ID
    useEffect(() => {
        const getUser = async () => {
            const userStr = await AsyncStorage.getItem("user");
            if (userStr) {
                const user = JSON.parse(userStr);
                setCurrentUserId(user.user_id);
            }
        };
        getUser();
    }, []);

    // Fetch conversations from API
    const fetchConversations = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                console.error("No auth token found");
                return;
            }

            const response = await axios.get(`${API_URL}/conversations`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                const convos = response.data.data;
                setConversations(convos);

                // Join all conversation rooms after fetching
                convos.forEach((conv: Conversation) => {
                    socketService.joinConversation(conv.id);
                });
            }
        } catch (error) {
            console.error("Error fetching conversations:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Setup socket connection once
    useEffect(() => {
        const setupSocket = async () => {
            await socketService.connect();
        };
        setupSocket();
    }, []);

    // Handle new messages - defined outside useFocusEffect to be stable
    const handleNewMessage = useCallback((message: Message) => {
        console.log("📩 New message received in conversations list:", message);

        setConversations((prev) => {
            const updated = prev.map((conv) => {
                if (conv.id === message.conversationId) {
                    const isOwnMessage = message.senderId === currentUserIdRef.current;

                    return {
                        ...conv,
                        lastMessage: message.content,
                        lastMessageAt: message.createdAt,
                        unreadCount: isOwnMessage ? conv.unreadCount : conv.unreadCount + 1,
                    };
                }
                return conv;
            });

            // Sort by most recent message
            return updated.sort((a, b) => {
                const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
                const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
                return dateB - dateA;
            });
        });
    }, []);

    // Setup socket listener when screen is focused
    useFocusEffect(
        useCallback(() => {
            console.log("📱 Conversations screen focused");

            // Fetch fresh data
            fetchConversations();

            // Add socket listener
            socketService.onNewMessage(handleNewMessage);

            return () => {
                console.log("📱 Conversations screen unfocused");
                // Remove listener when leaving screen
                socketService.offNewMessage();
            };
        }, [fetchConversations, handleNewMessage])
    );

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchConversations();
        } finally {
            setRefreshing(false);
        }
    };

    const handleConversationPress = async (conversation: Conversation) => {
        const otherUser = conversation.participants[0];

        // Clear unread count locally immediately
        if (conversation.unreadCount > 0) {
            setConversations((prev) =>
                prev.map((conv) =>
                    conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv
                )
            );
        }

        router.push({
            pathname: "/(traveler)/(conversations)/[id]",
            params: {
                id: String(conversation.id),
                name: `${otherUser?.firstName || ""} ${otherUser?.lastName || ""}`.trim(),
            },
        });
    };

    const formatTime = (dateString: string | null) => {
        if (!dateString) return "";

        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "now";
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;

        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    const totalUnread = conversations.reduce(
        (sum, conv) => sum + conv.unreadCount,
        0
    );

    const filteredConversations = conversations.filter((conversation) => {
        if (!searchQuery) return true;

        const otherUser = conversation.participants[0];
        const fullName =
            `${otherUser?.firstName} ${otherUser?.lastName}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase());
    });

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#1f2937" />
                <Text className="mt-4 text-gray-600 font-onest">
                    Loading conversations...
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="py-6 px-4">
                <View className="flex-row justify-between items-center mb-6">
                    <Pressable className="flex flex-row items-baseline" onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#1f1f1f" style={{ marginRight: 6, }} />

                        <View>
                            <Text className="text-3xl font-onest-semibold text-gray-800">
                                Messages
                            </Text>
                            <Text className="text-gray-400 font-onest">
                                {totalUnread > 0
                                    ? `${totalUnread} unread messages`
                                    : "All caught up"}
                            </Text>
                        </View>
                    </Pressable>
                    {totalUnread > 0 && (
                        <View className="bg-indigo-50 rounded-full px-3 py-1">
                            <Text className="text-primary font-onest-semibold text-sm">
                                {totalUnread}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Search Bar */}
                <View className="flex-row items-center bg-white rounded-full px-4 py-3 mb-4">
                    <Ionicons name="search-outline" size={20} color="#9CA3AF" />
                    <TextInput
                        className="flex-1 ml-3 font-onest text-gray-800"
                        placeholder="Search conversations..."
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

            {/* Conversations List */}
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 120 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={["#1f2937"]}
                        tintColor={"#1f2937"}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {filteredConversations.length === 0 ? (
                    <View className="flex-1 items-center justify-center py-20">
                        <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
                        <Text className="text-gray-400 font-onest-medium text-lg mt-4">
                            {searchQuery ? "No conversations found" : "No messages yet"}
                        </Text>
                        <Text className="text-gray-400 font-onest text-sm mt-2">
                            {searchQuery
                                ? "Try a different search"
                                : "Start a conversation with someone"}
                        </Text>
                    </View>
                ) : (
                    <View className="px-4">
                        {filteredConversations.map((conversation) => {
                            const otherUser = conversation.participants[0];
                            const hasUnread = conversation.unreadCount > 0;

                            return (
                                <TouchableOpacity
                                    key={conversation.id}
                                    onPress={() => handleConversationPress(conversation)}
                                    className={`bg-white rounded-2xl p-4 mb-3 ${hasUnread ? "border-l-4 border-primary" : ""
                                        }`}
                                    style={{
                                        shadowColor: "#000",
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.06,
                                        shadowRadius: 8,
                                        elevation: 3,
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <View className="flex-row items-center">
                                        {/* Avatar */}
                                        <View className="relative">
                                            {otherUser?.profilePic ? (
                                                <Image
                                                    source={{
                                                        uri: `${API_URL}/${otherUser.profilePic}`,
                                                    }}
                                                    className="w-14 h-14 rounded-full"
                                                />
                                            ) : (
                                                <View className="w-14 h-14 rounded-full bg-gray-200 items-center justify-center">
                                                    <Text className="text-gray-500 font-onest-semibold text-xl">
                                                        {otherUser?.firstName?.[0] || "?"}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>

                                        {/* Content */}
                                        <View className="flex-1 ml-4">
                                            <View className="flex-row justify-between items-center mb-1">
                                                <Text
                                                    className={`font-onest-semibold text-base ${hasUnread ? "text-gray-800" : "text-gray-600"
                                                        }`}
                                                    numberOfLines={1}
                                                >
                                                    {otherUser?.firstName} {otherUser?.lastName}
                                                </Text>
                                                <Text className="text-xs text-gray-400 font-onest">
                                                    {formatTime(conversation.lastMessageAt)}
                                                </Text>
                                            </View>
                                            <View className="flex-row justify-between items-center">
                                                <Text
                                                    className={`font-onest text-sm flex-1 mr-2 ${hasUnread
                                                        ? "text-gray-700 font-onest-medium"
                                                        : "text-gray-400"
                                                        }`}
                                                    numberOfLines={1}
                                                >
                                                    {conversation.lastMessage || "No messages yet"}
                                                </Text>
                                                {hasUnread && (
                                                    <View className="bg-primary rounded-full min-w-[20px] h-5 px-1.5 items-center justify-center">
                                                        <Text className="text-white font-onest-semibold text-xs">
                                                            {conversation.unreadCount > 9
                                                                ? "9+"
                                                                : conversation.unreadCount}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            {/* New Conversation FAB */}
            <TouchableOpacity
                className="absolute bottom-36 right-6 bg-primary rounded-full p-4 flex-row items-center"
                style={{
                    shadowColor: "#4F46E5",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                }}
                onPress={() => router.push("/(traveler)/(conversations)/new")}
            >
                <Ionicons name="create-outline" size={20} color="#E5E7EB" />
                <Text className="ml-2 text-gray-200 font-onest-medium">New Chat</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

export default ConversationsScreen;