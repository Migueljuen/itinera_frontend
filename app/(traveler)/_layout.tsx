import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from "expo-router";
import { Pressable, View } from 'react-native';

export default function TravelerLayout() {
    const router = useRouter();

    return (
        <Stack>
            <Stack.Screen name="(profile)" options={{ headerShown: false }} />
            <Stack.Screen
                name="(experience)"
                options={{
                    headerShown: true,
                    title: '',
                    headerTransparent: true,
                    headerTintColor: '#fff',
                    headerLeft: () => (
                        <Pressable onPress={() => router.back()}>
                            <View style={{
                                padding: 8,
                                backgroundColor: 'rgba(0,0,0,0.3)',
                                borderRadius: 999,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.3,
                                shadowRadius: 4,
                                elevation: 5,
                            }}>
                                <Ionicons name="arrow-back" size={24} color="#fff" />
                            </View>
                        </Pressable>
                    ),
                }}
            />

            <Stack.Screen
                name="(itinerary)"
                options={{
                    headerShown: true,
                    title: '',
                    headerTransparent: true,
                    headerTintColor: '#fff',
                    headerLeft: () => (
                        <Pressable onPress={() => router.back()}>
                            <View style={{
                                padding: 8,
                                borderRadius: 999,
                                shadowRadius: 4,
                                elevation: 5,
                            }}>
                                <Ionicons name="arrow-back" size={24} color="#1f1f1f" />
                            </View>
                        </Pressable>
                    ),
                }}
            />
            <Stack.Screen name="(createItinerary)" options={{ headerShown: false }} />
            <Stack.Screen name="(notification)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
    );
}
