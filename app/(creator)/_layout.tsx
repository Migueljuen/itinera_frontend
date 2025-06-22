// app/(creator)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from "expo-router";
import { Pressable, View } from 'react-native';

export default function CreatorLayout() {
    const router = useRouter();

    return (
        <>
            <Stack>
                <Stack.Screen name="(createExperience)" options={{ headerShown: false }} />
                <Stack.Screen name="(updateExperience)" options={{ headerShown: false }} />
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