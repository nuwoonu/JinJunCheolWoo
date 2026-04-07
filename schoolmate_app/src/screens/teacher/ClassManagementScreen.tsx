// [woo] 교사 학급 관리 — 학생 출결 드롭다운 변경 + Toast 피드백
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert, FlatList, Modal, Pressable, RefreshControl,
  StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { getClassAttendance, updateAttendance, markAllPresent } from "@/api/teacher";
import type { AttendanceRecord } from "@/api/teacher";
import { STATUS_CONFIG, StatusKey } from "@/constants/colors"; // [woo] STATUS_CONFIG/StatusKey 유지
import { useTheme, ThemeColors } from "@/hooks/useTheme"; // [woo] 다크모드
import { useToast } from "@/components/Toast";

const STATUS_KEYS = (Object.keys(STATUS_CONFIG) as StatusKey[]).filter((k) => k !== "NONE");

// [woo] 네이티브 Picker 대신 순수 RN Modal로 구현한 출결 선택 컴포넌트
function StatusPicker({
  current,
  onSelect,
  colors,
}: {
  current: StatusKey;
  onSelect: (key: string) => void;
  colors: ThemeColors;
}) {
  const styles = makeStyles(colors); // [woo]
  const [visible, setVisible] = useState(false);
  const cfg = STATUS_CONFIG[current] ?? STATUS_CONFIG.NONE;

  return (
    <>
      {/* 현재 상태 버튼 (터치하면 바텀시트 열림) */}
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={[styles.statusBtn, { borderColor: cfg.color, backgroundColor: cfg.bg }]}
        activeOpacity={0.7}
      >
        <Text style={[styles.statusBtnText, { color: cfg.color }]}>{cfg.label}</Text>
        <Text style={[styles.statusBtnArrow, { color: cfg.color }]}>▾</Text>
      </TouchableOpacity>

      {/* 바텀시트 모달 */}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setVisible(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>출결 상태 변경</Text>
            {STATUS_KEYS.map((k) => {
              const c = STATUS_CONFIG[k];
              const isSelected = k === current;
              return (
                <TouchableOpacity
                  key={k}
                  onPress={() => { onSelect(k); setVisible(false); }}
                  style={[styles.modalOption, isSelected && { backgroundColor: c.bg }]}
                  activeOpacity={0.6}
                >
                  <View style={[styles.modalDot, { backgroundColor: c.color }]} />
                  <Text style={[styles.modalOptionText, { color: c.color }]}>{c.label}</Text>
                  {isSelected && <Text style={styles.modalCheck}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

export default function ClassManagementScreen() {
  const { colors } = useTheme(); // [woo] 다크모드 색상
  const styles = makeStyles(colors); // [woo]
  const { showToast } = useToast();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<StatusKey | "ALL">("ALL");

  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;

  const load = useCallback(async () => {
    const data = await getClassAttendance(today);
    setRecords(data);
  }, [today]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleChange = async (studentInfoId: number, status: string) => {
    const name = records.find((r) => r.studentInfoId === studentInfoId)?.studentName ?? "";
    const cfg = STATUS_CONFIG[status as StatusKey] ?? STATUS_CONFIG.NONE;
    try {
      await updateAttendance(studentInfoId, today, status);
      setRecords((prev) => prev.map((r) => r.studentInfoId === studentInfoId ? { ...r, status: status as any } : r));
      showToast(`${name} — ${cfg.label} 처리되었습니다`, "success");
    } catch {
      showToast("출결 변경에 실패했습니다.", "error");
    }
  };

  const handleAllPresent = () => {
    Alert.alert("전원 출석", "전체 학생을 출석 처리하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "확인",
        onPress: async () => {
          try {
            await markAllPresent(today);
            await load();
            showToast("전원 출석 처리되었습니다", "success");
          } catch {
            showToast("처리에 실패했습니다.", "error");
          }
        },
      },
    ]);
  };

  const filtered = filter === "ALL" ? records : records.filter((r) => r.status === filter);
  const counts = {
    PRESENT: records.filter((r) => r.status === "PRESENT").length,
    LATE:    records.filter((r) => r.status === "LATE").length,
    ABSENT:  records.filter((r) => r.status === "ABSENT").length,
    NONE:    records.filter((r) => r.status === "NONE").length,
  };

  if (isWeekend) {
    return (
      <View style={styles.center}>
        <Text style={styles.holidayIcon}>🏖</Text>
        <Text style={styles.holidayText}>주말에는 출결 관리가 필요하지 않습니다</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 통계 */}
      <View style={styles.statsCard}>
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
        <TouchableOpacity onPress={handleAllPresent} style={styles.allBtn}>
          <Text style={styles.allBtnText}>✓  전원 출석 처리</Text>
        </TouchableOpacity>
      </View>

      {/* 필터 */}
      <View style={styles.filterRow}>
        {(["ALL", ...STATUS_KEYS] as (StatusKey | "ALL")[]).map((k) => {
          const active = filter === k;
          const cfg = k !== "ALL" ? STATUS_CONFIG[k] : null;
          return (
            <TouchableOpacity
              key={k}
              onPress={() => setFilter(k)}
              style={[styles.filterChip, active && { backgroundColor: cfg?.color ?? colors.primary, borderColor: cfg?.color ?? colors.primary }]}
            >
              <Text style={[styles.filterText, active && { color: colors.textInverse }]}>
                {k === "ALL" ? `전체 ${records.length}` : `${cfg?.label} ${counts[k as keyof typeof counts] ?? 0}`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 학생 목록 */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.studentInfoId)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <View style={styles.studentRow}>
            <Text style={styles.studentNum}>{item.studentNumber}</Text>
            <Text style={styles.studentName}>{item.studentName}</Text>
            <StatusPicker
              current={item.status as StatusKey}
              onSelect={(val) => handleChange(item.studentInfoId, val)}
              colors={colors}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>학생 정보가 없습니다</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

// [woo] makeStyles: 다크/라이트 모드 색상 반영
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  holidayIcon: { fontSize: 48, marginBottom: 12 },
  holidayText: { fontSize: 15, color: colors.textSecondary, textAlign: "center" },
  statsCard: { margin: 14, backgroundColor: colors.card, borderRadius: 14, padding: 16, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statsRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 12 },
  statItem: { alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "bold" },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  allBtn: { backgroundColor: colors.primaryLight, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  allBtnText: { color: colors.primary, fontWeight: "700", fontSize: 14 },
  filterRow: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 14, gap: 8, marginBottom: 10 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
  filterText: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },
  studentRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, marginHorizontal: 14, marginBottom: 8, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  studentNum: { fontSize: 13, color: colors.textSecondary, minWidth: 28, textAlign: "right", marginRight: 12 },
  studentName: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.text },
  empty: { flex: 1, alignItems: "center", paddingVertical: 40 },
  emptyText: { color: colors.textLight, fontSize: 14 },

  // [woo] StatusPicker 스타일
  statusBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5 },
  statusBtnText: { fontSize: 12, fontWeight: "700" },
  statusBtnArrow: { fontSize: 10 },

  // [woo] 바텀시트 모달 스타일
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" },
  modalSheet: { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40, paddingTop: 12, paddingHorizontal: 20 },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: "bold", color: colors.text, marginBottom: 16, textAlign: "center" },
  modalOption: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, marginBottom: 6 },
  modalDot: { width: 12, height: 12, borderRadius: 6 },
  modalOptionText: { fontSize: 15, fontWeight: "600", flex: 1 },
  modalCheck: { fontSize: 16, fontWeight: "bold", color: colors.primary },
});
