import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAppTheme } from "@/contexts/app-theme";
import { useAuthStore, AuthState } from '@/store/authStore';
import apiClient from "@/api/client";
import { ThemedText } from "@/components/themed-text";
import { PublicOnlyRoute } from "@/lib/auth-guards";
import { SignInBackgroundCarousel } from "@/components/sign-in-background-carousel";
import { SIGN_IN_CAROUSEL_IMAGES } from "@/constants/sign-in-carousel-images";

export default function SignInPage() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const setToken = useAuthStore((state: AuthState) => state.setToken);
  const setUser = useAuthStore((state: AuthState) => state.setUser);
  const heroColors = theme.gradient;
  const inputSurface = "rgba(255,255,255,0.50)";
  const inputBorder = "rgba(255,255,255,0.60)";
  const headingColor = "#22181f";
  const bodyColor = "rgba(44,31,41,0.9)";
  const labelColor = "rgba(34,24,31,0.92)";
  const mutedColor = "rgba(73,54,68,0.62)";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

      const accessToken: string = response.data.access_token;

      // Validamos el token recibido antes de persistir sesión global y redirigir.
      const profileResponse = await apiClient.get("/api/v1/auth/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setToken(accessToken);
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
        <SignInBackgroundCarousel images={SIGN_IN_CAROUSEL_IMAGES} />
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.select({ ios: "padding", android: "height" })}
          keyboardVerticalOffset={Platform.select({ ios: 8, android: 0 })}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <LinearGradient
              colors={heroColors}
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

            <View
              style={[
                styles.box,
                {
                  backgroundColor: "transparent",
                  borderColor: "transparent",
                },
              ]}
            >
              <View
                style={[
                  styles.inputGroup,
                  {
                    backgroundColor: inputSurface,
                    borderColor: inputBorder,
                  },
                ]}
              >
                <ThemedText style={[styles.inputLabel, { color: labelColor }]}>Correo electrónico</ThemedText>
                <TextInput
                  style={[styles.input, { color: headingColor }]}
                  value={email}
                  placeholder="usuario@ejemplo.com"
                  placeholderTextColor={mutedColor}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  textContentType="username"
                  onChangeText={setEmail}
                />
              </View>

              <View
                style={[
                  styles.inputGroup,
                  {
                    backgroundColor: inputSurface,
                    borderColor: inputBorder,
                  },
                ]}
              >
                <ThemedText style={[styles.inputLabel, { color: labelColor }]}>Contraseña</ThemedText>
                <TextInput
                  style={[styles.input, { color: headingColor }]}
                  value={password}
                  placeholder="••••••••"
                  placeholderTextColor={mutedColor}
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
          </ScrollView>
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
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  hero: {
    padding: 28,
    paddingTop: 56,
    marginTop: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  heroTitle: {
    color: "#fff",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    maxWidth: 260,
    textShadowColor: "rgba(0,0,0,0.22)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  box: {
    margin: 16,
    marginTop: 8,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  sectionTitle: {
    marginBottom: 6,
    textShadowColor: "rgba(255,255,255,0.16)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  sectionSubtitle: {
    marginBottom: 24,
    textShadowColor: "rgba(255,255,255,0.14)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  inputGroup: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
  },
  inputLabel: {
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    fontSize: 15,
    minHeight: 36,
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
