import React from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AxiosError } from "axios";
import { sendSupportReport } from "@/api/support";
import { ScreenShell } from "@/components/screen-shell";
import { useAppTheme } from "@/contexts/app-theme";

export default function ContactoScreen() {
  const { theme } = useAppTheme();
  const [contactType, setContactType] = React.useState("Consulta comercial");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [newsletterEmail, setNewsletterEmail] = React.useState("");

  const handleSendContact = async () => {
    const trimmedType = contactType.trim();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedType) {
      Alert.alert("Falta información", "Selecciona un tipo de asunto.");
      return;
    }
    if (!trimmedSubject) {
      Alert.alert("Falta información", "Escribe un asunto para el mensaje.");
      return;
    }
    if (!trimmedMessage) {
      Alert.alert("Falta información", "Escribe tu mensaje antes de enviarlo.");
      return;
    }

    try {
      setIsSubmitting(true);
      await sendSupportReport({
        issueType: `Contacto - ${trimmedType}`,
        title: trimmedSubject,
        description: trimmedMessage,
        evidences: [],
      });

      setSubject("");
      setMessage("");
      setShowSuccessModal(true);
    } catch (error) {
      const fallback = "No se pudo enviar el mensaje. Inténtalo de nuevo.";
      const detail =
        error instanceof AxiosError && typeof error.response?.data?.detail === "string"
          ? error.response.data.detail
          : fallback;
      Alert.alert("Error", detail || fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenShell title="Contacto">
      <View style={[styles.card, { backgroundColor: theme.surface }]}> 
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Información de contacto</Text>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={18} color={theme.accent} />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Email de soporte</Text>
            <Text style={styles.infoValue}>support@stylens.com (ficticio, real: stylensgarcijuanjesus@gmail.com)</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="business-outline" size={18} color={theme.accent} />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Email comercial</Text>
            <Text style={styles.infoValue}>business@stylens.com (ficticio, real: stylensgarcijuanjesus@gmail.com)</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={18} color={theme.accent} />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Horario de atención</Text>
            <Text style={styles.infoValue}>Lun-Vie 9:00-18:00 (GMT+1)</Text>
          </View>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}> 
        <View style={styles.titleRow}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.textPrimary} />
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Formulario de contacto</Text>
        </View>
        <View style={styles.choiceList}>
          {[
            "Consulta comercial",
            "Sugerencia",
            "Colaboración",
            "Otro",
          ].map((item) => (
            <Pressable
              key={item}
              style={[
                styles.choiceItem,
                { borderColor: theme.border, backgroundColor: theme.surface },
                contactType === item && { borderColor: theme.accent, backgroundColor: theme.accentSoft },
              ]}
              onPress={() => setContactType(item)}
            >
              <Text
                style={[
                  styles.choiceText,
                  { color: theme.textSecondary },
                  contactType === item && { color: theme.accent, fontWeight: "700" },
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          value={subject}
          onChangeText={setSubject}
          placeholder="Asunto"
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.textPrimary }]}
        />

        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Tu mensaje..."
          placeholderTextColor={theme.textMuted}
          multiline
          style={[styles.textArea, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.textPrimary }]}
        />

        <Pressable
          style={[styles.btn, { backgroundColor: theme.accent }]}
          onPress={handleSendContact}
          disabled={isSubmitting}
        >
          <Ionicons name="send" size={16} color="#fff" />
          <Text style={styles.btnText}>{isSubmitting ? "Enviando..." : "Enviar mensaje"}</Text>
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}> 
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Síguenos en redes sociales</Text>
        <View style={styles.socialGrid}>
          {[
            { icon: "logo-instagram", name: "Instagram", color: "#db2777" },
            { icon: "logo-twitter", name: "Twitter", color: "#2563eb" },
            { icon: "logo-linkedin", name: "LinkedIn", color: "#1d4ed8" },
            { icon: "logo-youtube", name: "YouTube", color: "#dc2626" },
          ].map((s) => (
            <Pressable
              key={s.name}
              style={[styles.socialButton, { backgroundColor: s.color }]}
              onPress={() => Alert.alert("Red social", s.name)}
            >
              <Ionicons name={s.icon as any} size={18} color="#fff" />
              <Text style={styles.socialText}>{s.name}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.highlightCard, { backgroundColor: theme.accentSoft, borderColor: theme.accentSoftStrong }]}> 
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Colaboraciones y partnerships</Text>
        <Text style={styles.highlightItem}>Para marcas: partnerships@stylens.com</Text>
        <Text style={styles.highlightItem}>Para influencers: influencers@stylens.com</Text>
        <Text style={styles.highlightItem}>Para prensa: press@stylens.com</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}> 
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Newsletter</Text>
        <Text style={[styles.cardText, { color: theme.textSecondary }]}>Suscríbete para recibir novedades, tips de moda y actualizaciones.</Text>
        <TextInput
          value={newsletterEmail}
          onChangeText={setNewsletterEmail}
          placeholder="tu@email.com"
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.textPrimary }]}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Pressable
          style={[styles.secondaryBtn, { backgroundColor: theme.accent }]}
          onPress={() => {
            if (!newsletterEmail) {
              Alert.alert("Newsletter", "Introduce un email válido");
              return;
            }
            Alert.alert("Newsletter", "Suscripción completada");
          }}
        >
          <Text style={styles.secondaryBtnText}>Suscribirse</Text>
        </Pressable>
      </View>

      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <Pressable style={styles.successOverlay} onPress={() => setShowSuccessModal(false)}>
          <Pressable style={[styles.successCard, { backgroundColor: theme.surface }]} onPress={() => {}}>
            <Ionicons name="checkmark-circle" size={72} color="#22c55e" />
            <Text style={[styles.successText, { color: theme.textPrimary }]}>Se envio correctamente su mensaje.</Text>
            <Pressable
              style={[styles.successButton, { backgroundColor: theme.accent }]}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.successButtonText}>Aceptar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
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
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
  },
  cardText: {
    fontSize: 14,
    color: "#6b7280",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  infoTextWrap: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  infoValue: {
    fontSize: 14,
    color: "#6b7280",
  },
  input: {
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
  },
  choiceItemSelected: {
    borderColor: "#f9a8d4",
    backgroundColor: "#fdf2f8",
  },
  choiceText: {
    color: "#374151",
    fontSize: 14,
  },
  choiceTextSelected: {
    color: "#be185d",
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
  btn: {
    marginTop: 2,
    borderRadius: 14,
    backgroundColor: "#ec4899",
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
  },
  socialGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  socialButton: {
    width: "48%",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  socialText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  highlightCard: {
    backgroundColor: "#fdf2f8",
    borderWidth: 1,
    borderColor: "#f9a8d4",
    borderRadius: 18,
    padding: 18,
    gap: 8,
  },
  highlightItem: {
    color: "#9d174d",
    fontSize: 14,
  },
  secondaryBtn: {
    borderRadius: 12,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
  },
  secondaryBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  successCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: "center",
    gap: 14,
  },
  successText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  successButton: {
    marginTop: 4,
    minWidth: 120,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  successButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
