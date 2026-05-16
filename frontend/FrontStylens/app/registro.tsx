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
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/contexts/app-theme";
import { PublicOnlyRoute } from "@/lib/auth-guards";
import apiClient from "@/api/client";

type RegisterStep = "form" | "otp" | "result";

export default function RegistroPage() {
	const router = useRouter();
	const { theme } = useAppTheme();

	const [step, setStep] = useState<RegisterStep>("form");
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [confirmEmail, setConfirmEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [otp, setOtp] = useState("");
	const [registerSuccess, setRegisterSuccess] = useState<boolean | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const translateAnim = useRef(new Animated.Value(12)).current;

	const inputSurface = theme.surface;
	const inputBorder = theme.accentSoftStrong;
	const labelColor = theme.textSecondary;
	const textColor = theme.textPrimary;
	const mutedColor = theme.textMuted;

	const onRegisterPress = async () => {
		if (!username.trim()) {
			setErrorMessage("El nombre de usuario es obligatorio.");
			return;
		}

		if (!email.trim()) {
			setErrorMessage("El correo electrónico es obligatorio.");
			return;
		}

		if (!confirmEmail.trim()) {
			setErrorMessage("Repite tu correo electrónico.");
			return;
		}

		if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
			setErrorMessage("Los correos electrónicos no coinciden.");
			return;
		}

		if (!password) {
			setErrorMessage("La contraseña es obligatoria.");
			return;
		}

		if (!confirmPassword) {
			setErrorMessage("Repite tu contraseña.");
			return;
		}

		if (password !== confirmPassword) {
			setErrorMessage("Las contraseñas no coinciden.");
			return;
		}

		setErrorMessage("");
		setIsSubmitting(true);

		try {
			await apiClient.post("/api/v1/auth/request-register-otp", {
				email: email.trim(),
			});
			setStep("otp");
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

			setRegisterSuccess(true);
			setStep("result");
		} catch (error: unknown) {
			setRegisterSuccess(false);
			setStep("result");
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

						{step === "form" ? (
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
									<ThemedText style={[styles.inputLabel, { color: labelColor }]}>Repite tu correo electrónico</ThemedText>
									<TextInput
										style={[styles.input, { color: textColor }]}
										value={confirmEmail}
										placeholder="usuario@ejemplo.com"
										placeholderTextColor={mutedColor}
										autoCapitalize="none"
										keyboardType="email-address"
										textContentType="emailAddress"
										onChangeText={setConfirmEmail}
									/>
								</View>

								<View style={[styles.inputGroup, { backgroundColor: inputSurface, borderColor: inputBorder }]}>
									<ThemedText style={[styles.inputLabel, { color: labelColor }]}>Contraseña</ThemedText>
									<View style={styles.passwordRow}>
										<TextInput
											style={[styles.input, styles.passwordInput, { color: textColor }]}
											value={password}
											placeholder="••••••••"
											placeholderTextColor={mutedColor}
											secureTextEntry={!showPassword}
											textContentType="newPassword"
											onChangeText={setPassword}
										/>
										<TouchableOpacity
											onPress={() => setShowPassword((prev) => !prev)}
											style={styles.passwordToggleButton}
											hitSlop={8}
											accessibilityRole="button"
											accessibilityLabel={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
										>
											<Ionicons
												name={showPassword ? "eye-off-outline" : "eye-outline"}
												size={20}
												color={mutedColor}
											/>
										</TouchableOpacity>
									</View>
								</View>

								<View style={[styles.inputGroup, { backgroundColor: inputSurface, borderColor: inputBorder }]}>
									<ThemedText style={[styles.inputLabel, { color: labelColor }]}>Repite tu contraseña</ThemedText>
									<View style={styles.passwordRow}>
										<TextInput
											style={[styles.input, styles.passwordInput, { color: textColor }]}
											value={confirmPassword}
											placeholder="••••••••"
											placeholderTextColor={mutedColor}
											secureTextEntry={!showConfirmPassword}
											textContentType="newPassword"
											onChangeText={setConfirmPassword}
										/>
										<TouchableOpacity
											onPress={() => setShowConfirmPassword((prev) => !prev)}
											style={styles.passwordToggleButton}
											hitSlop={8}
											accessibilityRole="button"
											accessibilityLabel={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
										>
											<Ionicons
												name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
												size={20}
												color={mutedColor}
											/>
										</TouchableOpacity>
									</View>
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
						) : null}

						{step === "otp" ? (
							<>
								<ThemedText type="title" style={[styles.title, { color: theme.textPrimary }]}>Verifica tu correo</ThemedText>
								<ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>Introduce el código OTP enviado a {email.trim()}. Expira en 10 minutos.</ThemedText>

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
						) : null}

						{step === "result" ? (
							<>
								<View style={styles.resultWrap}>
									<Ionicons
										name={registerSuccess ? "checkmark-circle" : "close-circle"}
										size={68}
										color={registerSuccess ? "#22c55e" : "#ef4444"}
									/>
									<ThemedText type="title" style={[styles.title, { color: theme.textPrimary }]}>Estado del registro</ThemedText>
									<ThemedText style={[styles.resultText, { color: theme.textSecondary }]}>
										{registerSuccess ? "registro completado" : "Algo falló, vuelva a intentarlo más tarde."}
									</ThemedText>
								</View>

								<TouchableOpacity
									style={[styles.registerButton, { backgroundColor: theme.accent }]}
									onPress={() => {
										if (registerSuccess) {
											router.replace("/sign-in");
											return;
										}
										setStep("form");
										setErrorMessage("");
										setOtp("");
									}}
								>
									<ThemedText style={[styles.registerButtonText, { color: theme.onAccent }]}>
										{registerSuccess ? "Ir a iniciar sesión" : "Volver a intentar"}
									</ThemedText>
								</TouchableOpacity>
							</>
						) : null}
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
	passwordRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	passwordInput: {
		flex: 1,
		paddingRight: 8,
	},
	passwordToggleButton: {
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 4,
		minHeight: 36,
	},
	errorText: {
		marginBottom: 12,
		fontSize: 14,
	},
	resultWrap: {
		alignItems: "center",
		gap: 10,
		marginBottom: 10,
	},
	resultText: {
		fontSize: 15,
		textAlign: "center",
		lineHeight: 22,
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
