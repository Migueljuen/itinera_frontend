// (traveler)/createItinerary/(generate)/_layout.tsx
import { Stack } from 'expo-router';

export default function GenerateLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="generate" />
            <Stack.Screen
                name="MeetingPointScreen"
                options={{
                    presentation: 'fullScreenModal', // Makes it feel like Grab
                    animation: 'slide_from_bottom',
                }}
            />
        </Stack>
    );
}