import React, { useEffect, useRef, useState } from "react";
import {
	View,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	Animated,
	ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/contexts/app-theme";
import { PublicOnlyRoute } from "@/lib/auth-guards";
import apiClient from "@/api/client";

export default function RegistroPage() {
	const router = useRouter();
	const { theme } = useAppTheme();

	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [otp, setOtp] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [isOtpStep, setIsOtpStep] = useState(false);
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const translateAnim = useRef(new Animated.Value(12)).current;

	const inputSurface = theme.surface;
	const inputBorder = theme.accentSoftStrong;
	const labelColor = theme.textSecondary;
	const textColor = theme.textPrimary;
	const mutedColor = theme.textMuted;

	const onRegisterPress = async () => {
		void username;
		void password;

		if (!email.trim()) {
			setErrorMessage("El correo electrónico es obligatorio.");
			return;
		}

		setErrorMessage("");
		setIsSubmitting(true);

		try {
			await apiClient.post("/api/v1/auth/request-register-otp", {
				email: email.trim(),
			});
			setIsOtpStep(true);
		} catch (error: unknown) {
			const detail =
				typeof error === "object" && error !== null && "response" in error
					? (error as any).response?.data?.detail
					: null;
			setErrorMessage(detail || "No se pudo enviar el código OTP. Inténtalo de nuevo.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const onVerifyPress = async () => {
		if (!otp.trim()) {
			setErrorMessage("El código OTP es obligatorio.");
			return;
		}

		setErrorMessage("");
		setIsSubmitting(true);

		try {
			await apiClient.post("/api/v1/auth/verify-otp", {
				email: email.trim(),
				otp: otp.trim(),
				message: "register request",
			});

			await apiClient.post("/api/user/register", {
				nombre_usuario: username.trim(),
				email: email.trim(),
				password,
			});

			router.replace("/sign-in");
		} catch (error: unknown) {
			const detail =
				typeof error === "object" && error !== null && "response" in error
					? (error as any).response?.data?.detail
					: null;
			setErrorMessage(detail || "No se pudo verificar el código. Inténtalo de nuevo.");
		} finally {
			setIsSubmitting(false);
		}
	};

	useEffect(() => {
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 700,
				useNativeDriver: false,
			}),
			Animated.timing(translateAnim, {
				toValue: 0,
				duration: 700,
				useNativeDriver: false,
			}),
		]).start();
	}, [fadeAnim, translateAnim]);

	return (
		<PublicOnlyRoute>
			<KeyboardAvoidingView
				style={styles.root}
				behavior={Platform.select({ ios: "padding", android: "height" })}
			>
				<Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
					<Pressable style={StyleSheet.absoluteFill} onPress={() => router.back()} />
				</Animated.View>

				<Animated.View
					style={[
						styles.centeredContainer,
						{ opacity: fadeAnim, transform: [{ translateY: translateAnim }], pointerEvents: "box-none" },
					]}
				>
					<View style={[styles.card, { backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}>
						<TouchableOpacity
							style={[styles.closeButton, { backgroundColor: theme.accent }]}
							onPress={() => router.back()}
						>
							<ThemedText style={[styles.closeButtonText, { color: theme.onAccent }]}>Volver</ThemedText>
						</TouchableOpacity>

						{!isOtpStep ? (
							<>
								<ThemedText type="title" style={[styles.title, { color: theme.textPrimary }]}>Crear cuenta</ThemedText>
								<ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>Regístrate para empezar a usar Stylens.</ThemedText>

								<View style={[styles.inputGroup, { backgroundColor: inputSurface, borderColor: inputBorder }]}>
									<ThemedText style={[styles.inputLabel, { color: labelColor }]}>Nombre de usuario</ThemedText>
									<TextInput
										style={[styles.input, { color: textColor }]}
										value={username}
										placeholder="Tu nombre"
										placeholderTextColor={mutedColor}
										autoCapitalize="words"
										textContentType="username"
										onChangeText={setUsername}
									/>
								</View>

								<View style={[styles.inputGroup, { backgroundColor: inputSurface, borderColor: inputBorder }]}>
									<ThemedText style={[styles.inputLabel, { color: labelColor }]}>Correo electrónico</ThemedText>
									<TextInput
										style={[styles.input, { color: textColor }]}
										value={email}
										placeholder="usuario@ejemplo.com"
										placeholderTextColor={mutedColor}
										autoCapitalize="none"
										keyboardType="email-address"
										textContentType="emailAddress"
										onChangeText={setEmail}
									/>
								</View>

								<View style={[styles.inputGroup, { backgroundColor: inputSurface, borderColor: inputBorder }]}>
									<ThemedText style={[styles.inputLabel, { color: labelColor }]}>Contraseña</ThemedText>
									<TextInput
										style={[styles.input, { color: textColor }]}
										value={password}
										placeholder="••••••••"
										placeholderTextColor={mutedColor}
										secureTextEntry
										textContentType="newPassword"
										onChangeText={setPassword}
									/>
								</View>

								{errorMessage ? (
									<ThemedText style={[styles.errorText, { color: theme.danger }]}>{errorMessage}</ThemedText>
								) : null}

								<TouchableOpacity
									style={[styles.registerButton, { backgroundColor: theme.accent }]}
									onPress={onRegisterPress}
									disabled={isSubmitting}
								>
									{isSubmitting ? (
										<ActivityIndicator color={theme.onAccent} />
									) : (
										<ThemedText style={[styles.registerButtonText, { color: theme.onAccent }]}>Registrarse</ThemedText>
									)}
								</TouchableOpacity>
							</>
						) : (
							<>
								<ThemedText type="title" style={[styles.title, { color: theme.textPrimary }]}>Verifica tu correo</ThemedText>
								<ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>Introduce el código OTP enviado a {email.trim()}.</ThemedText>

								<View style={[styles.inputGroup, { backgroundColor: inputSurface, borderColor: inputBorder }]}>
									<ThemedText style={[styles.inputLabel, { color: labelColor }]}>Código OTP</ThemedText>
									<TextInput
										style={[styles.input, { color: textColor }]}
										value={otp}
										placeholder="000000"
										placeholderTextColor={mutedColor}
										keyboardType="number-pad"
										textContentType="oneTimeCode"
										autoCapitalize="none"
										onChangeText={setOtp}
									/>
								</View>

								{errorMessage ? (
									<ThemedText style={[styles.errorText, { color: theme.danger }]}>{errorMessage}</ThemedText>
								) : null}

								<TouchableOpacity
									style={[styles.registerButton, { backgroundColor: theme.accent }]}
									onPress={onVerifyPress}
									disabled={isSubmitting}
								>
									{isSubmitting ? (
										<ActivityIndicator color={theme.onAccent} />
									) : (
										<ThemedText style={[styles.registerButtonText, { color: theme.onAccent }]}>Verificar</ThemedText>
									)}
								</TouchableOpacity>
							</>
						)}
					</View>
				</Animated.View>
			</KeyboardAvoidingView>
		</PublicOnlyRoute>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	backdrop: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0,0,0,0.46)",
	},
	centeredContainer: {
		flex: 1,
		justifyContent: "center",
		paddingHorizontal: 16,
	},
	card: {
		borderRadius: 22,
		padding: 20,
		paddingTop: 44,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.25)",
		shadowColor: "#000",
		shadowOpacity: 0.22,
		shadowRadius: 18,
		shadowOffset: { width: 0, height: 10 },
		elevation: 10,
		position: "relative",
	},
	closeButton: {
		position: "absolute",
		top: 12,
		right: 12,
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 10,
	},
	closeButtonText: {
		fontSize: 12,
		fontWeight: "700",
	},
	title: {
		marginBottom: 6,
	},
	subtitle: {
		marginBottom: 16,
	},
	inputGroup: {
		borderWidth: 1.5,
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
		marginBottom: 12,
		fontSize: 14,
	},
	registerButton: {
		marginTop: 4,
		borderRadius: 14,
		paddingVertical: 14,
		alignItems: "center",
	},
	registerButtonText: {
		fontSize: 16,
		fontWeight: "700",
	},
});
