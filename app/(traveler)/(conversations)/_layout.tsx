// app/(traveler)/(conversations)/_layout.tsx

import { Stack } from "expo-router";
import React from "react";

export default function ConversationsLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="[id]" />
            <Stack.Screen name="new" />
        </Stack>
    );
}