import React from 'react';
import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="checkin" options={{ headerShown: false }} />
        <Stack.Screen name="alerts" options={{ headerShown: false }} />
      </Stack>
  );
}
