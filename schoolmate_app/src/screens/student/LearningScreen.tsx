// [woo] 학생 학습 화면 — 과제 / 퀴즈 탭
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList, RefreshControl, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import { getHomeworkList, getQuizList } from "@/api/student";
import { useTheme, ThemeColors } from "@/hooks/useTheme"; // [woo] 다크모드
import EmptyState from "@/components/EmptyState";

type LTab = "과제" | "퀴즈";

// [woo] 백엔드 status(OPEN/CLOSED) + submissionStatus → 표시용 상태 변환
function getHwDisplayStatus(item: any): string {
  if (item.submissionStatus === "GRADED") return "GRADED";
  if (item.submitted || item.submissionStatus === "SUBMITTED") return "SUBMITTED";
  if (item.status === "CLOSED") return "NOT_SUBMITTED";
  return "IN_PROGRESS";
}

function daysUntil(dateStr: string): number {
  const due = new Date(dateStr); due.setHours(0, 0, 0, 0);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function LearningScreen() {
  const { colors } = useTheme(); // [woo] 다크모드 색상
  const styles = makeStyles(colors); // [woo]

  // [woo] HW_STATUS는 colors 의존이므로 컴포넌트 안에서 정의
  const HW_STATUS: Record<string, { label: string; color: string; bg: string }> = {
    SUBMITTED:     { label: "제출완료", color: colors.present,   bg: colors.presentBg },
    GRADED:        { label: "채점완료", color: "#8b5cf6",        bg: "#f5f3ff" },
    NOT_SUBMITTED: { label: "미제출",   color: colors.absent,    bg: colors.absentBg },
    IN_PROGRESS:   { label: "진행중",   color: colors.late,      bg: colors.lateBg },
  };

  const [tab, setTab] = useState<LTab>("과제");
  const [homework, setHomework] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [hw, qz] = await Promise.allSettled([getHomeworkList(0), getQuizList(0)]);
    if (hw.status === "fulfilled") setHomework(hw.value.content ?? []);
    if (qz.status === "fulfilled") setQuizzes(qz.value.content ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const items = tab === "과제" ? homework : quizzes;

  return (
    <View style={styles.container}>
      {/* 탭 */}
      <View style={styles.tabRow}>
        {(["과제", "퀴즈"] as LTab[]).map((t) => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === "과제" ? "📚 과제" : "🧠 퀴즈"}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.primary} />}
        contentContainerStyle={items.length === 0 ? { flex: 1 } : { padding: 14 }}
        ListEmptyComponent={loading ? null : <EmptyState icon={tab === "과제" ? "📚" : "🧠"} title={`${tab}이 없습니다`} />}
        renderItem={({ item }) => {
          const d = daysUntil(item.dueDate);
          const displayStatus = getHwDisplayStatus(item);
          const cfg = HW_STATUS[displayStatus] ?? HW_STATUS.IN_PROGRESS;
          const isUrgent = (displayStatus === "NOT_SUBMITTED" || displayStatus === "IN_PROGRESS") && d <= 1;
          return (
            <View style={[styles.card, isUrgent && styles.cardUrgent]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                  {item.subjectName && <Text style={styles.subject}>{item.subjectName}</Text>}
                </View>
                <View style={[styles.badge, { backgroundColor: cfg.bg, borderColor: cfg.color }]}>
                  <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </View>
              <View style={styles.footer}>
                <Text style={styles.due}>
                  마감: {new Date(item.dueDate).toLocaleDateString("ko-KR")}
                </Text>
                {d >= 0 && d <= 7 && (
                  <Text style={[styles.dday, { color: d <= 1 ? colors.absent : d <= 3 ? colors.late : colors.textSecondary }]}>
                    {d === 0 ? "오늘 마감" : `D-${d}`}
                  </Text>
                )}
                {d < 0 && <Text style={[styles.dday, { color: colors.absent }]}>마감됨</Text>}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

// [woo] makeStyles: 다크/라이트 모드 색상 반영
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  tabRow: { flexDirection: "row", backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  tabTextActive: { color: colors.primary },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardUrgent: { borderWidth: 1.5, borderColor: colors.absent, backgroundColor: colors.absentBg },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  title: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 3 },
  subject: { fontSize: 12, color: colors.textSecondary },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, borderWidth: 1.5, flexShrink: 0 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  due: { fontSize: 12, color: colors.textSecondary },
  dday: { fontSize: 12, fontWeight: "700" },
});
