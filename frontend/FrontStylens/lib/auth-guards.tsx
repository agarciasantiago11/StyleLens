import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuthStore, type AuthState } from "@/store/authStore";

function AuthLoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state: AuthState) => state.token);
  const _hasHydrated = useAuthStore((state: AuthState) => state._hasHydrated);

  if (!_hasHydrated || !token) {
    if (!_hasHydrated) return <AuthLoadingScreen />;
    return <Redirect href="/sign-in" />;
  }

  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state: AuthState) => state.token);
  const _hasHydrated = useAuthStore((state: AuthState) => state._hasHydrated);

  if (!_hasHydrated || token) {
    if (!_hasHydrated) return <AuthLoadingScreen />;
    return <Redirect href="/" />;
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state: AuthState) => state.token);
  const user = useAuthStore((state: AuthState) => state.user);
  const _hasHydrated = useAuthStore((state: AuthState) => state._hasHydrated);

  if (!_hasHydrated) {
    return <AuthLoadingScreen />;
  }

  if (!token || !user) {
    return <Redirect href="/sign-in" />;
  }

  if (user.role_priority < 50) {
    return <Redirect href="/" />;
  }

  return <>{children}</>;
}
