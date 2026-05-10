// [woo] 학생 출결 현황 화면 — 이달 달력 + 통계
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { STATUS_CONFIG, StatusKey } from "@/constants/colors"; // [woo] STATUS_CONFIG/StatusKey 유지
import { useTheme, ThemeColors } from "@/hooks/useTheme"; // [woo] 다크모드

// 학생 자신의 월별 출결은 현재 백엔드에 별도 엔드포인트가 없으므로
// 부모 API 구조를 재활용하거나 향후 추가 예정 — 현재는 당일 조회로 대체
import api from "@/api/client";

interface AttendanceRecord {
  date: string;
  status: StatusKey;
}

export default function StudentAttendanceScreen() {
  const { colors } = useTheme(); // [woo] 다크모드 색상
  const styles = makeStyles(colors); // [woo]
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // [woo] 학생 월별 출결 API (백엔드 구현 시 엔드포인트 수정)
      const res = await api.get(`/attendance/student/monthly?year=${year}&month=${month}`);
      setRecords(Array.isArray(res.data) ? res.data : []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const statusMap: Record<string, StatusKey> = {};
  records.forEach((r) => { statusMap[r.date] = r.status; });

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = now.toISOString().split("T")[0];

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const stats = {
    PRESENT:     records.filter((r) => r.status === "PRESENT").length,
    LATE:        records.filter((r) => r.status === "LATE").length,
    ABSENT:      records.filter((r) => r.status === "ABSENT").length,
    EARLY_LEAVE: records.filter((r) => r.status === "EARLY_LEAVE").length,
    SICK:        records.filter((r) => r.status === "SICK").length,
  };

  const prevMonth = () => { if (month === 1) { setYear((y) => y - 1); setMonth(12); } else setMonth((m) => m - 1); };
  const nextMonth = () => {
    if (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)) return;
    if (month === 12) { setYear((y) => y + 1); setMonth(1); } else setMonth((m) => m + 1);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.card}>
        {/* 월 네비게이션 */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Text style={styles.navArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{year}년 {month}월</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 요일 헤더 */}
        <View style={styles.weekRow}>
          {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
            <Text key={d} style={[styles.weekLabel, i === 0 && { color: "#ef4444" }, i === 6 && { color: "#3b82f6" }]}>{d}</Text>
          ))}
        </View>

        {/* 달력 그리드 */}
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 30 }} />
        ) : (
          <View style={styles.grid}>
            {cells.map((day, idx) => {
              if (day === null) return <View key={`e-${idx}`} style={styles.cell} />;
              const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const status = statusMap[dateStr];
              const cfg = status ? STATUS_CONFIG[status] : null;
              const isToday = dateStr === today;
              const dow = (firstDay + day - 1) % 7;
              return (
                <View key={dateStr} style={[styles.cell, isToday && styles.cellToday]}>
                  <Text style={[
                    styles.dayNum,
                    isToday && { color: colors.primary, fontWeight: "bold" },
                    dow === 0 && { color: "#ef4444" },
                    dow === 6 && { color: "#3b82f6" },
                  ]}>{day}</Text>
                  {cfg && <View style={[styles.dot, { backgroundColor: cfg.color }]} />}
                </View>
              );
            })}
          </View>
        )}

        {/* 범례 */}
        <View style={styles.legend}>
          {(Object.keys(STATUS_CONFIG) as StatusKey[]).filter((k) => k !== "NONE").map((k) => (
            <View key={k} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: STATUS_CONFIG[k].color }]} />
              <Text style={styles.legendText}>{STATUS_CONFIG[k].label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 이달 통계 */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>이달 출결 통계</Text>
        <View style={styles.statsGrid}>
          {[
            { label: "출석", val: stats.PRESENT,     color: colors.present },
            { label: "지각", val: stats.LATE,         color: colors.late },
            { label: "결석", val: stats.ABSENT,       color: colors.absent },
            { label: "조퇴", val: stats.EARLY_LEAVE,  color: colors.earlyLeave },
            { label: "병결", val: stats.SICK,         color: colors.sick },
          ].map((s) => (
            <View key={s.label} style={[styles.statItem, { backgroundColor: s.color + "15" }]}>
              <Text style={[styles.statNum, { color: s.color }]}>{s.val}</Text>
              <Text style={[styles.statLabel, { color: s.color }]}>{s.label}</Text>
            </View>
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
  card: { margin: 16, backgroundColor: colors.card, borderRadius: 16, padding: 18, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 26, color: colors.primary, fontWeight: "bold" },
  monthLabel: { fontSize: 18, fontWeight: "bold", color: colors.text },
  weekRow: { flexDirection: "row", marginBottom: 4 },
  weekLabel: { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "600", color: colors.textSecondary, paddingVertical: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  cellToday: { backgroundColor: colors.primaryLight, borderRadius: 8 },
  dayNum: { fontSize: 14, color: colors.text },
  dot: { width: 7, height: 7, borderRadius: 3.5, marginTop: 2 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendText: { fontSize: 11, color: colors.textSecondary },
  statsCard: { marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 16, padding: 18, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statsTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 14 },
  statsGrid: { flexDirection: "row", gap: 8 },
  statItem: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "bold" },
  statLabel: { fontSize: 11, fontWeight: "600", marginTop: 4 },
});
