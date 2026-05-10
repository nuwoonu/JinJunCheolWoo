// [woo] 학부모 자녀 성적 조회 화면
// FCM 알림 탭 시 actionUrl "/parent/grades?child={studentInfoId}" 로 딥링크 진입 가능
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons"; // [woo]
import { useTheme, ThemeColors } from "@/hooks/useTheme"; // [woo] 다크모드
import { useSelectedChild } from "@/context/SelectedChildContext"; // [woo] 전역 자녀 선택
import {
  getChildGrades,
  getChildClassInfo,
  getTerms,
  TEST_TYPE_LABEL,
} from "@/api/grade";
import type { GradeItem, TermInfo, ClassInfo } from "@/api/grade";
import EmptyState from "@/components/EmptyState";

type RouteParams = {
  GradeScreen: {
    childStudentInfoId?: number; // [woo] 알림 딥링크에서 전달
  };
};

// [woo] 수행평가 제외
type TestTypeFilter = "ALL" | "MIDTERMTEST" | "FINALTEST" | "HOMEWORK" | "QUIZ";

export default function GradeScreen() {
  const { colors } = useTheme(); // [woo] 다크모드 색상
  const styles = makeStyles(colors); // [woo]
  const route = useRoute<RouteProp<RouteParams, "GradeScreen">>();
  const deepLinkChildId = route.params?.childStudentInfoId;
  const { selectedChild: globalChild } = useSelectedChild(); // [woo] 내정보에서 선택된 자녀

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // [woo] 학기 목록 + 선택
  const [terms, setTerms] = useState<TermInfo[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<number | undefined>(undefined);

  // [woo] 성적 데이터
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);

  // [woo] 시험 유형 필터
  const [testFilter, setTestFilter] = useState<TestTypeFilter>("ALL");

  // [woo] 과목 아코디언 — 터치한 과목명 set
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const toggleSubject = (name: string) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  // [woo] 딥링크 우선, 없으면 내정보에서 선택된 자녀의 studentInfoId 사용
  // [woo] 딥링크 우선, 없으면 내정보에서 선택된 자녀의 studentInfoId 사용
  const studentInfoId = deepLinkChildId ?? globalChild?.studentInfoId ?? null;

  // ── 초기 로딩 ──────────────────────────────────────────────

  const loadInitial = useCallback(async () => {
    try {
      const termList = await getTerms();
      setTerms(termList);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // ── 성적 조회 ──────────────────────────────────────────────

  const loadGrades = useCallback(async () => {
    if (!studentInfoId) return;
    try {
      const [gradeData, classData] = await Promise.all([
        getChildGrades(studentInfoId, selectedTermId),
        getChildClassInfo(studentInfoId, selectedTermId),
      ]);
      setGrades(gradeData);
      setClassInfo(classData);
    } catch {
      setGrades([]);
      setClassInfo(null);
    }
  }, [studentInfoId, selectedTermId]);

  useEffect(() => {
    if (studentInfoId) loadGrades();
  }, [loadGrades, studentInfoId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGrades();
    setRefreshing(false);
  };

  // ── 필터링 + 과목별 그룹핑 ──────────────────────────────────────────────

  const filtered =
    testFilter === "ALL" ? grades : grades.filter((g) => g.testType === testFilter);

  // [woo] 과목별 그룹핑
  const grouped: Record<string, typeof grades> = {};
  filtered.forEach((g) => {
    if (!grouped[g.subjectName]) grouped[g.subjectName] = [];
    grouped[g.subjectName].push(g);
  });
  const subjectNames = Object.keys(grouped);

  // [woo] 시험 유형 정렬 순서
  // [woo] 수행평가 제외, 순서: 중간고사→기말고사→과제→퀴즈
  const TEST_ORDER: Record<string, number> = {
    MIDTERMTEST: 0, FINALTEST: 1, HOMEWORK: 2, QUIZ: 3,
  };
  subjectNames.forEach((s) => {
    grouped[s].sort((a, b) => (TEST_ORDER[a.testType] ?? 9) - (TEST_ORDER[b.testType] ?? 9));
  });

  // [woo] 내 평균: 현재 필터 기준 전체 grades 평균
  const avgScore =
    filtered.length > 0
      ? Math.round((filtered.reduce((s, g) => s + g.score, 0) / filtered.length) * 10) / 10
      : null;

  // [woo] 학급 평균: classAvgs 리스트에서 전체 평균 계산
  const classOverallAvg: number | null = (() => {
    const avgs = classInfo?.classAvgs;
    if (!avgs?.length) return null;
    const vals: number[] = [];
    avgs.forEach((s) => {
      if (s.midtermAvg != null) vals.push(s.midtermAvg);
      if (s.finalAvg != null) vals.push(s.finalAvg);
      if (s.quizAvg != null) vals.push(s.quizAvg);
      if (s.homeworkAvg != null) vals.push(s.homeworkAvg);
    });
    if (!vals.length) return null;
    return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10;
  })();

  // ── 점수 색상 ──────────────────────────────────────────────

  function scoreColor(score: number): string {
    if (score >= 90) return colors.present;
    if (score >= 70) return colors.primary;
    if (score >= 50) return colors.late;
    return colors.absent;
  }

  // ── 렌더링 ──────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!studentInfoId) {
    return <EmptyState icon="👨‍👩‍👧" title="내정보에서 자녀를 선택해주세요" />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >

      {/* [woo] 학기 선택 */}
      {terms.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipRow}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {terms.map((t) => {
            const active = selectedTermId === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => setSelectedTermId(t.id)}
                style={[styles.termChip, active && styles.termChipActive]}
              >
                <Text style={[styles.termChipText, active && styles.termChipTextActive]}>
                  {t.label ?? `${t.schoolYear} ${t.semester}학기`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* [woo] 학급 비교 요약 카드 — myAverage: grades 평균, classAverage: classAvgs 평균 */}
      {classInfo && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            📊 {globalChild?.name}의 성적 요약
          </Text>
          {classInfo.homeroomTeacherName && (
            <Text style={styles.teacherName}>
              담임: {classInfo.homeroomTeacherName}
            </Text>
          )}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>내 평균</Text>
              <Text style={[styles.summaryValue, { color: scoreColor(avgScore ?? 0) }]}>
                {avgScore != null ? avgScore.toFixed(1) : "-"}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>학급 평균</Text>
              <Text style={styles.summaryValue}>
                {classOverallAvg != null ? classOverallAvg.toFixed(1) : "-"}
              </Text>
            </View>
            {avgScore != null && classOverallAvg != null && (
              <>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>점수변동</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: avgScore >= classOverallAvg ? colors.present : colors.absent },
                    ]}
                  >
                    {avgScore >= classOverallAvg ? "+" : ""}
                    {(avgScore - classOverallAvg).toFixed(1)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* [woo] 시험 유형 필터 — 전체/중간/기말/과제/퀴즈, 수행평가 제외 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {(["ALL", "MIDTERMTEST", "FINALTEST", "HOMEWORK", "QUIZ"] as TestTypeFilter[]).map((f) => {
          const active = testFilter === f;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setTestFilter(f)}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {f === "ALL" ? "전체" : TEST_TYPE_LABEL[f]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* [woo] 과목별 아코디언 성적 목록 */}
      <View style={styles.gradeList}>
        {filtered.length === 0 ? (
          <EmptyState icon="📝" title="성적 정보가 없습니다" />
        ) : (
          subjectNames.map((subject) => {
            const items = grouped[subject];
            const expanded = expandedSubjects.has(subject);
            const subjectAvg = Math.round(items.reduce((s, g) => s + g.score, 0) / items.length * 10) / 10;
            return (
              <View key={subject} style={styles.gradeItem}>
                {/* 과목 헤더 — 터치하면 펼침 */}
                <TouchableOpacity
                  style={styles.subjectHeader}
                  onPress={() => toggleSubject(subject)}
                  activeOpacity={0.75}
                >
                  <View style={styles.gradeLeft}>
                    <Text style={styles.subjectName}>{subject}</Text>
                    <Text style={styles.classAvgText}>{items.length}개 항목</Text>
                  </View>
                  <View style={styles.gradeRight}>
                    {expanded ? (
                      <Ionicons name="chevron-up" size={18} color={colors.textLight} />
                    ) : (
                      <>
                        <Text style={[styles.scoreText, { color: scoreColor(subjectAvg) }]}>{subjectAvg}</Text>
                        <Text style={styles.scoreUnit}>점</Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity>

                {/* 펼쳐진 세부 항목 */}
                {expanded && (
                  <View style={styles.expandedList}>
                    {items.map((g, i) => (
                      <View key={`${g.gradeId}-${i}`} style={[styles.expandedItem, i > 0 && { borderTopWidth: 1, borderTopColor: colors.borderLight }]}>
                        <View style={styles.gradeLeft}>
                          <View style={styles.gradeMetaRow}>
                            <View style={[styles.testTypeBadge, { backgroundColor: testTypeBg(g.testType, colors) }]}>
                              <Text style={[styles.testTypeText, { color: testTypeColor(g.testType, colors) }]}>
                                {TEST_TYPE_LABEL[g.testType]}
                              </Text>
                            </View>
                            {g.classAverage != null && (
                              <Text style={styles.classAvgText}>학급 평균 {g.classAverage.toFixed(1)}</Text>
                            )}
                          </View>
                        </View>
                        <View style={styles.gradeRight}>
                          <Text style={[styles.scoreText, { color: scoreColor(g.score), fontSize: 22 }]}>{g.score}</Text>
                          <Text style={styles.scoreUnit}>점</Text>
                        </View>
                      </View>
                    ))}
                  </View>
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

// ── 시험 유형별 색상 ──────────────────────────────────────────

function testTypeBg(type: string, colors: ThemeColors): string {
  switch (type) {
    case "MIDTERMTEST": return colors.info + "22";
    case "FINALTEST":   return colors.warning + "22";
    case "QUIZ":        return colors.sick + "22";
    case "HOMEWORK":    return colors.present + "22";
    case "PERFORMANCEASSESSMENT": return "#8b5cf622";
    default: return colors.cardSecondary;
  }
}

function testTypeColor(type: string, colors: ThemeColors): string {
  switch (type) {
    case "MIDTERMTEST": return colors.info;
    case "FINALTEST":   return colors.warning;
    case "QUIZ":        return colors.sick;
    case "HOMEWORK":    return colors.present;
    case "PERFORMANCEASSESSMENT": return "#8b5cf6";
    default: return colors.textSecondary;
  }
}

// ── makeStyles ──────────────────────────────────────────────

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.backgroundSecondary },

  chipRow: { marginBottom: 8, marginTop: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  chipTextActive: { color: colors.primary },

  termChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  termChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  termChipText: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },
  termChipTextActive: { color: colors.primary },

  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
  filterChipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  filterChipText: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },
  filterChipTextActive: { color: colors.textInverse },

  // 요약 카드
  card: { marginHorizontal: 16, marginBottom: 12, backgroundColor: colors.card, borderRadius: 16, padding: 18, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 10 },
  teacherName: { fontSize: 12, color: colors.textSecondary, marginBottom: 12 },
  summaryRow: { flexDirection: "row", justifyContent: "space-around", backgroundColor: colors.cardSecondary, borderRadius: 12, paddingVertical: 16 },
  summaryItem: { alignItems: "center" },
  summaryLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 6 },
  summaryValue: { fontSize: 22, fontWeight: "bold", color: colors.text },
  summaryDivider: { width: 1, backgroundColor: colors.border },

  // 성적 리스트
  gradeList: { paddingHorizontal: 16 },
  gradeItem: {
    backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 10,
    shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  gradeLeft: { flex: 1, marginRight: 12 },
  subjectName: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 4 },
  gradeMetaRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  testTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  testTypeText: { fontSize: 11, fontWeight: "700" },
  classAvgText: { fontSize: 11, color: colors.textSecondary },
  gradeRight: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  scoreText: { fontSize: 28, fontWeight: "bold" },
  scoreUnit: { fontSize: 13, color: colors.textSecondary },

  // [woo] 과목 아코디언
  subjectHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  expandedList: { marginTop: 10, borderTopWidth: 1, borderTopColor: colors.borderLight },
  expandedItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 4 },
});
