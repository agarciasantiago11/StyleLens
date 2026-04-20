import { Stack } from 'expo-router';

export default function TabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="preview" />
      <Stack.Screen name="capturas" />
      <Stack.Screen name="favoritos" />
      <Stack.Screen name="configuracion" />
      <Stack.Screen name="soporte" />
      <Stack.Screen name="contacto" />
      <Stack.Screen name="acerca" />
    </Stack>
  );
}