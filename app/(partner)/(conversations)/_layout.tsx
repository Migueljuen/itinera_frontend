// app/(guide)/(conversations)/_layout.tsx

import { Stack } from "expo-router";
import React from "react";

export default function GuideConversationsLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="[id]" />
        </Stack>
    );
}