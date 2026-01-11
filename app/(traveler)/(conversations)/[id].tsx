// app/(traveler)/(conversations)/[id].tsx

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";

import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API_URL from "../../../constants/api";
import socketService from "../../../services/socket";

interface Message {
    id: number;
    conversationId: number;
    senderId: number;
    content: string;
    createdAt: string;
    senderFirstName?: string;
    senderLastName?: string;
}

interface User {
    user_id: number;
    first_name: string;
    last_name: string;
}

const ChatScreen = () => {
    const router = useRouter();
    const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
    const conversationId = parseInt(id);

    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [inputValue, setInputValue] = useState("");
    const [sending, setSending] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [typingUsers, setTypingUsers] = useState<number[]>([]);

    const flatListRef = useRef<FlatList>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Get current user
    useEffect(() => {
        const getUser = async () => {
            const userStr = await AsyncStorage.getItem("user");
            if (userStr) {
                setCurrentUser(JSON.parse(userStr));
            }
        };
        getUser();
    }, []);

    // Mark messages as read
    const markMessagesAsRead = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) return;

            await fetch(`${API_URL}/messages/${conversationId}/read`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
        } catch (error) {
            console.error("Failed to mark messages as read:", error);
        }
    }, [conversationId]);

    // Fetch message history
    const fetchMessages = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) return;

            const response = await fetch(`${API_URL}/messages/${conversationId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (data.success) {
                setMessages(data.data);
                // Mark messages as read after fetching
                markMessagesAsRead();
            }
        } catch (error) {
            console.error("Failed to load messages:", error);
        } finally {
            setLoading(false);
        }
    }, [conversationId, markMessagesAsRead]);

    // Setup socket connection
    useEffect(() => {
        if (!currentUser) return;

        const setup = async () => {
            await socketService.connect();
            socketService.joinConversation(conversationId);

            fetchMessages();

            // Listen for new messages
            socketService.onNewMessage((message: Message) => {
                if (message.conversationId === conversationId) {
                    setMessages((prev) => [...prev, message]);
                    // Mark as read immediately since user is viewing the chat
                    markMessagesAsRead();
                }
            });

            // Listen for typing indicators
            socketService.onUserTyping(({ userId }: { userId: number }) => {
                if (userId !== currentUser.user_id) {
                    setTypingUsers((prev) =>
                        prev.includes(userId) ? prev : [...prev, userId]
                    );
                }
            });

            socketService.onUserStoppedTyping(({ userId }: { userId: number }) => {
                setTypingUsers((prev) => prev.filter((id) => id !== userId));
            });
        };

        setup();

        return () => {
            socketService.offNewMessage();
            socketService.offUserTyping();
            socketService.offUserStoppedTyping();
            socketService.leaveConversation(conversationId);
        };
    }, [conversationId, currentUser, fetchMessages, markMessagesAsRead]);

    const handleSend = () => {
        if (!inputValue.trim() || !currentUser) return;

        setSending(true);

        socketService.sendMessage(
            conversationId,
            currentUser.user_id,
            inputValue.trim(),
            (response: { success: boolean; error?: string }) => {
                setSending(false);
                if (response.success) {
                    setInputValue("");
                    stopTyping();
                } else {
                    console.error("Failed to send message:", response.error);
                }
            }
        );
    };

    const handleInputChange = (text: string) => {
        setInputValue(text);

        if (!currentUser) return;

        socketService.startTyping(conversationId, currentUser.user_id);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            stopTyping();
        }, 1000);
    };

    const stopTyping = () => {
        if (!currentUser) return;
        socketService.stopTyping(conversationId, currentUser.user_id);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isOwnMessage = item.senderId === currentUser?.user_id;

        return (
            <View
                className={`flex-row mb-3 ${isOwnMessage ? "justify-end" : "justify-start"}`}
            >
                <View
                    className={`max-w-[75%] px-4 py-3 ${isOwnMessage
                        ? "bg-primary rounded-2xl rounded-br-md"
                        : "bg-white rounded-2xl rounded-bl-md"
                        }`}
                    style={
                        !isOwnMessage
                            ? {
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.05,
                                shadowRadius: 4,
                                elevation: 2,
                            }
                            : undefined
                    }
                >
                    <Text
                        className={`font-onest text-base ${isOwnMessage ? "text-white" : "text-gray-800"
                            }`}
                    >
                        {item.content}
                    </Text>
                    <Text
                        className={`font-onest text-xs mt-1 ${isOwnMessage ? "text-indigo-200" : "text-gray-400"
                            }`}
                    >
                        {formatTime(item.createdAt)}
                    </Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#1f2937" />
                <Text className="mt-4 text-gray-600 font-onest">
                    Loading messages...
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
            {/* Header */}
            <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>

                <View className="flex-1 ml-3">
                    <Text className="font-onest-semibold text-lg text-gray-800">
                        {name || "Chat"}
                    </Text>
                    {typingUsers.length > 0 && (
                        <Text className="font-onest text-xs text-primary">typing...</Text>
                    )}
                </View>

                <TouchableOpacity className="p-2">
                    <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
                </TouchableOpacity>
            </View>

            {/* Messages */}
            <KeyboardAvoidingView
                className="flex-1 mb-8"
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={[...messages].reverse()}
                    inverted
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() =>
                        flatListRef.current?.scrollToEnd({ animated: true })
                    }
                    ListEmptyComponent={
                        <View className="flex-1 items-center justify-center py-20">
                            <Ionicons name="chatbubble-outline" size={48} color="#D1D5DB" />
                            <Text className="text-gray-400 font-onest-medium mt-4">
                                No messages yet
                            </Text>
                            <Text className="text-gray-400 font-onest text-sm mt-1">
                                Send a message to start the conversation
                            </Text>
                        </View>
                    }
                />

                {/* Input */}
                <View className="flex-row items-end px-4 py-3 bg-white border-t border-gray-100">
                    <View className="flex-1 flex-row items-end bg-gray-100 rounded-3xl px-4 py-3 mr-3">
                        <TextInput
                            className="flex-1 font-onest text-gray-800 max-h-24"
                            placeholder="Aa"
                            placeholderTextColor="#9CA3AF"
                            value={inputValue}
                            onChangeText={handleInputChange}
                            multiline
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={!inputValue.trim() || sending}
                        className={`w-12 h-12 rounded-full items-center justify-center ${inputValue.trim() && !sending ? "bg-primary" : "bg-gray-300"
                            }`}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Ionicons name="send" size={20} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ChatScreen;