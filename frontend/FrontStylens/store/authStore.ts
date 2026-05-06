import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const noopStorage: StateStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

// AsyncStorage on native and browser; noopStorage during web SSR (no window)
const getStorage = (): StateStorage => {
  if (Platform.OS !== 'web') return AsyncStorage;
  if (typeof window === 'undefined') return noopStorage;
  return AsyncStorage;
};

export interface User {
  id: string;
  email: string;
  nombre_completo: string;
  role_id: number;
  role_priority: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      _hasHydrated: false,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      logout: () => {
        set({ user: null, token: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(getStorage),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('Error rehidratando auth-storage:', error);
        }
        state?.setHasHydrated(true);
      },
    }
  )
);