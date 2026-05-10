// [woo] 학부모 상담 예약/목록 화면 — 웹 /consultation/reservation 주간 캘린더 방식 동일하게 구현
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Alert, Dimensions, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "@/api/client";
import { cancelConsultation } from "@/api/parent";
import type { Consultation } from "@/api/parent";
import { useTheme, ThemeColors } from "@/hooks/useTheme"; // [woo] 다크모드
import { useSelectedChild } from "@/context/SelectedChildContext"; // [woo] 전역 자녀 선택
import EmptyState from "@/components/EmptyState";

// [woo] 상담 가능 시간대 (웹과 동일)
const TIME_SLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
const WEEK_DAYS = ["월", "화", "수", "목", "금"];
const SCREEN_W = Dimensions.get("window").width;
const TIME_COL_W = 52;
const DAY_COL_W = Math.floor((SCREEN_W - 32 - TIME_COL_W) / 5); // 좌우 padding 16씩

interface ChildInfo {
  id: number;
  name: string;
  grade: number | null;
  classNum: number | null;
}

interface ReservationItem {
  id: number;
  date: string;
  startTime: string;
  endTime?: string;
  writerName: string;
  content?: string;
  status: string;
  studentName?: string;
  consultationType?: string;
  isMine?: boolean;
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:   { label: "대기중",  color: "#856404", bg: "#fff3cd" },
  CONFIRMED: { label: "확정",    color: "#155724", bg: "#d4edda" },
  COMPLETED: { label: "완료",    color: "#383d41", bg: "#e2e3e5" },
  CANCELLED: { label: "취소됨",  color: "#721c24", bg: "#f8d7da" },
};

