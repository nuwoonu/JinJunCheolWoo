// [woo] 소셜 로그인 후 역할 선택 화면 (GUEST 유저 전용) — POST /auth/select-role
import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/context/AuthContext";
import { useTheme, ThemeColors } from "@/hooks/useTheme";
import api from "@/api/client";

type Role = "TEACHER" | "STUDENT" | "PARENT";

const ROLES: { role: Role; label: string; icon: React.ComponentProps<typeof Ionicons>["name"]; desc: string }[] = [
  { role: "STUDENT", label: "학생",          icon: "school-outline",   desc: "재학 중인 학생" },
  { role: "TEACHER", label: "교사 / 교직원", icon: "briefcase-outline", desc: "학교 교사 및 교직원" },
  { role: "PARENT",  label: "학부모",         icon: "people-outline",   desc: "학생 보호자" },
];

export default function SocialSelectRoleScreen() {
  const { colors } = useTheme();
  const { refresh } = useAuth();
  const [selected, setSelected] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const styles = makeStyles(colors);

  const handleSubmit = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await api.post<{ accessToken: string; refreshToken: string }>(
        "/auth/select-role",
        { role: selected }
      );
      await AsyncStorage.setItem("accessToken", res.data.accessToken);
      await AsyncStorage.setItem("refreshToken", res.data.refreshToken);
      await refresh();
    } catch (e: any) {
      const msg = e.response?.data?.message;
      Alert.alert("오류", msg ?? "역할 설정에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <View style={styles.header}>
        <Text style={styles.title}>환영합니다! 👋</Text>
        <Text style={styles.subtitle}>사용자 유형을 선택해주세요.</Text>
      </View>

      <View style={styles.roleList}>
        {ROLES.map(({ role, label, icon, desc }) => {
          const active = selected === role;
          return (
            <TouchableOpacity
              key={role}
              style={[styles.roleCard, active && styles.roleCardActive]}
              onPress={() => setSelected(role)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={icon}
                size={32}
                color={active ? colors.primary : colors.textSecondary}
              />
              <View style={styles.roleText}>
                <Text style={[styles.roleLabel, active && { color: colors.primary }]}>{label}</Text>
                <Text style={styles.roleDesc}>{desc}</Text>
              </View>
              {active && (
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, (!selected || loading) && { opacity: 0.4 }]}
        onPress={handleSubmit}
        disabled={!selected || loading}
        activeOpacity={0.8}
      >
        {loading
          ? <ActivityIndicator color={colors.textInverse} />
          : <Text style={styles.submitBtnText}>선택 완료</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

// [woo] makeStyles: 다크/라이트 모드 색상 반영
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { padding: 24, paddingTop: 80, paddingBottom: 40 },

  header: { marginBottom: 32 },
  title: { fontSize: 26, fontWeight: "700", color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textSecondary },

  roleList: { gap: 12 },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    backgroundColor: colors.card,
  },
  roleCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  roleText: { flex: 1 },
  roleLabel: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 4 },
  roleDesc: { fontSize: 13, color: colors.textSecondary },

  submitBtn: {
    marginTop: 32,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  submitBtnText: { color: colors.textInverse, fontSize: 16, fontWeight: "700" },
});
