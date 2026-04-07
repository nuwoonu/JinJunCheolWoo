// [woo] 회원가입 3단계 — 기본 정보 입력
import React, { useState } from "react";
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import api from "@/api/client";
import { useTheme, ThemeColors } from "@/hooks/useTheme"; // [woo] 다크모드

const ROLE_LABELS: Record<string, string> = {
  TEACHER: "교사 / 교직원",
  STUDENT: "학생",
  PARENT:  "학부모",
};

function formatPhone(value: string): string {
  const digits = value.replace(/[^0-9]/g, "");
  if (digits.length > 7) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  if (digits.length > 3) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return digits;
}

export default function RegisterFormScreen() {
  const { colors } = useTheme(); // [woo] 다크모드 색상
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { role, schoolId, schoolName } = route.params as { role: string; schoolId: number | null; schoolName: string | null };
  const styles = makeStyles(colors); // [woo]

  const [form, setForm] = useState({ name: "", email: "", password: "", phoneNumber: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      Alert.alert("알림", "이름, 이메일, 비밀번호는 필수입니다.");
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, string | number> = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phoneNumber: form.phoneNumber,
        role,
      };
      if (schoolId) body.schoolId = schoolId;

      await api.post("/auth/register", body);
      Alert.alert("가입 완료", "회원가입이 완료되었습니다.\n로그인해 주세요.", [
        { text: "확인", onPress: () => navigation.navigate("Login") },
      ]);
    } catch (e: any) {
      const status = e.response?.status;
      const msg = e.response?.data?.message;
      if (status === 409) {
        Alert.alert("가입 실패", msg ?? "이미 사용 중인 이메일입니다.");
      } else {
        Alert.alert("가입 실패", msg ?? "회원가입에 실패했습니다. 다시 시도해 주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.inner}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      {/* 헤더 */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ 이전</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>기본 정보 입력</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* 선택된 역할/학교 */}
      <View style={styles.infoBadge}>
        <Text style={styles.infoBadgeText}>
          ✓ {ROLE_LABELS[role] ?? role}{schoolName ? `  ·  ${schoolName}` : ""}
        </Text>
      </View>

      {/* 입력 폼 */}
      <View style={styles.form}>
        <Text style={styles.label}>이름 *</Text>
        <TextInput
          style={styles.input}
          placeholder="홍길동"
          placeholderTextColor={colors.placeholder}
          value={form.name}
          onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
          editable={!loading}
        />

        <Text style={styles.label}>이메일 *</Text>
        <TextInput
          style={styles.input}
          placeholder="example@email.com"
          placeholderTextColor={colors.placeholder}
          value={form.email}
          onChangeText={(v) => setForm((p) => ({ ...p, email: v }))}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />

        <Text style={styles.label}>비밀번호 *</Text>
        <TextInput
          style={styles.input}
          placeholder="비밀번호를 입력하세요"
          placeholderTextColor={colors.placeholder}
          value={form.password}
          onChangeText={(v) => setForm((p) => ({ ...p, password: v }))}
          secureTextEntry
          editable={!loading}
        />

        <Text style={styles.label}>전화번호</Text>
        <TextInput
          style={styles.input}
          placeholder="010-0000-0000"
          placeholderTextColor={colors.placeholder}
          value={form.phoneNumber}
          onChangeText={(v) => setForm((p) => ({ ...p, phoneNumber: formatPhone(v) }))}
          keyboardType="phone-pad"
          editable={!loading}
          maxLength={13}
        />
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, loading && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={colors.textInverse} />
          : <Text style={styles.submitBtnText}>가입하기</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

// [woo] makeStyles: 다크/라이트 모드 색상 반영
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { paddingBottom: 40 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 60, paddingBottom: 20 },
  backBtn: { width: 60 },
  backBtnText: { fontSize: 16, color: colors.primary, fontWeight: "600" },
  topTitle: { fontSize: 17, fontWeight: "700", color: colors.text },
  infoBadge: { marginHorizontal: 24, marginBottom: 24, padding: 12, backgroundColor: colors.primaryLight, borderRadius: 10 },
  infoBadgeText: { textAlign: "center", color: colors.primary, fontWeight: "600", fontSize: 14 },
  form: { paddingHorizontal: 24, gap: 4 },
  label: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text,
    backgroundColor: colors.inputBg,
  },
  submitBtn: {
    marginHorizontal: 24, marginTop: 32,
    backgroundColor: colors.primary, borderRadius: 12,
    paddingVertical: 15, alignItems: "center",
  },
  submitBtnText: { color: colors.textInverse, fontSize: 16, fontWeight: "700" },
});
