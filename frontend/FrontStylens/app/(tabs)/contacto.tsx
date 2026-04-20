import React from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenShell } from "@/components/screen-shell";
import { useAppTheme } from "@/contexts/app-theme";

export default function ContactoScreen() {
  const { theme } = useAppTheme();
  const [subject, setSubject] = React.useState("Selecciona un asunto");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [newsletter, setNewsletter] = React.useState(false);
  const [newsletterEmail, setNewsletterEmail] = React.useState("");

  return (
    <ScreenShell title="Contacto">
      <View style={[styles.card, { backgroundColor: theme.surface }]}> 
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Informacion de contacto</Text>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={18} color={theme.accent} />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Email de soporte</Text>
            <Text style={styles.infoValue}>support@stylens.com</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="business-outline" size={18} color={theme.accent} />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Email comercial</Text>
            <Text style={styles.infoValue}>business@stylens.com</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={18} color={theme.accent} />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Horario de atencion</Text>
            <Text style={styles.infoValue}>Lun-Vie 9:00-18:00 (GMT+1)</Text>
          </View>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}> 
        <View style={styles.titleRow}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.textPrimary} />
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Formulario de contacto</Text>
        </View>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nombre completo"
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.textPrimary }]}
        />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email de contacto"
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.textPrimary }]}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.choiceList}>
          {[
            "Selecciona un asunto",
            "Soporte tecnico",
            "Consulta comercial",
            "Sugerencia",
            "Colaboracion",
            "Otro",
          ].map((item) => (
            <Pressable
              key={item}
              style={[
                styles.choiceItem,
                { borderColor: theme.border, backgroundColor: theme.surface },
                subject === item && { borderColor: theme.accent, backgroundColor: theme.accentSoft },
              ]}
              onPress={() => setSubject(item)}
            >
              <Text
                style={[
                  styles.choiceText,
                  { color: theme.textSecondary },
                  subject === item && { color: theme.accent, fontWeight: "700" },
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Tu mensaje..."
          placeholderTextColor={theme.textMuted}
          multiline
          style={[styles.textArea, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.textPrimary }]}
        />

        <Pressable style={styles.checkboxRow} onPress={() => setNewsletter((v) => !v)}>
          <View style={[styles.checkbox, newsletter && styles.checkboxChecked]}>
            {newsletter && <Ionicons name="checkmark" size={12} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>Deseo recibir actualizaciones y novedades</Text>
        </Pressable>

        <Pressable
          style={[styles.btn, { backgroundColor: theme.accent }]}
          onPress={() => Alert.alert("Contacto", "Mensaje enviado correctamente")}
        >
          <Ionicons name="send" size={16} color="#fff" />
          <Text style={styles.btnText}>Enviar mensaje</Text>
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}> 
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Siguenos en redes sociales</Text>
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
        <Text style={[styles.cardText, { color: theme.textSecondary }]}>Suscribete para recibir novedades, tips de moda y actualizaciones.</Text>
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
              Alert.alert("Newsletter", "Introduce un email valido");
              return;
            }
            Alert.alert("Newsletter", "Suscripcion completada");
          }}
        >
          <Text style={styles.secondaryBtnText}>Suscribirse</Text>
        </Pressable>
      </View>
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
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
    borderColor: "#db2777",
    backgroundColor: "#db2777",
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: "#6b7280",
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
});
