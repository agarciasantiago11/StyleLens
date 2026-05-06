import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenShell } from "@/components/screen-shell";
import { useAppTheme } from "@/contexts/app-theme";

export default function AcercaScreen() {
  const { theme } = useAppTheme();

  return (
    <ScreenShell title="Acerca de Stylens">
      <View style={[styles.heroCard, { backgroundColor: theme.surface }]}>
        <View style={[styles.heroIconWrap, { backgroundColor: theme.accent }]}>
          <Ionicons name="information-circle-outline" size={24} color="#fff" />
        </View>
        <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>Stylens</Text>
        <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>Versión 1.0.0</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Nuestra misión</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          Stylens utiliza inteligencia artificial avanzada para ayudarte a encontrar las prendas que amas.
          Con tecnología YOLOv8 y FashionCLIP, detectamos y analizamos prendas para ofrecer resultados de
          búsqueda visual relevantes.
        </Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}> 
          Nuestro objetivo es democratizar la moda y hacer que encontrar el estilo perfecto sea accesible para todos.
        </Text>
      </View>

      <View style={[styles.highlightCard, { backgroundColor: theme.accentSoft, borderColor: theme.accentSoftStrong }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Tecnología</Text>
        <View style={styles.featureRow}>
          <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
          <View style={styles.featureTextWrap}>
            <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>YOLOv8</Text>
            <Text style={[styles.featureText, { color: theme.textSecondary }]}>Detección de objetos en tiempo real de última generación.</Text>
          </View>
        </View>
        <View style={styles.featureRow}>
          <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
          <View style={styles.featureTextWrap}>
            <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>FashionCLIP</Text>
            <Text style={[styles.featureText, { color: theme.textSecondary }]}>Clasificación avanzada de moda con IA.</Text>
          </View>
        </View>
        <View style={styles.featureRow}>
          <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
          <View style={styles.featureTextWrap}>
            <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>React Native + Expo</Text>
            <Text style={[styles.featureText, { color: theme.textSecondary }]}>Interfaz moderna y responsive para móvil y web.</Text>
          </View>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.meta, { color: theme.textMuted }]}>© 2026 Stylens. Todos los derechos reservados.</Text>
        <View style={styles.linksRow}>
          <Pressable onPress={() => Alert.alert("Legal", "Términos de servicio")}> 
            <Text style={[styles.linkText, { color: theme.accent }]}>Términos</Text>
          </Pressable>
          <Pressable onPress={() => Alert.alert("Legal", "Política de privacidad")}> 
            <Text style={[styles.linkText, { color: theme.accent }]}>Privacidad</Text>
          </Pressable>
          <Pressable onPress={() => Alert.alert("Legal", "Política de cookies")}> 
            <Text style={[styles.linkText, { color: theme.accent }]}>Cookies</Text>
          </Pressable>
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    gap: 6,
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
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7c3aed",
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
  },
  text: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6b7280",
  },
  highlightCard: {
    backgroundColor: "#f5f3ff",
    borderWidth: 1,
    borderColor: "#ddd6fe",
    borderRadius: 18,
    padding: 18,
    gap: 10,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  featureTextWrap: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  featureText: {
    fontSize: 13,
    color: "#6b7280",
  },
  meta: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
  },
  linksRow: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  linkText: {
    color: "#7c3aed",
    fontSize: 13,
    fontWeight: "600",
  },
});
