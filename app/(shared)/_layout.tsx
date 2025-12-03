// app/(shared)/_layout.tsx
import { Stack } from "expo-router";

export default function SharedLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="landingPage" />
            <Stack.Screen name="login" options={{
                headerShown: false,
                animation: "slide_from_left"
            }} />
            <Stack.Screen name="signup" />

            <Stack.Screen name="forgot" />
            <Stack.Screen name="verify-otp" />
            <Stack.Screen name="reset-password" />
        </Stack>
    );
}
