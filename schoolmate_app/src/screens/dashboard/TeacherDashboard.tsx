// [woo] 교사 대시보드 - 웹 Dashboard 네이티브 변환
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

interface Notice {
  title: string;
  writerName?: string;
  content?: string;
  createDate?: string;
}

interface StudentInfo {
  name: string;
  studentNumber?: number;
}

interface ClassInfo {
  grade: number;
  classNum: number;
  totalStudents: number;
  students: StudentInfo[];
}

interface TeacherDashboardData {
  teacherName?: string;
  teacherSubject?: string;
  classInfo?: ClassInfo;
  notices?: Notice[];
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { colors } = useTheme(); // [woo] 다크모드 색상
  const styles = makeStyles(colors); // [woo]
  const [data, setData] = useState<TeacherDashboardData>({});
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get("/dashboard/teacher");
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

  const notices = data.notices ?? [];
  const classInfo = data.classInfo;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* 교사 프로필 */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {data.teacherName?.charAt(0) ?? "?"}
          </Text>
        </View>
        <Text style={styles.name}>{data.teacherName ?? "선생님"}</Text>
        {data.teacherSubject && (
          <Text style={styles.subject}>{data.teacherSubject}</Text>
        )}
        {classInfo && (
          <View style={styles.classBadge}>
            <Text style={styles.classText}>
              {classInfo.grade}학년 {classInfo.classNum}반 담임
            </Text>
          </View>
        )}
      </View>

      {/* 학급 현황 */}
      {classInfo && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>학급 현황</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{classInfo.totalStudents}</Text>
              <Text style={styles.statLabel}>총 학생</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {classInfo.grade}-{classInfo.classNum}
              </Text>
              <Text style={styles.statLabel}>학년-반</Text>
            </View>
          </View>
        </View>
      )}

      {/* 알림 메시지 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>알림 메시지</Text>
        {notices.length > 0 ? (
          notices.map((notice, i) => (
            <View
              key={i}
              style={[
                styles.noticeItem,
                i < 2 && styles.noticeNew,
              ]}
            >
              <View style={styles.noticeHeader}>
                <Text style={styles.noticeTitle} numberOfLines={1}>
                  {notice.title}
                </Text>
                {i < 2 && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                )}
              </View>
              <View style={styles.noticeMeta}>
                <Text style={styles.noticeWriter}>
                  {notice.writerName ?? ""}
                </Text>
                <Text style={styles.noticeTime}>
                  {timeAgo(notice.createDate)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>새로운 알림이 없습니다.</Text>
        )}
      </View>

      {/* 빠른 메뉴 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>바로 가기</Text>
        <View style={styles.menuGrid}>
          {[
            { label: "학급 관리", color: colors.present,     bg: colors.presentBg },
            { label: "수업 관리", color: colors.info,        bg: colors.info + "22" },
            { label: "과제 관리", color: colors.late,        bg: colors.lateBg },
            { label: "성적 관리", color: colors.sick,        bg: colors.sickBg },
          ].map((menu) => (
            <TouchableOpacity
              key={menu.label}
              style={[styles.menuItem, { backgroundColor: menu.bg }]}
            >
              <Text style={[styles.menuLabel, { color: menu.color }]}>
                {menu.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text,
  },
  subject: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  classBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  classText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  card: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  noticeItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.cardSecondary,
    marginBottom: 8,
  },
  noticeNew: {
    backgroundColor: colors.presentBg,
    borderWidth: 1,
    borderColor: colors.present + "44",
  },
  noticeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  newBadge: {
    backgroundColor: colors.danger,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: "bold",
  },
  noticeMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  noticeWriter: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  noticeTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  emptyText: {
    textAlign: "center",
    color: colors.textLight,
    fontSize: 14,
    paddingVertical: 20,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  menuItem: {
    width: "47%",
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: "center",
  },
  menuLabel: {
    fontWeight: "600",
    fontSize: 14,
  },
});
