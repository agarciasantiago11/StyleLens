import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAppTheme } from "@/contexts/app-theme";

const SIDEBAR_WIDTH = 300;

const MENU_ITEMS: { icon: keyof typeof Ionicons.glyphMap; label: string; href: string }[] = [
  { icon: "time-outline", label: "Anteriores Capturas", href: "/(tabs)/capturas" },
  { icon: "star-outline", label: "Favoritos", href: "/(tabs)/favoritos" },
  { icon: "settings-outline", label: "Configuración", href: "/(tabs)/configuracion" },
  { icon: "headset-outline", label: "Soporte", href: "/(tabs)/soporte" },
  { icon: "mail-outline", label: "Contacto", href: "/(tabs)/contacto" },
  { icon: "information-circle-outline", label: "Acerca de", href: "/(tabs)/acerca" },
];

export default function Sidebar({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { theme } = useAppTheme();
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  useEffect(() => {
  if (visible) {
    slideAnim.setValue(-SIDEBAR_WIDTH);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  } else {
    Animated.timing(slideAnim, {
      toValue: -SIDEBAR_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }
}, [slideAnim, visible]);

  return (
    <Modal visible={visible} animationType="none" transparent>
      <View style={styles.overlay}>
        {/* Backdrop sin sombra, solo para cerrar al tocar fuera */}
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        {/* Sidebar animado desde la izquierda */}
        <Animated.View
          style={[
            styles.sidebar,
            { backgroundColor: theme.surface, transform: [{ translateX: slideAnim }] },
          ]}
        >
          <SafeAreaView style={{ flex: 1 }}>
            {/* Header */}
            <View style={styles.header}>
              <LinearGradient
                colors={theme.gradient}
                style={styles.logoIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="image-outline" size={20} color="#fff" />
              </LinearGradient>
              <View>
                <Text style={[styles.logoTitle, { color: theme.textPrimary }]}>Stylens</Text>
                <Text style={[styles.logoSubtitle, { color: theme.textMuted }]}>Menú de navegación</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Menu Items */}
            <View style={styles.menuList}>
              {MENU_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.menuItem}
                  onPress={() => {
                    onClose();
                    router.push(item.href as any);
                  }}
                >
                  <Ionicons name={item.icon} size={22} color={theme.textSecondary} />
                  <Text style={[styles.menuLabel, { color: theme.textPrimary }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.textMuted }]}>Versión 1.0.0</Text>
              <Text style={[styles.footerText, { color: theme.textMuted }]}>© 2026 Stylens</Text>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "transparent",
  },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 24,
    paddingTop: 32,
  },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  logoSubtitle: {
    fontSize: 12,
    color: "#9ca3af",
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginHorizontal: 20,
  },
  menuList: {
    paddingTop: 16,
    paddingHorizontal: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  menuLabel: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  footer: {
    position: "absolute",
    bottom: 32,
    width: "100%",
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    color: "#9ca3af",
  },
});
