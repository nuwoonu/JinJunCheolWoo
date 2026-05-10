// [woo] 학생 홈 대시보드 — 오늘 시간표 + 미완료 과제 + 공지
import React, { useCallback, useEffect, useState } from "react";
import {
  RefreshControl, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getStudentDashboard, getHomeworkList, getSchoolNotices, getStudentTimetable } from "@/api/student";
import { useTheme, ThemeColors } from "@/hooks/useTheme"; // [woo] 다크모드
import { useAuth } from "@/context/AuthContext";

const PERIOD_COLORS = ["#25A194", "#04B4FF", "#FF7A2C", "#45B369", "#8252E9"];

interface TimetableItem { period: number; subject: string; }
interface NoticeItem { id: number; title: string; createDate: string; }
interface HomeworkItem { id: number; title: string; dueDate: string; status: string; subjectName?: string; submitted?: boolean; }

function daysUntil(dateStr: string): number {
  const due = new Date(dateStr); due.setHours(0, 0, 0, 0);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function StudentHomeScreen() {
  const { user } = useAuth();
  const { colors } = useTheme(); // [woo] 다크모드 색상
  const styles = makeStyles(colors); // [woo]
  const navigation = useNavigation<any>();
  const [student, setStudent] = useState<any>(null);
  const [timetable, setTimetable] = useState<TimetableItem[]>([]);
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [dash, hw, nt] = await Promise.allSettled([
        getStudentDashboard(),
        getHomeworkList(0),
        getSchoolNotices(0),
      ]);
      if (dash.status === "fulfilled") {
        const d = dash.value;
        const s = d.student;
        setStudent(s);
        // [woo] /api/dashboard/student에 시간표 미포함 → /api/calendar/timetable 별도 호출
        if (s?.year && s?.classNum) {
          const tt = await getStudentTimetable(s.year, s.classNum, s.schoolId);
          setTimetable(tt);
        }
      }
      if (hw.status === "fulfilled") {
        const list = hw.value.content ?? [];
        const pending = list.filter((h: HomeworkItem) => h.status === "OPEN" && !h.submitted);
        setHomework(pending.slice(0, 3));
      }
      if (nt.status === "fulfilled") {
        setNotices((nt.value.content ?? []).slice(0, 3));
      }
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* 인사말 + 학급 정보 */}
      <View style={styles.greetCard}>
        <View style={styles.greetLeft}>
          <Text style={styles.greetText}>안녕하세요, {user?.name ?? ""}님 👋</Text>
          {student && (
            <Text style={styles.classInfo}>{student.year}학년 {student.classNum}반 {student.studentNumber}번</Text>
          )}
        </View>
        <View style={styles.greetAvatar}>
          <Text style={styles.greetAvatarText}>{user?.name?.charAt(0) ?? "S"}</Text>
        </View>
      </View>

      {/* 오늘 시간표 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📅 오늘 시간표</Text>
        {timetable.length === 0 ? (
          <Text style={styles.empty}>시간표 정보가 없습니다</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {timetable.map((item, idx) => {
              const color = PERIOD_COLORS[idx % PERIOD_COLORS.length];
              return (
                <View key={item.period} style={[styles.periodCard, { borderTopColor: color, borderTopWidth: 3 }]}>
                  <Text style={[styles.periodNum, { color }]}>{item.period}교시</Text>
                  <Text style={styles.periodSubject}>{item.subject}</Text>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* 마감 임박 과제 */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>📚 마감 임박 과제</Text>
          <TouchableOpacity onPress={() => navigation.navigate("학습")}>
            <Text style={styles.moreBtn}>전체 보기 →</Text>
          </TouchableOpacity>
        </View>
        {homework.length === 0 ? (
          <Text style={styles.empty}>미완료 과제가 없습니다 🎉</Text>
        ) : (
          homework.map((hw) => {
            const d = daysUntil(hw.dueDate);
            const isUrgent = d <= 1;
            return (
              <View key={hw.id} style={[styles.hwItem, isUrgent && styles.hwUrgent]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.hwTitle} numberOfLines={1}>{hw.title}</Text>
                  {hw.subjectName && <Text style={styles.hwSubject}>{hw.subjectName}</Text>}
                </View>
                <View style={[styles.dBadge, { backgroundColor: isUrgent ? colors.absentBg : d <= 3 ? colors.lateBg : colors.cardSecondary }]}>
                  <Text style={[styles.dText, { color: isUrgent ? colors.absent : d <= 3 ? colors.late : colors.textSecondary }]}>
                    {d < 0 ? "마감" : d === 0 ? "오늘" : `D-${d}`}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* 공지사항 */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>📢 공지사항</Text>
          <TouchableOpacity onPress={() => navigation.navigate("게시판")}>
            <Text style={styles.moreBtn}>전체 보기 →</Text>
          </TouchableOpacity>
        </View>
        {notices.length === 0 ? (
          <Text style={styles.empty}>공지사항이 없습니다</Text>
        ) : (
          notices.map((n, i) => (
            <TouchableOpacity
              key={n.id}
              style={[styles.noticeRow, i < notices.length - 1 && styles.noticeBorder]}
              onPress={() => navigation.navigate("BoardDetail", { id: n.id })}
            >
              <Text style={styles.noticeTitle} numberOfLines={1}>{n.title}</Text>
              <Text style={styles.noticeDate}>{new Date(n.createDate).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" })}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// [woo] makeStyles: 다크/라이트 모드 색상 반영
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  greetCard: { margin: 16, backgroundColor: colors.primary, borderRadius: 16, padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greetLeft: {},
  greetText: { fontSize: 18, fontWeight: "bold", color: colors.textInverse },
  classInfo: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  greetAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.25)", justifyContent: "center", alignItems: "center" },
  greetAvatarText: { fontSize: 22, fontWeight: "bold", color: colors.textInverse },
  card: { marginHorizontal: 16, marginBottom: 12, backgroundColor: colors.card, borderRadius: 16, padding: 18, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 12 },
  cardTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  moreBtn: { fontSize: 13, color: colors.primary, fontWeight: "600" },
  empty: { fontSize: 13, color: colors.textLight, textAlign: "center", paddingVertical: 16 },
  periodCard: { width: 80, backgroundColor: colors.cardSecondary, borderRadius: 12, padding: 12, alignItems: "center" },
  periodNum: { fontSize: 11, fontWeight: "700", marginBottom: 6 },
  periodSubject: { fontSize: 13, fontWeight: "600", color: colors.text, textAlign: "center" },
  hwItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.cardSecondary, marginBottom: 8, gap: 8 },
  hwUrgent: { backgroundColor: colors.absentBg, borderWidth: 1, borderColor: colors.absent },
  hwTitle: { fontSize: 14, fontWeight: "600", color: colors.text },
  hwSubject: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  dBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  dText: { fontSize: 12, fontWeight: "700" },
  noticeRow: { paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  noticeBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  noticeTitle: { fontSize: 14, color: colors.text, flex: 1, marginRight: 8 },
  noticeDate: { fontSize: 12, color: colors.textLight },
});
