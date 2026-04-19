import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";

export default function Preview() {
  const router = useRouter();
  const { uri } = useLocalSearchParams<{ uri: string }>();

  const handleClose = () => {
    router.back();
  };

  const handleSubirOtra = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 1,
      allowsEditing: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
router.push({ pathname: "/(tabs)/preview" as any, params: { uri: result.assets[0].uri } });    }
  };

  const handleContinuar = () => {
    // aquí irá la navegación a la pantalla de procesado con IA
    console.log("Continuar con:", uri);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor="#000" translucent={false} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="menu" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <LinearGradient
            colors={["#a855f7", "#ec4899"]}
            style={styles.logoIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="image-outline" size={20} color="#fff" />
          </LinearGradient>
          <Text style={styles.logoText}>Stylens</Text>
        </View>

        <Text style={styles.version}>v1.0</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>

        {/* Title row */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>Vista Previa</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={16} color="#333" />
            <Text style={styles.closeText}>Cerrar</Text>
          </TouchableOpacity>
        </View>

        {/* Image */}
        <View style={styles.imageCard}>
          {uri ? (
            <Image source={{ uri }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={48} color="#ccc" />
            </View>
          )}
        </View>

        {/* Buttons */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleSubirOtra}>
            <Text style={styles.secondaryButtonText}>Subir otra imagen</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton} onPress={handleContinuar}>
            <LinearGradient
              colors={["#a855f7", "#ec4899"]}
              style={styles.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryButtonText}>Continuar</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>© 2026 Stylens - Captura tu estilo</Text>
      </View>
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

  // Content
  content: {
    flex: 1,
    backgroundColor: "#fdf4f8",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },

  // Title row
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
  },
  closeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  closeText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },

  // Image
  imageCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
  },

  // Buttons
  buttonsRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 20,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  primaryButton: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  primaryGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },

  // Footer
  footer: {
    textAlign: "center",
    fontSize: 13,
    color: "#9ca3af",
  },
});