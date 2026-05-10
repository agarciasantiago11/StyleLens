import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function confirm(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: "Cancelar", style: "cancel" },
      { text: "Confirmar", style: "destructive", onPress: onConfirm },
    ]);
  }
}

function notify(message: string) {
  if (Platform.OS === "web") {
    window.alert(message);
  } else {
    Alert.alert("Aviso", message);
  }
}
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAppTheme } from "@/contexts/app-theme";
import { useAuthStore } from "@/store/authStore";
import apiClient from "@/api/client";

type Role = {
  id: number;
  nombre: string;
  prioridad: number;
};

type UserItem = {
  id: string;
  email: string;
  nombre_completo: string | null;
  role_id: number | null;
  role_nombre: string | null;
  role_prioridad: number;
  is_active: boolean;
};

export default function AdminPanelScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const currentUser = useAuthStore((state) => state.user);

  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Role picker modal state
  const [rolePickerUser, setRolePickerUser] = useState<UserItem | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        apiClient.get("/api/user/list"),
        apiClient.get("/api/user/roles"),
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch {
      Alert.alert("Error", "No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleChangeRole = async (user: UserItem, newRole: Role) => {
    setRolePickerUser(null);
    try {
      await apiClient.put(`/api/user/${user.id}/role?nuevo_role_id=${newRole.id}`);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, role_id: newRole.id, role_nombre: newRole.nombre, role_prioridad: newRole.prioridad }
            : u
        )
      );
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.detail ?? "No se pudo cambiar el rol.");
    }
  };

  const handleDelete = (user: UserItem) => {
    confirm(
      "Eliminar usuario",
      `¿Seguro que quieres desactivar a ${user.nombre_completo ?? user.email}?`,
      async () => {
        try {
          await apiClient.delete(`/api/user/${user.id}`);
          setUsers((prev) => prev.filter((u) => u.id !== user.id));
        } catch (e: any) {
          notify(e?.response?.data?.detail ?? "No se pudo eliminar el usuario.");
        }
      }
    );
  };

  const handleReset2FA = (user: UserItem) => {
    confirm(
      "Resetear 2FA",
      `Se cerrará la sesión activa de ${user.nombre_completo ?? user.email} y se borrará su 2FA. ¿Continuar?`,
      async () => {
        try {
          await apiClient.post(`/api/user/${user.id}/reset-2fa`);
          notify("2FA reseteado correctamente. El usuario deberá volver a iniciar sesión.");
        } catch (e: any) {
          notify(e?.response?.data?.detail ?? "No se pudo resetear el 2FA.");
        }
      }
    );
  };

  const renderUser = ({ item }: { item: UserItem }) => {
    const isSelf = item.id === currentUser?.id;
    const currentUserPriority = currentUser?.role_priority ?? 0;
    const canModify = !isSelf && (currentUserPriority >= 100 || item.role_prioridad < currentUserPriority);

    return (
      <View style={[styles.userCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {/* Avatar + info */}
        <View style={styles.userHeader}>
          <LinearGradient colors={theme.gradient} style={styles.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.avatarText}>
              {(item.nombre_completo ?? item.email).charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.textPrimary }]} numberOfLines={1}>
              {item.nombre_completo ?? "Sin nombre"}
              {isSelf && (
                <Text style={[styles.selfBadge, { color: theme.textMuted }]}> (tú)</Text>
              )}
            </Text>
            <Text style={[styles.userEmail, { color: theme.textSecondary }]} numberOfLines={1}>
              {item.email}
            </Text>
          </View>
        </View>

        {/* Role badge - clickable if allowed */}
        <View style={styles.roleRow}>
          <Text style={[styles.roleLabel, { color: theme.textMuted }]}>Rol:</Text>
          <TouchableOpacity
            style={[
              styles.roleBadge,
              { backgroundColor: theme.accentSoft, borderColor: theme.accent },
              !canModify && styles.roleBadgeDisabled,
            ]}
            onPress={() => canModify && setRolePickerUser(item)}
            disabled={!canModify}
            activeOpacity={canModify ? 0.7 : 1}
          >
            <Text style={[styles.roleBadgeText, { color: theme.accent }]}>
              {item.role_nombre ?? "Sin rol"}
            </Text>
            {canModify && (
              <Ionicons name="chevron-down" size={13} color={theme.accent} style={{ marginLeft: 4 }} />
            )}
          </TouchableOpacity>
        </View>

        {/* Action buttons */}
        {canModify && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: theme.border }]}
              onPress={() => handleReset2FA(item)}
            >
              <Ionicons name="key-outline" size={16} color={theme.textSecondary} />
              <Text style={[styles.actionBtnText, { color: theme.textSecondary }]}>Reset 2FA</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnDanger]}
              onPress={() => handleDelete(item)}
            >
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
              <Text style={[styles.actionBtnText, { color: "#ef4444" }]}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.appBackground }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBackground, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push("/(tabs)" as any)}>
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <LinearGradient colors={theme.gradient} style={styles.headerIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
          </LinearGradient>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Panel de Administrador</Text>
        </View>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={22} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.accent}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={[styles.listHeaderText, { color: theme.textMuted }]}>
                {users.length} usuario{users.length !== 1 ? "s" : ""} activo{users.length !== 1 ? "s" : ""}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="people-outline" size={48} color={theme.textMuted} />
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>No hay usuarios</Text>
            </View>
          }
        />
      )}

      {/* Role picker modal */}
      <Modal
        visible={!!rolePickerUser}
        transparent
        animationType="fade"
        onRequestClose={() => setRolePickerUser(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setRolePickerUser(null)}>
          <Pressable style={[styles.modalBox, { backgroundColor: theme.surface }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              Cambiar rol de {rolePickerUser?.nombre_completo ?? rolePickerUser?.email}
            </Text>
            <View style={[styles.modalDivider, { backgroundColor: theme.border }]} />
            {roles.map((role) => {
              const isCurrentRole = role.id === rolePickerUser?.role_id;
              return (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles.roleOption,
                    isCurrentRole && { backgroundColor: theme.accentSoft },
                  ]}
                  onPress={() => rolePickerUser && handleChangeRole(rolePickerUser, role)}
                >
                  <Text style={[styles.roleOptionText, { color: isCurrentRole ? theme.accent : theme.textPrimary }]}>
                    {role.nombre}
                  </Text>
                  {isCurrentRole && (
                    <Ionicons name="checkmark" size={18} color={theme.accent} />
                  )}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={[styles.modalCancelBtn, { borderColor: theme.border }]}
              onPress={() => setRolePickerUser(null)}
            >
              <Text style={[styles.modalCancelText, { color: theme.textSecondary }]}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  backBtn: {
    padding: 4,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "center",
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "500",
  },
  list: {
    padding: 16,
    gap: 12,
  },
  listHeader: {
    marginBottom: 8,
  },
  listHeaderText: {
    fontSize: 13,
    fontWeight: "500",
  },
  userCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
  },
  selfBadge: {
    fontSize: 13,
    fontWeight: "400",
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleBadgeDisabled: {
    opacity: 0.7,
  },
  roleBadgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
  },
  actionBtnDanger: {
    borderColor: "#ef444440",
    backgroundColor: "#ef444410",
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalBox: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 16,
    paddingVertical: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalDivider: {
    height: 1,
    marginHorizontal: 0,
  },
  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  roleOptionText: {
    fontSize: 15,
    fontWeight: "500",
  },
  modalCancelBtn: {
    borderTopWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
