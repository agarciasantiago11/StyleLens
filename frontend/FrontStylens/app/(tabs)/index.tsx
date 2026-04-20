import React, { useState, useRef} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Sidebar from "./Sidebar";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import TipsBottomSheet, { TipsBottomSheetRef } from "./TipsBottomSheet";
import { useAppTheme } from "@/contexts/app-theme";

const FORMATS = ["JPG", "PNG", "GIF", "WEBP", "HEIC"];

export default function StylensScreen() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const { theme } = useAppTheme();
  const router = useRouter();
  const scaleCamera = useRef(new Animated.Value(1)).current;
  const scaleGallery = useRef(new Animated.Value(1)).current;
  const tipsSheetRef = useRef<TipsBottomSheetRef>(null);
  const pendingAction = useRef<"camera" | "gallery" | null>(null);

  const animateIn = (anim: Animated.Value) => {
    Animated.spring(anim, { toValue: 1.07, useNativeDriver: true }).start();
  };

  const animateOut = (anim: Animated.Value) => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleTakePhoto = () => {
    pendingAction.current = "camera";
    if (Platform.OS === "web") {
      handleContinueFromTips();
      return;
    }
    tipsSheetRef.current?.open();
  };

  const handleUploadFromGallery = () => {
    pendingAction.current = "gallery";
    if (Platform.OS === "web") {
      handleContinueFromTips();
      return;
    }
    tipsSheetRef.current?.open();
  };

  const handleContinueFromTips = async () => {
    if (pendingAction.current === "camera") {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return;
      const result = await ImagePicker.launchCameraAsync({ quality: 1 });
      if (!result.canceled) {
        router.push({ pathname: "/preview" as any, params: { uri: result.assets[0].uri } });
      }
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 1,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });
      if (!result.canceled) {
        router.push({ pathname: "/preview" as any, params: { uri: result.assets[0].uri } });
      }
    }
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
          {/* Hero Section */}
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

          {/* Action Cards */}
          <View style={styles.cardsRow}>
            {/* Tomar Foto */}
            <Animated.View style={[styles.card, { backgroundColor: theme.surface, transform: [{ scale: scaleCamera }] }]}>
              <TouchableOpacity
                style={{ alignItems: "center", flex: 1, width: "100%" }}
                onPress={handleTakePhoto}
                //@ts-ignore
                onMouseEnter={() => animateIn(scaleCamera)}
                //@ts-ignore
                onMouseLeave={() => animateOut(scaleCamera)}
                activeOpacity={1}
              >
                <View style={[styles.cardIconWrapper, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name="camera" size={28} color={theme.accent} />
                </View>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Tomar Foto</Text>
                <Text style={[styles.cardSubtitle, { color: theme.textMuted }]}>Abre la cámara y captura una imagen</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Subir desde Galería */}
            <Animated.View style={[styles.card, { backgroundColor: theme.surface, transform: [{ scale: scaleGallery }] }]}>
              <TouchableOpacity
                style={{ alignItems: "center", flex: 1, width: "100%" }}
                onPress={handleUploadFromGallery}
                //@ts-ignore
                onMouseEnter={() => animateIn(scaleGallery)}
                //@ts-ignore
                onMouseLeave={() => animateOut(scaleGallery)}
                activeOpacity={1}
              >
                <View style={[styles.cardIconWrapper, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name="arrow-up-circle" size={28} color={theme.accent} />
                </View>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Subir desde Galería</Text>
                <Text style={[styles.cardSubtitle, { color: theme.textMuted }]}>Selecciona una imagen de tu dispositivo</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Supported Formats */}
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
        </ScrollView>

        <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />

        {Platform.OS !== "web" && (
          <TipsBottomSheet
            ref={tipsSheetRef}
            onContinue={handleContinueFromTips}
            onBack={() => {}}
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
    paddingBottom: 40,
    backgroundColor: "#fdf4f8",
  },

  // Hero
  heroSection: {
    alignItems: "center",
    paddingTop: 48,
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
});