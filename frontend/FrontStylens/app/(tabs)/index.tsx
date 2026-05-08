import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Platform,
  Image,
  Linking,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import Sidebar from "./Sidebar";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import * as ExpoLinking from "expo-linking";
import { useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TipsBottomSheet, { TipsBottomSheetRef } from "./TipsBottomSheet";
import { useAppTheme } from "@/contexts/app-theme";
import apiClient from "@/api/client";
import { useAuthStore } from "@/store/authStore";

const FORMATS = ["JPG", "PNG", "GIF", "WEBP", "HEIC"];
const HIDE_TIPS_KEY = "stylelens.hide-recommendations";
const REQUEST_TIMEOUT_MS = 120000;
const DEFAULT_TIMEOUT_MESSAGE =
  "Ups... algo salio mal, pruebe de nuevo en unos minutos.";

type ScreenState = "home" | "preview" | "select" | "loading" | "results" | "error";

type BackendPrenda = {
  id?: string | number;
  nombre?: string | null;
  categoria?: string | null;
  precio?: number | string | null;
  imagen_url?: string | null;
  imagen?: string | null;
  link?: string | null;
  url?: string | null;
};

type DetectarApiResponse = {
  prendas_detectadas?: BackendPrenda[];
  total?: number;
  desde_cache?: boolean;
};

type BackendBBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type BackendDetectedBox = {
  id: number;
  clase: string;
  confianza: number;
  bbox: BackendBBox;
};

type DetectarCajasApiResponse = {
  prendas_detectadas?: BackendDetectedBox[];
  total?: number;
};

type Product = {
  id: string | number;
  image: string;
  name: string;
  price: string;
  link: string;
  category: string;
};

type BackendErrorPayload = {
  detail?: unknown;
};

type FavoritoApi = {
  prenda_id?: string | number | null;
};

type SelectableBox = {
  id: number;
  clase: string;
  confianza: number;
  bbox: BackendBBox;
};

const getConfiguredApiBaseUrl = () => {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (configured && configured.trim().length > 0) {
    return configured.trim().replace(/\/$/, "");
  }

  return null;
};

const extractHost = (value: string | null | undefined) => {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const withoutProtocol = trimmed.replace(/^https?:\/\//, "");
  const hostPort = withoutProtocol.split("/")[0];
  const host = hostPort.split(":")[0];
  return host || null;
};

const getExpoHostApiBaseUrl = () => {
  const hostCandidates = [
    Constants.expoConfig?.hostUri,
    (Constants as any).expoGoConfig?.debuggerHost,
    (Constants as any).manifest?.debuggerHost,
    ExpoLinking.createURL("/"),
  ];

  const host = hostCandidates.map(extractHost).find((item) => Boolean(item));
  if (!host) return null;
  return `http://${host}:8000`;
};

const getApiBaseCandidates = () => {
  const candidates = [
    getConfiguredApiBaseUrl(),
    getExpoHostApiBaseUrl(),
    Platform.select({
      android: "http://10.0.2.2:8000",
      default: "http://localhost:8000",
    }) as string,
  ].filter((item): item is string => Boolean(item));

  return [...new Set(candidates)];
};

const toErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Error desconocido";
};

const getApiErrorDetail = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return null;

  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  return null;
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

const detectarCajasConBackend = async (selectedImageUri: string) => {
  const apiBaseCandidates = getApiBaseCandidates();
  const errors: string[] = [];

  for (const apiBase of apiBaseCandidates) {
    try {
      const formData = await buildImageFormData(selectedImageUri);
      const response = await fetch(`${apiBase}/api/v1/detectar-cajas`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let detail = `HTTP ${response.status}`;
        try {
          const body = await response.json();
          detail = getApiErrorDetail(body) ?? detail;
        } catch {
          const textBody = await response.text();
          if (textBody) detail = textBody;
        }

        errors.push(`[${apiBase}] ${detail}`);
        continue;
      }

      const data: DetectarCajasApiResponse = await response.json();
      return data;
    } catch (error) {
      errors.push(`[${apiBase}] ${toErrorMessage(error)}`);
    }
  }

  throw new Error(errors.join(" | "));
};

const detectarPrendaSeleccionadaConBackend = async (
  selectedImageUri: string,
  box: SelectableBox
) => {
  const apiBaseCandidates = getApiBaseCandidates();
  const errors: string[] = [];

  for (const apiBase of apiBaseCandidates) {
    try {
      const formData = await buildImageFormData(selectedImageUri);
      formData.append("clase", box.clase);
      formData.append("x", String(box.bbox.x));
      formData.append("y", String(box.bbox.y));
      formData.append("w", String(box.bbox.w));
      formData.append("h", String(box.bbox.h));

      const response = await fetch(`${apiBase}/api/v1/detectar-prenda`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let detail = `HTTP ${response.status}`;
        try {
          const body = await response.json();
          detail = getApiErrorDetail(body) ?? detail;
        } catch {
          const textBody = await response.text();
          if (textBody) detail = textBody;
        }

        errors.push(`[${apiBase}] ${detail}`);
        continue;
      }

      const data: DetectarApiResponse = await response.json();
      return data;
    } catch (error) {
      errors.push(`[${apiBase}] ${toErrorMessage(error)}`);
    }
  }

  throw new Error(errors.join(" | "));
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

const formatPrice = (value: number | string | null | undefined) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value.toFixed(2)} EUR`;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const numeric = Number(value.replace(",", "."));
    if (Number.isFinite(numeric)) {
      return `${numeric.toFixed(2)} EUR`;
    }
    return value;
  }

  return "Precio no disponible";
};

const mapBackendProducts = (items: BackendPrenda[] = []): Product[] => {
  return items.map((item, index) => ({
    id: item.id ?? index + 1,
    image: item.imagen_url ?? item.imagen ?? "",
    name: item.nombre?.trim() || "Producto sin nombre",
    price: formatPrice(item.precio),
    link: item.link ?? item.url ?? "",
    category: item.categoria?.trim() || "Sin clasificar",
  }));
};

export default function StylensScreen() {
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && viewportWidth >= 1024;
  const isAndroid = Platform.OS === "android";

  const selectImageHeight = isDesktopWeb
    ? Math.min(740, Math.round(viewportHeight * 0.72))
    : isAndroid
      ? Math.round(viewportHeight * 0.8)
      : Math.round(viewportHeight * 0.68);

  const selectCardWidth = isDesktopWeb
    ? Math.min(980, Math.round(viewportWidth * 0.78))
    : Math.max(300, Math.round(viewportWidth * 0.92));

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [screenState, setScreenState] = useState<ScreenState>("home");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [detectedBoxes, setDetectedBoxes] = useState<SelectableBox[]>([]);
  const [selectedBoxId, setSelectedBoxId] = useState<number | null>(null);
  const [previewLayout, setPreviewLayout] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 1, height: 1 });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hideTips, setHideTips] = useState(false);
  const [favoritePendingIds, setFavoritePendingIds] = useState<string[]>([]);
  const { theme } = useAppTheme();
  const token = useAuthStore((state) => state.token);
  const scaleCamera = useRef(new Animated.Value(1)).current;
  const scaleGallery = useRef(new Animated.Value(1)).current;
  const tipsSheetRef = useRef<TipsBottomSheetRef>(null);
  const pendingAction = useRef<"camera" | "gallery" | null>(null);
  const requestTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(HIDE_TIPS_KEY)
      .then((value) => setHideTips(value === "true"))
      .catch(() => setHideTips(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(HIDE_TIPS_KEY)
        .then((value) => setHideTips(value === "true"))
        .catch(() => setHideTips(false));
    }, [])
  );

  const loadFavoriteIds = useCallback(async () => {
    if (!token) {
      setFavorites([]);
      return;
    }

    try {
      const { data } = await apiClient.get<FavoritoApi[]>("/api/v1/favoritos");
      const ids = (data ?? [])
        .map((item) => (item.prenda_id == null ? "" : String(item.prenda_id).trim()))
        .filter((id): id is string => id.length > 0);

      setFavorites(Array.from(new Set(ids)));
    } catch {
      // Evitamos alertas intrusivas en carga de estado visual.
    }
  }, [token]);

  useEffect(() => {
    void loadFavoriteIds();
  }, [loadFavoriteIds]);

  useFocusEffect(
    useCallback(() => {
      void loadFavoriteIds();
    }, [loadFavoriteIds])
  );

  useEffect(() => {
    return () => {
      if (requestTimeout.current) {
        clearTimeout(requestTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedImage) {
      setImageSize({ width: 1, height: 1 });
      return;
    }

    Image.getSize(
      selectedImage,
      (width, height) => {
        if (width > 0 && height > 0) {
          setImageSize({ width, height });
        }
      },
      () => {
        setImageSize({ width: 1, height: 1 });
      }
    );
  }, [selectedImage]);

  const animateIn = (anim: Animated.Value) => {
    Animated.spring(anim, { toValue: 1.07, useNativeDriver: true }).start();
  };

  const animateOut = (anim: Animated.Value) => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleTakePhoto = () => {
    pendingAction.current = "camera";
    if (hideTips) {
      handleContinueFromTips();
      return;
    }
    tipsSheetRef.current?.open();
  };

  const handleUploadFromGallery = () => {
    pendingAction.current = "gallery";
    if (hideTips) {
      handleContinueFromTips();
      return;
    }
    tipsSheetRef.current?.open();
  };

  const handleContinueFromTips = async (dontShowAgain = false) => {
    if (dontShowAgain) {
      setHideTips(true);
      await AsyncStorage.setItem(HIDE_TIPS_KEY, "true");
    }

    if (pendingAction.current === "camera") {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return;
      const result = await ImagePicker.launchCameraAsync({ quality: 1 });
      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
        setScreenState("preview");
      }
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 1,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });
      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
        setScreenState("preview");
      }
    }

    pendingAction.current = null;
  };

  const clearImage = () => {
    setSelectedImage(null);
    setProducts([]);
    setDetectedBoxes([]);
    setSelectedBoxId(null);
    setPreviewLayout({ width: 0, height: 0 });
    setErrorMessage(null);
    setScreenState("home");
    if (requestTimeout.current) {
      clearTimeout(requestTimeout.current);
      requestTimeout.current = null;
    }
  };

  const handleContinue = async () => {
    if (!selectedImage) {
      setErrorMessage("No se encontro ninguna imagen para analizar.");
      setScreenState("error");
      return;
    }

    setErrorMessage(null);
    setScreenState("loading");

    try {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error("REQUEST_TIMEOUT"));
        }, REQUEST_TIMEOUT_MS);
      });

      requestTimeout.current = timeoutId;

      const data = await Promise.race([
        detectarCajasConBackend(selectedImage),
        timeoutPromise,
      ]);

      const boxes = data.prendas_detectadas ?? [];
      if (boxes.length === 0) {
        setErrorMessage("No se detectaron prendas en la imagen. Prueba con otra foto.");
        setScreenState("error");
        return;
      }

      setDetectedBoxes(boxes);
      setSelectedBoxId(null);
      setScreenState("select");
    } catch (error) {
      const reason = toErrorMessage(error);
      const timeoutTriggered = reason.includes("REQUEST_TIMEOUT");

      setScreenState("error");
      setErrorMessage(
        timeoutTriggered
          ? DEFAULT_TIMEOUT_MESSAGE
          : `No se pudo completar la deteccion. ${reason}`
      );
    } finally {
      if (requestTimeout.current) {
        clearTimeout(requestTimeout.current);
        requestTimeout.current = null;
      }
    }
  };

  const handleDetectSelectedGarment = async (box: SelectableBox) => {
    if (!selectedImage) {
      setErrorMessage("No se encontro ninguna imagen para analizar.");
      setScreenState("error");
      return;
    }

    setSelectedBoxId(box.id);
    setErrorMessage(null);
    setScreenState("loading");

    try {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error("REQUEST_TIMEOUT"));
        }, REQUEST_TIMEOUT_MS);
      });

      requestTimeout.current = timeoutId;

      const data = await Promise.race([
        detectarPrendaSeleccionadaConBackend(selectedImage, box),
        timeoutPromise,
      ]);

      const mappedProducts = mapBackendProducts(data.prendas_detectadas ?? []);
      setProducts(mappedProducts);
      setScreenState("results");
    } catch (error) {
      const reason = toErrorMessage(error);
      const timeoutTriggered = reason.includes("REQUEST_TIMEOUT");

      setScreenState("error");
      setErrorMessage(
        timeoutTriggered
          ? DEFAULT_TIMEOUT_MESSAGE
          : `No se pudo completar la deteccion. ${reason}`
      );
    } finally {
      if (requestTimeout.current) {
        clearTimeout(requestTimeout.current);
        requestTimeout.current = null;
      }
    }
  };

  const handleToggleFavorite = async (product: Product, isFavorite: boolean) => {
    if (!token) {
      Alert.alert("Inicia sesión", "Debes iniciar sesión para guardar favoritos.");
      return;
    }

    const productId = typeof product.id === "string" ? product.id.trim() : "";

    if (!productId) {
      Alert.alert(
        "No se pudo guardar",
        "Esta prenda no tiene un identificador válido para guardarse en favoritos."
      );
      return;
    }

    if (favoritePendingIds.includes(productId)) {
      return;
    }

    setFavoritePendingIds((prev) => [...prev, productId]);

    try {
      if (isFavorite) {
        await apiClient.delete(`/api/v1/favoritos/${productId}`);
        setFavorites((prev) => prev.filter((id) => id !== productId));
      } else {
        await apiClient.post(`/api/v1/favoritos/${productId}`);
        setFavorites((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
      }
    } catch (error) {
      const detail = getApiErrorDetail((error as { response?: { data?: BackendErrorPayload } })?.response?.data);
      Alert.alert("No se pudo actualizar favoritos", detail ?? toErrorMessage(error));
    } finally {
      setFavoritePendingIds((prev) => prev.filter((id) => id !== productId));
    }
  };

  const handleBackToSelect = () => {
    setProducts([]);
    setScreenState("select");
  };

  const handleOpenProduct = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert("Enlace no válido", "No se puede abrir este enlace.");
      return;
    }
    await Linking.openURL(url);
  };

  const getRenderedImageFrame = () => {
    const containerWidth = previewLayout.width;
    const containerHeight = previewLayout.height;
    const imageWidth = imageSize.width;
    const imageHeight = imageSize.height;

    if (containerWidth <= 0 || containerHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) {
      return null;
    }

    const scale = Math.min(containerWidth / imageWidth, containerHeight / imageHeight);
    const renderedWidth = imageWidth * scale;
    const renderedHeight = imageHeight * scale;
    const offsetX = (containerWidth - renderedWidth) / 2;
    const offsetY = (containerHeight - renderedHeight) / 2;

    return { offsetX, offsetY, renderedWidth, renderedHeight };
  };

  const getBoxStyle = (box: SelectableBox) => {
    const frame = getRenderedImageFrame();
    if (!frame) return null;

    return {
      left: frame.offsetX + box.bbox.x * frame.renderedWidth,
      top: frame.offsetY + box.bbox.y * frame.renderedHeight,
      width: box.bbox.w * frame.renderedWidth,
      height: box.bbox.h * frame.renderedHeight,
    };
  };

  const renderProductCard = (product: Product, useMobileCard = false) => {
    const productId = String(product.id);
    const isFavorite = favorites.includes(productId);
    const isFavoritePending = favoritePendingIds.includes(productId);

    return (
      <TouchableOpacity
        key={product.id}
        style={[
          styles.productCard,
          isDesktopWeb && styles.productCardDesktop,
          useMobileCard && styles.productCardMobile,
          { backgroundColor: theme.surface },
        ]}
        activeOpacity={0.88}
        onPress={() => {
          if (!product.link) {
            Alert.alert("Sin enlace", "Este resultado no incluye una URL valida.");
            return;
          }
          void handleOpenProduct(product.link);
        }}
      >
        <View
          style={[
            styles.productImageWrap,
            isDesktopWeb && styles.productImageWrapDesktop,
            useMobileCard && styles.productImageWrapMobile,
          ]}
        >
          {product.image ? (
            <Image
              source={{ uri: product.image }}
              style={[styles.productImage, isDesktopWeb && styles.productImageDesktop]}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.productImage, styles.productImageFallback]}>
              <Ionicons name="image-outline" size={34} color={theme.textMuted} />
              <Text style={[styles.productImageFallbackText, { color: theme.textMuted }]}>Sin imagen</Text>
            </View>
          )}
          {!isDesktopWeb && (
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.45)"]}
              style={styles.productImageOverlay}
              pointerEvents="none"
            />
          )}
          <TouchableOpacity
            style={[
              styles.favoriteButton,
              isFavorite && styles.favoriteButtonActive,
              isFavoritePending && styles.favoriteButtonDisabled,
            ]}
            disabled={isFavoritePending}
            onPress={(e) => {
              e.stopPropagation?.();
              void handleToggleFavorite(product, isFavorite);
            }}
          >
            {isFavoritePending ? (
              <ActivityIndicator size="small" color="#9ca3af" />
            ) : (
              <Ionicons
                name={isFavorite ? "star" : "star-outline"}
                size={15}
                color={isFavorite ? "#f59e0b" : "#9ca3af"}
              />
            )}
          </TouchableOpacity>
          <View style={styles.productPriceBadge}>
            <Text style={styles.productPriceBadgeText} numberOfLines={1}>
              {product.price}
            </Text>
          </View>
        </View>

        <View style={styles.productBody}>
          <Text style={[styles.productCategory, { color: theme.accent }]} numberOfLines={1}>
            {product.category}
          </Text>
          <Text style={[styles.productName, { color: theme.textPrimary }]} numberOfLines={2}>
            {product.name}
          </Text>
          <View style={styles.productFooter}>
            <LinearGradient
              colors={theme.gradient}
              style={styles.productLinkButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.productLinkText}>Ver</Text>
              <Ionicons name="arrow-forward" size={12} color="#fff" />
            </LinearGradient>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.appBackground }]}>
      <StatusBar style="light" backgroundColor={theme.headerBackground} translucent={false} />

        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.headerBackground, borderBottomColor: theme.border }]}>
          <TouchableOpacity style={styles.menuButton} onPress={() => setSidebarVisible(true)}>
            <Ionicons name="menu" size={24} color={theme.textPrimary} />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <LinearGradient
              colors={theme.gradient}
              style={styles.logoIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="image-outline" size={20} color="#fff" />
            </LinearGradient>
            <Text style={[styles.logoText, { color: theme.textPrimary }]}>Stylens</Text>
          </View>

          <Text style={[styles.version, { color: theme.textMuted }]}>v1.0</Text>
        </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.appBackground }]}
        style={{ backgroundColor: theme.appBackground }}
      >
        {screenState === "home" && (
          <>
            <View style={styles.heroSection}>
              <LinearGradient
                colors={theme.gradient}
                style={styles.heroIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="camera" size={40} color="#fff" />
              </LinearGradient>

              <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>Captura tu estilo</Text>
              <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                Sube una foto desde tu galería o toma una nueva con tu cámara
              </Text>
            </View>

            <View style={styles.cardsRow}>
              <Animated.View style={[styles.card, { backgroundColor: theme.surface, transform: [{ scale: scaleCamera }] }]}>
                <TouchableOpacity
                  style={{ alignItems: "center", flex: 1, width: "100%" }}
                  onPress={handleTakePhoto}
                  // @ts-ignore
                  onMouseEnter={() => animateIn(scaleCamera)}
                  // @ts-ignore
                  onMouseLeave={() => animateOut(scaleCamera)}
                  activeOpacity={1}
                >
                  <View style={[styles.cardIconWrapper, { backgroundColor: theme.accentSoft }]}>
                    <Ionicons name="camera" size={28} color={theme.accent} />
                  </View>
                  <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Tomar foto</Text>
                  <Text style={[styles.cardSubtitle, { color: theme.textMuted }]}>Abre la cámara y captura una imagen</Text>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View style={[styles.card, { backgroundColor: theme.surface, transform: [{ scale: scaleGallery }] }]}>
                <TouchableOpacity
                  style={{ alignItems: "center", flex: 1, width: "100%" }}
                  onPress={handleUploadFromGallery}
                  // @ts-ignore
                  onMouseEnter={() => animateIn(scaleGallery)}
                  // @ts-ignore
                  onMouseLeave={() => animateOut(scaleGallery)}
                  activeOpacity={1}
                >
                  <View style={[styles.cardIconWrapper, { backgroundColor: theme.accentSoft }]}>
                    <Ionicons name="arrow-up-circle" size={28} color={theme.accent} />
                  </View>
                  <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Subir desde galería</Text>
                  <Text style={[styles.cardSubtitle, { color: theme.textMuted }]}>Selecciona una imagen de tu dispositivo</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>

            <View style={[styles.formatsCard, { backgroundColor: theme.surface }]}> 
              <Text style={[styles.formatsTitle, { color: theme.textPrimary }]}>Formatos soportados</Text>
              <View style={styles.formatsRow}>
                {FORMATS.map((format) => (
                  <View key={format} style={[styles.formatBadge, { backgroundColor: theme.surfaceSoft }]}>
                    <Text style={[styles.formatText, { color: theme.textSecondary }]}>{format}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {screenState === "preview" && (
          <>
            <View style={styles.topRow}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Vista previa</Text>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
                onPress={clearImage}
              >
                <Ionicons name="close" size={14} color={theme.textPrimary} />
                <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>Cerrar</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.previewCard, { backgroundColor: theme.surface }]}>
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="contain" />
              ) : (
                <View style={[styles.previewPlaceholder, { backgroundColor: theme.surfaceSoft }]}>
                  <Ionicons name="image-outline" size={44} color={theme.textMuted} />
                </View>
              )}
            </View>

            <View style={styles.previewActions}>
              <TouchableOpacity
                style={[styles.secondaryAction, { borderColor: theme.border, backgroundColor: theme.surface }]}
                onPress={clearImage}
              >
                <Text style={[styles.secondaryActionText, { color: theme.textPrimary }]}>Subir otra imagen</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryAction} onPress={handleContinue}>
                <LinearGradient colors={theme.gradient} style={styles.primaryActionGradient}>
                  <Text style={styles.primaryActionText}>Continuar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        )}

        {screenState === "select" && (
          <>
            <View style={styles.topRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Selecciona una prenda</Text>
                <Text style={[styles.resultsCount, { color: theme.textSecondary }]}>
                  Pulsa sobre el recuadro de la prenda que quieres buscar
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
                onPress={clearImage}
              >
                <Ionicons name="refresh" size={14} color={theme.textPrimary} />
                <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>Nueva imagen</Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.selectCard,
                isDesktopWeb && styles.selectCardDesktop,
                !isDesktopWeb && styles.selectCardMobile,
                {
                  backgroundColor: theme.surface,
                  width: selectCardWidth,
                },
              ]}
              onLayout={(event) => {
                const { width, height } = event.nativeEvent.layout;
                setPreviewLayout({ width, height });
              }}
            >
              {selectedImage ? (
                <Image
                  source={{ uri: selectedImage }}
                  style={[styles.selectImage, { height: selectImageHeight }]}
                  resizeMode="contain"
                />
              ) : null}

              {detectedBoxes.map((box) => {
                const boxStyle = getBoxStyle(box);
                if (!boxStyle) return null;

                const isSelected = selectedBoxId === box.id;
                return (
                  <TouchableOpacity
                    key={box.id}
                    style={[
                      styles.detectedBox,
                      boxStyle,
                      isSelected && styles.detectedBoxActive,
                    ]}
                    onPress={() => {
                      void handleDetectSelectedGarment(box);
                    }}
                    activeOpacity={0.9}
                  >
                    <View style={styles.detectedBoxLabelWrap}>
                      <Text style={styles.detectedBoxLabel} numberOfLines={1}>
                        {box.clase}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {screenState === "loading" && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.loadingTitle, { color: theme.textPrimary }]}>Analizando tu imagen...</Text>
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Estamos usando YOLOv8 y FashionCLIP para detectar y encontrar prendas similares. Esto puede tardar hasta 2 minutos.</Text>
          </View>
        )}

        {screenState === "error" && (
          <View style={styles.errorWrap}>
            <Ionicons name="alert-circle-outline" size={42} color={theme.accent} />
            <Text style={[styles.errorTitle, { color: theme.textPrimary }]}>No se pudo completar la deteccion</Text>
            <Text style={[styles.errorText, { color: theme.textSecondary }]}>
              {errorMessage ?? DEFAULT_TIMEOUT_MESSAGE}
            </Text>
            <View style={styles.previewActions}>
              <TouchableOpacity
                style={[styles.secondaryAction, { borderColor: theme.border, backgroundColor: theme.surface }]}
                onPress={clearImage}
              >
                <Text style={[styles.secondaryActionText, { color: theme.textPrimary }]}>Subir otra imagen</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryAction} onPress={handleContinue}>
                <LinearGradient colors={theme.gradient} style={styles.primaryActionGradient}>
                  <Text style={styles.primaryActionText}>Reintentar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {screenState === "results" && (
          <>
            <View style={styles.topRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Productos encontrados</Text>
                <Text style={[styles.resultsCount, { color: theme.textSecondary }]}>{products.length} prendas similares detectadas</Text>
              </View>
              <View style={styles.resultsActionsRow}>
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
                  onPress={handleBackToSelect}
                >
                  <Ionicons name="arrow-back" size={14} color={theme.textPrimary} />
                  <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>Volver</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
                  onPress={clearImage}
                >
                  <Ionicons name="refresh" size={14} color={theme.textPrimary} />
                  <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>Nueva búsqueda</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.resultsGrid, isDesktopWeb && styles.resultsGridDesktop]}>
              {products.map((product) => renderProductCard(product, !isDesktopWeb))}
            </View>
          </>
        )}
      </ScrollView>

        <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />

      <TipsBottomSheet
        ref={tipsSheetRef}
        onContinue={handleContinueFromTips}
        onBack={() => {
          pendingAction.current = null;
        }}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  menuButton: {
    padding: 4,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  version: {
    fontSize: 13,
    color: "#9ca3af",
    fontWeight: "500",
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    flexGrow: 1,
  },

  // Hero
  heroSection: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 36,
  },
  heroIcon: {
    width: 90,
    height: 90,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111",
    marginBottom: 10,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },

  // Cards
  cardsRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 20,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 17,
  },

  // Formats
  formatsCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  formatsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    marginBottom: 14,
  },
  formatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  formatBadge: {
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  formatText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 14,
  },
  resultsActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 2,
  },
  resultsCount: {
    fontSize: 14,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  previewCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    minHeight: 280,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  previewImage: {
    width: "100%",
    height: 340,
  },
  previewPlaceholder: {
    minHeight: 280,
    alignItems: "center",
    justifyContent: "center",
  },
  selectCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    minHeight: 360,
    position: "relative",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  selectCardDesktop: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  selectCardMobile: {
    borderRadius: 18,
  },
  selectImage: {
    width: "100%",
    minHeight: 360,
  },
  detectedBox: {
    position: "absolute",
    borderWidth: 3,
    borderColor: "#22c55e",
    backgroundColor: "transparent",
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "flex-start",
    minWidth: 44,
    minHeight: 44,
  },
  detectedBoxActive: {
    borderColor: "#f59e0b",
    backgroundColor: "transparent",
  },
  detectedBoxLabelWrap: {
    backgroundColor: "rgba(0,0,0,0.72)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
    borderBottomRightRadius: 10,
  },
  detectedBoxLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  previewActions: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryAction: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  primaryAction: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  primaryActionGradient: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 10,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  loadingText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 340,
  },
  errorWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 56,
    gap: 12,
  },
  errorTitle: {
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center",
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 340,
    marginBottom: 8,
  },
  resultsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 14,
    paddingBottom: 8,
  },
  resultsGridDesktop: {
    justifyContent: "flex-start",
  },
  productCard: {
    width: "48%",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,
  },
  productCardDesktop: {
    width: "31%",
    minWidth: 280,
    maxWidth: 360,
  },
  productCardMobile: {
    width: "100%",
  },
  productImageWrap: {
    position: "relative",
    width: "100%",
    height: 210,
    backgroundColor: "#f3f4f6",
  },
  productImageWrapDesktop: {
    height: 260,
    backgroundColor: "#f9fafb",
  },
  productImageWrapMobile: {
    height: 235,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  productImageDesktop: {
    width: "94%",
    height: "94%",
    alignSelf: "center",
    marginTop: "3%",
  },
  productImageFallback: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#f3f4f6",
  },
  productImageFallbackText: {
    fontSize: 11,
    fontWeight: "500",
  },
  productImageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  productPriceBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: "80%",
  },
  productPriceBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  favoriteButtonActive: {
    backgroundColor: "#fffbeb",
  },
  favoriteButtonDisabled: {
    opacity: 0.75,
  },
  productBody: {
    padding: 10,
    gap: 6,
  },
  productName: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    minHeight: 34,
  },
  productCategory: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  productFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  productLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  productLinkText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
});