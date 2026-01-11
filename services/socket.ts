// services/socket.ts

import API_URL from "@/constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io, Socket } from "socket.io-client";

class SocketService {
    socket: Socket | null = null;
    joinedConversations: Set<number> = new Set();

    async connect(): Promise<void> {
        return new Promise(async (resolve) => {
            if (this.socket?.connected) {
                resolve();
                return;
            }

            const token = await AsyncStorage.getItem("token");

            this.socket = io(API_URL, {
                auth: { token },
                transports: ["websocket"],
            });

            this.socket.on("connect", () => {
                console.log("Connected to socket server:", this.socket?.id);

                // Rejoin all conversations after reconnect
                this.joinedConversations.forEach((convId) => {
                    this.socket?.emit("join_conversation", convId);
                });

                resolve();
            });

            this.socket.on("disconnect", () => {
                console.log("Disconnected from socket server");
            });

            this.socket.on("connect_error", (error) => {
                console.error("Connection error:", error);
            });
        });
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.joinedConversations.clear();
        }
    }

    joinConversation(conversationId: number): void {
        console.log("Joining conversation:", conversationId);
        this.joinedConversations.add(conversationId);
        this.socket?.emit("join_conversation", conversationId);
    }

    leaveConversation(conversationId: number): void {
        console.log("Leaving conversation:", conversationId);
        this.joinedConversations.delete(conversationId);
        this.socket?.emit("leave_conversation", conversationId);
    }

    joinMultipleConversations(conversationIds: number[]): void {
        conversationIds.forEach((id) => this.joinConversation(id));
    }

    leaveAllConversations(): void {
        this.joinedConversations.forEach((convId) => {
            this.socket?.emit("leave_conversation", convId);
        });
        this.joinedConversations.clear();
    }

    sendMessage(
        conversationId: number,
        senderId: number,
        content: string,
        callback?: (response: { success: boolean; error?: string }) => void
    ): void {
        this.socket?.emit(
            "send_message",
            { conversationId, senderId, content },
            callback
        );
    }

    // onNewMessage(callback: (message: any) => void): void {
    //     this.socket?.on("new_message", callback);
    // }
    onNewMessage(callback: (message: any) => void): void {
        this.socket?.on("new_message", callback);
    }
    offNewMessage(): void {
        this.socket?.off("new_message");
    }
    offNewMessage1(callback: (message: any) => void): void {
        this.socket?.off("new_message", callback);
    }
    startTyping(conversationId: number, userId: number): void {
        this.socket?.emit("typing_start", { conversationId, userId });
    }

    stopTyping(conversationId: number, userId: number): void {
        this.socket?.emit("typing_stop", { conversationId, userId });
    }

    onUserTyping(callback: (data: { userId: number }) => void): void {
        this.socket?.on("user_typing", callback);
    }

    offUserTyping(): void {
        this.socket?.off("user_typing");
    }

    onUserStoppedTyping(callback: (data: { userId: number }) => void): void {
        this.socket?.on("user_stopped_typing", callback);
    }

    offUserStoppedTyping(): void {
        this.socket?.off("user_stopped_typing");
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }
}

export default new SocketService();