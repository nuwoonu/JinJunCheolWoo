// [woo] 학부모 홈 대시보드 — 알림 배너 + 오늘의 출결 상태 + 하루 요약 + 바로가기
import React, { useCallback, useEffect, useState } from "react";
import {
  RefreshControl, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getChildren, getParentNotices, getClassDiary, getChildAttendanceRecords } from "@/api/parent";
import type { ChildAttendanceRecord } from "@/api/parent";
import { STATUS_CONFIG } from "@/constants/colors";
import { useTheme, ThemeColors } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useSelectedChild } from "@/context/SelectedChildContext";
import api from "@/api/client";

const QUICK = [
  { label: "자녀 성적",  icon: "bar-chart-outline",        screen: "ChildGrades" },
  { label: "가정통신문", icon: "document-text-outline",     screen: "게시판" },
  { label: "상담 예약",  icon: "chatbubble-outline",        screen: "상담" },
  { label: "자녀 출결",  icon: "checkmark-circle-outline",  screen: "ChildAttendance" },
] as const;

export default function ParentHomeScreen() {
  const { user } = useAuth();
  const { colors } = useTheme(); // [woo] 다크모드 색상
  const styles = makeStyles(colors); // [woo]
  const navigation = useNavigation<any>();

  const { selectedChild, setSelectedChild } = useSelectedChild();
  const [todayStatus, setTodayStatus] = useState<ChildAttendanceRecord | null>(null);
  const [unreadNotices, setUnreadNotices] = useState(0);
  const [unreadDiary, setUnreadDiary] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  // [woo] 하루 요약 (오늘 없으면 최근 것)
  const [todaySummary, setTodaySummary] = useState<string | null>(null);
  const [summaryLabel, setSummaryLabel] = useState<string>("오늘의 하루 요약");

  const now = new Date();
  // [woo] 로컬 날짜 기준 오늘 (toISOString은 UTC → KST 자정~오전9시 사이 하루 전 날짜 버그)
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;

  // [woo] 하루 요약 로드 — 오늘 요약 없으면 최근 요약으로 fallback
  const loadTodaySummary = useCallback(async () => {
    if (!selectedChild?.studentInfoId) { setTodaySummary(null); setSummaryLabel("하루 요약"); return; }
    const today = new Date().toISOString().split("T")[0];
    try {
      const res = await api.get(`/daily-summary/student/${selectedChild.studentInfoId}/date/${today}`);
      if (res.data?.content) {
        setTodaySummary(res.data.content);
        setSummaryLabel("오늘의 하루 요약");
        return;
      }
    } catch {}
    // 오늘 요약 없으면 최근 요약 1개 fallback
    try {
      const listRes = await api.get<{ id: number; summaryDate: string; content: string }[]>(
        `/daily-summary/student/${selectedChild.studentInfoId}`
      );
      const latest = listRes.data?.[0];
      if (latest?.content) {
        const d = new Date(latest.summaryDate);
        const label = `${d.getMonth() + 1}월 ${d.getDate()}일 하루 요약`;
        setTodaySummary(latest.content);
        setSummaryLabel(label);
        return;
      }
    } catch {}
    setTodaySummary(null);
    setSummaryLabel("하루 요약");
  }, [selectedChild]);

  // [woo] 선택된 자녀의 출결 로드
  const loadAttendance = useCallback(async () => {
    if (!selectedChild?.studentInfoId) { setTodayStatus(null); return; }
    try {
      const att = await getChildAttendanceRecords(
        selectedChild.studentInfoId, now.getFullYear(), now.getMonth() + 1,
      );
      setTodayStatus(att.find((a) => a.attendanceDate === today) ?? null);
    } catch { setTodayStatus(null); }
  }, [selectedChild, today]);

  // [woo] 공지/알림장 미읽음 + 선택된 자녀 유효성 검증 후 자동 세팅
  const loadData = useCallback(async () => {
    try {
      // [woo] 항상 자녀 목록을 가져와서 캐시된 selectedChild가 현재 계정에 유효한지 검증
      const kids = await getChildren();
      const isValid = kids.some((k) => k.id === selectedChild?.id);
      if (!isValid && kids[0]) setSelectedChild(kids[0]);

      const [notices, diary, noticeReadIds, diaryReadIds] = await Promise.all([
        getParentNotices(0),
        getClassDiary(0),
        api.get<number[]>("/board/read-ids?type=PARENT_NOTICE").then(r => r.data).catch(() => [] as number[]),
        api.get<number[]>("/board/read-ids?type=CLASS_DIARY").then(r => r.data).catch(() => [] as number[]),
      ]);
      const week = 7 * 24 * 60 * 60 * 1000;
      setUnreadNotices((notices?.content ?? []).filter(
        (p: any) => !noticeReadIds.includes(p.id) && Date.now() - new Date(p.createDate).getTime() < week,
      ).length);
      setUnreadDiary((diary?.content ?? []).filter(
        (p: any) => !diaryReadIds.includes(p.id) && Date.now() - new Date(p.createDate).getTime() < week,
      ).length);
    } catch {}
  }, [selectedChild, today]);

  useEffect(() => { loadData(); }, [loadData]);

  // [woo] 선택 자녀 바뀌면 출결 + 요약 다시 로드
  useEffect(() => { loadAttendance(); }, [loadAttendance]);
  useEffect(() => { loadTodaySummary(); }, [loadTodaySummary]);

  const onRefresh = async () => { setRefreshing(true); await Promise.all([loadData(), loadAttendance(), loadTodaySummary()]); setRefreshing(false); };

  const todayCfg = todayStatus
    ? (STATUS_CONFIG[todayStatus.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.NONE)
    : null;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* 인사말 */}
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>안녕하세요, {user?.name ?? ""}님</Text>
        <Text style={styles.greetingDate}>
          {now.getFullYear()}년 {now.getMonth() + 1}월 {now.getDate()}일
        </Text>
      </View>

      {/* 미확인 알림 배너 */}
      {(unreadNotices > 0 || unreadDiary > 0) && (
        <View style={styles.alertBanner}>
          <Ionicons name="notifications-outline" size={18} color={colors.warning} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            {unreadNotices > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate("게시판")}>
                <Text style={styles.alertText}>
                  가정통신문 <Text style={styles.alertCount}>{unreadNotices}건</Text> 확인하세요
                </Text>
              </TouchableOpacity>
            )}
            {unreadDiary > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate("게시판")}>
                <Text style={styles.alertText}>
                  알림장 <Text style={styles.alertCount}>{unreadDiary}건</Text> 등록됨
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* 오늘의 출결 상태 카드 */}
      <View style={styles.card}>
        {/* 자녀 헤더 */}
        <View style={styles.childHeader}>
          <View style={styles.childAvatar}>
            <Ionicons name="person" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.childName}>{selectedChild?.name ?? "-"}</Text>
            <Text style={styles.childSubtitle}>오늘의 출결 상태</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* 출결 상태 행 */}
        <View style={styles.attRow}>
          <Text style={styles.attLabel}>출결 상태</Text>
          <View style={styles.attRight}>
            {todayCfg ? (
              <>
                <View style={[styles.statusDot, { backgroundColor: todayCfg.color }]} />
                <View style={[styles.statusPill, { borderColor: todayCfg.color }]}>
                  <Text style={[styles.statusPillText, { color: todayCfg.color }]}>
                    {todayCfg.label}
                  </Text>
                </View>
              </>
            ) : (
              <Text style={styles.noDataSmall}>미확인</Text>
            )}
          </View>
        </View>

        {/* 등교 시간 행 */}
        <View style={styles.attRow}>
          <View style={styles.attLabelRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.attLabel}>등교 시간</Text>
          </View>
          <Text style={styles.attTime}>
            {todayStatus?.checkInTime ? todayStatus.checkInTime.slice(0, 5) : "--:--"}
          </Text>
        </View>

      </View>

      {/* [woo] 오늘의 하루 요약 카드 */}
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate("DailySummary" as never)}
      >
        <View style={styles.cardTitleRow}>
          <View style={styles.summaryIconWrap}>
            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
          </View>
          <Text style={styles.cardTitle}>{summaryLabel}</Text>
          <Ionicons name="chevron-forward-outline" size={16} color={colors.textSecondary} style={{ marginLeft: "auto" }} />
        </View>
        {todaySummary ? (
          <Text style={styles.summaryText} numberOfLines={3}>{todaySummary}</Text>
        ) : (
          <Text style={styles.summaryEmpty}>아직 작성된 요약이 없어요</Text>
        )}
      </TouchableOpacity>

      {/* 바로 가기 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>바로 가기</Text>
        <View style={styles.quickGrid}>
          {QUICK.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.quickItem}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Ionicons name={item.icon} size={28} color={colors.primary} />
              <Text style={styles.quickLabel}>{item.label}</Text>
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

  alertBanner: {
    marginHorizontal: 16, marginBottom: 12, backgroundColor: colors.warning + "22",
    borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "flex-start",
    borderWidth: 1, borderColor: colors.warning + "55",
  },
  alertText: { fontSize: 13, color: colors.text, marginBottom: 2 },
  alertCount: { fontWeight: "bold", color: colors.late },

  card: {
    marginHorizontal: 16, marginBottom: 12, backgroundColor: colors.card,
    borderRadius: 16, padding: 18,
    shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 14 },

  // 자녀 헤더
  childHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  childAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  childName: { fontSize: 16, fontWeight: "700", color: colors.text },
  childSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  divider: { height: 1, backgroundColor: colors.borderLight, marginBottom: 14 },

  // 출결 행
  attRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  attLabel: { fontSize: 14, color: colors.textSecondary },
  attLabelRow: { flexDirection: "row", alignItems: "center" },
  attRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1.5 },
  statusPillText: { fontSize: 12, fontWeight: "700" },
  noDataSmall: { fontSize: 13, color: colors.textLight },
  attTime: { fontSize: 18, fontWeight: "700", color: colors.text },

  // 월별 버튼
  monthlyBtn: {
    marginTop: 4, backgroundColor: colors.primary,
    borderRadius: 10, paddingVertical: 12, alignItems: "center",
  },
  monthlyBtnText: { color: colors.textInverse, fontWeight: "700", fontSize: 14 },

  // 하루 요약
  cardTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  summaryIconWrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primaryLight,
    justifyContent: "center", alignItems: "center", marginRight: 8,
  },
  summaryText: { fontSize: 14, color: colors.text, lineHeight: 22 },
  summaryEmpty: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },

  // 바로가기
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickItem: {
    width: "47%", backgroundColor: colors.backgroundSecondary,
    borderRadius: 12, paddingVertical: 16,
    alignItems: "center", gap: 8,
  },
  quickLabel: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
});