// [woo] 날짜 유틸
function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const m = new Date(d);
  m.setDate(d.getDate() + diff);
  m.setHours(0, 0, 0, 0);
  return m;
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function endTimeOf(start: string): string {
  const [h, m] = start.split(":").map(Number);
  return `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function ConsultationScreen() {
  const { colors } = useTheme(); // [woo] 다크모드 색상
  const styles = makeStyles(colors);

  // [woo] 전역 선택된 자녀 기본값 + 화면 내 자녀 변경 모달
  const { selectedChild: globalChild } = useSelectedChild();
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [localChild, setLocalChild] = useState<ChildInfo | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // [woo] 실제 사용하는 자녀: 화면 내 선택 우선, 없으면 전역
  const selectedChild = localChild ?? (globalChild as ChildInfo | null);

  // [woo] 주간 캘린더
  const [monday, setMonday] = useState(() => getMonday(new Date()));
  const [calReservations, setCalReservations] = useState<ReservationItem[]>([]);

  // [woo] 선택된 슬롯 + 예약 폼
  const [selected, setSelected] = useState<{ date: string; time: string } | null>(null);
  const [consultationType, setConsultationType] = useState<"VISIT" | "PHONE">("VISIT");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  // [woo] 내 예약 목록
  const [myList, setMyList] = useState<ReservationItem[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [refreshing, setRefreshing] = useState(false);

  const weekDates = useMemo(() => Array.from({ length: 5 }, (_, i) => addDays(monday, i)), [monday]);
  const startStr = fmt(monday);
  const endStr = fmt(addDays(monday, 4));
  const todayStr = fmt(new Date());

  const loadCalendar = useCallback(async () => {
    try {
      const params = new URLSearchParams({ startDate: startStr, endDate: endStr });
      if (selectedChild) params.append("studentUserUid", String(selectedChild.id));
      const res = await api.get<ReservationItem[]>(`/consultation/reservations?${params}`);
      setCalReservations(
        (Array.isArray(res.data) ? res.data : []).map((r) => ({
          ...r,
          startTime: r.startTime?.slice(0, 5) ?? "",
          endTime: r.endTime?.slice(0, 5),
        }))
      );
    } catch {
      setCalReservations([]);
    }
  }, [startStr, endStr, selectedChild]);

  const loadMyList = useCallback(async () => {
    try {
      const params = selectedChild ? `?studentUserUid=${selectedChild.id}` : "";
      const res = await api.get<ReservationItem[]>(`/consultation/reservations/my${params}`);
      setMyList(
        (Array.isArray(res.data) ? res.data : []).map((r) => ({
          ...r,
          startTime: r.startTime?.slice(0, 5) ?? "",
          endTime: r.endTime?.slice(0, 5),
        }))
      );
    } catch {
      setMyList([]);
    }
  }, [selectedChild]);

  const loadChildren = useCallback(async () => {
    try {
      const res = await api.get<ChildInfo[]>("/consultation/reservations/children");
      setChildren(Array.isArray(res.data) ? res.data : []);
    } catch {}
  }, []);

  useEffect(() => { loadChildren(); }, [loadChildren]);
  useEffect(() => { loadCalendar(); }, [loadCalendar]);
  useEffect(() => { loadMyList(); }, [loadMyList]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadCalendar(), loadMyList()]);
    setRefreshing(false);
  };

  // [woo] 예약 맵: `${date}_${startTime}` → 예약 정보
  const reservationMap = useMemo(() => {
    const map: Record<string, ReservationItem> = {};
    for (const r of calReservations) {
      if (r.status === "CANCELLED") continue;
      map[`${r.date}_${r.startTime}`] = r;
    }
    return map;
  }, [calReservations]);

  const handleCellPress = (date: string, time: string) => {
    const key = `${date}_${time}`;
    if (reservationMap[key]) return; // 이미 예약된 슬롯
    if (date < todayStr) return;     // 과거 날짜
    if (selected?.date === date && selected?.time === time) {
      setSelected(null);
    } else {
      setSelected({ date, time });
    }
  };

  const handleReserve = async () => {
    if (!selectedChild) { Alert.alert("알림", "자녀를 선택해주세요."); return; }
    if (!selected) return;
    setSaving(true);
    try {
      await api.post("/consultation/reservations", {
        date: selected.date,
        startTime: selected.time,
        endTime: endTimeOf(selected.time),
        content: content.trim() || undefined,
        studentUserUid: selectedChild.id,
        consultationType,
      });
      Alert.alert("예약 완료", "상담 예약이 접수되었습니다.\n선생님 확인 후 확정됩니다.");
      setSelected(null);
      setContent("");
      await Promise.all([loadCalendar(), loadMyList()]);
    } catch {
      Alert.alert("오류", "예약 접수에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = (id: number) => {
    Alert.alert("상담 취소", "이 예약을 취소하시겠습니까?", [
      { text: "닫기", style: "cancel" },
      {
        text: "취소하기", style: "destructive",
        onPress: async () => {
          try {
            await cancelConsultation(id);
            await Promise.all([loadCalendar(), loadMyList()]);
          } catch {
            Alert.alert("오류", "취소에 실패했습니다.");
          }
        },
      },
    ]);
  };

  const filteredList = filter === "ALL" ? myList : myList.filter((r) => r.status === filter);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >

      {/* [woo] 자녀 선택 드롭다운 */}
      <View style={styles.dropdownWrapper}>
        <TouchableOpacity
          style={styles.childSelector}
          onPress={() => children.length > 1 && setShowDropdown((v) => !v)}
        >
          <Ionicons name="person-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.childSelectorText}>
            {selectedChild ? `${selectedChild.name} (${selectedChild.grade}학년 ${selectedChild.classNum}반)` : "자녀를 선택하세요"}
          </Text>
          {children.length > 1 && (
            <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={16} color={colors.textLight} />
          )}
        </TouchableOpacity>
        {showDropdown && (
          <View style={styles.dropdownList}>
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={[styles.dropdownItem, selectedChild?.id === child.id && styles.dropdownItemActive]}
                onPress={() => { setLocalChild(child); setShowDropdown(false); setSelected(null); }}
              >
                <Ionicons
                  name={selectedChild?.id === child.id ? "radio-button-on" : "radio-button-off"}
                  size={16}
                  color={selectedChild?.id === child.id ? colors.primary : colors.textLight}
                />
                <Text style={[styles.dropdownItemText, selectedChild?.id === child.id && { color: colors.primary }]}>
                  {child.name} ({child.grade}학년 {child.classNum}반)
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* [woo] 주간 캘린더 */}
      <View style={styles.calCard}>
        {/* 주 이동 헤더 */}
        <View style={styles.calHeader}>
          <TouchableOpacity onPress={() => { setMonday((p) => addDays(p, -7)); setSelected(null); }} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setMonday(getMonday(new Date())); setSelected(null); }}>
            <Text style={styles.calHeaderTitle}>
              {monday.getMonth() + 1}월 {monday.getDate()}일 — {addDays(monday, 4).getMonth() + 1}월 {addDays(monday, 4).getDate()}일
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setMonday((p) => addDays(p, 7)); setSelected(null); }} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* 요일 헤더 */}
        <View style={styles.calRow}>
          <View style={[styles.timeCell, { width: TIME_COL_W }]} />
          {weekDates.map((d, i) => {
            const ds = fmt(d);
            const isToday = ds === todayStr;
            return (
              <View key={i} style={[styles.dayHeader, { width: DAY_COL_W }, isToday && styles.dayHeaderToday]}>
                <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{WEEK_DAYS[i]}</Text>
                <Text style={[styles.dayDate, isToday && styles.dayLabelToday]}>{d.getDate()}</Text>
              </View>
            );
          })}
        </View>

        {/* 시간 슬롯 그리드 */}
        {TIME_SLOTS.map((time) => (
          <View key={time} style={[styles.calRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <View style={[styles.timeCell, { width: TIME_COL_W }]}>
              <Text style={styles.timeCellText}>{time}</Text>
            </View>
            {weekDates.map((d, i) => {
              const ds = fmt(d);
              const key = `${ds}_${time}`;
              const reservation = reservationMap[key];
              const isPast = ds < todayStr || (ds === todayStr && time < new Date().toTimeString().slice(0, 5));
              const isSelected = selected?.date === ds && selected?.time === time;
              const isMine = reservation?.isMine;
              const isTaken = !!reservation && !isMine;

              let cellStyle = styles.slotFree;
              if (isPast) cellStyle = styles.slotPast;
              else if (isSelected) cellStyle = styles.slotSelected;
              else if (isMine) cellStyle = styles.slotMine;
              else if (isTaken) cellStyle = styles.slotTaken;

              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.slotCell, { width: DAY_COL_W }, cellStyle]}
                  onPress={() => handleCellPress(ds, time)}
                  disabled={isPast || isTaken}
                  activeOpacity={0.7}
                >
                  {isSelected && <Ionicons name="checkmark" size={14} color={colors.textInverse} />}
                  {isMine && <Ionicons name="person" size={12} color={colors.primary} />}
                  {isTaken && <View style={styles.takenDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* [woo] 범례 */}
        <View style={styles.legend}>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.primaryLight }]} /><Text style={styles.legendText}>신청가능</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.primary }]} /><Text style={styles.legendText}>선택</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.primaryLight, borderWidth: 1.5, borderColor: colors.primary }]} /><Text style={styles.legendText}>내 예약</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.cardSecondary }]} /><Text style={styles.legendText}>예약됨</Text></View>
        </View>
      </View>

      {/* [woo] 선택된 슬롯 예약 폼 */}
      {selected && (
        <View style={styles.formCard}>
          <View style={styles.formTitleRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={styles.formTitle}>{selected.date}  {selected.time} ~ {endTimeOf(selected.time)}</Text>
            <TouchableOpacity onPress={() => setSelected(null)}>
              <Ionicons name="close" size={18} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          {/* 상담 방식 */}
          <View style={styles.typeRow}>
            {(["VISIT", "PHONE"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeBtn, consultationType === t && styles.typeBtnActive]}
                onPress={() => setConsultationType(t)}
              >
                <Ionicons
                  name={t === "VISIT" ? "walk-outline" : "call-outline"}
                  size={15}
                  color={consultationType === t ? colors.textInverse : colors.textSecondary}
                />
                <Text style={[styles.typeBtnText, consultationType === t && styles.typeBtnTextActive]}>
                  {t === "VISIT" ? "방문 상담" : "전화 상담"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 메모 */}
          <TextInput
            style={styles.contentInput}
            placeholder="상담 내용이나 요청사항 (선택)"
            placeholderTextColor={colors.placeholder}
            multiline
            value={content}
            onChangeText={setContent}
          />

          <TouchableOpacity
            style={[styles.submitBtn, saving && { opacity: 0.6 }]}
            onPress={handleReserve}
            disabled={saving}
          >
            <Text style={styles.submitBtnText}>{saving ? "접수 중..." : "예약 접수"}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* [woo] 내 예약 목록 */}
      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>내 예약 현황</Text>

        {/* 필터 탭 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={styles.filterRow}>
            {(["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, filter === f && styles.filterChipActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                  {f === "ALL" ? "전체" : STATUS_CFG[f]?.label ?? f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {filteredList.length === 0 ? (
          <EmptyState icon="💬" title="예약 내역이 없습니다" subtitle="위 캘린더에서 빈 슬롯을 탭해 예약하세요" />
        ) : (
          filteredList.map((r) => {
            const cfg = STATUS_CFG[r.status] ?? STATUS_CFG.PENDING;
            // [woo] 확정 이후에는 취소 불가 — PENDING 상태만 취소 허용
            const canCancel = r.status === "PENDING";
            return (
              <View key={r.id} style={[styles.reserveCard, (r.status === "CANCELLED" || r.status === "COMPLETED") && { opacity: 0.65 }]}>
                <View style={styles.reserveCardHeader}>
                  <View style={{ gap: 2 }}>
                    <View style={styles.reserveInfoRow}>
                      <Ionicons name="calendar-outline" size={14} color={colors.textLight} />
                      <Text style={styles.reserveInfoText}>{r.date}  {r.startTime}{r.endTime ? ` ~ ${r.endTime}` : ""}</Text>
                    </View>
                    {r.consultationType && (
                      <View style={styles.reserveInfoRow}>
                        <Ionicons name={r.consultationType === "VISIT" ? "walk-outline" : "call-outline"} size={14} color={colors.textLight} />
                        <Text style={styles.reserveInfoText}>{r.consultationType === "VISIT" ? "방문 상담" : "전화 상담"}</Text>
                      </View>
                    )}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>
                {r.content ? <Text style={styles.reserveNote}>{r.content}</Text> : null}
                {canCancel && (
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(r.id)}>
                    <Ionicons name="close-circle-outline" size={14} color="#dc3545" />
                    <Text style={styles.cancelBtnText}>예약 취소</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </View>

      <View style={{ height: 32 }} />

    </ScrollView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },

  // 자녀 선택
  childSelector: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1.5, borderColor: colors.primary + "40" },
  childSelectorText: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.text },

  // 캘린더 카드
  calCard: { marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 16, padding: 12, marginBottom: 12, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 },
  calHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  calHeaderTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  navBtn: { padding: 4 },

  calRow: { flexDirection: "row" },
  timeCell: { justifyContent: "center", alignItems: "center", height: 38 },
  timeCellText: { fontSize: 11, color: colors.textLight, fontWeight: "600" },
  dayHeader: { alignItems: "center", justifyContent: "center", paddingVertical: 6, height: 44 },
  dayHeaderToday: { backgroundColor: colors.primary + "18", borderRadius: 8 },
  dayLabel: { fontSize: 11, fontWeight: "700", color: colors.textSecondary },
  dayDate: { fontSize: 13, fontWeight: "700", color: colors.text, marginTop: 1 },
  dayLabelToday: { color: colors.primary },

  slotCell: { height: 38, alignItems: "center", justifyContent: "center", borderLeftWidth: 1, borderLeftColor: colors.border },
  slotFree: { backgroundColor: colors.primaryLight + "60" },
  slotPast: { backgroundColor: colors.cardSecondary + "80" },
  slotSelected: { backgroundColor: colors.primary },
  slotMine: { backgroundColor: colors.primaryLight, borderWidth: 1.5, borderColor: colors.primary },
  slotTaken: { backgroundColor: colors.cardSecondary },
  takenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textLight },

  legend: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 10, color: colors.textLight },

  // 예약 폼
  formCard: { marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: colors.primary + "60" },
  formTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  formTitle: { flex: 1, fontSize: 14, fontWeight: "700", color: colors.primary },
  typeRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  typeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.inputBg },
  typeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeBtnText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  typeBtnTextActive: { color: colors.textInverse },
  contentInput: { borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.text, backgroundColor: colors.inputBg, height: 72, textAlignVertical: "top", marginBottom: 12 },
  submitBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  submitBtnText: { color: colors.textInverse, fontWeight: "700", fontSize: 15 },

  // 예약 목록
  listSection: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 10 },
  filterRow: { flexDirection: "row", gap: 8, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  filterChipTextActive: { color: colors.textInverse },

  reserveCard: { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  reserveCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  reserveInfoRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  reserveInfoText: { fontSize: 13, color: colors.textSecondary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: "700" },
  reserveNote: { fontSize: 13, color: colors.textSecondary, fontStyle: "italic", marginTop: 4 },
  cancelBtn: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-end", marginTop: 8, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: "#dc3545" },
  cancelBtnText: { color: "#dc3545", fontSize: 12, fontWeight: "600" },

  // 자녀 드롭다운
  dropdownWrapper: { marginHorizontal: 16, marginBottom: 8, zIndex: 10 },
  dropdownList: { backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginTop: 4, overflow: "hidden", shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 6 },
  dropdownItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  dropdownItemActive: { backgroundColor: colors.primaryLight },
  dropdownItemText: { fontSize: 14, fontWeight: "600", color: colors.text },
});
