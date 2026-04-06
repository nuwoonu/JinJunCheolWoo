import { useEffect, useState } from "react";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";
import api from '@/shared/api/authApi';
import { getChildGrades, getTerms, getChildClassInfo } from "@/shared/api/grade";
import type { GradeResponseDTO, TermDTO, TestType, ChildClassInfoDTO } from "@/shared/api/grade";

// [woo] 학부모 자녀 성적 조회 페이지
// /parent/grades

interface Child {
  studentInfoId: number;
  name: string;
  grade?: number;
  classNum?: number;
}

// const ALL_TYPES: TestType[] = ["MIDTERMTEST", "FINALTEST", "QUIZ", "HOMEWORK"];

// [woo] 한국 교육과정 과목 정렬 순서
const SUBJECT_ORDER = [
  "국어", "수학", "영어",
  "사회", "역사", "한국사", "도덕",
  "과학",
  "기술가정", "기술", "가정",
  "정보", "체육", "음악", "미술",
  "한문", "제2외국어", "교양",
];
function subjectSortKey(name: string): number {
  const idx = SUBJECT_ORDER.findIndex((s) => name.startsWith(s));
  return idx >= 0 ? idx : SUBJECT_ORDER.length;
}

// [woo] 과목별 ri 아이콘
const SUBJECT_ICON: Record<string, string> = {
  "국어": "ri-book-open-line", "수학": "ri-calculator-line", "영어": "ri-global-line",
  "사회": "ri-building-line", "역사": "ri-history-line", "한국사": "ri-flag-line",
  "도덕": "ri-heart-line", "과학": "ri-flask-line", "기술가정": "ri-tools-line",
  "기술": "ri-tools-line", "가정": "ri-home-4-line", "정보": "ri-code-line",
  "체육": "ri-run-line", "음악": "ri-music-line", "미술": "ri-palette-line",
  "한문": "ri-book-2-line", "제2외국어": "ri-earth-line", "교양": "ri-book-read-line",
};
function getSubjectIcon(name: string): string {
  for (const [key, icon] of Object.entries(SUBJECT_ICON)) {
    if (name.startsWith(key)) return icon;
  }
  return "ri-book-2-line";
}

// [woo] F등급 없음 — D가 최저 등급
function gradeLabel(score: number | null): string {
  if (score == null) return "-";
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  return "D";
}

function avg(scores: (number | null)[]): number | null {
  const valid = scores.filter((s): s is number => s != null);
  if (valid.length === 0) return null;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
}

