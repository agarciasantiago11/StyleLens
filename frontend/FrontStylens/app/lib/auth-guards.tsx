import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const router = useRouter();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) {
      router.replace("/sign-in");
    }
  }, [_hasHydrated, router, token]);

  if (!_hasHydrated || !token) {
    return null;
  }

  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const router = useRouter();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (token) {
      router.replace("/");
    }
  }, [_hasHydrated, router, token]);

  if (!_hasHydrated || token) {
    return null;
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const router = useRouter();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token || !user) {
      router.replace("/sign-in");
      return;
    }

    if (user.role_priority < 100) {
      router.replace("/");
    }
  }, [_hasHydrated, router, token, user]);

  if (!_hasHydrated || !token || !user || user.role_priority < 100) {
    return null;
  }

  return <>{children}</>;
}
