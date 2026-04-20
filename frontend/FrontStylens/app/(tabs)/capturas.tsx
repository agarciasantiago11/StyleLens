import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenShell } from "@/components/screen-shell";
import { useRouter } from "expo-router";
import { useAppTheme } from "@/contexts/app-theme";

export default function CapturasScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  return (
    <ScreenShell title="Anteriores Capturas">
      <View style={[styles.heroCard, { backgroundColor: theme.surface }]}>
        <View style={[styles.heroIconWrap, { backgroundColor: theme.accent }]}>
          <Ionicons name="time-outline" size={28} color="#ffffff" />
        </View>
        <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>Historial de busquedas</Text>
        <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>Aqui veras tus capturas anteriores cuando empieces a analizar prendas.</Text>
      </View>

      <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
        <Ionicons name="images-outline" size={38} color={theme.textMuted} />
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>No hay capturas anteriores</Text>
        <Text style={[styles.cardText, { color: theme.textSecondary }]}>Tu historial de busquedas aparecera aqui automaticamente.</Text>
        <Pressable style={[styles.primaryButton, { backgroundColor: theme.accent }]} onPress={() => router.push("/(tabs)" as any)}>
          <Text style={styles.primaryButtonText}>Hacer una busqueda</Text>
        </Pressable>
      </View>
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
});
