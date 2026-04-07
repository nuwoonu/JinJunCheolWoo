// [woo] 자녀 출결 현황 화면 — 웹 /attendance/parent 왼쪽 패널 참고
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "@/api/client";
import { getChildAttendanceRecords } from "@/api/parent"; // [woo] 개별 출결 기록 (사유 포함)
import type { ChildAttendanceRecord } from "@/api/parent";
import { useSelectedChild } from "@/context/SelectedChildContext"; // [woo] 전역 자녀 선택
import { useTheme, ThemeColors } from "@/hooks/useTheme"; // [woo] 다크모드
import EmptyState from "@/components/EmptyState";

interface ChildSummary {
  childName: string;
  studentInfoId: number;
  studentNumber: string;
  grade: number;
  classNum: number;
  statusCounts: Record<string, number>;
  totalDays: number;
}

// [woo] 테마 색상 적용 — 하드코딩 제거
function getStatusConfig(colors: ThemeColors) {
  return [
    { key: "PRESENT",     label: "출석", color: colors.present },
    { key: "ABSENT",      label: "결석", color: colors.absent },
    { key: "LATE",        label: "지각", color: colors.late },
    { key: "EARLY_LEAVE", label: "조퇴", color: colors.earlyLeave },
    { key: "SICK",        label: "병결", color: colors.sick },
  ];
}

function getBarItems(colors: ThemeColors) {
  return [
    { key: "LATE",        label: "지각", color: colors.late },
    { key: "EARLY_LEAVE", label: "조퇴", color: colors.earlyLeave },
    { key: "ABSENT",      label: "결석", color: colors.absent },
    { key: "SICK",        label: "병결", color: colors.sick },
  ];
}

function pad(n: number) { return String(n).padStart(2, "0"); }

