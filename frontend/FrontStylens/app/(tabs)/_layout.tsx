import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '@/store/authStore';

export default function TabLayout() {
  const token = useAuthStore((state) => state.token);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);

  if (!_hasHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!token) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="capturas" />
      <Stack.Screen name="favoritos" />
      <Stack.Screen name="configuracion" />
      <Stack.Screen name="soporte" />
      <Stack.Screen name="contacto" />
      <Stack.Screen name="acerca" />
      <Stack.Screen name="admin-panel" />
    </Stack>
  );
}