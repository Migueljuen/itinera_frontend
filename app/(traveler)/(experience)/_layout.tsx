// (traveler)/(experience)/_layout.tsx
import { Stack } from "expo-router";
import React from "react";
export default function experienceLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: "modal",
        headerShown: false,
      }}
    />
  );
}
