import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';

const getApiBaseUrl = (): string => {
  // Variable de entorno tiene prioridad (útil en CI o producción)
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl?.trim()) return envUrl.trim().replace(/\/$/, '');

  // En web usamos localhost directamente
  if (Platform.OS === 'web') return 'http://localhost:8000';

  // En nativo, extraemos el host del tunnel/LAN de Expo para llegar al PC de desarrollo
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as any).expoGoConfig?.debuggerHost ??
    (Constants as any).manifest?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:8000`;
  }

  // Fallback: emulador Android usa 10.0.2.2 para llegar al host
  if (Platform.OS === 'android') return 'http://10.0.2.2:8000';

  return 'http://127.0.0.1:8000';
};

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inyecta el token en todas las peticiones
apiClient.interceptors.request.use(
  async (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Si el servidor responde 401, cierra sesión automáticamente
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export default apiClient;
