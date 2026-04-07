// [woo] 교사 홈 대시보드 — 오늘 수업 일정 + 학급 출결 요약
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert, RefreshControl, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import { getTodaySchedules, getClassAttendance, markAllPresent } from "@/api/teacher";
import type { Schedule, AttendanceRecord } from "@/api/teacher";
import { STATUS_CONFIG } from "@/constants/colors"; // [woo] STATUS_CONFIG 유지
import { useTheme, ThemeColors } from "@/hooks/useTheme"; // [woo] 다크모드
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";

const PERIOD_COLORS = ["#25A194", "#04B4FF", "#FF7A2C", "#45B369", "#8252E9"];

function fmtTime(t: string) { return t.substring(0, 5); }

export default function TeacherHomeScreen() {
  const { user } = useAuth();
  const { colors } = useTheme(); // [woo] 다크모드 색상
  const styles = makeStyles(colors); // [woo]
  const { showToast } = useToast();
  const [scheduleLabel, setScheduleLabel] = useState("오늘의 수업 일정");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const loadData = useCallback(async () => {
    const [sch, att] = await Promise.allSettled([
      getTodaySchedules(),
      getClassAttendance(today),
    ]);
    if (sch.status === "fulfilled") {
      setScheduleLabel(sch.value.label);
      setSchedules(sch.value.schedules);
    }
    if (att.status === "fulfilled") setAttendance(att.value);
  }, [today]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const handleAllPresent = () => {
    Alert.alert("전원 출석", "전체 학생을 출석 처리하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "확인",
        onPress: async () => {
          try {
            await markAllPresent(today);
            const updated = await getClassAttendance(today);
            setAttendance(updated);
            showToast("전원 출석 처리되었습니다", "success");
          } catch {
            showToast("처리에 실패했습니다.", "error");
          }
        },
      },
    ]);
  };

  const counts = {
    PRESENT: attendance.filter((r) => r.status === "PRESENT").length,
    LATE:    attendance.filter((r) => r.status === "LATE").length,
    ABSENT:  attendance.filter((r) => r.status === "ABSENT").length,
    NONE:    attendance.filter((r) => r.status === "NONE").length,
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* 인사말 */}
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>안녕하세요, {user?.name ?? ""}선생님 👋</Text>
        <Text style={styles.greetingDate}>{new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}</Text>
      </View>

      {/* 출결 현황 카드 */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>📊 학급 출결 현황</Text>
          {counts.NONE > 0 && (
            <TouchableOpacity onPress={handleAllPresent} style={styles.allPresentBtn}>
              <Text style={styles.allPresentText}>전원 출석 ✓</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.statsRow}>
          {[
            { label: "출석", val: counts.PRESENT, color: colors.present },
            { label: "지각", val: counts.LATE,    color: colors.late },
            { label: "결석", val: counts.ABSENT,  color: colors.absent },
            { label: "미처리",val: counts.NONE,   color: colors.none },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={[styles.statNum, { color: s.color }]}>{s.val}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
        {counts.NONE > 0 && (
          <View style={styles.warningRow}>
            <Text style={styles.warningText}>⚠ 미처리 학생이 {counts.NONE}명 있습니다</Text>
          </View>
        )}
      </View>

      {/* 오늘 수업 일정 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🗓 {scheduleLabel}</Text>
        {schedules.length === 0 ? (
          <Text style={styles.empty}>오늘 수업 일정이 없습니다</Text>
        ) : (
          schedules.map((s, idx) => {
            const color = PERIOD_COLORS[idx % PERIOD_COLORS.length];
            return (
              <View key={s.id} style={[styles.scheduleItem, { borderLeftColor: color }]}>
                <View style={styles.scheduleLeft}>
                  <View style={[styles.periodBadge, { backgroundColor: color + "22" }]}>
                    <Text style={[styles.periodText, { color }]}>{s.period}교시</Text>
                  </View>
                  <Text style={styles.subjectName}>{s.subjectName}</Text>
                </View>
                <View style={styles.scheduleRight}>
                  <Text style={styles.scheduleTime}>{fmtTime(s.startTime)} - {fmtTime(s.endTime)}</Text>
                  {s.className && <Text style={styles.scheduleClass}>{s.className}</Text>}
                  {s.location && <Text style={styles.scheduleLocation}>📍 {s.location}</Text>}
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* 바로 가기 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>바로 가기</Text>
        <View style={styles.quickGrid}>
          {[
            { label: "출결 관리",  icon: "✅", color: colors.present,    bg: colors.presentBg },
            { label: "알림장 쓰기", icon: "📝", color: colors.info,       bg: colors.info + "22" },
            { label: "과제 관리",  icon: "📚", color: colors.late,        bg: colors.lateBg },
            { label: "교직원 게시판",icon: "👥", color: colors.sick,      bg: colors.sickBg },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={[styles.quickItem, { backgroundColor: item.bg }]}>
              <Text style={styles.quickIcon}>{item.icon}</Text>
              <Text style={[styles.quickLabel, { color: item.color }]}>{item.label}</Text>
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
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  greeting: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  greetingText: { fontSize: 20, fontWeight: "bold", color: colors.text },
  greetingDate: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  card: { marginHorizontal: 16, marginBottom: 12, backgroundColor: colors.card, borderRadius: 16, padding: 18, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
  allPresentBtn: { backgroundColor: colors.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  allPresentText: { fontSize: 12, fontWeight: "700", color: colors.primary },
  statsRow: { flexDirection: "row", justifyContent: "space-around", backgroundColor: colors.cardSecondary, borderRadius: 10, paddingVertical: 14 },
  statItem: { alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "bold" },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  warningRow: { marginTop: 10, backgroundColor: colors.lateBg, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  warningText: { fontSize: 13, color: colors.late, fontWeight: "600" },
  empty: { fontSize: 13, color: colors.textLight, textAlign: "center", paddingVertical: 20 },
  scheduleItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderLeftWidth: 3, paddingLeft: 12, marginBottom: 12 },
  scheduleLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  periodBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  periodText: { fontSize: 11, fontWeight: "700" },
  subjectName: { fontSize: 15, fontWeight: "600", color: colors.text },
  scheduleRight: { alignItems: "flex-end" },
  scheduleTime: { fontSize: 12, color: colors.textSecondary, fontWeight: "500" },
  scheduleClass: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  scheduleLocation: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickItem: { width: "47%", borderRadius: 12, paddingVertical: 18, alignItems: "center", gap: 6 },
  quickIcon: { fontSize: 28 },
  quickLabel: { fontSize: 13, fontWeight: "600" },
});
