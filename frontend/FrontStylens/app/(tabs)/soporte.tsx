import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenShell } from "@/components/screen-shell";
import { useAppTheme } from "@/contexts/app-theme";

export default function SoporteScreen() {
  const { theme } = useAppTheme();
  const [query, setQuery] = useState("");
  const [issueType, setIssueType] = useState("Tipo de problema");
  const [issueText, setIssueText] = useState("");

  const faqItems = [
    "¿Cómo funciona la detección de prendas?",
    "¿Por qué no se detecta mi prenda?",
    "¿Los productos son oficiales?",
    "¿Puedo buscar accesorios además de ropa?",
    "¿Los precios están actualizados?",
    "¿Funciona offline?",
  ];

  const tutorials = [
    "Guía de inicio rápido",
    "Mejores prácticas de fotografía",
    "Cómo usar favoritos",
    "Interpretar resultados",
  ];

  const issues = [
    "La cámara no funciona",
    "Las imágenes no se suben",
    "Resultados incorrectos",
    "Errores de conexión",
    "Aplicación lenta",
  ];

  return (
    <ScreenShell title="Soporte">
      <View style={[styles.heroCard, { backgroundColor: theme.surface }]}> 
        <View style={[styles.heroIconWrap, { backgroundColor: theme.accent }]}> 
          <Ionicons name="headset-outline" size={24} color="#fff" />
        </View>
        <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>Centro de soporte</Text>
        <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>¿Cómo podemos ayudarte?</Text>
      </View>

      <View style={[styles.searchWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
        <Ionicons name="search" size={18} color={theme.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar en la ayuda..."
          placeholderTextColor={theme.textMuted}
          style={[styles.searchInput, { color: theme.textPrimary }]}
        />
      </View>

      <View style={styles.cardSuccess}>
        <View style={styles.row}>
          <View style={styles.dot} />
          <Text style={styles.statusTitle}>Estado del sistema</Text>
        </View>
        <Text style={styles.statusText}>Todos los sistemas operativos - Sin incidencias</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}> 
        <View style={styles.row}>
          <Ionicons name="help-circle-outline" size={20} color={theme.textPrimary} />
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Preguntas frecuentes</Text>
        </View>
        <View style={styles.listBlock}>
          {faqItems.map((q) => (
            <Pressable
              key={q}
              style={styles.listItem}
              onPress={() => Alert.alert("FAQ", q)}
            >
              <Text style={styles.listText}>{q}</Text>
              <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}> 
        <View style={styles.row}>
          <Ionicons name="bulb-outline" size={20} color={theme.textPrimary} />
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Tutoriales y guías</Text>
        </View>
        <View style={styles.listBlock}>
          {tutorials.map((t) => (
            <Pressable
              key={t}
              style={styles.softItem}
              onPress={() => Alert.alert("Tutorial", t)}
            >
              <Ionicons name="play-circle-outline" size={18} color={theme.accent} />
              <Text style={styles.softText}>{t}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}> 
        <View style={styles.row}>
          <Ionicons name="alert-circle-outline" size={20} color={theme.textPrimary} />
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Solución de problemas</Text>
        </View>
        <View style={styles.listBlock}>
          {issues.map((i) => (
            <Pressable key={i} style={styles.warnItem} onPress={() => Alert.alert("Problema", i)}>
              <Text style={styles.warnText}>{i}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}> 
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Reportar un problema</Text>
        <View style={styles.choiceList}>
          {[
            "Tipo de problema",
            "Bug técnico",
            "Error en resultados",
            "Problema de rendimiento",
            "Otro",
          ].map((item) => (
            <Pressable
              key={item}
              style={[styles.choiceItem, issueType === item && styles.choiceItemSelected]}
              onPress={() => setIssueType(item)}
            >
              <Text style={[styles.choiceText, issueType === item && styles.choiceTextSelected]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          value={issueText}
          onChangeText={setIssueText}
          placeholder="Describe el problema..."
          placeholderTextColor={theme.textMuted}
          multiline
          style={[styles.textArea, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.textPrimary }]}
        />

        <Pressable
          style={[styles.primaryButton, { backgroundColor: theme.accent }]}
          onPress={() => Alert.alert("Reporte", "Reporte enviado correctamente")}
        >
          <Ionicons name="send" size={16} color="#fff" />
          <Text style={styles.primaryButtonText}>Enviar reporte</Text>
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
    backgroundColor: "#06b6d4",
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
  searchWrap: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: "#111",
    fontSize: 14,
  },
  cardSuccess: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    borderRadius: 18,
    padding: 18,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#22c55e",
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#065f46",
  },
  statusText: {
    fontSize: 14,
    color: "#047857",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  cardText: {
    fontSize: 14,
    color: "#6b7280",
  },
  listBlock: {
    gap: 8,
  },
  listItem: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  listText: {
    flex: 1,
    color: "#374151",
    fontSize: 14,
  },
  softItem: {
    borderWidth: 1,
    borderColor: "#ddd6fe",
    borderRadius: 12,
    backgroundColor: "#faf5ff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  softText: {
    color: "#5b21b6",
    fontSize: 14,
    fontWeight: "600",
  },
  warnItem: {
    borderWidth: 1,
    borderColor: "#fed7aa",
    borderRadius: 12,
    backgroundColor: "#fff7ed",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  warnText: {
    color: "#9a3412",
    fontSize: 14,
  },
  choiceList: {
    gap: 8,
  },
  choiceItem: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  choiceItemSelected: {
    borderColor: "#7dd3fc",
    backgroundColor: "#ecfeff",
  },
  choiceText: {
    color: "#374151",
    fontSize: 14,
  },
  choiceTextSelected: {
    color: "#0e7490",
    fontWeight: "700",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 110,
    textAlignVertical: "top",
    color: "#111",
  },
  primaryButton: {
    backgroundColor: "#06b6d4",
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});