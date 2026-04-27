import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAppTheme } from "@/contexts/app-theme";
import { useAuthStore } from "@/store/authStore";
import apiClient from "@/api/client";
import { ThemedText } from "@/components/themed-text";
import { PublicOnlyRoute } from "@/app/lib/auth-guards";

export default function SignInPage() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { token, setToken, setUser } = useAuthStore((state) => ({
    token: state.token,
    setToken: state.setToken,
    setUser: state.setUser,
  }));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (token) {
      router.replace("/");
    }
  }, [token, router]);

  const toErrorMessage = (error: unknown) => {
    if (typeof error === "string") return error;
    if (error instanceof Error) return error.message;
    return "Ocurrió un error inesperado. Revise sus credenciales e intentelo de nuevo.";
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMessage("El correo y la contraseña son obligatorios.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await apiClient.post("/api/v1/auth/login", {
        email: email.trim(),
        password,
      });

      setToken(response.data.access_token);

      const profileResponse = await apiClient.get("/api/v1/auth/me");
      setUser(profileResponse.data);
      router.replace("/");
    } catch (error: unknown) {
      const detail =
        typeof error === "object" && error !== null && "response" in error
          ? (error as any).response?.data?.detail
          : null;
      setErrorMessage(detail || toErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicOnlyRoute>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.appBackground }]}> 
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.select({ ios: "padding", android: undefined })}
        >
          <LinearGradient
            colors={theme.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <ThemedText type="title" style={styles.heroTitle}>
              Stylens
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.heroSubtitle}>
              Inicia sesión y explora tu tablero.
            </ThemedText>
          </LinearGradient>

          <View style={[styles.box, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Inicio de sesión
            </ThemedText>
            <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}> 
              Accede con tu correo y contraseña para continuar.
            </ThemedText>

            <View style={[styles.inputGroup, { backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}> 
              <ThemedText style={styles.inputLabel}>Correo electrónico</ThemedText>
              <TextInput
                style={[styles.input, { color: theme.textPrimary }]}
                value={email}
                placeholder="usuario@ejemplo.com"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="username"
                onChangeText={setEmail}
              />
            </View>

            <View style={[styles.inputGroup, { backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}> 
              <ThemedText style={styles.inputLabel}>Contraseña</ThemedText>
              <TextInput
                style={[styles.input, { color: theme.textPrimary }]}
                value={password}
                placeholder="••••••••"
                placeholderTextColor={theme.textMuted}
                secureTextEntry
                textContentType="password"
                onChangeText={setPassword}
              />
            </View>

            {errorMessage ? (
              <ThemedText style={[styles.errorText, { color: theme.danger }]}>
                {errorMessage}
              </ThemedText>
            ) : null}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.accent }]}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={theme.onAccent} />
              ) : (
                <ThemedText style={[styles.buttonText, { color: theme.onAccent }]}>Entrar</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PublicOnlyRoute>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  hero: {
    padding: 28,
    paddingTop: 56,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroTitle: {
    color: "#fff",
    marginBottom: 8,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    maxWidth: 260,
  },
  box: {
    margin: 16,
    marginTop: -48,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  sectionTitle: {
    marginBottom: 6,
  },
  sectionSubtitle: {
    marginBottom: 24,
  },
  inputGroup: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 10,
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    fontSize: 16,
    minHeight: 44,
    padding: 0,
  },
  errorText: {
    marginBottom: 16,
    fontSize: 14,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
