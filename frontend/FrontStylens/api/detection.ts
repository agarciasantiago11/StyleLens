import { Platform } from "react-native";
import axios from "axios";
import apiClient from "./client";

export type BackendBBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type BackendDetectedBox = {
  id: string;
  clase: string;
  confianza: number;
  bbox: BackendBBox;
};

export type DetectarCajasApiResponse = {
  prendas_detectadas?: BackendDetectedBox[];
  total?: number;
  captura_id?: string;
};

export type BackendPrenda = {
  id?: string | number;
  nombre?: string | null;
  categoria?: string | null;
  precio?: number | string | null;
  imagen_url?: string | null;
  imagen?: string | null;
  link?: string | null;
  url?: string | null;
};

export type DetectarApiResponse = {
  captura_id?: string;
  prendas_detectadas?: BackendPrenda[];
  total?: number;
  desde_cache?: boolean;
};

const inferMimeType = (uri: string) => {
  const normalized = uri.toLowerCase();
  if (normalized.endsWith(".png")) return "image/png";
  if (normalized.endsWith(".gif")) return "image/gif";
  if (normalized.endsWith(".webp")) return "image/webp";
  if (normalized.endsWith(".heic")) return "image/heic";
  return "image/jpeg";
};

const inferFileName = (uri: string) => {
  const cleanedUri = uri.split("?")[0];
  const parts = cleanedUri.split("/");
  const lastPart = parts[parts.length - 1];
  if (lastPart && lastPart.includes(".")) return lastPart;
  return "photo.jpg";
};

const buildImageFormData = async (selectedImageUri: string) => {
  const formData = new FormData();

  if (Platform.OS === "web") {
    const response = await fetch(selectedImageUri);
    const blob = await response.blob();
    formData.append("imagen", blob, inferFileName(selectedImageUri));
  } else {
    formData.append("imagen", {
      uri: selectedImageUri,
      name: inferFileName(selectedImageUri),
      type: inferMimeType(selectedImageUri),
    } as any);
  }

  return formData;
};

// Convierte un error de axios en un Error con mensaje legible para el usuario.
// El interceptor de apiClient ya dispara logout() si la respuesta es 401.
const toReadableError = (error: unknown): Error => {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) {
      return new Error(detail);
    }
    if (error.code === "ECONNABORTED") {
      return new Error("REQUEST_TIMEOUT");
    }
    return new Error(error.message || "Error de red");
  }
  if (error instanceof Error) return error;
  return new Error("Error desconocido");
};

export async function detectarCajas(
  selectedImageUri: string,
  timeoutMs: number,
): Promise<DetectarCajasApiResponse> {
  const formData = await buildImageFormData(selectedImageUri);
  try {
    const { data } = await apiClient.post<DetectarCajasApiResponse>(
      "/api/v1/detectar-cajas",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: timeoutMs,
      },
    );
    return data;
  } catch (error) {
    throw toReadableError(error);
  }
}

export async function detectarPrenda(
  selectedImageUri: string,
  box: BackendDetectedBox,
  capturaId: string | null,
  timeoutMs: number,
): Promise<DetectarApiResponse> {
  const formData = await buildImageFormData(selectedImageUri);
  formData.append("clase", box.clase);
  formData.append("x", String(box.bbox.x));
  formData.append("y", String(box.bbox.y));
  formData.append("w", String(box.bbox.w));
  formData.append("h", String(box.bbox.h));
  formData.append("deteccion_id", box.id);
  if (capturaId) {
    formData.append("captura_id", capturaId);
  }

  try {
    const { data } = await apiClient.post<DetectarApiResponse>(
      "/api/v1/detectar-prenda",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: timeoutMs,
      },
    );
    return data;
  } catch (error) {
    throw toReadableError(error);
  }
}
