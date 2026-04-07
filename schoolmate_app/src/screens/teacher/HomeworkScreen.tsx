// [woo] 교사 과제 관리 화면
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList, RefreshControl, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import { getHomeworkList } from "@/api/teacher";
import { useTheme, ThemeColors } from "@/hooks/useTheme"; // [woo] 다크모드
import EmptyState from "@/components/EmptyState";

interface HomeworkItem {
  id: number;
  title: string;
  subjectName?: string;
  dueDate: string;
  status: string;
  submissionCount?: number;
  totalCount?: number;
}

export default function TeacherHomeworkScreen() {
  const { colors } = useTheme(); // [woo] 다크모드 색상
  const styles = makeStyles(colors); // [woo]

  // [woo] STATUS_CFG는 colors 의존이므로 컴포넌트 안에서 정의
  const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
    ACTIVE:   { label: "진행중", color: colors.late,    bg: colors.lateBg },
    CLOSED:   { label: "마감",   color: colors.absent,  bg: colors.absentBg },
    DRAFT:    { label: "임시저장",color: colors.none,   bg: colors.noneBg },
  };

  const [items, setItems] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getHomeworkList(0);
      setItems(res.content ?? []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <FlatList
      style={styles.container}
      data={items}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      contentContainerStyle={items.length === 0 ? { flex: 1 } : { padding: 14 }}
      ListEmptyComponent={loading ? null : <EmptyState icon="📚" title="등록된 과제가 없습니다" subtitle="학생들을 위한 과제를 만들어 보세요" />}
      renderItem={({ item }) => {
        const cfg = STATUS_CFG[item.status] ?? STATUS_CFG.ACTIVE;
        const rate = item.totalCount ? Math.round((item.submissionCount ?? 0) / item.totalCount * 100) : null;
        return (
          <View style={styles.card}>
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
              <Text style={styles.due}>마감: {new Date(item.dueDate).toLocaleDateString("ko-KR")}</Text>
              {rate !== null && (
                <View style={styles.rateWrap}>
                  <Text style={styles.rateText}>제출 {rate}%</Text>
                  <View style={styles.rateBar}>
                    <View style={[styles.rateFill, { width: `${rate}%` as any, backgroundColor: rate >= 70 ? colors.present : colors.late }]} />
                  </View>
                  <Text style={styles.rateCount}>{item.submissionCount}/{item.totalCount}</Text>
                </View>
              )}
            </View>
          </View>
        );
      }}
    />
  );
}

// [woo] makeStyles: 다크/라이트 모드 색상 반영
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  title: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 3 },
  subject: { fontSize: 12, color: colors.textSecondary },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, borderWidth: 1.5, flexShrink: 0 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  due: { fontSize: 12, color: colors.textSecondary },
  rateWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  rateText: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },
  rateBar: { width: 60, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden" },
  rateFill: { height: "100%", borderRadius: 3 },
  rateCount: { fontSize: 11, color: colors.textLight },
});
