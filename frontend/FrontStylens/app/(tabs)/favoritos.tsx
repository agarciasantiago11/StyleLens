import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenShell } from "@/components/screen-shell";
import { useRouter } from "expo-router";
import { useAppTheme } from "@/contexts/app-theme";
import { useFocusEffect } from "@react-navigation/native";
import apiClient from "@/api/client";
import { useAuthStore } from "@/store/authStore";

type FavoritoApi = {
  prenda_id: string;
  prenda: {
    id: string;
    nombre: string;
    precio?: number | null;
    precio_actual?: number | null;
    imagen_url?: string | null;
    link?: string | null;
    tienda?: string | null;
    marca?: string | null;
  };
  created_at: string;
};

type FavoriteProduct = {
  id: string;
  image: string;
  name: string;
  price: string;
  link: string | null;
};

export default function FavoritosScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const token = useAuthStore((state) => state.token);
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removingIds, setRemovingIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatPrice = (value?: number | null): string => {
    if (value == null) return "Precio no disponible";
    return `${value.toFixed(2)} EUR`;
  };

  const mapFavoritos = (items: FavoritoApi[]): FavoriteProduct[] => {
    return items.map((item) => {
      const prenda = item.prenda;
      return {
        id: String(item.prenda_id || prenda.id),
        image: prenda.imagen_url || "https://via.placeholder.com/600x400?text=Sin+imagen",
        name: prenda.nombre,
        price: formatPrice(prenda.precio_actual ?? prenda.precio),
        link: prenda.link ?? null,
      };
    });
  };

  const loadFavoritos = useCallback(async () => {
    if (!token) {
      setFavorites([]);
      setErrorMessage("Inicia sesión para ver tus favoritos.");
      setLoading(false);
      return;
    }

    try {
      setErrorMessage(null);
      const { data } = await apiClient.get<FavoritoApi[]>("/api/v1/favoritos");
      setFavorites(mapFavoritos(data ?? []));
    } catch {
      setErrorMessage("No se pudo cargar la lista de favoritos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadFavoritos();
    }, [loadFavoritos])
  );

  const onRefresh = () => {
    setRefreshing(true);
    void loadFavoritos();
  };

  const removeFavorite = async (id: string) => {
    setRemovingIds((prev) => [...prev, id]);

    try {
      await apiClient.delete(`/api/v1/favoritos/${id}`);
      setFavorites((prev) => prev.filter((item) => item.id !== id));
    } catch {
      Alert.alert("No se pudo eliminar", "Intenta de nuevo en unos segundos.");
    } finally {
      setRemovingIds((prev) => prev.filter((value) => value !== id));
    }
  };

  const openProduct = async (url: string | null) => {
    if (!url) {
      Alert.alert("Sin enlace", "Este favorito no tiene un enlace disponible.");
      return;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert("Enlace no válido", "No se puede abrir este enlace.");
      return;
    }

    await Linking.openURL(url);
  };

  return (
    <ScreenShell title="Favoritos">
      <View style={[styles.heroCard, { backgroundColor: theme.surface }]}>
        <View style={[styles.heroIconWrap, { backgroundColor: theme.accent }]}> 
          <Ionicons name="star" size={24} color="#ffffff" />
        </View>
        <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>Favoritos</Text>
        <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>{favorites.length} productos guardados</Text>
      </View>

      {loading ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}> 
          <ActivityIndicator size="small" color={theme.accent} />
          <Text style={[styles.cardText, { color: theme.textSecondary }]}>Cargando favoritos...</Text>
        </View>
      ) : errorMessage ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}> 
          <Ionicons name="alert-circle-outline" size={36} color={theme.textMuted} />
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>No se pudieron cargar</Text>
          <Text style={[styles.cardText, { color: theme.textSecondary }]}>{errorMessage}</Text>
          <Pressable style={[styles.primaryButton, { backgroundColor: theme.accent }]} onPress={() => onRefresh()}>
            <Text style={styles.primaryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : favorites.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}> 
          <Ionicons name="star-outline" size={38} color={theme.textMuted} />
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>No tienes favoritos aún</Text>
          <Text style={[styles.cardText, { color: theme.textSecondary }]}>Guarda productos desde Buscar para verlos aquí.</Text>
          <Pressable style={[styles.primaryButton, { backgroundColor: theme.accent }]} onPress={() => router.push("/(tabs)" as any)}>
            <Text style={styles.primaryButtonText}>Ir a buscar</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.grid}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        >
          {favorites.map((product) => {
            const isRemoving = removingIds.includes(product.id);
            return (
              <View key={product.id} style={[styles.productCard, { backgroundColor: theme.surface }]}>
                <View style={styles.productImageWrap}>
                  <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="contain" />
                </View>
                <View style={styles.favoriteBadge}>
                  <Pressable disabled={isRemoving} onPress={() => void removeFavorite(product.id)}>
                    {isRemoving ? (
                      <ActivityIndicator size="small" color="#f59e0b" />
                    ) : (
                      <Ionicons name="star" size={16} color="#f59e0b" />
                    )}
                  </Pressable>
                </View>

                <View style={styles.productBody}>
                  <Text style={[styles.productName, { color: theme.textPrimary }]} numberOfLines={2}>{product.name}</Text>
                  <Text style={[styles.productPrice, { color: theme.textSecondary }]}>{product.price}</Text>
                  <Pressable style={[styles.linkButton, { backgroundColor: theme.accent }]} onPress={() => void openProduct(product.link)}>
                    <Text style={styles.linkButtonText}>Ver producto</Text>
                    <Ionicons name="open-outline" size={14} color="#fff" />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
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
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f59e0b",
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#6b7280",
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
  },
  primaryButton: {
    marginTop: 2,
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
  grid: {
    gap: 10,
    paddingBottom: 16,
  },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  productImageWrap: {
    width: "100%",
    height: 170,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  productImage: {
    width: "94%",
    height: "94%",
  },
  favoriteBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 999,
    padding: 6,
  },
  productBody: {
    padding: 12,
    gap: 8,
  },
  productName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },
  productPrice: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },
  linkButton: {
    marginTop: 2,
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: "#7c3aed",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  linkButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
