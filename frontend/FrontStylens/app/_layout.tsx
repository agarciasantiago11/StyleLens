import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useState } from 'react';

import { AppThemeProvider } from '@/contexts/app-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore, AuthState } from '@/store/authStore';
import type { User } from '@/store/authStore';
import apiClient from '@/api/client';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();

  const token = useAuthStore((state: AuthState) => state.token);
  const user = useAuthStore((state: AuthState) => state.user);
  const _hasHydrated = useAuthStore((state: AuthState) => state._hasHydrated);
  const setUser = useAuthStore((state: AuthState) => state.setUser);
  const logout = useAuthStore((state: AuthState) => state.logout);
  const [authLoading, setAuthLoading] = useState(false);

  const isSignInRoute = (segments as string[]).includes('sign-in');

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!token && !isSignInRoute) {
      router.replace('/sign-in' as never);
      return;
    }

    if (token && isSignInRoute) {
      router.replace('/');
      return;
    }

    if (token && !user && !authLoading) {
      setAuthLoading(true);
      apiClient
        .get('/api/v1/auth/me')
        .then((response: { data: User }) => {
          setUser(response.data);
        })
        .catch((error: unknown) => {
          console.warn('No se pudo validar sesión:', error);
          logout();
        })
        .finally(() => {
          setAuthLoading(false);
        });
    }
  }, [_hasHydrated, token, user, isSignInRoute, router, setUser, logout, authLoading]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="sign-in" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}
