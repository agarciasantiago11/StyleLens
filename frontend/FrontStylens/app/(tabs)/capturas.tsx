import React, { useCallback, useState } from "react";
import { ActivityIndicator, Image, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenShell } from "@/components/screen-shell";
import { useFocusEffect, useRouter } from "expo-router";
import { useAppTheme } from "@/contexts/app-theme";
import apiClient from "@/api/client";
import { useAuthStore } from "@/store/authStore";

type CapturaResumen = {
  id: string;
  imagen_original_url?: string | null;
  fecha: string;
  total_detecciones: number;
};

type CapturaConNumero = CapturaResumen & {
  numero: number;
};

type BBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type DeteccionDetalle = {
  id: string;
  clase: string;
  confianza: number;
  bbox?: BBox | null;
  recorte_url?: string | null;
  total_resultados: number;
};

type CapturaDetalle = {
  id: string;
  imagen_original_url?: string | null;
  fecha: string;
  detecciones: DeteccionDetalle[];
};

type PrendaResultado = {
  id: string;
  nombre: string;
  categoria?: string | null;
  tienda?: string | null;
  precio?: number | null;
  imagen_url?: string | null;
  link?: string | null;
};

type ResultadoDetalle = {
  rank?: number | null;
  similitud_score?: number | null;
  fuente?: string | null;
  prenda: PrendaResultado;
};

type FavoritoApi = {
  prenda_id?: string | number | null;
};

const YOLO_CLASS_LABELS: Record<string, string> = {
  short_sleeved_shirt: "camiseta de manga corta",
  long_sleeved_shirt: "camiseta de manga larga",
  vest: "chaleco",
  sling: "top de tirantes",
  short_sleeved_outwear: "chaqueta o abrigo de manga corta",
  long_sleeved_outwear: "chaqueta o abrigo de manga larga",
  shorts: "pantalones cortos",
  trousers: "pantalones",
  skirt: "falda",
  short_sleeved_dress: "vestido de manga corta",
  long_sleeved_dress: "vestido de manga larga",
  vest_dress: "vestido tipo chaleco",
  sling_dress: "vestido de tirantes",
};

const translateYoloClass = (clase: string) => {
  const normalized = clase.trim().toLowerCase();
  return (YOLO_CLASS_LABELS[normalized] ?? normalized.replace(/_/g, " ")).toUpperCase();
};

