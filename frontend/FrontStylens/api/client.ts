import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const apiClient = axios.create({
  // RECUERDA: Si pruebas en móvil real, cambia 127.0.0.1 por la IP de tu PC
  baseURL: 'http://127.0.0.1:8000', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para meter el token en todas las peticiones
apiClient.interceptors.request.use(
  async (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar el 401 (Token expirado - Puntos 4 y 7 de la tarea)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Verificamos de forma segura si el error es un 401
    if (error.response?.status === 401) {
      console.warn('Sesión expirada (401). Cerrando sesión...');
      
      // Si el servidor dice que el token no vale, cerramos sesión en Zustand
      useAuthStore.getState().logout();
      
      // Al hacer logout, el token pasa a ser null y el useEffect 
      // de tu _layout.tsx te mandará automáticamente al login.
    }
    return Promise.reject(error);
  }
);

export default apiClient;