export default function ParentGrades() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<number | undefined>();
  const [terms, setTerms] = useState<TermDTO[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<number | undefined>();
  const [grades, setGrades] = useState<GradeResponseDTO[]>([]);
  const [classInfo, setClassInfo] = useState<ChildClassInfoDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  // [woo] 학업 평균 토글
  const [statsTab, setStatsTab] = useState<"class" | "grade">("class");

  useEffect(() => {
    api.get("/grades/my-children").then((res) => {
      const list: Child[] = res.data.map((c: any) => ({
        studentInfoId: c.studentInfoId, name: c.name, grade: c.grade, classNum: c.classNum,
      }));
      setChildren(list);
      if (list.length > 0) setSelectedChild(list[0].studentInfoId);
    }).catch(() => {});

    getTerms().then((res) => {
      setTerms(Array.isArray(res.data) ? res.data : []);
      const active = res.data.find((t) => t.active);
      if (active) setSelectedTermId(active.termId);
    }).catch(() => {});
  }, []);

  // [woo] 현재 학기 성적 + 담임/학급 정보
  useEffect(() => {
    if (!selectedChild || !selectedTermId) { setLoading(false); return; }
    setLoading(true);
    setExpandedSubject(null);
    Promise.all([
      getChildGrades(selectedChild, selectedTermId),
      getChildClassInfo(selectedChild, selectedTermId),
    ])
      .then(([gradesRes, classRes]) => {
        setGrades(gradesRes.data);
        setClassInfo(classRes.data);
      })
      .catch(() => { setGrades([]); setClassInfo(null); })
      .finally(() => setLoading(false));
  }, [selectedChild, selectedTermId]);

  // [woo] 과목별 피벗 — "퀴즈" 가상 과목 제외
  const subjectMap = new Map<string, Record<TestType, number | null>>();
  for (const g of grades) {
    if (g.subjectName === "퀴즈") continue;
    if (!subjectMap.has(g.subjectName)) {
      subjectMap.set(g.subjectName, { MIDTERMTEST: null, FINALTEST: null, QUIZ: null, HOMEWORK: null });
    }
    subjectMap.get(g.subjectName)![g.testType] = g.score;
  }
  const subjectRows = [...subjectMap.entries()].sort(([a], [b]) => subjectSortKey(a) - subjectSortKey(b));

  // [woo] 통계
  const overallAvg = avg(grades.filter(g => g.subjectName !== "퀴즈").map((g) => g.score));
  const midtermAvg = avg(grades.filter(g => g.testType === "MIDTERMTEST" && g.subjectName !== "퀴즈").map(g => g.score));
  const finalAvg = avg(grades.filter(g => g.testType === "FINALTEST" && g.subjectName !== "퀴즈").map(g => g.score));
  const change = midtermAvg != null && finalAvg != null
    ? Math.round((finalAvg - midtermAvg) * 10) / 10
    : null;

  function subjectAvg(scores: Record<TestType, number | null>): number | null {
    return avg(Object.values(scores));
  }

  // [woo] 성취도 요약 (areaData 차트 추가 시 활성화)
  // const langScores = subjectRows.filter(([n]) => ["국어","영어","한문","제2외국어"].some(s => n.startsWith(s))).map(([,s]) => subjectAvg(s));
  // const mathSciScores = subjectRows.filter(([n]) => ["수학","과학","정보"].some(s => n.startsWith(s))).map(([,s]) => subjectAvg(s));
  // const socialScores = subjectRows.filter(([n]) => ["사회","역사","한국사","도덕"].some(s => n.startsWith(s))).map(([,s]) => subjectAvg(s));
  // const etcScores = subjectRows.filter(([n]) => ["음악","미술","체육","기술","가정","기술가정","교양"].some(s => n.startsWith(s))).map(([,s]) => subjectAvg(s));
  // const areaData = [
  //   { label: "어문", avg: avg(langScores), color: "#6366f1" },
  //   { label: "수리·과학", avg: avg(mathSciScores), color: "#22c55e" },
  //   { label: "사회·도덕", avg: avg(socialScores), color: "#f59e0b" },
  //   { label: "예체능·기타", avg: avg(etcScores), color: "#06b6d4" },
  // ].filter((a) => a.avg != null);

  // [woo] 학습 현황
  const insights: string[] = [];
  if (subjectRows.length > 0) {
    const best = [...subjectRows].sort(([,a], [,b]) => (subjectAvg(b) ?? 0) - (subjectAvg(a) ?? 0))[0];
    const worst = [...subjectRows].sort(([,a], [,b]) => (subjectAvg(a) ?? 0) - (subjectAvg(b) ?? 0))[0];
    if (best) insights.push(`${best[0]} 과목이 ${subjectAvg(best[1])}점으로 가장 우수합니다.`);
    if (worst && worst[0] !== best[0]) insights.push(`${worst[0]} 과목은 ${subjectAvg(worst[1])}점으로 보완이 필요합니다.`);
    if (change != null && change > 0) insights.push(`중간고사 대비 기말고사에서 ${change}점 상승했습니다.`);
    if (change != null && change < 0) insights.push(`중간고사 대비 기말고사에서 ${Math.abs(change)}점 하락했습니다.`);
  }

  const currentChild = children.find((c) => c.studentInfoId === selectedChild);
  const termName = terms.find((t) => t.termId === selectedTermId)?.displayName ?? "";

  return (
    <DashboardLayout>
      {/* [woo] 상단 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h6 style={{ fontWeight: 600, margin: 0 }}>자녀 성적 조회</h6>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {children.length > 1 && (
            <select
              style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, background: "#fff" }}
              value={selectedChild ?? ""}
              onChange={(e) => setSelectedChild(Number(e.target.value))}
            >
              {children.map((c) => (
                <option key={c.studentInfoId} value={c.studentInfoId}>
                  {c.name}{c.grade && c.classNum ? ` (${c.grade}학년 ${c.classNum}반)` : ""}
                </option>
              ))}
            </select>
          )}
          <select
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, background: "#fff" }}
            value={selectedTermId ?? ""}
            onChange={(e) => setSelectedTermId(Number(e.target.value))}
          >
            {terms.map((t) => (
              <option key={t.termId} value={t.termId}>
                {t.displayName} {t.active ? "(현재)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* [woo] 헤더 카드 */}
      <div style={{
        background: "#fff",
        border: "1.5px solid #25a194",
        borderRadius: 16, padding: "24px 32px", marginBottom: 20,
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%", background: "#E0F5F5",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <i className="ri-graduation-cap-line" style={{ fontSize: 24, color: "#25a194" }} />
          </div>
          <div>
            <div style={{ color: "#0F2B3C", fontWeight: 700, fontSize: 20, lineHeight: 1.3 }}>{currentChild?.name ?? "자녀"}</div>
            <div style={{ color: "#3A5568", fontSize: 13, marginTop: 3 }}>
              {classInfo?.className ?? ""} · {termName}
              {classInfo?.homeroomTeacherName && (
                <span style={{ color: "#6B7B8D", marginLeft: 8 }}>
                  담임 {classInfo.homeroomTeacherName} 선생님
                </span>
              )}
            </div>
          </div>
        </div>
        {overallAvg != null && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ color: "#6B7B8D", fontSize: 13, marginBottom: 4, width: "100%", textAlign: "center" }}>전체평균</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
              <span style={{ color: "#25a194", fontWeight: 800, fontSize: 42, lineHeight: 1 }}>{overallAvg}</span>
              <span style={{ color: "#6B7B8D", fontSize: 13 }}>점</span>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
          <div className="spinner-border text-primary" />
        </div>
      ) : grades.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af", background: "#fff", borderRadius: 16 }}>
          등록된 성적이 없습니다.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20, alignItems: "stretch" }}>
          {/* ===== [woo] 왼쪽: 통계 패널 ===== */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* 학업 평균 + 학급/학년 비교 토글 */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 24 }}>
              <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 8, fontWeight: 500 }}>학업 평균</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 16 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: "#1f2937" }}>{overallAvg ?? "-"}</span>
                <span style={{ color: "#9ca3af", fontSize: 14 }}>점</span>
              </div>
              {/* [woo] pill 토글: 학급 비교 / 학년 비교 */}
              <div style={{ display: "flex", gap: 6, marginBottom: 16, background: "#f3f4f6", borderRadius: 20, padding: 3 }}>
                {(["class", "grade"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatsTab(tab)}
                    style={{
                      flex: 1, padding: "7px 0", fontSize: 13, fontWeight: 600,
                      border: "none", borderRadius: 18, cursor: "pointer",
                      background: statsTab === tab ? "#5b8def" : "transparent",
                      color: statsTab === tab ? "#fff" : "#6b7280",
                      transition: "all 0.2s", textAlign: "center",
                    }}
                  >
                    {tab === "class" ? "학급 비교" : "학년 비교"}
                  </button>
                ))}
              </div>
              {/* [woo] 학급/학년 비교 바 — statsTab에 따라 전환 */}
              {(() => {
                const compareAvgs = statsTab === "class" ? classInfo?.classAvgs : classInfo?.gradeAvgs;
                const compareOverall = compareAvgs?.length
                  ? avg(compareAvgs.map((c) => avg([c.midtermAvg, c.finalAvg, c.quizAvg, c.homeworkAvg])))
                  : null;
                const compareLabel = statsTab === "class" ? "학급 평균" : "학년 평균";
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>자녀 평균</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#1f2937" }}>{overallAvg != null ? `${overallAvg}점` : "-"}</span>
                      </div>
                      <div style={{ height: 8, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${overallAvg ?? 0}%`, height: "100%", background: "#6366f1", borderRadius: 4, transition: "width 0.4s" }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>{compareLabel}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#1f2937" }}>{compareOverall != null ? `${compareOverall}점` : "-"}</span>
                      </div>
                      <div style={{ height: 8, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${compareOverall ?? 0}%`, height: "100%", background: statsTab === "class" ? "#f59e0b" : "#8b5cf6", borderRadius: 4, transition: "width 0.4s" }} />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* [woo] 성적 변화 — 중간·기말 둘 다 있을 때만 렌더링 */}
            {midtermAvg != null && finalAvg != null && (
              <div style={{ background: "#fff", borderRadius: 16, padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <p style={{ color: "#6b7280", fontSize: 13, fontWeight: 500, margin: 0 }}>성적 변화</p>
                  {change != null && (
                    <span style={{
                      fontSize: 13, fontWeight: 700,
                      padding: "3px 10px", borderRadius: 20,
                      background: change > 0 ? "#dcfce7" : change < 0 ? "#fee2e2" : "#f3f4f6",
                      color: change > 0 ? "#16a34a" : change < 0 ? "#dc2626" : "#6b7280",
                    }}>
                      {change > 0 ? "▲ +" : change < 0 ? "▼ " : ""}{change}점
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>중간고사</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1f2937" }}>{midtermAvg}점</span>
                    </div>
                    <div style={{ height: 8, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${midtermAvg}%`, height: "100%", background: "#6366f1", borderRadius: 4, transition: "width 0.4s" }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>기말고사</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1f2937" }}>{finalAvg}점</span>
                    </div>
                    <div style={{ height: 8, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${finalAvg}%`, height: "100%", background: change != null && change >= 0 ? "#22c55e" : "#ef4444", borderRadius: 4, transition: "width 0.4s" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* [woo] 성취도 요약 — 등급별 과목 수 + 가로 바 */}
            {subjectRows.length > 0 && (() => {
              const gradeCounts = { A: 0, B: 0, C: 0, D: 0 };
              for (const [, scores] of subjectRows) {
                const sa = subjectAvg(scores);
                if (sa == null) continue;
                if (sa >= 90) gradeCounts.A++;
                else if (sa >= 80) gradeCounts.B++;
                else if (sa >= 70) gradeCounts.C++;
                else gradeCounts.D++;
              }
              const total = subjectRows.length;
              const gradeItems = [
                { label: "A", count: gradeCounts.A, color: "#22c55e" },
                { label: "B", count: gradeCounts.B, color: "#3b82f6" },
                { label: "C", count: gradeCounts.C, color: "#f59e0b" },
                { label: "D", count: gradeCounts.D, color: "#ef4444" },
              ];
              return (
                <div style={{ background: "#fff", borderRadius: 16, padding: 24 }}>
                  <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16, fontWeight: 500 }}>성취도 요약</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {gradeItems.map((g) => {
                      const pct = total > 0 ? Math.round((g.count / total) * 100) : 0;
                      return (
                        <div key={g.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: g.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 14, fontWeight: 700, color: g.color, width: 16, flexShrink: 0 }}>{g.label}</span>
                          <span style={{ fontSize: 12, color: "#9ca3af", width: 40, flexShrink: 0 }}>{g.count}과목</span>
                          <div style={{ flex: 1, height: 8, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: g.color, borderRadius: 4, transition: "width 0.4s" }} />
                          </div>
                          <span style={{ fontSize: 12, color: "#9ca3af", width: 30, textAlign: "right", flexShrink: 0 }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* 학습 현황 */}
            {insights.length > 0 && (
              <div style={{ background: "#fff", borderRadius: 16, padding: 24 }}>
                <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 12, fontWeight: 500 }}>학습 현황</p>
                <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
                  {insights.map((text, i) => (
                    <li key={i} style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.6 }}>{text}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ===== [woo] 오른쪽: 과목별 상세 성적 ===== */}
          <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden" }}>
            <div style={{
              padding: "18px 24px", borderBottom: "1px solid #f3f4f6",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <h6 style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>과목별 상세 성적</h6>
              <span style={{ color: "#9ca3af", fontSize: 13 }}>{subjectRows.length}개 과목</span>
            </div>

            {subjectRows.map(([subjectName, scores]) => {
              const sAvg = subjectAvg(scores);
              const icon = getSubjectIcon(subjectName);
              // [woo] statsTab에 따라 비교 대상 전환 (학급 / 학년)
              const compareAvgs = statsTab === "class" ? classInfo?.classAvgs : classInfo?.gradeAvgs;
              const compareSubject = compareAvgs?.find((c) => c.subjectName === subjectName);
              const compareLabel = statsTab === "class" ? "학급" : "학년";
              const isOpen = expandedSubject === subjectName;

              const mid = scores.MIDTERMTEST;
              const fin = scores.FINALTEST;
              const quiz = scores.QUIZ;
              const hw = scores.HOMEWORK;
              const compareAvgScore = compareSubject
                ? avg([compareSubject.midtermAvg, compareSubject.finalAvg, compareSubject.quizAvg, compareSubject.homeworkAvg])
                : null;

              return (
                <div key={subjectName}>
                  {/* 과목 행 */}
                  <div
                    onClick={() => setExpandedSubject(isOpen ? null : subjectName)}
                    style={{
                      display: "flex", alignItems: "center", padding: "18px 24px",
                      borderBottom: "1px solid #f3f4f6", gap: 16,
                      cursor: "pointer", transition: "background 0.15s",
                      background: isOpen ? "#fafaff" : "transparent",
                    }}
                    onMouseEnter={(e) => { if (!isOpen) e.currentTarget.style.background = "#fafafa"; }}
                    onMouseLeave={(e) => { if (!isOpen) e.currentTarget.style.background = isOpen ? "#fafaff" : "transparent"; }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, background: "#f0fafa",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <i className={icon} style={{ fontSize: 20, color: "#25a194" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: "#1f2937" }}>{subjectName}</div>
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>
                        {compareAvgScore != null ? `${compareLabel} 평균 ${compareAvgScore}점` : "상세보기"}
                      </span>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginRight: 8 }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: "#1f2937", lineHeight: 1 }}>
                        {sAvg != null ? Math.round(sAvg) : "-"}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#6366f1" }}>
                        {gradeLabel(sAvg)}등급
                      </span>
                    </div>
                    <span style={{
                      fontSize: 18, color: "#9ca3af", flexShrink: 0,
                      transition: "transform 0.2s",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}>
                      ▾
                    </span>
                  </div>

                  {/* [woo] 펼침 상세 — statsTab에 따라 학급/학년 비교 */}
                  {isOpen && (
                    <div style={{ padding: "16px 24px 20px", background: "#fafaff", borderBottom: "1px solid #f3f4f6" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
                        {([
                          { label: "중간고사", score: mid, cmpAvg: compareSubject?.midtermAvg, color: "#6366f1" },
                          { label: "기말고사", score: fin, cmpAvg: compareSubject?.finalAvg, color: "#22c55e" },
                          { label: "과제", score: hw, cmpAvg: compareSubject?.homeworkAvg, color: "#06b6d4" },
                          { label: "퀴즈", score: quiz, cmpAvg: compareSubject?.quizAvg, color: "#f59e0b" },
                        ] as const).map((item) => {
                          const scoreDiff = item.score != null && item.cmpAvg != null
                            ? Math.round((item.score - item.cmpAvg) * 10) / 10
                            : null;
                          return (
                            <div key={item.label} style={{
                              background: "#fff", borderRadius: 12, padding: "14px 14px 12px",
                              border: "1px solid #f0f0f5", display: "flex", flexDirection: "column", gap: 6,
                            }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>{item.label}</span>
                                {scoreDiff != null && (
                                  <span style={{
                                    fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 4,
                                    background: scoreDiff >= 0 ? "#dcfce7" : "#fee2e2",
                                    color: scoreDiff >= 0 ? "#16a34a" : "#dc2626",
                                  }}>
                                    {scoreDiff >= 0 ? "+" : ""}{scoreDiff}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 26, fontWeight: 800, color: item.score != null ? item.color : "#d1d5db", lineHeight: 1 }}>
                                {item.score ?? "-"}
                                {item.score != null && <span style={{ fontSize: 12, fontWeight: 400, color: "#9ca3af" }}>점</span>}
                              </div>
                              <div style={{ position: "relative", height: 6, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
                                {item.cmpAvg != null && (
                                  <div style={{ position: "absolute", top: 0, left: 0, width: `${item.cmpAvg}%`, height: "100%", background: "#e5e7eb", borderRadius: 3 }} />
                                )}
                                {item.score != null && (
                                  <div style={{ position: "absolute", top: 0, left: 0, width: `${item.score}%`, height: "100%", background: item.color, borderRadius: 3, opacity: 0.85 }} />
                                )}
                              </div>
                              <div style={{ fontSize: 11, color: "#b0b0b0" }}>
                                {compareLabel} <b style={{ color: "#6b7280" }}>{item.cmpAvg ?? "-"}</b>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {sAvg != null && compareAvgScore != null && (
                        <div style={{
                          fontSize: 13, padding: "10px 14px", borderRadius: 10, fontWeight: 500,
                          background: sAvg >= compareAvgScore ? "#f0fdf4" : "#fef2f2",
                          color: sAvg >= compareAvgScore ? "#16a34a" : "#dc2626",
                          border: `1px solid ${sAvg >= compareAvgScore ? "#bbf7d0" : "#fecaca"}`,
                        }}>
                          {sAvg >= compareAvgScore ? (
                            <><i className="ri-arrow-up-line" /> {compareLabel} 평균({compareAvgScore}점)보다 {Math.round((sAvg - compareAvgScore) * 10) / 10}점 높아요</>
                          ) : (
                            <><i className="ri-arrow-down-line" /> {compareLabel} 평균({compareAvgScore}점)보다 {Math.round((compareAvgScore - sAvg) * 10) / 10}점 낮아요</>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
