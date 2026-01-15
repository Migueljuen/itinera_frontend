import { Stack, useRouter } from "expo-router";

export default function GuideLayout() {
  const router = useRouter();

  return (
    <Stack>

      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}