import React, { useMemo, useState } from "react";
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenShell } from "@/components/screen-shell";
import { useRouter } from "expo-router";
import { useAppTheme } from "@/contexts/app-theme";

export default function FavoritosScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [favorites, setFavorites] = useState<number[]>([]);

  const mockProducts = useMemo(
    () => [
      {
        id: 1,
        image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400",
        name: "Camiseta básica blanca",
        price: "29.99 EUR",
        link: "https://example.com/product1",
      },
      {
        id: 2,
        image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400",
        name: "Pantalón vaquero slim fit",
        price: "59.99 EUR",
        link: "https://example.com/product2",
      },
      {
        id: 3,
        image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400",
        name: "Sudadera con capucha gris",
        price: "45.99 EUR",
        link: "https://example.com/product3",
      },
      {
        id: 4,
        image: "https://images.unsplash.com/photo-1606821011768-d4c3f9e3c3e8?w=400",
        name: "Zapatillas deportivas negras",
        price: "89.99 EUR",
        link: "https://example.com/product4",
      },
    ],
    []
  );

  const favoriteProducts = mockProducts.filter((item) => favorites.includes(item.id));

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
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

      {favorites.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}> 
          <Ionicons name="star-outline" size={38} color={theme.textMuted} />
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>No tienes favoritos aún</Text>
          <Text style={[styles.cardText, { color: theme.textSecondary }]}>Agrega productos a favoritos para guardarlos aquí.</Text>
          <Pressable style={[styles.primaryButton, { backgroundColor: theme.accent }]} onPress={() => router.push("/(tabs)" as any)}>
            <Text style={styles.primaryButtonText}>Buscar productos</Text>
          </Pressable>

          <Text style={styles.suggestedTitle}>Sugeridos (toca estrella para guardar)</Text>
          <View style={styles.suggestedGrid}>
            {mockProducts.map((product) => {
              const isFav = favorites.includes(product.id);
              return (
                <Pressable key={product.id} style={[styles.suggestedCard, { borderColor: theme.border, backgroundColor: theme.surface }]} onPress={() => toggleFavorite(product.id)}>
                  <Image source={{ uri: product.image }} style={styles.suggestedImage} />
                  <View style={styles.suggestedInfo}>
                    <Text style={[styles.suggestedName, { color: theme.textSecondary }]} numberOfLines={2}>{product.name}</Text>
                    <Ionicons name={isFav ? "star" : "star-outline"} size={16} color={isFav ? "#f59e0b" : "#9ca3af"} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          {favoriteProducts.map((product) => (
            <View key={product.id} style={[styles.productCard, { backgroundColor: theme.surface }]}>
              <Image source={{ uri: product.image }} style={styles.productImage} />
              <View style={styles.favoriteBadge}>
                <Pressable onPress={() => toggleFavorite(product.id)}>
                  <Ionicons name="star" size={16} color="#f59e0b" />
                </Pressable>
              </View>

              <View style={styles.productBody}>
                <Text style={[styles.productName, { color: theme.textPrimary }]} numberOfLines={2}>{product.name}</Text>
                <Text style={[styles.productPrice, { color: theme.textSecondary }]}>{product.price}</Text>
                <Pressable style={[styles.linkButton, { backgroundColor: theme.accent }]} onPress={() => Linking.openURL(product.link)}>
                  <Text style={styles.linkButtonText}>Ver producto</Text>
                  <Ionicons name="open-outline" size={14} color="#fff" />
                </Pressable>
              </View>
            </View>
          ))}
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
  suggestedTitle: {
    marginTop: 12,
    marginBottom: 2,
    alignSelf: "flex-start",
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  suggestedGrid: {
    width: "100%",
    gap: 8,
  },
  suggestedCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  suggestedImage: {
    width: "100%",
    height: 120,
    backgroundColor: "#f3f4f6",
  },
  suggestedInfo: {
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  suggestedName: {
    flex: 1,
    fontSize: 13,
    color: "#374151",
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
  productImage: {
    width: "100%",
    height: 170,
    backgroundColor: "#f3f4f6",
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
