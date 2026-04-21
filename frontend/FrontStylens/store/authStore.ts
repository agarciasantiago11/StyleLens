import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Mejoramos la interfaz User para incluir la prioridad del rol (Punto 5 de la tarea)
interface User {
  id: string;
  email: string;
  nombre_completo: string;
  role_id: number;
  role_priority: number; // Esto es clave para el AdminRoute (>= 100)
}

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  // 2. Añadimos una bandera hidratada para saber si ya cargó de AsyncStorage
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      _hasHydrated: false, // Control de carga inicial

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      logout: () => {
        set({ user: null, token: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Esto asegura que la app espere a leer el disco antes de decidir si hay sesión
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);