import React, { useState, useEffect } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenShell } from "@/components/screen-shell";
import { useAppTheme } from "@/contexts/app-theme";
import apiClient from "@/api/client";

const HIDE_TIPS_KEY = "stylelens.hide-recommendations";
const SEARCH_PRICE_MIN_KEY = "stylelens.search.priceMin";
const SEARCH_PRICE_MAX_KEY = "stylelens.search.priceMax";

export default function ConfiguracionScreen() {
  const router = useRouter();
  const { theme, themes, selectedThemeId, setSelectedThemeId } = useAppTheme();

  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [resetTipsChecked, setResetTipsChecked] = useState(false);
  const [clearCacheChecked, setClearCacheChecked] = useState(false);
  const [savedVisible, setSavedVisible] = useState(false);
  const [deleteConfirmPending, setDeleteConfirmPending] = useState(false);
  const [deletingHistory, setDeletingHistory] = useState(false);

  useEffect(() => {
    (async () => {
      const [min, max] = await Promise.all([
        AsyncStorage.getItem(SEARCH_PRICE_MIN_KEY),
        AsyncStorage.getItem(SEARCH_PRICE_MAX_KEY),
      ]);
      if (min) setPriceMin(min);
      if (max) setPriceMax(max);
    })();
  }, []);

  const handleEliminarHistorial = async () => {
    if (!deleteConfirmPending) {
      setDeleteConfirmPending(true);
      return;
    }
    setDeletingHistory(true);
    try {
      await apiClient.delete("/api/v1/historial");
      setDeleteConfirmPending(false);
      Alert.alert("Historial", "Todo el historial ha sido eliminado.");
    } catch {
      Alert.alert("Error", "No se pudo eliminar el historial.");
    } finally {
      setDeletingHistory(false);
    }
  };

  const handleGuardarCambios = async () => {
    try {
      await AsyncStorage.setItem(SEARCH_PRICE_MIN_KEY, priceMin);
      await AsyncStorage.setItem(SEARCH_PRICE_MAX_KEY, priceMax);

      if (resetTipsChecked) {
        await AsyncStorage.removeItem(HIDE_TIPS_KEY);
        setResetTipsChecked(false);
      }

      if (clearCacheChecked) {
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(
          (k) => k.startsWith("stylelens.") && k !== "stylelens.theme.id"
        );
        if (cacheKeys.length > 0) {
          await AsyncStorage.multiRemove(cacheKeys);
        }
        setClearCacheChecked(false);
      }

      setSavedVisible(true);
      setTimeout(() => {
        setSavedVisible(false);
        router.replace("/(tabs)" as any);
      }, 2000);
    } catch {
      Alert.alert("Error", "No se pudieron guardar los cambios.");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenShell title="Configuración">

          {/* Preferencias de búsqueda */}
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="search" size={18} color={theme.textPrimary} />
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Preferencias de búsqueda</Text>
            </View>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Rango de precios</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={priceMin}
                onChangeText={setPriceMin}
                placeholder="Min"
                keyboardType="numeric"
                style={[styles.input, { borderColor: theme.border, color: theme.textPrimary }]}
                placeholderTextColor={theme.textMuted}
              />
              <TextInput
                value={priceMax}
                onChangeText={setPriceMax}
                placeholder="Max"
                keyboardType="numeric"
                style={[styles.input, { borderColor: theme.border, color: theme.textPrimary }]}
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </View>

          {/* Privacidad y datos */}
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.textPrimary} />
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Privacidad y datos</Text>
            </View>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              Todos sus datos han sido registrados en la nube. Para eliminar su información pulse{" "}
              <Text style={{ fontWeight: "700" }}>Eliminar todo el historial.</Text>
            </Text>
            {deleteConfirmPending ? (
              <View style={styles.confirmRow}>
                <Pressable
                  style={[styles.dangerButton, styles.confirmButton]}
                  onPress={handleEliminarHistorial}
                  disabled={deletingHistory}
                >
                  <Ionicons name="trash-outline" size={16} color="#dc2626" />
                  <Text style={styles.dangerText}>
                    {deletingHistory ? "Eliminando..." : "Confirmar eliminación"}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => setDeleteConfirmPending(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.dangerButton} onPress={handleEliminarHistorial}>
                <Ionicons name="trash-outline" size={16} color="#dc2626" />
                <Text style={styles.dangerText}>Eliminar todo el historial</Text>
              </Pressable>
            )}
          </View>

          {/* Apariencia */}
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="color-palette-outline" size={18} color={theme.textPrimary} />
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Apariencia</Text>
            </View>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Tema de color</Text>
            <View style={styles.themeGrid}>
              {themes.map((themeOption) => {
                const selected = selectedThemeId === themeOption.id;
                return (
                  <Pressable
                    key={themeOption.id}
                    onPress={() => setSelectedThemeId(themeOption.id)}
                    style={[
                      styles.themeCard,
                      { borderColor: theme.border, backgroundColor: theme.surface },
                      selected && { borderColor: theme.accent, backgroundColor: theme.accentSoft },
                    ]}
                  >
                    <View style={styles.themeSwatchRow}>
                      <View style={[styles.themeSwatch, { backgroundColor: themeOption.colors[0] }]} />
                      <View style={[styles.themeSwatch, { backgroundColor: themeOption.colors[1] }]} />
                    </View>
                    <Text style={[styles.themeName, { color: theme.textSecondary }]}>{themeOption.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Avanzado */}
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="settings-outline" size={18} color={theme.textPrimary} />
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Avanzado</Text>
            </View>
            <Pressable
              style={[
                styles.secondaryButton,
                resetTipsChecked && { borderColor: theme.accent, backgroundColor: theme.accentSoft },
              ]}
              onPress={() => setResetTipsChecked((v) => !v)}
            >
              <View style={styles.buttonRow}>
                <Text
                  style={[
                    styles.secondaryButtonText,
                    resetTipsChecked && { color: theme.accent, fontWeight: "600" },
                  ]}
                >
                  Restablecer consejos de recomendaciones
                </Text>
                {resetTipsChecked && (
                  <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
                )}
              </View>
            </Pressable>
            <Pressable
              style={[
                styles.secondaryButton,
                clearCacheChecked && { borderColor: theme.accent, backgroundColor: theme.accentSoft },
              ]}
              onPress={() => setClearCacheChecked((v) => !v)}
            >
              <View style={styles.buttonRow}>
                <Text
                  style={[
                    styles.secondaryButtonText,
                    clearCacheChecked && { color: theme.accent, fontWeight: "600" },
                  ]}
                >
                  Limpiar caché
                </Text>
                {clearCacheChecked && (
                  <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
                )}
              </View>
            </Pressable>
          </View>

          <Pressable
            style={[styles.saveButton, { backgroundColor: theme.accent }]}
            onPress={handleGuardarCambios}
          >
            <Text style={styles.saveButtonText}>Guardar cambios</Text>
          </Pressable>

      </ScreenShell>

      {savedVisible && (
        <View style={[styles.savedBanner, { backgroundColor: theme.accent }]}>
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={styles.savedBannerText}>Cambios guardados correctamente</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginTop: 2,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#374151",
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#111",
  },
  dangerButton: {
    marginTop: 2,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dangerText: {
    color: "#dc2626",
    fontWeight: "600",
  },
  confirmRow: {
    gap: 8,
    marginTop: 2,
  },
  confirmButton: {
    marginTop: 0,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "500",
  },
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  themeCard: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 10,
    gap: 8,
  },
  themeSwatchRow: {
    flexDirection: "row",
    gap: 6,
  },
  themeSwatch: {
    flex: 1,
    height: 28,
    borderRadius: 8,
  },
  themeName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: "#374151",
    fontSize: 14,
    flex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  saveButton: {
    marginTop: 2,
    backgroundColor: "#7c3aed",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  savedBanner: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 999,
  },
  savedBannerText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
});
