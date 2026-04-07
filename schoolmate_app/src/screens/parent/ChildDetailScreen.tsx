// [woo] 자녀 상세 화면 — 출결 달력 / 과제 현황 탭
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { getChildAttendanceRecords, getChildHomework } from "@/api/parent";
import type { ChildAttendanceRecord, HomeworkItem } from "@/api/parent";
import { STATUS_CONFIG, StatusKey } from "@/constants/colors"; // [woo] STATUS_CONFIG/StatusKey 유지
import { useTheme, ThemeColors } from "@/hooks/useTheme"; // [woo] 다크모드
import EmptyState from "@/components/EmptyState";

type RouteParams = {
  ChildDetail: {
    childId: number;
    studentInfoId: number | null; // [woo] 출결 API용
    childName: string;
    grade: number;
    classNum: number;
  };
};

type SubTab = "출결" | "과제";

// ── 출결 달력 ──────────────────────────────────────────────────────────────────
function AttendanceCalendar({ studentInfoId, colors }: { studentInfoId: number | null; colors: ThemeColors }) {
  const calStyles = makeCalStyles(colors); // [woo]
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [records, setRecords] = useState<ChildAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!studentInfoId) { setLoading(false); return; }
    setLoading(true);
    const data = await getChildAttendanceRecords(studentInfoId, year, month);
    setRecords(data);
    setLoading(false);
  }, [studentInfoId, year, month]);

  useEffect(() => { load(); }, [load]);

  const statusMap: Record<string, StatusKey> = {};
  records.forEach((r) => { statusMap[r.attendanceDate] = r.status as StatusKey; });

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = now.toISOString().split("T")[0];

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const stats = {
    PRESENT:     records.filter((r) => r.status === "PRESENT").length,
    LATE:        records.filter((r) => r.status === "LATE").length,
    ABSENT:      records.filter((r) => r.status === "ABSENT").length,
    SICK:        records.filter((r) => r.status === "SICK").length,
    EARLY_LEAVE: records.filter((r) => r.status === "EARLY_LEAVE").length,
  };

  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const nextMonth = () => {
    if (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)) return;
    if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1);
  };

  return (
    <View>
      <View style={calStyles.monthNav}>
        <TouchableOpacity onPress={prevMonth} style={calStyles.navBtn}>
          <Text style={calStyles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={calStyles.monthLabel}>{year}년 {month}월</Text>
        <TouchableOpacity onPress={nextMonth} style={calStyles.navBtn}>
          <Text style={calStyles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={calStyles.weekRow}>
        {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
          <Text key={d} style={[calStyles.weekLabel, i === 0 && { color: colors.danger }, i === 6 && { color: colors.info }]}>{d}</Text>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
      ) : (
        <View style={calStyles.grid}>
          {cells.map((day, idx) => {
            if (day === null) return <View key={`e-${idx}`} style={calStyles.cell} />;
            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const status = statusMap[dateStr] as StatusKey | undefined;
            const cfg = status ? STATUS_CONFIG[status] : null;
            const isToday = dateStr === today;
            const dow = (firstDay + day - 1) % 7;
            return (
              <View key={dateStr} style={[calStyles.cell, isToday && calStyles.cellToday]}>
                <Text style={[
                  calStyles.dayNum,
                  isToday && { color: colors.primary, fontWeight: "bold" },
                  dow === 0 && { color: colors.danger },
                  dow === 6 && { color: colors.info },
                ]}>{day}</Text>
                {cfg && <View style={[calStyles.dot, { backgroundColor: cfg.color }]} />}
              </View>
            );
          })}
        </View>
      )}

      <View style={calStyles.legend}>
        {(Object.keys(STATUS_CONFIG) as StatusKey[]).filter((k) => k !== "NONE").map((k) => (
          <View key={k} style={calStyles.legendItem}>
            <View style={[calStyles.dot, { backgroundColor: STATUS_CONFIG[k].color }]} />
            <Text style={calStyles.legendLabel}>{STATUS_CONFIG[k].label}</Text>
          </View>
        ))}
      </View>

      <View style={calStyles.statsRow}>
        {[
          { label: "출석", val: stats.PRESENT,     color: colors.present },
          { label: "지각", val: stats.LATE,         color: colors.late },
          { label: "결석", val: stats.ABSENT,       color: colors.absent },
          { label: "조퇴", val: stats.EARLY_LEAVE,  color: colors.earlyLeave },
          { label: "병결", val: stats.SICK,         color: colors.sick },
        ].map((s) => (
          <View key={s.label} style={calStyles.statItem}>
            <Text style={[calStyles.statNum, { color: s.color }]}>{s.val}</Text>
            <Text style={calStyles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── 과제 현황 ──────────────────────────────────────────────────────────────────
function HomeworkList({ childId, colors }: { childId: number; colors: ThemeColors }) {
  const hwStyles = makeHwStyles(colors); // [woo]
  const [items, setItems] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  useEffect(() => {
    getChildHomework(childId).then((d) => { setItems(d); setLoading(false); });
  }, [childId]);

  const HW_STATUS: Record<string, { label: string; color: string; bg: string }> = {
    SUBMITTED:     { label: "제출완료", color: colors.present,  bg: colors.presentBg },
    GRADED:        { label: "채점완료", color: "#8b5cf6",       bg: "#f5f3ff" },
    NOT_SUBMITTED: { label: "미제출",   color: colors.absent,   bg: colors.absentBg },
    IN_PROGRESS:   { label: "진행중",   color: colors.late,     bg: colors.lateBg },
  };

  // [woo] 백엔드 status(OPEN/CLOSED) + submissionStatus → 표시용 상태 변환
  function getHwDisplayStatus(hw: HomeworkItem): string {
    if (hw.submissionStatus === "GRADED") return "GRADED";
    if (hw.submitted || hw.submissionStatus === "SUBMITTED") return "SUBMITTED";
    if (hw.status === "CLOSED") return "NOT_SUBMITTED";
    return "IN_PROGRESS";
  }

  const FILTERS = ["ALL", "NOT_SUBMITTED", "IN_PROGRESS", "SUBMITTED", "GRADED"];
  const filtered = activeFilter === "ALL" ? items : items.filter((h) => getHwDisplayStatus(h) === activeFilter);

  function daysUntil(dateStr: string): number {
    const due = new Date(dateStr); due.setHours(0, 0, 0, 0);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  if (loading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />;
  if (items.length === 0) return <EmptyState icon="📚" title="과제가 없습니다" />;

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ gap: 8 }}>
        {FILTERS.map((f) => {
          const active = activeFilter === f;
          const cfg = f === "ALL" ? null : HW_STATUS[f];
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[hwStyles.filterChip, active && { backgroundColor: cfg?.color ?? colors.primary, borderColor: cfg?.color ?? colors.primary }]}
            >
              <Text style={[hwStyles.filterText, active && { color: colors.textInverse }]}>
                {f === "ALL" ? "전체" : cfg?.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {filtered.length === 0 ? (
        <EmptyState icon="✅" title="해당 과제가 없습니다" />
      ) : (
        filtered.map((hw) => {
          const d = daysUntil(hw.dueDate);
          const displayStatus = getHwDisplayStatus(hw);
          const cfg = HW_STATUS[displayStatus] ?? HW_STATUS.IN_PROGRESS;
          const isUrgent = (displayStatus === "NOT_SUBMITTED" || displayStatus === "IN_PROGRESS") && d <= 1;
          return (
            <View key={hw.id} style={[hwStyles.item, isUrgent && hwStyles.itemUrgent]}>
              <View style={{ flex: 1 }}>
                <Text style={hwStyles.title} numberOfLines={2}>{hw.title}</Text>
                {hw.subjectName && <Text style={hwStyles.subject}>{hw.subjectName}</Text>}
                <Text style={hwStyles.due}>
                  마감: {new Date(hw.dueDate).toLocaleDateString("ko-KR")}
                  {d >= 0 && d <= 7 && <Text style={{ color: isUrgent ? colors.absent : colors.late }}> (D-{d})</Text>}
                  {d < 0 && <Text style={{ color: colors.absent }}> (마감)</Text>}
                </Text>
              </View>
              <View style={[hwStyles.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.color }]}>
                <Text style={[hwStyles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

// ── 메인 ──────────────────────────────────────────────────────────────────────
export default function ChildDetailScreen() {
  const { colors } = useTheme(); // [woo] 다크모드 색상
  const styles = makeStyles(colors); // [woo]
  const route = useRoute<RouteProp<RouteParams, "ChildDetail">>();
  const { childId, studentInfoId, childName, grade, classNum } = route.params;
  const [subTab, setSubTab] = useState<SubTab>("출결");

  return (
    <ScrollView style={styles.container}>
      {/* 자녀 정보 헤더 */}
      <View style={styles.profileRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{childName.charAt(0)}</Text>
        </View>
        <View>
          <Text style={styles.childName}>{childName}</Text>
          <Text style={styles.childClass}>{grade}학년 {classNum}반</Text>
        </View>
      </View>

      {/* 서브탭 */}
      <View style={styles.subTabRow}>
        {(["출결", "과제"] as SubTab[]).map((t) => (
          <TouchableOpacity key={t} onPress={() => setSubTab(t)} style={[styles.subTab, subTab === t && styles.subTabActive]}>
            <Text style={[styles.subTabText, subTab === t && styles.subTabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 콘텐츠 */}
      <View style={styles.card}>
        {subTab === "출결" ? (
          <AttendanceCalendar studentInfoId={studentInfoId} colors={colors} />
        ) : (
          <HomeworkList childId={childId} colors={colors} />
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// [woo] makeStyles
const makeCalStyles = (colors: ThemeColors) => StyleSheet.create({
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 24, color: colors.primary, fontWeight: "bold" },
  monthLabel: { fontSize: 17, fontWeight: "bold", color: colors.text },
  weekRow: { flexDirection: "row", marginBottom: 4 },
  weekLabel: { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "600", color: colors.textSecondary, paddingVertical: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  cellToday: { backgroundColor: colors.primaryLight, borderRadius: 8 },
  dayNum: { fontSize: 13, color: colors.text },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12, marginBottom: 4 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendLabel: { fontSize: 11, color: colors.textSecondary },
  statsRow: { flexDirection: "row", justifyContent: "space-around", backgroundColor: colors.cardSecondary, borderRadius: 10, paddingVertical: 12, marginTop: 12 },
  statItem: { alignItems: "center" },
  statNum: { fontSize: 20, fontWeight: "bold" },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
});

const makeHwStyles = (colors: ThemeColors) => StyleSheet.create({
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
  filterText: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: colors.cardSecondary, borderRadius: 12, padding: 14, marginBottom: 10, gap: 10 },
  itemUrgent: { backgroundColor: colors.absentBg, borderWidth: 1, borderColor: colors.absent + "88" },
  title: { fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 3 },
  subject: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  due: { fontSize: 12, color: colors.textSecondary },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, borderWidth: 1.5 },
  statusText: { fontSize: 11, fontWeight: "700" },
});

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 20 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 20, fontWeight: "bold", color: colors.textInverse },
  childName: { fontSize: 18, fontWeight: "700", color: colors.text },
  childClass: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  subTabRow: { flexDirection: "row", backgroundColor: colors.card, borderRadius: 12, padding: 4, marginHorizontal: 16, marginBottom: 12 },
  subTab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
  subTabActive: { backgroundColor: colors.primary },
  subTabText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  subTabTextActive: { color: colors.textInverse },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 18, marginHorizontal: 16, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
});
