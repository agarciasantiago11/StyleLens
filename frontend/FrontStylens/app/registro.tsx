import React, { useState } from "react";
import {
	View,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
	Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/contexts/app-theme";
import { PublicOnlyRoute } from "@/lib/auth-guards";

export default function RegistroPage() {
	const router = useRouter();
	const { theme } = useAppTheme();

	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const inputSurface = "rgba(255,255,255,0.82)";
	const inputBorder = "rgba(255,255,255,0.95)";
	const labelColor = "rgba(34,24,31,0.92)";
	const textColor = "#22181f";
	const mutedColor = "rgba(73,54,68,0.58)";

	const onRegisterPress = () => {
		// Por ahora, solo dejamos preparado el formulario sin lógica de envío.
		void username;
		void email;
		void password;
	};

	return (
		<PublicOnlyRoute>
			<KeyboardAvoidingView
				style={styles.root}
				behavior={Platform.select({ ios: "padding", android: "height" })}
			>
				<Pressable style={styles.backdrop} onPress={() => router.back()} />

				<View style={styles.centeredContainer}>
					<View style={[styles.card, { backgroundColor: theme.surface }]}> 
						<ThemedText type="title" style={styles.title}>
							Crear cuenta
						</ThemedText>
						<ThemedText style={styles.subtitle}>
							Regístrate para empezar a usar Stylens.
						</ThemedText>

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

						<TouchableOpacity
							style={[styles.registerButton, { backgroundColor: theme.accent }]}
							onPress={onRegisterPress}
						>
							<ThemedText style={[styles.registerButtonText, { color: theme.onAccent }]}>Registrarse</ThemedText>
						</TouchableOpacity>
					</View>
				</View>
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
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.25)",
		shadowColor: "#000",
		shadowOpacity: 0.22,
		shadowRadius: 18,
		shadowOffset: { width: 0, height: 10 },
		elevation: 10,
	},
	title: {
		color: "#1f161c",
		marginBottom: 6,
	},
	subtitle: {
		color: "rgba(37,27,35,0.74)",
		marginBottom: 16,
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
