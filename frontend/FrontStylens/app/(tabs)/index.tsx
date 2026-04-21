import React, { useEffect, useRef, useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Sidebar from "./Sidebar";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TipsBottomSheet, { TipsBottomSheetRef } from "./TipsBottomSheet";
import { useAppTheme } from "@/contexts/app-theme";

const FORMATS = ["JPG", "PNG", "GIF", "WEBP", "HEIC"];
const HIDE_TIPS_KEY = "stylelens.hide-recommendations";

const MOCK_PRODUCTS = [
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
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400",
    name: "Vestido casual verano",
    price: "39.99 EUR",
    link: "https://example.com/product5",
  },
  {
    id: 6,
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400",
    name: "Chaqueta denim azul",
    price: "79.99 EUR",
    link: "https://example.com/product6",
  },
];

type ScreenState = "home" | "preview" | "loading" | "results";

export default function StylensScreen() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [screenState, setScreenState] = useState<ScreenState>("home");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [hideTips, setHideTips] = useState(false);
  const { theme } = useAppTheme();
  const scaleCamera = useRef(new Animated.Value(1)).current;
  const scaleGallery = useRef(new Animated.Value(1)).current;
  const tipsSheetRef = useRef<TipsBottomSheetRef>(null);
  const pendingAction = useRef<"camera" | "gallery" | null>(null);
  const loadingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(HIDE_TIPS_KEY)
      .then((value) => setHideTips(value === "true"))
      .catch(() => setHideTips(false));
  }, []);

  useEffect(() => {
    return () => {
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }
    };
  }, []);

  const animateIn = (anim: Animated.Value) => {
    Animated.spring(anim, { toValue: 1.07, useNativeDriver: true }).start();
  };

  const animateOut = (anim: Animated.Value) => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleTakePhoto = () => {
    pendingAction.current = "camera";
    if (hideTips || Platform.OS === "web") {
      handleContinueFromTips();
      return;
    }
    tipsSheetRef.current?.open();
  };

  const handleUploadFromGallery = () => {
    pendingAction.current = "gallery";
    if (hideTips || Platform.OS === "web") {
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
    setScreenState("home");
    if (loadingTimeout.current) {
      clearTimeout(loadingTimeout.current);
      loadingTimeout.current = null;
    }
  };

  const handleContinue = () => {
    setScreenState("loading");
    loadingTimeout.current = setTimeout(() => {
      setScreenState("results");
      loadingTimeout.current = null;
    }, 5000);
  };

  const toggleFavorite = (productId: number) => {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleOpenProduct = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert("Enlace no válido", "No se puede abrir este enlace.");
      return;
    }
    await Linking.openURL(url);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.headerBackground }]}>
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
        contentContainerStyle={styles.scrollContent}
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

        {screenState === "loading" && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.loadingTitle, { color: theme.textPrimary }]}>Analizando tu imagen...</Text>
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Estamos usando YOLOv8 y FashionCLIP para detectar y encontrar prendas similares.</Text>
          </View>
        )}

        {screenState === "results" && (
          <>
            <View style={styles.topRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Productos encontrados</Text>
                <Text style={[styles.resultsCount, { color: theme.textSecondary }]}>{MOCK_PRODUCTS.length} prendas similares detectadas</Text>
              </View>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
                onPress={clearImage}
              >
                <Ionicons name="refresh" size={14} color={theme.textPrimary} />
                <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>Nueva búsqueda</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.resultsGrid}>
              {MOCK_PRODUCTS.map((product) => {
                const isFavorite = favorites.includes(product.id);
                return (
                  <View key={product.id} style={[styles.productCard, { backgroundColor: theme.surface }]}> 
                    <View style={styles.productImageWrap}>
                      <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="cover" />
                      <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={() => toggleFavorite(product.id)}
                      >
                        <Ionicons
                          name={isFavorite ? "star" : "star-outline"}
                          size={16}
                          color={isFavorite ? "#f59e0b" : "#6b7280"}
                        />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.productBody}>
                      <Text style={[styles.productName, { color: theme.textPrimary }]} numberOfLines={2}>{product.name}</Text>
                      <Text style={[styles.productPrice, { color: theme.textSecondary }]}>{product.price}</Text>
                      <TouchableOpacity
                        style={styles.productLinkButton}
                        onPress={() => handleOpenProduct(product.link)}
                      >
                        <LinearGradient colors={theme.gradient} style={styles.productLinkGradient}>
                          <Text style={styles.productLinkText}>Ver producto</Text>
                          <Ionicons name="open-outline" size={14} color="#fff" />
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

        <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />

      {Platform.OS !== "web" && (
        <TipsBottomSheet
          ref={tipsSheetRef}
          onContinue={handleContinueFromTips}
          onBack={() => {
            pendingAction.current = null;
          }}
        />
      )}

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
    backgroundColor: "#fdf4f8",
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
  resultsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    paddingBottom: 8,
  },
  productCard: {
    width: "48%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  productImageWrap: {
    position: "relative",
    width: "100%",
    height: 180,
    backgroundColor: "#f3f4f6",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  productBody: {
    padding: 10,
    gap: 6,
  },
  productName: {
    fontSize: 13,
    fontWeight: "700",
    minHeight: 34,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: "600",
  },
  productLinkButton: {
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 4,
  },
  productLinkGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  productLinkText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});