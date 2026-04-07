// [woo] 내정보 화면 — 역할별 분기 (학부모: 프로필 + 자녀 드롭다운 / 기타: 기존 레이아웃)
import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useSelectedChild } from "@/context/SelectedChildContext"; // [woo] 자녀 전역 선택
import { useTheme, ThemeColors } from "@/hooks/useTheme"; // [woo] 다크모드
import { getChildren } from "@/api/parent";
import type { Child } from "@/api/parent";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

// ─── 공통 ────────────────────────────────────────────────────────────────────
const ROLE_LABEL: Record<string, string> = {
  PARENT: "학부모", TEACHER: "교사", STUDENT: "학생",
  STAFF: "교직원", ADMIN: "관리자",
};

// ─── 학부모 전용 화면 ─────────────────────────────────────────────────────────
function ChildDropdown({ children, colors }: { children: Child[]; colors: ThemeColors }) {
  const styles = makeStyles(colors); // [woo]
  const { selectedChild, setSelectedChild } = useSelectedChild(); // [woo] 전역 자녀 선택
  const [open, setOpen] = useState(false);

  // [woo] 초기값: 전역 선택된 자녀 or 첫 번째 자녀
  const selected = selectedChild ?? children[0] ?? null;

  const select = (c: Child) => { setSelectedChild(c); setOpen(false); };

  return (
    <View>
      {/* 선택된 자녀 행 (드롭다운 트리거) */}
      <TouchableOpacity
        style={[styles.childRow, open && styles.childRowOpen]}
        onPress={() => setOpen(!open)}
        activeOpacity={0.8}
      >
        <View style={styles.childAvatarSm}>
          <Ionicons name="person" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.childRowName}>{selected?.name ?? "-"}</Text>
          <Text style={styles.childRowSub}>
            {selected?.grade != null ? `${selected.grade}학년 ${selected.classNum}반` : "정보 없음"}
          </Text>
        </View>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* 드롭다운 목록 */}
      {open && (
        <View style={styles.dropdownList}>
          {children.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.dropdownItem, selected?.id === c.id && styles.dropdownItemActive]}
              onPress={() => select(c)}
              activeOpacity={0.7}
            >
              <View style={[styles.childAvatarSm, selected?.id === c.id && { backgroundColor: colors.primary }]}>
                <Ionicons name="person" size={18} color={selected?.id === c.id ? colors.textInverse : colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.childRowName, selected?.id === c.id && { color: colors.primary }]}>
                  {c.name}
                </Text>
                <Text style={styles.childRowSub}>
                  {c.grade != null ? `${c.grade}학년 ${c.classNum}반` : "정보 없음"}
                </Text>
              </View>
              {selected?.id === c.id && (
                <Ionicons name="checkmark" size={16} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 선택된 자녀 상세 정보 */}
      {selected && !open && (
        <View style={styles.childDetail}>
          <View style={styles.childDetailRow}>
            <Text style={styles.childDetailLabel}>학교</Text>
            <Text style={styles.childDetailValue}>{selected.schoolName ?? "-"}</Text>
          </View>
          <View style={styles.childDetailDivider} />
          <View style={styles.childDetailRow}>
            <Text style={styles.childDetailLabel}>학년 / 반</Text>
            <Text style={styles.childDetailValue}>
              {selected.grade != null ? `${selected.grade}학년 ${selected.classNum}반` : "-"}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

function ParentProfileScreen() {
  const { user, logout } = useAuth();
  const { colors } = useTheme(); // [woo] 다크모드 색상
  const styles = makeStyles(colors); // [woo]
  const navigation = useNavigation<any>();
  const [children, setChildren] = useState<Child[]>([]);

  useEffect(() => {
    getChildren().then(setChildren).catch(() => {});
  }, []);

  const handleLogout = () => {
    Alert.alert("로그아웃", "정말 로그아웃하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "로그아웃", style: "destructive", onPress: logout },
    ]);
  };

  const INFO_ROWS: { icon: IoniconsName; label: string; value: string }[] = [
    { icon: "call-outline",     label: "연락처",  value: user?.phoneNumber ?? "-" },
    { icon: "mail-outline",     label: "이메일",  value: user?.email ?? "-" },
  ];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 정보</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate("Notifications")}>
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate("NotificationSettings")}>
            <Ionicons name="settings-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 프로필 카드 */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) ?? "?"}</Text>
        </View>
        <Text style={styles.profileName}>{user?.name ?? "이름 없음"}</Text>
        <Text style={styles.profileRole}>{ROLE_LABEL[user?.role ?? ""] ?? "알 수 없음"}</Text>
      </View>

      {/* 기본 정보 */}
      <View style={styles.section}>
        {INFO_ROWS.map((row, i) => (
          <View key={row.label} style={[styles.infoRow, i > 0 && styles.infoBorder]}>
            <Ionicons name={row.icon} size={18} color={colors.primary} style={{ marginRight: 12 }} />
            <Text style={styles.infoLabel}>{row.label}</Text>
            <Text style={styles.infoValue}>{row.value}</Text>
          </View>
        ))}
      </View>

      {/* 자녀 정보 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>자녀 정보</Text>
      </View>
      <View style={styles.section}>
        {children.length === 0 ? (
          <Text style={styles.emptyText}>등록된 자녀가 없습니다</Text>
        ) : (
          <ChildDropdown children={children} colors={colors} />
        )}
      </View>

      {/* 로그아웃 */}
      <TouchableOpacity style={styles.logoutRow} onPress={handleLogout} activeOpacity={0.7}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── 기타 역할 화면 (기존 유지) ────────────────────────────────────────────────
function GenericProfileScreen() {
  const { user, logout } = useAuth();
  const { colors } = useTheme(); // [woo] 다크모드 색상
  const styles = makeStyles(colors); // [woo]
  const navigation = useNavigation<any>();

  const handleLogout = () => {
    Alert.alert("로그아웃", "정말 로그아웃하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "로그아웃", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 정보</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate("Notifications")}>
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate("NotificationSettings")}>
            <Ionicons name="settings-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) ?? "?"}</Text>
        </View>
        <Text style={styles.profileName}>{user?.name ?? "이름 없음"}</Text>
        <Text style={styles.profileRole}>{ROLE_LABEL[user?.role ?? ""] ?? "알 수 없음"}</Text>
      </View>

      <View style={styles.section}>
        {[
          { icon: "mail-outline" as IoniconsName,  label: "이메일", value: user?.email ?? "-" },
          { icon: "call-outline" as IoniconsName,  label: "연락처", value: user?.phoneNumber ?? "-" },
        ].map((row, i) => (
          <View key={row.label} style={[styles.infoRow, i > 0 && styles.infoBorder]}>
            <Ionicons name={row.icon} size={18} color={colors.primary} style={{ marginRight: 12 }} />
            <Text style={styles.infoLabel}>{row.label}</Text>
            <Text style={styles.infoValue}>{row.value}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.quickCard]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate("NotificationSettings")}
      >
        <Ionicons name="notifications-outline" size={18} color={colors.primary} />
        <Text style={styles.quickCardText}>알림 설정</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textLight} style={{ marginLeft: "auto" }} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutRow} onPress={handleLogout} activeOpacity={0.7}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── 진입점 ───────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { user } = useAuth();
  return user?.role === "PARENT" ? <ParentProfileScreen /> : <GenericProfileScreen />;
}

// ─── makeStyles ───────────────────────────────────────────────────────────────
// [woo] makeStyles: 다크/라이트 모드 색상 반영
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 16 },

  // 헤더
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, backgroundColor: colors.backgroundSecondary,
  },
  headerTitle: { fontSize: 26, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
  headerIcons: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card,
    justifyContent: "center", alignItems: "center",
    shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },

  // 프로필 카드
  profileCard: {
    marginHorizontal: 20, marginTop: 16, marginBottom: 12,
    backgroundColor: colors.card, borderRadius: 16, padding: 24,
    alignItems: "center",
    shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryLight,
    justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: "700", color: colors.primary },
  profileName: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 4 },
  profileRole: { fontSize: 13, color: colors.textSecondary },

  // 섹션
  sectionHeader: { paddingHorizontal: 20, marginBottom: 6, marginTop: 4 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 },
  section: {
    marginHorizontal: 20, marginBottom: 12, backgroundColor: colors.card,
    borderRadius: 16, overflow: "hidden",
    shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  emptyText: { fontSize: 13, color: colors.textLight, textAlign: "center", paddingVertical: 20 },

  // 정보 행
  infoRow: { flexDirection: "row", alignItems: "center", padding: 16 },
  infoBorder: { borderTopWidth: 1, borderTopColor: colors.borderLight },
  infoLabel: { fontSize: 14, color: colors.textSecondary, flex: 1 },
  infoValue: { fontSize: 14, fontWeight: "600", color: colors.text },

  // 자녀 드롭다운
  childRow: {
    flexDirection: "row", alignItems: "center", padding: 14,
    borderRadius: 12, borderWidth: 1.5, borderColor: colors.primary,
    margin: 14,
  },
  childRowOpen: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginBottom: 0 },
  childAvatarSm: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: "center", alignItems: "center", marginRight: 10,
  },
  childRowName: { fontSize: 15, fontWeight: "700", color: colors.text },
  childRowSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  dropdownList: {
    marginHorizontal: 14, borderWidth: 1.5, borderTopWidth: 0,
    borderColor: colors.primary, borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
    overflow: "hidden", marginBottom: 0,
  },
  dropdownItem: {
    flexDirection: "row", alignItems: "center", padding: 14,
    borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  dropdownItemActive: { backgroundColor: colors.primaryLight },

  childDetail: {
    marginHorizontal: 14, marginTop: 10, marginBottom: 14,
    backgroundColor: colors.cardSecondary, borderRadius: 12, padding: 14,
  },
  childDetailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  childDetailDivider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
  childDetailLabel: { fontSize: 13, color: colors.textSecondary },
  childDetailValue: { fontSize: 13, fontWeight: "700", color: colors.text },

  // 액션 버튼
  actionBtn: {
    marginHorizontal: 20, marginBottom: 10, backgroundColor: colors.primary,
    borderRadius: 12, paddingVertical: 14, alignItems: "center",
  },
  actionBtnSecondary: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border },
  actionBtnText: { color: colors.textInverse, fontSize: 15, fontWeight: "700" },
  actionBtnTextSecondary: { color: colors.text },

  // 퀵 카드 (기타 역할용)
  quickCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginHorizontal: 20, marginBottom: 10, backgroundColor: colors.card,
    borderRadius: 14, padding: 16,
    shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  quickCardText: { fontSize: 14, fontWeight: "600", color: colors.text },

  // 로그아웃
  logoutRow: { marginHorizontal: 20, marginTop: 8, paddingVertical: 16, alignItems: "center" },
  logoutText: { fontSize: 15, color: colors.textSecondary, fontWeight: "600" },
});