export default function ChildrenAttendanceScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const STATUS_CONFIG = getStatusConfig(colors); // [woo] 테마 색상 적용
  const BAR_ITEMS = getBarItems(colors); // [woo] 테마 색상 적용
  const { selectedChild } = useSelectedChild(); // [woo] 전역 선택된 자녀

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [summaries, setSummaries] = useState<ChildSummary[]>([]);
  const [records, setRecords] = useState<ChildAttendanceRecord[]>([]); // [woo] 사유 포함 개별 기록
  const [reasonExpanded, setReasonExpanded] = useState(false); // [woo] 사유 목록 접기/펼치기
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // [woo] 전역 선택 자녀와 매칭되는 summary를 활성으로, 없으면 첫 번째
  const activeIdx = summaries.findIndex((s) => s.studentInfoId === selectedChild?.studentInfoId);
  const activeSummary = summaries[activeIdx >= 0 ? activeIdx : 0] ?? null;

  const isFuture = year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);

  const shiftMonth = (delta: number) => {
    setMonth((m) => {
      const next = m + delta;
      if (next < 1) { setYear((y) => y - 1); return 12; }
      if (next > 12) { setYear((y) => y + 1); return 1; }
      return next;
    });
  };

  const load = useCallback(async () => {
    try {
      const startDate = new Date(year, month - 1, 1).toISOString().slice(0, 10);
      const endDate = new Date(year, month, 0).toISOString().slice(0, 10);
      const res = await api.get<ChildSummary[]>(`/attendance/parent/summary?startDate=${startDate}&endDate=${endDate}`);
      setSummaries(Array.isArray(res.data) ? res.data : []);
    } catch {
      setSummaries([]);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  // [woo] 선택 자녀의 개별 출결 기록 (사유 포함) — 요약과 같은 월 기준
  const loadRecords = useCallback(async () => {
    const id = selectedChild?.studentInfoId ?? (summaries[0]?.studentInfoId);
    if (!id) { setRecords([]); return; }
    try {
      const data = await getChildAttendanceRecords(id, year, month);
      // [woo] 사유가 있거나 출석 아닌 항목만 표시
      setRecords(data.filter((r) => r.status !== "PRESENT" && r.status !== "NONE"));
    } catch {
      setRecords([]);
    }
  }, [selectedChild, summaries, year, month]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadRecords(); }, [loadRecords]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), loadRecords()]);
    setRefreshing(false);
  };

  const present = activeSummary?.statusCounts["PRESENT"] ?? 0;
  const totalDays = activeSummary?.totalDays ?? 0;
  // [woo] totalDays가 0이면 기록 없음 → rate 계산 불가, 표시 분리
  const hasData = totalDays > 0;
  const rate = hasData ? Math.round((present / totalDays) * 100) : 0;
  const rateColor = !hasData
    ? colors.textLight
    : rate >= 90
    ? colors.present
    : rate >= 70
    ? colors.warning
    : colors.absent;

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {summaries.length === 0 ? (
        <EmptyState icon="📋" title="출결 기록이 없습니다" />
      ) : (
        <>
          {/* [woo] 자녀 카드 */}
          <View style={styles.card}>
            {/* 자녀 헤더 */}
            <View style={styles.childHeader}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.childName}>{activeSummary?.childName}</Text>
                <Text style={styles.childSub}>
                  {activeSummary?.grade}학년 {activeSummary?.classNum}반 ({activeSummary?.studentNumber})
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                {/* [woo] 기록 없으면 '--' 표시, 있으면 실제 출석률 */}
                <Text style={[styles.rateNum, { color: rateColor }]}>
                  {hasData ? `${rate}%` : "--"}
                </Text>
                <Text style={styles.rateLabel}>{hasData ? "출석률" : "기록없음"}</Text>
              </View>
            </View>

            {/* [woo] 상태별 카운트 그리드 */}
            <View style={styles.countGrid}>
              {STATUS_CONFIG.map((s) => (
                <View key={s.key} style={styles.countItem}>
                  <Text style={[styles.countLabel, { color: s.color }]}>{s.label}</Text>
                  <Text style={styles.countNum}>{activeSummary?.statusCounts[s.key] ?? 0}</Text>
                </View>
              ))}
              <View style={styles.countItem}>
                <Text style={[styles.countLabel, { color: colors.textSecondary }]}>전체</Text>
                <Text style={styles.countNum}>{totalDays}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* [woo] 월 네비게이션 */}
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={() => shiftMonth(-1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.monthText}>{year}년 {pad(month)}월</Text>
              <TouchableOpacity
                onPress={() => { if (!isFuture) shiftMonth(1); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="chevron-forward" size={18} color={isFuture ? colors.border : colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* [woo] 진행 바 */}
            {BAR_ITEMS.map((item) => {
              const count = activeSummary?.statusCounts[item.key] ?? 0;
              const pct = totalDays > 0 ? Math.round((count / totalDays) * 100) : 0;
              return (
                <View key={item.key} style={styles.barRow}>
                  <View style={styles.barLabelRow}>
                    <Text style={styles.barLabel}>{item.label}</Text>
                    <Text style={styles.barCount}>{count}건 ({pct}%)</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: item.color }]} />
                  </View>
                </View>
              );
            })}

            {/* [woo] 총 출석률 — 기록 없으면 안내 문구 */}
            <View style={{ alignItems: "flex-end", marginTop: 8 }}>
              {hasData ? (
                <Text style={styles.totalRate}>
                  총 출석률{" "}
                  <Text style={{ fontWeight: "700", color: rateColor }}>{rate}%</Text>
                  <Text style={{ color: colors.textLight }}> (총 {totalDays}일)</Text>
                </Text>
              ) : (
                <Text style={[styles.totalRate, { color: colors.textLight }]}>
                  이번 달 출결 기록이 없습니다
                </Text>
              )}
            </View>

            {/* [woo] 출결 사유 목록 — 접힘: 1건, 펼침: 전체 */}
            {records.length > 0 && (
              <>
                <View style={styles.reasonDivider} />
                <View style={styles.reasonTitleRow}>
                  <Text style={styles.reasonTitle}>출결 사유 내역 ({records.length}건)</Text>
                </View>
                {(reasonExpanded ? records : records.slice(0, 1)).map((r, i) => {
                  const sc = STATUS_CONFIG.find((s) => s.key === r.status);
                  return (
                    <View key={`${r.attendanceDate}-${i}`} style={styles.reasonRow}>
                      <Text style={styles.reasonDate}>{r.attendanceDate}</Text>
                      <View style={[styles.reasonBadge, { borderColor: sc?.color ?? "#999" }]}>
                        <Text style={[styles.reasonBadgeText, { color: sc?.color ?? "#999" }]}>
                          {r.statusDesc ?? sc?.label ?? r.status}
                        </Text>
                      </View>
                      <Text style={styles.reasonText}>{r.reason ?? "사유 없음"}</Text>
                    </View>
                  );
                })}
                {records.length > 1 && (
                  <TouchableOpacity
                    style={styles.reasonMoreBtn}
                    onPress={() => setReasonExpanded((v) => !v)}
                  >
                    <Text style={styles.reasonMoreText}>
                      {reasonExpanded ? "접기" : `${records.length - 1}건 더 보기`}
                    </Text>
                    <Ionicons
                      name={reasonExpanded ? "chevron-up" : "chevron-down"}
                      size={13}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          <View style={{ height: 32 }} />
        </>
      )}
    </ScrollView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  card: {
    margin: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },

  // 자녀 헤더
  childHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, justifyContent: "center", alignItems: "center" },
  childName: { fontSize: 16, fontWeight: "700", color: colors.text },
  childSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  rateNum: { fontSize: 28, fontWeight: "800", lineHeight: 32 },
  rateLabel: { fontSize: 11, color: colors.textLight, marginTop: 2 },

  // 카운트 그리드
  countGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16 },
  countItem: { width: "33.33%", alignItems: "center", paddingVertical: 8 },
  countLabel: { fontSize: 11, fontWeight: "600", marginBottom: 4 },
  countNum: { fontSize: 22, fontWeight: "700", color: colors.text, lineHeight: 26 },

  divider: { height: 1, backgroundColor: colors.borderLight, marginBottom: 14 },

  // 월 네비게이션
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  monthText: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },

  // 진행 바
  barRow: { marginBottom: 10 },
  barLabelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  barLabel: { fontSize: 12, color: colors.textSecondary },
  barCount: { fontSize: 12, fontWeight: "600", color: colors.text },
  barTrack: { height: 6, backgroundColor: colors.cardSecondary, borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },

  totalRate: { fontSize: 13, color: colors.textSecondary },

  // [woo] 사유 목록
  reasonDivider: { height: 1, backgroundColor: colors.borderLight, marginTop: 18, marginBottom: 18 },
  reasonTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  reasonTitle: { fontSize: 13, fontWeight: "700", color: colors.text },
  reasonRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  reasonDate: { fontSize: 12, color: colors.textSecondary, width: 86 },
  reasonBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1.5 },
  reasonBadgeText: { fontSize: 11, fontWeight: "700" },
  reasonText: { flex: 1, fontSize: 12, color: colors.text },
  reasonMoreBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 4, paddingVertical: 6 },
  reasonMoreText: { fontSize: 12, fontWeight: "600", color: colors.primary },
});
