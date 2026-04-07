// [woo] 학생 대시보드 - 웹 Dashboard 네이티브 변환
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from "react-native";
import api from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { useTheme, ThemeColors } from "@/hooks/useTheme"; // [woo] 다크모드

interface Notice {
  nno?: number;
  title: string;
  createDate?: string;
}

interface StudentInfo {
  userName?: string;
  year?: number;
  classNum?: number;
  studentNumber?: number;
  status?: string;
}

interface TimetableItem {
  period: number;
  subject: string;
}

interface DashboardData {
  student?: StudentInfo;
  notices?: Notice[];
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "승인대기",
  ENROLLED: "재학",
  LEAVE_OF_ABSENCE: "휴학",
  DROPOUT: "자퇴",
  EXPELLED: "제적",
  GRADUATED: "졸업",
  TRANSFERRED: "전학",
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const { colors } = useTheme(); // [woo] 다크모드 색상
  const styles = makeStyles(colors); // [woo]
  const [data, setData] = useState<DashboardData>({});
  const [timetable, setTimetable] = useState<TimetableItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get("/dashboard/student");
      setData(res.data);

      const s = res.data?.student;
      if (s?.year && s?.classNum) {
        const ttRes = await api.get(
          `/calendar/timetable?grade=${s.year}&classNum=${s.classNum}`
        );
        setTimetable(ttRes.data ?? []);
      }
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

  const { student, notices = [] } = data;
  const statusLabel = student?.status
    ? STATUS_LABEL[student.status] ?? student.status
    : "재학";

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* 프로필 카드 */}
      {student && (
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {student.userName?.charAt(0) ?? "?"}
            </Text>
          </View>
          <Text style={styles.name}>{student.userName}</Text>
          <Text style={styles.classInfo}>
            {student.year}학년 {student.classNum}반 {student.studentNumber}번
          </Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>
      )}

      {/* 오늘의 시간표 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>오늘의 시간표</Text>
        {timetable.length > 0 ? (
          timetable.map((item) => (
            <View key={item.period} style={styles.timetableRow}>
              <View style={styles.periodBadge}>
                <Text style={styles.periodText}>{item.period}</Text>
              </View>
              <Text style={styles.subjectText}>{item.subject}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>오늘 시간표 정보가 없습니다.</Text>
        )}
      </View>

      {/* 공지사항 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>공지사항</Text>
        {notices.length > 0 ? (
          notices.map((n, i) => (
            <View
              key={n.nno ?? i}
              style={[
                styles.noticeRow,
                i < notices.length - 1 && styles.borderBottom,
              ]}
            >
              <Text style={styles.noticeTitle} numberOfLines={1}>
                {n.title}
              </Text>
              <Text style={styles.noticeDate}>
                {n.createDate?.slice(0, 10)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>등록된 공지사항이 없습니다.</Text>
        )}
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
  classInfo: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statusBadge: {
    backgroundColor: colors.presentBg,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  statusText: {
    color: colors.present,
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
  timetableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  periodBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  periodText: {
    color: colors.textInverse,
    fontWeight: "bold",
    fontSize: 14,
  },
  subjectText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: "500",
  },
  noticeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  noticeTitle: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  noticeDate: {
    fontSize: 12,
    color: colors.textLight,
  },
  emptyText: {
    textAlign: "center",
    color: colors.textLight,
    fontSize: 14,
    paddingVertical: 20,
  },
});
