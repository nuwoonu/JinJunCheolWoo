// [woo] 회원가입 1단계 — 역할 선택
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, ThemeColors } from "@/hooks/useTheme"; // [woo] 다크모드

type Role = "TEACHER" | "STUDENT" | "PARENT";

const ROLES: { role: Role; label: string; icon: React.ComponentProps<typeof Ionicons>["name"]; desc: string }[] = [
  { role: "STUDENT", label: "학생",           icon: "school-outline",     desc: "재학 중인 학생" },
  { role: "TEACHER", label: "교사 / 교직원", icon: "briefcase-outline",   desc: "학교 교사 및 교직원" },
  { role: "PARENT",  label: "학부모",          icon: "people-outline",     desc: "학생 보호자" },
];

export default function RegisterRoleScreen() {
  const { colors } = useTheme(); // [woo] 다크모드 색상
  const navigation = useNavigation<any>();
  const styles = makeStyles(colors); // [woo]

  const handleSelect = (role: Role) => {
    if (role === "PARENT") {
      // 학부모는 학교 선택 없이 바로 정보 입력
      navigation.navigate("RegisterForm", { role, schoolId: null, schoolName: null });
    } else {
      navigation.navigate("RegisterSchool", { role });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SchoolMate</Text>
        <Text style={styles.subtitle}>사용자 유형을 선택해 주세요</Text>
      </View>

      <View style={styles.roleList}>
        {ROLES.map(({ role, label, icon, desc }) => (
          <TouchableOpacity
            key={role}
            style={styles.roleCard}
            onPress={() => handleSelect(role)}
            activeOpacity={0.7}
          >
            <Ionicons name={icon} size={28} color={colors.primary} style={styles.roleIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.roleLabel}>{label}</Text>
              <Text style={styles.roleDesc}>{desc}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
        <Text style={styles.backLinkText}>이미 계정이 있으신가요? 로그인하기</Text>
      </TouchableOpacity>
    </View>
  );
}

// [woo] makeStyles: 다크/라이트 모드 색상 반영
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24, justifyContent: "center" },
  header: { marginBottom: 40, alignItems: "center" },
  title: { fontSize: 32, fontWeight: "bold", color: colors.primary, marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.textSecondary },
  roleList: { gap: 12 },
  roleCard: {
    flexDirection: "row", alignItems: "center", gap: 16,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 16,
    padding: 18, backgroundColor: colors.card,
  },
  roleIcon: { width: 32, textAlign: "center" },
  roleLabel: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 2 },
  roleDesc: { fontSize: 12, color: colors.textLight },
  arrow: { fontSize: 22, color: colors.textLight, fontWeight: "300" },
  backLink: { marginTop: 36, alignItems: "center" },
  backLinkText: { fontSize: 13, color: colors.primary, fontWeight: "600" },
});