const formatFecha = (fechaIso: string) => {
  const parsed = new Date(fechaIso);
  if (Number.isNaN(parsed.getTime())) return "Fecha no disponible";
  return parsed.toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatPrecio = (precio?: number | null) => {
  if (typeof precio !== "number" || Number.isNaN(precio)) return "Precio no disponible";
  return `${precio.toFixed(2)} EUR`;
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
  return "captura.jpg";
};

export default function CapturasScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const token = useAuthStore((state) => state.token);
  const [capturas, setCapturas] = useState<CapturaConNumero[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCaptura, setSelectedCaptura] = useState<CapturaDetalle | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedDeteccion, setSelectedDeteccion] = useState<DeteccionDetalle | null>(null);
  const [resultados, setResultados] = useState<ResultadoDetalle[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favoritePendingIds, setFavoritePendingIds] = useState<string[]>([]);

  const loadCapturas = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await apiClient.get<CapturaResumen[]>("/api/v1/capturas");
      const capturasConNumero = (data ?? []).map((captura, index) => ({
        ...captura,
        numero: (data ?? []).length - index,
      }));
      setCapturas(capturasConNumero);
    } catch (e: unknown) {
      const detail =
        typeof e === "object" && e !== null && "response" in e
          ? (e as any).response?.data?.detail
          : null;
      setError(typeof detail === "string" ? detail : "No se pudieron cargar tus capturas.");
      setCapturas([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCapturaDetalle = useCallback(async (capturaId: string) => {
    setDetailLoading(true);
    setDetailError(null);
    setSelectedDeteccion(null);
    setResultados([]);
    setResultsError(null);

    try {
      const { data } = await apiClient.get<CapturaDetalle>(`/api/v1/capturas/${capturaId}`);
      setSelectedCaptura(data);
    } catch (e: unknown) {
      const detail =
        typeof e === "object" && e !== null && "response" in e
          ? (e as any).response?.data?.detail
          : null;
      setDetailError(typeof detail === "string" ? detail : "No se pudo cargar el detalle de la captura.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const loadFavoriteIds = useCallback(async () => {
    if (!token) {
      setFavoriteIds([]);
      return;
    }

    try {
      const { data } = await apiClient.get<FavoritoApi[]>("/api/v1/favoritos");
      const ids = (data ?? [])
        .map((item) => (item.prenda_id == null ? "" : String(item.prenda_id).trim()))
        .filter((id): id is string => id.length > 0);

      setFavoriteIds(Array.from(new Set(ids)));
    } catch {
      // Evitamos alertas intrusivas al cargar estado visual.
    }
  }, [token]);

  const loadResultadosDeteccion = useCallback(async (deteccion: DeteccionDetalle) => {
    setSelectedDeteccion(deteccion);
    setResultados([]);
    setResultsLoading(true);
    setResultsError(null);

    try {
      await loadFavoriteIds();

      const fetchResultados = async () => {
        const { data } = await apiClient.get<ResultadoDetalle[]>(
          `/api/v1/detecciones/${deteccion.id}/resultados`
        );
        return data ?? [];
      };

      let data = await fetchResultados();

      if (data.length === 0 && selectedCaptura) {
        if (!selectedCaptura.imagen_original_url) {
          setResultsError("No hay imagen original para relanzar la búsqueda de esta detección.");
          setResultsLoading(false);
          return;
        }

        if (!deteccion.bbox || deteccion.bbox.w <= 0 || deteccion.bbox.h <= 0) {
          setResultsError("No hay coordenadas válidas para volver a buscar esta detección.");
          setResultsLoading(false);
          return;
        }

        const formData = new FormData();
        const imageUri = selectedCaptura.imagen_original_url;
        if (Platform.OS === "web") {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          formData.append("imagen", blob, inferFileName(imageUri));
        } else {
          formData.append("imagen", {
            uri: imageUri,
            name: inferFileName(imageUri),
            type: inferMimeType(imageUri),
          } as any);
        }

        formData.append("clase", deteccion.clase || "unknown");
        formData.append("x", String(deteccion.bbox.x));
        formData.append("y", String(deteccion.bbox.y));
        formData.append("w", String(deteccion.bbox.w));
        formData.append("h", String(deteccion.bbox.h));
        formData.append("captura_id", selectedCaptura.id);
        formData.append("deteccion_id", deteccion.id);

        await apiClient.post("/api/v1/detectar-prenda", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        data = await fetchResultados();
      }

      setResultados(data);

      // Refleja inmediatamente el nuevo total de resultados en la detección seleccionada
      // y en la lista de detecciones del detalle de captura.
      setSelectedDeteccion((prev) => {
        if (!prev || prev.id !== deteccion.id) return prev;
        return { ...prev, total_resultados: data.length };
      });

      setSelectedCaptura((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          detecciones: prev.detecciones.map((item) =>
            item.id === deteccion.id
              ? { ...item, total_resultados: data.length }
              : item
          ),
        };
      });
    } catch (e: unknown) {
      const detail =
        typeof e === "object" && e !== null && "response" in e
          ? (e as any).response?.data?.detail
          : null;
      setResultsError(typeof detail === "string" ? detail : "No se pudieron cargar los resultados de esta detección.");
    } finally {
      setResultsLoading(false);
    }
  }, [loadFavoriteIds, selectedCaptura]);

  const handleOpenLink = useCallback(async (url?: string | null) => {
    if (!url) return;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  }, []);

  const toggleFavorite = useCallback(async (productId: string, isFavorite: boolean) => {
    if (!productId || favoritePendingIds.includes(productId)) {
      return;
    }

    setFavoritePendingIds((prev) => [...prev, productId]);
    try {
      if (isFavorite) {
        await apiClient.delete(`/api/v1/favoritos/${productId}`);
        setFavoriteIds((prev) => prev.filter((id) => id !== productId));
      } else {
        await apiClient.post(`/api/v1/favoritos/${productId}`);
        setFavoriteIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
      }
    } finally {
      setFavoritePendingIds((prev) => prev.filter((id) => id !== productId));
    }
  }, [favoritePendingIds]);

  useFocusEffect(
    useCallback(() => {
      void loadCapturas();
    }, [loadCapturas])
  );

  return (
    <ScreenShell title={selectedDeteccion ? "Resultados" : selectedCaptura ? "Detalle de captura" : "Capturas anteriores"}>
      {selectedCaptura ? (
        <>
          <Pressable
            onPress={() => {
              if (selectedDeteccion) {
                setSelectedDeteccion(null);
                setResultados([]);
                setResultsError(null);
                return;
              }
              setSelectedCaptura(null);
            }}
            style={[styles.backButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
          >
            <Ionicons name="chevron-back" size={20} color={theme.textPrimary} />
            <Text style={[styles.backButtonText, { color: theme.textPrimary }]}>Volver</Text>
          </Pressable>

          {detailLoading ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
              <ActivityIndicator color={theme.accent} />
              <Text style={[styles.cardText, { color: theme.textSecondary }]}>Cargando detalle...</Text>
            </View>
          ) : detailError ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
              <Ionicons name="alert-circle-outline" size={34} color={theme.textMuted} />
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Error</Text>
              <Text style={[styles.cardText, { color: theme.textSecondary }]}>{detailError}</Text>
              <Pressable style={[styles.primaryButton, { backgroundColor: theme.accent }]} onPress={() => void loadCapturaDetalle(selectedCaptura.id)}>
                <Text style={styles.primaryButtonText}>Reintentar</Text>
              </Pressable>
            </View>
          ) : selectedDeteccion ? (
            <>
              <View style={[styles.selectedDetectionHeader, { backgroundColor: theme.surface }]}> 
                <Text style={[styles.selectedDetectionTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                  {selectedDeteccion.clase ? translateYoloClass(selectedDeteccion.clase) : "Detección"}
                </Text>
                <Text style={[styles.selectedDetectionMeta, { color: theme.textSecondary }]}>
                  Confianza: {((selectedDeteccion.confianza ?? 0) * 100).toFixed(1)}%
                </Text>
              </View>

              {resultsLoading ? (
                <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
                  <ActivityIndicator color={theme.accent} />
                  <Text style={[styles.cardText, { color: theme.textSecondary }]}>Cargando resultados...</Text>
                </View>
              ) : resultsError ? (
                <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
                  <Ionicons name="alert-circle-outline" size={34} color={theme.textMuted} />
                  <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>No se pudieron cargar</Text>
                  <Text style={[styles.cardText, { color: theme.textSecondary }]}>{resultsError}</Text>
                  <Pressable style={[styles.primaryButton, { backgroundColor: theme.accent }]} onPress={() => void loadResultadosDeteccion(selectedDeteccion)}>
                    <Text style={styles.primaryButtonText}>Reintentar</Text>
                  </Pressable>
                </View>
              ) : resultados.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
                  <Ionicons name="search-outline" size={34} color={theme.textMuted} />
                  <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Sin resultados</Text>
                  <Text style={[styles.cardText, { color: theme.textSecondary }]}>Esta detección todavía no tiene resultados guardados.</Text>
                </View>
              ) : (
                <View style={styles.resultsList}>
                  {resultados.map((resultado, idx) => {
                    const prenda = resultado.prenda;
                    const productId = String(prenda.id ?? "").trim();
                    const isFavorite = productId.length > 0 && favoriteIds.includes(productId);
                    const isFavoritePending = productId.length > 0 && favoritePendingIds.includes(productId);
                    return (
                      <Pressable
                        key={`${prenda.id}-${idx}`}
                        onPress={() => void handleOpenLink(prenda.link)}
                        style={[styles.resultCard, { backgroundColor: theme.surface }]}
                      >
                        {prenda.imagen_url ? (
                          <Image source={{ uri: prenda.imagen_url }} style={styles.resultImage} resizeMode="cover" />
                        ) : (
                          <View style={[styles.resultImageFallback, { backgroundColor: theme.surfaceSoft }]}>
                            <Ionicons name="image-outline" size={24} color={theme.textMuted} />
                          </View>
                        )}

                        <View style={styles.resultBody}>
                          <Text style={[styles.resultName, { color: theme.textPrimary }]} numberOfLines={2}>
                            {prenda.nombre || "Prenda sin nombre"}
                          </Text>
                          <Text style={[styles.resultMeta, { color: theme.textSecondary }]} numberOfLines={1}>
                            {prenda.categoria || "Sin categoría"}
                          </Text>
                          <Text style={[styles.resultMeta, { color: theme.textSecondary }]} numberOfLines={1}>
                            {prenda.tienda || "Tienda no disponible"}
                          </Text>
                          <Text style={[styles.resultPrice, { color: theme.textPrimary }]}>
                            {formatPrecio(prenda.precio)}
                          </Text>
                          <Text style={[styles.resultScore, { color: theme.accent }]}>Similitud: {(((resultado.similitud_score ?? 0) * 100)).toFixed(1)}%</Text>
                        </View>

                        <Pressable
                          style={[
                            styles.favoriteButton,
                            isFavorite && styles.favoriteButtonActive,
                            isFavoritePending && styles.favoriteButtonDisabled,
                          ]}
                          disabled={!productId || isFavoritePending}
                          onPress={(event) => {
                            event.stopPropagation?.();
                            void toggleFavorite(productId, isFavorite);
                          }}
                        >
                          {isFavoritePending ? (
                            <ActivityIndicator size="small" color="#9ca3af" />
                          ) : (
                            <Ionicons
                              name={isFavorite ? "star" : "star-outline"}
                              size={16}
                              color={isFavorite ? "#f59e0b" : "#9ca3af"}
                            />
                          )}
                        </Pressable>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </>
          ) : (
            <>
              <View style={[styles.detailImageCard, { backgroundColor: theme.surface }]}>
                {selectedCaptura.imagen_original_url ? (
                  <Image source={{ uri: selectedCaptura.imagen_original_url }} style={styles.detailImage} resizeMode="contain" />
                ) : (
                  <View style={[styles.detailImageFallback, { backgroundColor: theme.surfaceSoft }]}>
                    <Ionicons name="image-outline" size={48} color={theme.textMuted} />
                  </View>
                )}
              </View>

              <View style={styles.detailHeader}>
                <Text style={[styles.detailTitle, { color: theme.textPrimary }]}>Detecciones encontradas</Text>
                <Text style={[styles.detailCount, { color: theme.textSecondary }]}>{selectedCaptura.detecciones.length} detecciones</Text>
              </View>

              {selectedCaptura.detecciones.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
                  <Ionicons name="search-outline" size={34} color={theme.textMuted} />
                  <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Sin detecciones</Text>
                  <Text style={[styles.cardText, { color: theme.textSecondary }]}>No se encontraron prendas en esta captura.</Text>
                </View>
              ) : (
                <View style={styles.detectionsList}>
                  {selectedCaptura.detecciones.map((deteccion) => (
                    <Pressable
                      key={deteccion.id}
                      style={[styles.detectionCard, { backgroundColor: theme.surface }]}
                      onPress={() => void loadResultadosDeteccion(deteccion)}
                    >
                      {deteccion.recorte_url ? (
                        <Image source={{ uri: deteccion.recorte_url }} style={styles.detectionImage} resizeMode="cover" />
                      ) : (
                        <View style={[styles.detectionImageFallback, { backgroundColor: theme.surfaceSoft }]}>
                          <Ionicons name="image-outline" size={24} color={theme.textMuted} />
                        </View>
                      )}
                      <View style={styles.detectionBody}>
                        <Text style={[styles.detectionClase, { color: theme.accent }]} numberOfLines={1}>
                          {translateYoloClass(deteccion.clase)}
                        </Text>
                        <View style={styles.confidenceWrap}>
                          <Text style={[styles.detectionMeta, { color: theme.textSecondary }]}>
                            Confianza: {(deteccion.confianza * 100).toFixed(1)}%
                          </Text>
                        </View>
                        <Text style={[styles.detectionMeta, { color: theme.textSecondary }]}>
                          {deteccion.total_resultados === 0
                            ? "Sin resultados aún"
                            : `${deteccion.total_resultados} resultado${deteccion.total_resultados !== 1 ? "s" : ""}`}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <View style={[styles.heroCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.heroIconWrap, { backgroundColor: theme.accent }]}>
              <Ionicons name="time-outline" size={28} color="#ffffff" />
            </View>
            <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>Historial de búsquedas</Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>Aquí verás tus capturas anteriores cuando empieces a analizar prendas.</Text>
          </View>

          {isLoading ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
              <ActivityIndicator color={theme.accent} />
              <Text style={[styles.cardText, { color: theme.textSecondary }]}>Cargando capturas...</Text>
            </View>
          ) : null}

          {!isLoading && error ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
              <Ionicons name="alert-circle-outline" size={34} color={theme.textMuted} />
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>No se pudo cargar</Text>
              <Text style={[styles.cardText, { color: theme.textSecondary }]}>{error}</Text>
              <Pressable style={[styles.primaryButton, { backgroundColor: theme.accent }]} onPress={() => void loadCapturas()}>
                <Text style={styles.primaryButtonText}>Reintentar</Text>
              </Pressable>
            </View>
          ) : null}

          {!isLoading && !error && capturas.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
              <Ionicons name="images-outline" size={38} color={theme.textMuted} />
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>No hay capturas anteriores</Text>
              <Text style={[styles.cardText, { color: theme.textSecondary }]}>Tu historial de búsquedas aparecerá aquí automáticamente.</Text>
              <Pressable style={[styles.primaryButton, { backgroundColor: theme.accent }]} onPress={() => router.push("/(tabs)" as any)}>
                <Text style={styles.primaryButtonText}>Hacer una búsqueda</Text>
              </Pressable>
            </View>
          ) : null}

          {!isLoading && !error && capturas.length > 0 ? (
            <View style={styles.listWrap}>
              {capturas.map((captura) => (
                <Pressable key={captura.id} onPress={() => void loadCapturaDetalle(captura.id)}>
                  <View style={[styles.itemCard, { backgroundColor: theme.surface }]}> 
                    {captura.imagen_original_url ? (
                      <Image source={{ uri: captura.imagen_original_url }} style={styles.itemImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.itemImageFallback, { backgroundColor: theme.surfaceSoft }]}> 
                        <Ionicons name="image-outline" size={24} color={theme.textMuted} />
                      </View>
                    )}

                    <View style={styles.itemBody}>
                      <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>Captura {captura.numero}</Text>
                      <Text style={[styles.itemMeta, { color: theme.textSecondary }]}>{formatFecha(captura.fecha)}</Text>
                      <Text style={[styles.itemMeta, { color: theme.textSecondary }]}>
                        Detecciones: {captura.total_detecciones}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}
        </>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    gap: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366f1",
    marginBottom: 2,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6b7280",
    textAlign: "center",
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    gap: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 4,
  },
  primaryButton: {
    marginTop: 4,
    backgroundColor: "#7c3aed",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  listWrap: {
    gap: 10,
  },
  itemCard: {
    borderRadius: 16,
    overflow: "hidden",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  itemImage: {
    width: 96,
    height: 96,
  },
  itemImageFallback: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
  },
  itemBody: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  itemMeta: {
    fontSize: 13,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  detailImageCard: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 16,
    minHeight: 280,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  detailImage: {
    width: "100%",
    height: 320,
  },
  detailImageFallback: {
    width: "100%",
    height: 280,
    alignItems: "center",
    justifyContent: "center",
  },
  detailHeader: {
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  detailCount: {
    fontSize: 14,
  },
  detectionsList: {
    gap: 10,
  },
  detectionCard: {
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  detectionImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  detectionImageFallback: {
    width: 80,
    height: 80,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  detectionBody: {
    flex: 1,
    gap: 4,
  },
  detectionClase: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  confidenceWrap: {
    marginVertical: 2,
  },
  detectionMeta: {
    fontSize: 12,
  },
  selectedDetectionHeader: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedDetectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  selectedDetectionMeta: {
    fontSize: 13,
  },
  resultsList: {
    gap: 10,
  },
  resultCard: {
    borderRadius: 14,
    flexDirection: "row",
    gap: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  resultImage: {
    width: 90,
    height: 110,
    borderRadius: 12,
  },
  resultImageFallback: {
    width: 90,
    height: 110,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  resultBody: {
    flex: 1,
    gap: 4,
  },
  resultName: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
  },
  resultMeta: {
    fontSize: 12,
  },
  resultPrice: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "700",
  },
  resultScore: {
    fontSize: 12,
    fontWeight: "600",
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
});
