// app/(creator)/_layout.tsx
import { Stack, useRouter, Slot } from "expo-router";
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CreatorLayout() {
    const router = useRouter();

    return (
        <>
            <Stack>
                <Stack.Screen name="(createExperience)" options={{ headerShown: false }} />

                <Stack.Screen
                    name="(tabs)"
                    options={{
                        headerShown: false,
                        title: '(tabs)',
                        headerTintColor: '#333',
                    }}
                />


            </Stack>

        </>
    );
}