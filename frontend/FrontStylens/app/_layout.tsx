import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router'; 
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react'; 
import { Alert } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '../store/authStore'; 

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  // Estado de Zustand
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Si aún no se han cargado los datos del almacenamiento local, esperamos
    if (!hasHydrated) return;

    // Resolvemos el segmento actual de forma segura para TypeScript
    const firstSegment = segments[0] as string | undefined;
    const inAuthGroup = firstSegment === '(auth)';
    const inAdminSection = firstSegment === '(admin)';

    // 1. Si NO hay token y NO estamos en login -> Forzar Login
    if (!token && !inAuthGroup) {
      router.replace('/(auth)/login');
    } 
    
    // 2. Si SI hay token pero estamos en login -> Mandar al Inicio
    else if (token && inAuthGroup) {
      router.replace('/(tabs)');
    }

    // 3. Lógica de Administrador (Punto 5: Priority >= 100)
    else if (token && inAdminSection) {
      const priority = user?.role_priority ?? 0;
      if (priority < 100) {
        Alert.alert("Acceso Restringido", "No tienes permisos de administrador.");
        router.replace('/(tabs)');
      }
    }
  }, [token, segments, hasHydrated, user]);

  // Mientras se cargan los datos persistidos (AsyncStorage), no renderizamos nada
  if (!hasHydrated) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Definición de las rutas de navegación */}
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ title: 'Panel Admin', headerShown: true }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}