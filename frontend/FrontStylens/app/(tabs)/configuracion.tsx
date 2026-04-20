import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenShell } from "@/components/screen-shell";
import { useAppTheme } from "@/contexts/app-theme";

export default function ConfiguracionScreen() {
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [country, setCountry] = useState("España");
  const [currency, setCurrency] = useState("EUR (€)");
  const [aiSensitivity, setAiSensitivity] = useState("Media - Balanceado");
  const [includeSimilar, setIncludeSimilar] = useState(true);

  const [saveHistory, setSaveHistory] = useState(true);
  const [shareForAi, setShareForAi] = useState(false);

  const [priceAlerts, setPriceAlerts] = useState(true);
  const [similarAlerts, setSimilarAlerts] = useState(false);
  const [promoAlerts, setPromoAlerts] = useState(false);

  const [language, setLanguage] = useState("Espanol");
  const [fontSize, setFontSize] = useState("Mediano");
  const { theme, themes, selectedThemeId, setSelectedThemeId } = useAppTheme();

  const ChoiceRow = ({
    label,
    selected,
    onPress,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={[
        styles.choiceItem,
        { borderColor: theme.border, backgroundColor: theme.surface },
        selected && { borderColor: theme.accent, backgroundColor: theme.accentSoft },
      ]}
    >
      <Text
        style={[
          styles.choiceItemText,
          { color: theme.textSecondary },
          selected && { color: theme.accent, fontWeight: "600" },
        ]}
      >
        {label}
      </Text>
      {selected && <Ionicons name="checkmark-circle" size={18} color={theme.accent} />}
    </Pressable>
  );

  return (
    <ScreenShell title="Configuracion">
      <ScrollView contentContainerStyle={styles.stack}>
        <View style={[styles.card, { backgroundColor: theme.surface }]}> 
          <View style={styles.sectionTitleRow}>
            <Ionicons name="search" size={18} color={theme.textPrimary} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Preferencias de busqueda</Text>
          </View>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Rango de precios</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={priceMin}
              onChangeText={setPriceMin}
              placeholder="Min"
              keyboardType="numeric"
              style={styles.input}
              placeholderTextColor={theme.textMuted}
            />
            <TextInput
              value={priceMax}
              onChangeText={setPriceMax}
              placeholder="Max"
              keyboardType="numeric"
              style={styles.input}
              placeholderTextColor={theme.textMuted}
            />
          </View>

          <Text style={styles.label}>Ubicacion/Pais</Text>
          <View style={styles.choiceList}>
            {["España", "México", "Argentina", "Colombia"].map((item) => (
              <ChoiceRow
                key={item}
                label={item}
                selected={country === item}
                onPress={() => setCountry(item)}
              />
            ))}
          </View>

          <Text style={styles.label}>Divisa preferida</Text>
          <View style={styles.choiceList}>
            {["EUR (€)", "USD ($)", "GBP (£)", "MXN ($)"].map((item) => (
              <ChoiceRow
                key={item}
                label={item}
                selected={currency === item}
                onPress={() => setCurrency(item)}
              />
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}> 
          <View style={styles.sectionTitleRow}>
            <Ionicons name="bulb-outline" size={18} color={theme.textPrimary} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Configuracion de IA</Text>
          </View>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Sensibilidad de deteccion</Text>
          <View style={styles.choiceList}>
            {["Alta - Coincidencias exactas", "Media - Balanceado", "Baja - Mas variaciones"].map((item) => (
              <ChoiceRow
                key={item}
                label={item}
                selected={aiSensitivity === item}
                onPress={() => setAiSensitivity(item)}
              />
            ))}
          </View>
          <View style={styles.switchRow}>
            <Text style={[styles.switchText, { color: theme.textSecondary }]}>Buscar productos similares ademas de identicos</Text>
            <Switch value={includeSimilar} onValueChange={setIncludeSimilar} />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}> 
          <View style={styles.sectionTitleRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color={theme.textPrimary} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Privacidad y datos</Text>
          </View>
          <View style={styles.switchRow}>
            <Text style={[styles.switchText, { color: theme.textSecondary }]}>Guardar historial de busquedas</Text>
            <Switch value={saveHistory} onValueChange={setSaveHistory} />
          </View>
          <View style={styles.switchRow}>
            <Text style={[styles.switchText, { color: theme.textSecondary }]}>Compartir datos para mejorar IA</Text>
            <Switch value={shareForAi} onValueChange={setShareForAi} />
          </View>
          <Pressable
            style={styles.dangerButton}
            onPress={() => Alert.alert("Historial", "Se ha eliminado todo el historial.")}
          >
            <Ionicons name="trash-outline" size={16} color="#dc2626" />
            <Text style={styles.dangerText}>Eliminar todo el historial</Text>
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}> 
          <View style={styles.sectionTitleRow}>
            <Ionicons name="notifications-outline" size={18} color={theme.textPrimary} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Notificaciones</Text>
          </View>
          <View style={styles.switchRow}>
            <Text style={[styles.switchText, { color: theme.textSecondary }]}>Alertas de precio en favoritos</Text>
            <Switch value={priceAlerts} onValueChange={setPriceAlerts} />
          </View>
          <View style={styles.switchRow}>
            <Text style={[styles.switchText, { color: theme.textSecondary }]}>Nuevos productos similares</Text>
            <Switch value={similarAlerts} onValueChange={setSimilarAlerts} />
          </View>
          <View style={styles.switchRow}>
            <Text style={[styles.switchText, { color: theme.textSecondary }]}>Ofertas y promociones</Text>
            <Switch value={promoAlerts} onValueChange={setPromoAlerts} />
          </View>
        </View>

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

          <Text style={[styles.label, { color: theme.textSecondary }]}>Idioma</Text>
          <View style={styles.choiceList}>
            {["Espanol", "English", "Francais"].map((item) => (
              <ChoiceRow
                key={item}
                label={item}
                selected={language === item}
                onPress={() => setLanguage(item)}
              />
            ))}
          </View>

          <Text style={[styles.label, { color: theme.textSecondary }]}>Tamano de fuente</Text>
          <View style={styles.choiceList}>
            {["Pequeno", "Mediano", "Grande"].map((item) => (
              <ChoiceRow
                key={item}
                label={item}
                selected={fontSize === item}
                onPress={() => setFontSize(item)}
              />
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}> 
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Avanzado</Text>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => Alert.alert("Consejos", "Las recomendaciones se mostraran nuevamente.")}
          >
            <Text style={styles.secondaryButtonText}>Restablecer consejos de recomendaciones</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => Alert.alert("Cache", "Cache limpiada correctamente.")}
          >
            <Text style={styles.secondaryButtonText}>Limpiar cache</Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.saveButton, { backgroundColor: theme.accent }]}
          onPress={() => Alert.alert("Configuracion", "Cambios guardados.")}
        >
          <Text style={styles.saveButtonText}>Guardar cambios</Text>
        </Pressable>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 12,
    paddingBottom: 24,
  },
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  choiceItemSelected: {
    borderColor: "#c4b5fd",
    backgroundColor: "#f5f3ff",
  },
  choiceItemText: {
    color: "#374151",
    fontSize: 14,
    flex: 1,
  },
  choiceItemTextSelected: {
    color: "#5b21b6",
    fontWeight: "600",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  switchText: {
    flex: 1,
    color: "#374151",
    fontSize: 14,
    lineHeight: 20,
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
  themeCardSelected: {
    borderColor: "#a78bfa",
    backgroundColor: "#faf5ff",
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
});
