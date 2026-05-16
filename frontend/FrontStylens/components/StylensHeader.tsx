import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/contexts/app-theme";
import AppLogo from "../assets/images/android-icon-monochrome.png";

type StylensHeaderProps = {
  title?: string;
  onBack?: () => void;
  onRefresh?: () => void;
};

export default function StylensHeader({ title, onBack, onRefresh }: StylensHeaderProps) {
  const { theme } = useAppTheme();
  return (
    <View style={[styles.header, { backgroundColor: theme.headerBackground, borderBottomColor: theme.border }]}> 
      {onBack ? (
        <TouchableOpacity style={styles.menuButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.menuButton} />
      )}
      <View style={styles.logoContainer}>
        <LinearGradient
          colors={theme.gradient}
          style={styles.logoIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Image
            source={AppLogo}
            style={{ width: 24, height: 24, resizeMode: "contain" }}
            accessibilityLabel="Stylens logo"
          />
        </LinearGradient>
        <Text style={[styles.logoText, { color: theme.textPrimary }]}>Stylens</Text>
      </View>
      {onRefresh ? (
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={22} color={theme.textSecondary} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 24 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  menuButton: {
    padding: 4,
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "center",
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
    color: "#111",
  },
});
