// app/(shared)/_layout.tsx
import { Stack } from "expo-router";

export default function SharedLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="landingPage" />
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" />

            <Stack.Screen name="forgot" />
            <Stack.Screen name="verify-otp" />
            <Stack.Screen name="reset-password" />
        </Stack>
    );
}
