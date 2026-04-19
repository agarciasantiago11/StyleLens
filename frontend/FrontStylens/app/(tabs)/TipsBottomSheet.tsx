import React, { useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const TIPS = [
  {
    icon: "checkmark-circle",
    color: "#22c55e",
    title: "Iluminación clara y uniforme",
    desc: "Usa luz natural o artificial brillante para evitar sombras que dificulten la detección.",
    warning: false,
  },
  {
    icon: "checkmark-circle",
    color: "#22c55e",
    title: "Fondo simple y neutro",
    desc: "Coloca la prenda sobre un fondo liso (blanco, gris o negro) para mejorar la precisión.",
    warning: false,
  },
  {
    icon: "checkmark-circle",
    color: "#22c55e",
    title: "Prenda completa en el encuadre",
    desc: "Asegúrate de que toda la prenda sea visible sin cortes en los bordes.",
    warning: false,
  },
  {
    icon: "checkmark-circle",
    color: "#22c55e",
    title: "Una prenda a la vez",
    desc: "Para mejores resultados, fotografía cada prenda por separado.",
    warning: false,
  },
  {
    icon: "checkmark-circle",
    color: "#22c55e",
    title: "Prenda extendida y sin arrugas",
    desc: "Estira la prenda para mostrar su forma y detalles claramente.",
    warning: false,
  },
  {
    icon: "alert-circle",
    color: "#f97316",
    title: "Evita reflejos y brillos",
    desc: "Los materiales brillantes pueden confundir el sistema; usa iluminación indirecta.",
    warning: true,
  },
];

export type TipsBottomSheetRef = {
  open: () => void;
  close: () => void;
};

type Props = {
  onContinue: () => void;
  onBack: () => void;
};

const TipsBottomSheet = forwardRef<TipsBottomSheetRef, Props>(
  ({ onContinue, onBack }, ref) => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const [dontShow, setDontShow] = React.useState(false);

    useImperativeHandle(ref, () => ({
      open: () => bottomSheetRef.current?.expand(),
      close: () => bottomSheetRef.current?.close(),
    }));

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
      ),
      []
    );

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={["92%"]}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.indicator}
        backgroundStyle={styles.sheetBackground}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero icon */}
          <View style={styles.heroIconWrapper}>
            <LinearGradient
              colors={["#f97316", "#fbbf24"]}
              style={styles.heroIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="bulb" size={28} color="#fff" />
            </LinearGradient>
          </View>

          <Text style={styles.title}>Consejos para mejores resultados</Text>
          <Text style={styles.subtitle}>
            Nuestro sistema usa IA avanzada (YOLOv8 + FashionCLIP) para detectar y analizar
            prendas. Sigue estas recomendaciones para resultados óptimos:
          </Text>

          {/* Tips grid */}
          <View style={styles.grid}>
            {TIPS.map((tip) => (
              <View key={tip.title} style={styles.tipCard}>
                <Ionicons name={tip.icon as any} size={20} color={tip.color} />
                <View style={styles.tipText}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Text style={styles.tipDesc}>{tip.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Info banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={18} color="#6366f1" />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Tecnología de detección inteligente</Text>
              <Text style={styles.infoDesc}>
                Utilizamos YOLOv8 para detectar prendas en tiempo real y FashionCLIP para
                clasificar tipos, colores, estilos y características específicas de cada
                prenda de forma automática.
              </Text>
            </View>
          </View>

          {/* Checkbox */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setDontShow(!dontShow)}
          >
            <View style={[styles.checkbox, dontShow && styles.checkboxChecked]}>
              {dontShow && <Ionicons name="checkmark" size={12} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>No volver a mostrar estas recomendaciones</Text>
          </TouchableOpacity>

          {/* Buttons */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                bottomSheetRef.current?.close();
                onBack();
              }}
            >
              <Text style={styles.secondaryButtonText}>Volver</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                bottomSheetRef.current?.close();
                onContinue();
              }}
            >
              <LinearGradient
                colors={["#a855f7", "#ec4899"]}
                style={styles.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.primaryButtonText}>Entendido, continuar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

export default TipsBottomSheet;

const styles = StyleSheet.create({
  indicator: {
    backgroundColor: "#d1d5db",
    width: 40,
  },
  sheetBackground: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroIconWrapper: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 12,
    width: "48%",
  },
  tipText: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111",
    marginBottom: 4,
  },
  tipDesc: {
    fontSize: 11,
    color: "#6b7280",
    lineHeight: 16,
  },
  infoBanner: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#eef2ff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4338ca",
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 12,
    color: "#6366f1",
    lineHeight: 18,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#a855f7",
    borderColor: "#a855f7",
  },
  checkboxLabel: {
    fontSize: 13,
    color: "#374151",
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 8,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  primaryButton: {
    flex: 2,
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
});