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
import { useAuthStore } from "@/store/authStore";
import apiClient from "@/api/client";

const ADMIN_PRIORITY = 100;

const SIDEBAR_WIDTH = 300;

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  href: string;
  adminOnly?: boolean;
};

const MENU_ITEMS: MenuItem[] = [
  { icon: "time-outline", label: "Capturas anteriores", href: "/(tabs)/capturas" },
  { icon: "star-outline", label: "Favoritos", href: "/(tabs)/favoritos" },
  { icon: "settings-outline", label: "Configuración", href: "/(tabs)/configuracion" },
  { icon: "headset-outline", label: "Soporte", href: "/(tabs)/soporte" },
  { icon: "mail-outline", label: "Contacto", href: "/(tabs)/contacto" },
  { icon: "information-circle-outline", label: "Acerca de", href: "/(tabs)/acerca" },
  { icon: "shield-checkmark-outline", label: "Panel de Administrador", href: "/(tabs)/admin-panel", adminOnly: true },
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
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const isAdmin = (user?.role_priority ?? 0) >= ADMIN_PRIORITY;

  const handleLogout = async () => {
    try {
      await apiClient.post("/api/v1/auth/logout");
    } catch {
      // Si falla la llamada al servidor igualmente limpiamos la sesión local
    }
    logout();
    onClose();
    router.replace("/sign-in");
  };
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
              {MENU_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.menuItem,
                    item.adminOnly && styles.adminItem,
                    item.adminOnly && { backgroundColor: theme.accentSoft, borderColor: theme.accent },
                  ]}
                  onPress={() => {
                    onClose();
                    router.push(item.href as any);
                  }}
                >
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={item.adminOnly ? theme.accent : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.menuLabel,
                      { color: item.adminOnly ? theme.accent : theme.textPrimary },
                      item.adminOnly && { fontWeight: "700" },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Logout */}
            <View style={styles.logoutContainer}>
              <TouchableOpacity
                style={[styles.logoutButton, { borderColor: "#ef4444" }]}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                <Text style={styles.logoutText}>Cerrar sesión</Text>
              </TouchableOpacity>
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
  adminItem: {
    borderWidth: 1,
    marginBottom: 4,
  },
  menuLabel: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  logoutContainer: {
    position: "absolute",
    bottom: 88,
    width: "100%",
    paddingHorizontal: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ef4444",
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
