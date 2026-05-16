import React, { ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppTheme } from "@/contexts/app-theme";
import StylensHeader from "./StylensHeader";

type ScreenShellProps = {
  title: string;
  children: ReactNode;
};

export function ScreenShell({ title, children }: ScreenShellProps) {
  const router = useRouter();
  const { theme } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.appBackground }]}> 
      <StylensHeader onBack={() => router.push("/(tabs)" as any)} />
      <ScrollView contentContainerStyle={[styles.content, { backgroundColor: theme.appBackground }]}> 
        <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  backButton: {
    padding: 4,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 18,
    fontWeight: "700",
  },
  version: {
    fontSize: 13,
    fontWeight: "500",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 36,
    flexGrow: 1,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
});
