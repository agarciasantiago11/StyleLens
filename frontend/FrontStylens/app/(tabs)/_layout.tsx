import { Stack } from 'expo-router';

import { ProtectedRoute } from '@/app/lib/auth-guards';

export default function TabLayout() {
  return (
    <ProtectedRoute>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="capturas" />
        <Stack.Screen name="favoritos" />
        <Stack.Screen name="configuracion" />
        <Stack.Screen name="soporte" />
        <Stack.Screen name="contacto" />
        <Stack.Screen name="acerca" />
      </Stack>
    </ProtectedRoute>
  );
}