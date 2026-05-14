import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import apiClient from "./client";

type SendSupportReportParams = {
  issueType: string;
  title: string;
  description: string;
  evidences: ImagePicker.ImagePickerAsset[];
};

const inferMimeType = (uri: string) => {
  const normalized = uri.toLowerCase();
  if (normalized.endsWith(".png")) return "image/png";
  if (normalized.endsWith(".gif")) return "image/gif";
  if (normalized.endsWith(".webp")) return "image/webp";
  if (normalized.endsWith(".heic")) return "image/heic";
  return "image/jpeg";
};

const inferFileName = (uri: string, fallbackIndex: number) => {
  const cleanedUri = uri.split("?")[0];
  const parts = cleanedUri.split("/");
  const lastPart = parts[parts.length - 1];
  if (lastPart && lastPart.includes(".")) return lastPart;
  return `evidencia-${fallbackIndex + 1}.jpg`;
};

const appendEvidence = async (
  formData: FormData,
  asset: ImagePicker.ImagePickerAsset,
  index: number,
) => {
  if (Platform.OS === "web") {
    const webFile = (asset as any).file as File | undefined;
    if (webFile) {
      formData.append("evidencias", webFile);
      return;
    }

    const response = await fetch(asset.uri);
    const blob = await response.blob();
    formData.append("evidencias", blob, asset.fileName ?? inferFileName(asset.uri, index));
    return;
  }

  formData.append("evidencias", {
    uri: asset.uri,
    name: asset.fileName ?? inferFileName(asset.uri, index),
    type: asset.mimeType ?? inferMimeType(asset.uri),
  } as any);
};

export const sendSupportReport = async ({
  issueType,
  title,
  description,
  evidences,
}: SendSupportReportParams): Promise<void> => {
  const formData = new FormData();
  formData.append("issue_type", issueType);
  formData.append("title", title);
  formData.append("description", description);

  for (let i = 0; i < evidences.length; i += 1) {
    await appendEvidence(formData, evidences[i], i);
  }

  await apiClient.post("/api/v1/soporte/reporte", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 30000,
  });
};
