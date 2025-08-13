import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../contexts/AuthContext";
import { RefreshProvider } from "../contexts/RefreshContext";
import "./global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  const [fontsLoaded] = useFonts({
    "Onest-Medium": require("../assets/fonts/Onest-Medium.ttf"),
    "Onest-ExtraBold": require("../assets/fonts/Onest-ExtraBold.ttf"),
    "Onest-Bold": require("../assets/fonts/Onest-Bold.ttf"),
    "Onest-SemiBold": require("../assets/fonts/Onest-SemiBold.ttf"),
    "Onest-Regular": require("../assets/fonts/Onest-Regular.ttf"),
    "Onest-Light": require("../assets/fonts/Onest-Light.ttf"),
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Simulate any other async setup tasks here
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn("Error during app initialization:", e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady, fontsLoaded]);

  if (!appIsReady || !fontsLoaded) {
    return null; // Keep splash screen until everything is ready
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <RefreshProvider>
          <SafeAreaProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }} />
          </SafeAreaProvider>
        </RefreshProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
