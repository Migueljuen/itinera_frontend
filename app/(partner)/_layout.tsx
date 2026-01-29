import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Pressable, View } from "react-native";

export default function GuideLayout() {
  const router = useRouter();

  return (
    <Stack>
      <Stack.Screen
        name="(itinerary)"
        options={{
          headerShown: true,
          title: "",
          headerTransparent: true,
          headerTintColor: "#fff",
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <View
                style={{
                  padding: 8,
                  borderRadius: 999,
                  shadowRadius: 4,
                  elevation: 5,
                }}
              >
                <Ionicons name="arrow-back" size={24} color="#1f1f1f" />
              </View>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="(profile)" options={{ headerShown: false }} />
      <Stack.Screen name="(subscription)" options={{ headerShown: false }} />
      <Stack.Screen name="(conversations)" options={{ headerShown: false }} />
      <Stack.Screen name="(vehicles)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}