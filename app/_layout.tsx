import { Stack, SplashScreen, useRouter } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import "./global.css";
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { AuthProvider } from '../contexts/AuthContext';
import { RefreshProvider } from "../contexts/RefreshContext";
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => {
      SplashScreen.hideAsync(); // Hide after 2s 
    }, 2000);
  }, []);


  return (

    <AuthProvider>
      <RefreshProvider>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack>
            <Stack.Screen
              name="(landingPage)"
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="(login)"
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="(signup)"
              options={{ headerShown: false, gestureEnabled: false }}
            />
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
                    <View
                      style={{
                        padding: 8,
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        borderRadius: 999,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        elevation: 5,
                      }}
                    >
                      <Ionicons name="arrow-back" size={24} color="#fff" />
                    </View>
                  </Pressable>
                ),
              }}
            />

            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </SafeAreaProvider>
      </RefreshProvider>
    </AuthProvider>
  );
}