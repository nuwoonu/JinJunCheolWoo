// [woo] 학부모 대시보드 - 웹 Dashboard 네이티브 변환
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import api from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { useTheme, ThemeColors } from "@/hooks/useTheme"; // [woo] 다크모드

interface Child {
  id: number;
  name: string;
  grade: number | null;
  classNum: number | null;
  schoolName: string | null;
  profileImageUrl: string | null;
}

interface ParentProfile {
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
}

interface ParentDashboardData {
  children: Child[];
  parentProfile: ParentProfile | null;
}

export default function ParentDashboard() {
  const { user } = useAuth();
  const { colors } = useTheme(); // [woo] 다크모드 색상
  const styles = makeStyles(colors); // [woo]
  const [data, setData] = useState<ParentDashboardData>({
    children: [],
    parentProfile: null,
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get("/dashboard/parent");
      setData(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const { parentProfile, children } = data;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* 프로필 카드 */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {parentProfile?.name?.charAt(0) ?? "?"}
          </Text>
        </View>
        <Text style={styles.name}>{parentProfile?.name ?? "-"}</Text>
        <Text style={styles.role}>학부모</Text>

        <View style={styles.contactInfo}>
          <Text style={styles.contactText}>{parentProfile?.email ?? "-"}</Text>
          <Text style={styles.contactText}>{parentProfile?.phone ?? "-"}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{children.length}</Text>
            <Text style={styles.statLabel}>자녀</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>미확인 알림</Text>
          </View>
        </View>
      </View>

      {/* 자녀 목록 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>자녀 목록</Text>
        <Text style={styles.sectionCount}>총 {children.length}명</Text>
      </View>

      {children.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>등록된 자녀가 없습니다.</Text>
        </View>
      ) : (
        children.map((child) => (
          <TouchableOpacity key={child.id} style={styles.childCard}>
            <View style={styles.childAvatar}>
              <Text style={styles.childAvatarText}>
                {child.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.childInfo}>
              <Text style={styles.childName}>{child.name}</Text>
              <Text style={styles.childSchool}>
                {child.schoolName ?? "-"}
              </Text>
              <Text style={styles.childClass}>
                {child.grade ?? "-"}학년 {child.classNum ?? "-"}반
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// [woo] makeStyles: 다크/라이트 모드 색상 반영
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  profileCard: {
    backgroundColor: colors.card,
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    color: colors.textInverse,
    fontSize: 32,
    fontWeight: "bold",
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
  },
  role: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  contactInfo: {
    marginTop: 12,
    alignItems: "center",
    gap: 4,
  },
  contactText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    width: "100%",
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  sectionCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  childCard: {
    backgroundColor: colors.primaryLight,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  childAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  childAvatarText: {
    color: colors.textInverse,
    fontSize: 22,
    fontWeight: "bold",
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 17,
    fontWeight: "bold",
    color: colors.text,
  },
  childSchool: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  childClass: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textLight,
    fontSize: 14,
  },
});
