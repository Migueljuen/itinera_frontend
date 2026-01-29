// app/(partner)/(subscription)/_layout.tsx
import { Stack } from 'expo-router';

export default function SubscriptionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="subscription" />
      <Stack.Screen name="plans" />
      <Stack.Screen name="payment" />
    </Stack>
  );
}