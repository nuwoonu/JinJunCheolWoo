import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";
import { getSectionSummary } from "@/shared/api/grade";
import type { SectionSummaryDTO, StudentSummaryDTO } from "@/shared/api/grade";

// [woo] 교사 성적 요약 대시보드 (석차 9등급제)
// /teacher/grades/section/:sectionId/summary

// [woo] 수행평가 호버 툴팁 (position:fixed로 overflow:hidden 컨테이너 탈출)
function PerfTooltip({ lines, children }: { lines: string[]; children: React.ReactNode }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);

  const handleMouseEnter = () => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 6, left: rect.left + rect.width / 2 });
  };

  return (
    <span
      ref={anchorRef}
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos && lines.length > 0 && (
        <div style={{
          position: "fixed", top: pos.top, left: pos.left,
          transform: "translateX(-50%)", background: "#1f2937", color: "#fff",
          borderRadius: 8, padding: "8px 12px", fontSize: 12, whiteSpace: "nowrap",
          zIndex: 99999, lineHeight: 1.8, textAlign: "left",
          boxShadow: "0 4px 12px rgba(0,0,0,0.25)", pointerEvents: "none",
        }}>
          <div style={{
            position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)",
            border: "5px solid transparent", borderBottomColor: "#1f2937",
          }} />
          {lines.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </span>
  );
}

// [woo] 석차 9등급 뱃지 색상 (1~3: 녹색, 4~6: 파랑, 7~8: 주황, 9: 빨강)
const GRADE_STYLE: Record<string, { bg: string; color: string }> = {
  "1": { bg: "#dcfce7", color: "#16a34a" },
  "2": { bg: "#dcfce7", color: "#16a34a" },
  "3": { bg: "#dbeafe", color: "#2563eb" },
  "4": { bg: "#dbeafe", color: "#2563eb" },
  "5": { bg: "#fef9c3", color: "#ca8a04" },
  "6": { bg: "#fef9c3", color: "#ca8a04" },
  "7": { bg: "#ffedd5", color: "#ea580c" },
  "8": { bg: "#ffedd5", color: "#ea580c" },
  "9": { bg: "#fee2e2", color: "#dc2626" },
};

// [woo] 등급 분포 그룹 (중고등학교 내신 9등급 기준)
const GRADE_GROUPS: Array<{
  label: string;
  grades: string[];
  bg: string;
  border: string;
  color: string;
}> = [
  { label: "1~3등급", grades: ["1", "2", "3"], bg: "#eaf7ef", border: "#9ee3b8", color: "#16a34a" },
  { label: "4~6등급", grades: ["4", "5", "6"], bg: "#e8efff", border: "#b7d0ff", color: "#2563eb" },
  { label: "7~9등급", grades: ["7", "8", "9"], bg: "#fff2e6", border: "#fdc897", color: "#ea580c" },
];

// [woo] 수행평가 — 비례환산 (백엔드 finalScore 계산과 동일 방식)
function calcPerformanceAvg(
  quiz: number | null,
  hw: number | null,
  quizR: number,
  hwR: number,
): number | null {
  let fs = 0, usedRatio = 0;
  if (quiz != null && quizR > 0) { fs += quiz * quizR; usedRatio += quizR; }
  if (hw != null && hwR > 0)     { fs += hw * hwR;     usedRatio += hwR; }
  if (usedRatio === 0) return null;
  return Math.round((fs / usedRatio) * 10) / 10;
}

export default function GradeEntry() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<SectionSummaryDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"attendanceNum" | "studentName" | "grade">("attendanceNum");

  const fetchSummary = useCallback(() => {
    if (!sectionId) return;
    setLoading(true);
    getSectionSummary(Number(sectionId))
      .then((res) => setSummary(res.data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [sectionId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const stats = summary?.stats;
  const gradeDist = stats?.gradeDist ?? {};
  const ratio = summary?.ratio;
  const quizR = ratio?.quizRatio ?? 0;
  const hwR = ratio?.homeworkRatio ?? 0;

  // [woo] 등급 그룹별 학생수
  const gradeRows = GRADE_GROUPS.map((group) => ({
    ...group,
    count: group.grades.reduce(
      (sum, g) => sum + (typeof gradeDist[g] === "number" ? (gradeDist[g] as number) : 0),
      0,
    ),
  }));

  const allStudents = summary?.students ?? [];
  const filtered = allStudents
    .filter((s) => !search || s.studentName.includes(search) || String(s.attendanceNum ?? "").includes(search))
    .slice()
    .sort((a, b) => {
      if (sortKey === "attendanceNum") return (a.attendanceNum ?? 999) - (b.attendanceNum ?? 999);
      if (sortKey === "studentName") return a.studentName.localeCompare(b.studentName, "ko");
      if (sortKey === "grade") return (a.grade ?? "9").localeCompare(b.grade ?? "9");
      return 0;
    });

  const hasData = allStudents.some((s) => s.finalScore != null);
  const maxScore = hasData
    ? Math.max(...allStudents.filter((s) => s.finalScore != null).map((s) => s.finalScore!))
    : null;

  // [woo] 1~3등급 학생 수 (상위권)
  const topCount = allStudents.filter((s) => s.grade === "1" || s.grade === "2" || s.grade === "3").length;

  const statCards = [
    {
      label: "수강생수",
      value: `${stats?.totalStudents ?? 0}명`,
      icon: "ri-group-line",
      bg: "#e0f2fe",
      fg: "#0284c7",
    },
    {
      label: "평균점수",
      value: stats?.average != null ? stats.average : "-",
      icon: "ri-bar-chart-2-line",
      bg: "#dcfce7",
      fg: "#16a34a",
    },
    {
      label: "최고점",
      value: maxScore != null ? maxScore : "-",
      icon: "ri-arrow-up-line",
      bg: "#fef9c3",
      fg: "#ca8a04",
    },
    {
      label: "1~3등급",
      value: hasData ? `${topCount}명` : "-",
      icon: "ri-medal-line",
      bg: "#eaf7ef",
      fg: "#16a34a",
    },
  ];

  return (
    <DashboardLayout>
      {/* ── 상단 헤더 배너 ── */}
      {/* [woo] 단색 배경 (그라데이션 제거) */}
      <div
        className="radius-12 mb-20 px-24 py-16 d-flex justify-content-between align-items-center"
        style={{ background: "#25a194" }}
      >
        <div>
          <p className="mb-4" style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
            <Link to="/teacher/grades/summary" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none" }}>
              성적 현황
            </Link>
            {summary ? ` > ${summary.subjectName}` : ""}
          </p>
          <h5 className="fw-bold mb-0 text-white">
            {summary
              ? `${summary.subjectName} — ${summary.schoolYear}학년도 ${summary.semester}학기`
              : "로딩 중..."}
          </h5>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginBottom: 4, width: "100%", textAlign: "center" }}>평균점수</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 42, lineHeight: 1 }}>{stats?.average ?? "-"}</span>
            {stats?.average != null && <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>점</span>}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-60">
          <div className="spinner-border text-primary" />
        </div>
      ) : !summary ? (
        <div className="text-center py-60 text-neutral-500">데이터를 불러올 수 없습니다.</div>
      ) : (
        <>
          {/* ── 미채점 과제 경고 ── */}
          {summary.ungradedCount > 0 && (
            <div
              className="d-flex align-items-center gap-12 px-20 py-14 radius-12 mb-20"
              style={{ background: "#fef3c7", border: "1px solid #f59e0b" }}
            >
              <i className="ri-file-edit-line text-xl" style={{ color: "#d97706", flexShrink: 0 }} />
              <span className="fw-semibold text-sm" style={{ color: "#92400e" }}>
                채점되지 않은 과제 제출이 <strong>{summary.ungradedCount}건</strong> 있습니다. 채점 전까지 해당 학생의 과제 점수는 계산에서 제외됩니다.
              </span>
            </div>
          )}

          {/* ── 비율 미설정 안내 ── */}
          {!summary.ratioSet && (
            <div
              className="d-flex align-items-center gap-12 px-20 py-14 radius-12 mb-20"
              style={{ background: "#fef9c3", border: "1px solid #fde047" }}
            >
              <i className="ri-alert-line text-xl" style={{ color: "#ca8a04", flexShrink: 0 }} />
              <div className="grow">
                <span className="fw-semibold text-sm" style={{ color: "#854d0e" }}>
                  배점 비율이 설정되지 않아 성적이 표시되지 않습니다.
                </span>
                <span className="text-sm ms-8" style={{ color: "#92400e" }}>
                  성적 입력 페이지에서 비율을 먼저 설정해주세요.
                </span>
              </div>
              <button
                className="btn btn-sm radius-8 px-14 fw-semibold"
                style={{ background: "#ca8a04", color: "#fff", border: "none", whiteSpace: "nowrap" }}
                onClick={() => navigate(`/teacher/grades/section/${sectionId}`)}
              >
                비율 설정하러 가기
              </button>
            </div>
          )}

          {/* ── 요약 카드 4개 ── */}
          <div className="row g-16 mb-20">
            {statCards.map(({ label, value, icon, bg, fg }) => (
              <div className="col-6 col-md-3" key={label}>
                <div className="card radius-12 h-100">
                  <div className="card-body p-16 d-flex align-items-center gap-12">
                    <div
                      className="d-flex align-items-center justify-content-center radius-8"
                      style={{ width: 44, height: 44, background: bg, flexShrink: 0 }}
                    >
                      <i className={`${icon} text-xl`} style={{ color: fg }} />
                    </div>
                    <div>
                      <p className="mb-2" style={{ fontSize: 12, color: "#6b7280" }}>
                        {label}
                      </p>
                      <h6 className="fw-bold mb-0">{value}</h6>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── 본문 2컬럼 ── */}
          <div className="row g-16 align-items-stretch">
            {/* 좌: 등급분포 + 점수분포 */}
            <div className="col-12 col-lg-3 d-flex flex-column">
              {/* 석차 등급 분포 */}
              <div className="card radius-12 mb-16">
                <div className="card-header py-12 px-16 border-bottom d-flex align-items-center gap-8">
                  <i className="ri-bar-chart-grouped-line" style={{ color: "#16a34a", fontSize: 16 }} />
                  <span className="fw-semibold text-sm">석차 등급 분포</span>
                </div>
                <div className="card-body p-16">
                  {gradeRows.map(({ label, count, bg, border, color }, idx) => (
                    <div
                      key={label}
                      className="d-flex justify-content-between align-items-center px-20 py-12"
                      style={{
                        background: bg,
                        border: `1px solid ${border}`,
                        borderRadius: 16,
                        marginBottom: idx === gradeRows.length - 1 ? 0 : 12,
                      }}
                    >
                      <span className="fw-semibold" style={{ color, fontSize: 15 }}>
                        {label}
                      </span>
                      <span className="fw-bold" style={{ color, fontSize: 15 }}>
                        {count}명
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 점수 분포 */}
              <div className="card radius-12 grow">
                <div className="card-header py-12 px-16 border-bottom d-flex align-items-center gap-8">
                  <i className="ri-bar-chart-line" style={{ color: "#6366f1", fontSize: 16 }} />
                  <span className="fw-semibold text-sm">점수 분포</span>
                </div>
                <div className="card-body p-16">
                  {Object.entries(stats?.scoreDist ?? {}).map(([range, count]) => (
                    <div key={range} className="d-flex justify-content-between align-items-center mb-10">
                      <span style={{ fontSize: 12, color: "#6b7280" }}>{range}</span>
                      <span className="fw-semibold text-sm">{count as number}명</span>
                    </div>
                  ))}
                  {stats?.average != null && (
                    <div className="d-flex justify-content-between align-items-center pt-8 border-top">
                      <span style={{ fontSize: 12, color: "#6b7280" }}>평균</span>
                      <span className="fw-bold text-sm" style={{ color: "#16a34a" }}>
                        {stats.average}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 우: 학생 테이블 */}
            <div className="col-12 col-lg-9">
              <div className="card radius-12 h-100">
                {/* 테이블 헤더: 검색 + 정렬 */}
                <div className="card-header py-12 px-16 border-bottom d-flex align-items-center justify-content-between gap-12 flex-wrap">
                  <input
                    type="text"
                    className="form-control form-control-sm radius-8"
                    style={{ maxWidth: 220 }}
                    placeholder="학생 이름 / 번호 검색"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <div className="d-flex align-items-center gap-8">
                    <span className="text-sm text-neutral-500">정렬</span>
                    {([
                      { key: "attendanceNum", label: "번호순" },
                      { key: "studentName",   label: "이름순" },
                      { key: "grade",         label: "등급순" },
                    ] as const).map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setSortKey(key)}
                        className="btn btn-sm radius-8 px-12"
                        style={{
                          background: sortKey === key ? "#25a194" : "#f3f4f6",
                          color: sortKey === key ? "#fff" : "#6b7280",
                          border: "none",
                          fontWeight: sortKey === key ? 600 : 400,
                          fontSize: 12,
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0" style={{ fontSize: 13 }}>
                      <thead style={{ background: "#f9fafb" }}>
                        <tr>
                          <th className="text-center py-10 px-12" style={{ width: 48, color: "#6b7280", fontSize: 12, fontWeight: 600 }}>번호</th>
                          <th className="py-10 px-16" style={{ color: "#6b7280", fontSize: 12, fontWeight: 600 }}>이름</th>
                          <th className="text-center py-10 px-8" style={{ width: 72, color: "#6b7280", fontSize: 12, fontWeight: 600 }}>중간고사</th>
                          <th className="text-center py-10 px-8" style={{ width: 72, color: "#6b7280", fontSize: 12, fontWeight: 600 }}>기말고사</th>
                          <th className="text-center py-10 px-8" style={{ width: 80, color: "#6b7280", fontSize: 12, fontWeight: 600 }}>수행평가</th>
                          <th className="text-center py-10 px-8" style={{ width: 72, color: "#6b7280", fontSize: 12, fontWeight: 600 }}>최종점수</th>
                          <th className="text-center py-10 px-8" style={{ width: 60, color: "#6b7280", fontSize: 12, fontWeight: 600 }}>등급</th>
                          <th className="text-center py-10 px-8" style={{ width: 52, color: "#6b7280", fontSize: 12, fontWeight: 600 }}>순위</th>
                          <th className="text-center py-10 px-8" style={{ width: 68, color: "#6b7280", fontSize: 12, fontWeight: 600 }}>제출률</th>
                          <th style={{ width: 36 }} />
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="text-center py-40" style={{ color: "#9ca3af" }}>
                              학생이 없습니다.
                            </td>
                          </tr>
                        ) : (
                          filtered.map((s: StudentSummaryDTO) => {
                            const gradeStyle = s.grade
                              ? (GRADE_STYLE[s.grade] ?? { bg: "#f3f4f6", color: "#374151" })
                              : null;
                            const perfAvg = calcPerformanceAvg(s.quiz, s.homework, quizR, hwR);
                            return (
                              <tr key={s.studentId}>
                                <td className="text-center py-10 px-12">{s.attendanceNum ?? "-"}</td>
                                <td className="py-10 px-16 fw-medium">{s.studentName}</td>
                                <td className="text-center py-10 px-8">
                                  {s.midterm != null ? s.midterm : <span style={{ color: "#d1d5db" }}>-</span>}
                                </td>
                                <td className="text-center py-10 px-8">
                                  {s.finalExam != null ? s.finalExam : <span style={{ color: "#d1d5db" }}>-</span>}
                                </td>
                                <td className="text-center py-10 px-8">
                                  {perfAvg != null ? (
                                    <PerfTooltip lines={[
                                      ...(quizR > 0 ? [`퀴즈: ${s.quiz != null ? `${s.quiz}점` : "미입력"} (${quizR}%)`] : []),
                                      ...(hwR > 0  ? [`과제: ${s.homework != null ? `${s.homework}점` : "미입력"} (${hwR}%)`] : []),
                                      `→ 비례환산 ${perfAvg}점`,
                                    ]}>
                                      <span
                                        className="fw-semibold"
                                        style={{ color: "#2563eb", cursor: "help", borderBottom: "1px dashed #93c5fd" }}
                                      >
                                        {perfAvg}
                                      </span>
                                    </PerfTooltip>
                                  ) : (
                                    <span style={{ color: "#d1d5db" }}>-</span>
                                  )}
                                </td>
                                <td className="text-center py-10 px-8 fw-bold" style={{ color: "#16a34a" }}>
                                  {s.finalScore != null ? (
                                    <PerfTooltip lines={[
                                      ...(ratio?.midtermRatio ? [`중간고사: ${s.midterm != null ? `${s.midterm}점` : "미입력"} (${ratio.midtermRatio}%)`] : []),
                                      ...(ratio?.finalRatio   ? [`기말고사: ${s.finalExam != null ? `${s.finalExam}점` : "미입력"} (${ratio.finalRatio}%)`] : []),
                                      ...(quizR > 0  ? [`퀴즈: ${s.quiz != null ? `${s.quiz}점` : "미입력"} (${quizR}%)`] : []),
                                      ...(hwR > 0    ? [`과제: ${s.homework != null ? `${s.homework}점` : "미입력"} (${hwR}%)`] : []),
                                      `→ 최종 ${s.finalScore}점`,
                                    ]}>
                                      <span style={{ cursor: "help", borderBottom: "1px dashed #6ee7b7" }}>
                                        {s.finalScore}
                                      </span>
                                    </PerfTooltip>
                                  ) : (
                                    <span style={{ color: "#d1d5db", fontWeight: 400 }}>-</span>
                                  )}
                                </td>
                                <td className="text-center py-10 px-8">
                                  {gradeStyle ? (
                                    <span
                                      className="fw-bold radius-6 px-8 py-2"
                                      style={{ background: gradeStyle.bg, color: gradeStyle.color, fontSize: 12, whiteSpace: "nowrap" }}
                                    >
                                      {s.grade}등급
                                    </span>
                                  ) : (
                                    <span style={{ color: "#d1d5db" }}>-</span>
                                  )}
                                </td>
                                <td className="text-center py-10 px-8">
                                  {s.rank != null ? (
                                    <span className="radius-4 px-6 py-2 text-xs fw-semibold" style={{ background: "#f3f4f6", color: "#374151" }}>
                                      {s.rank}등
                                    </span>
                                  ) : (
                                    <span style={{ color: "#d1d5db" }}>-</span>
                                  )}
                                </td>
                                <td className="text-center py-10 px-8">
                                  {s.submissionRate != null ? (
                                    <span
                                      className="fw-semibold"
                                      style={{
                                        fontSize: 13,
                                        color: s.submissionRate >= 80 ? "#16a34a" : s.submissionRate >= 50 ? "#ca8a04" : "#dc2626",
                                      }}
                                    >
                                      {s.submissionRate}%
                                    </span>
                                  ) : (
                                    <span style={{ color: "#d1d5db" }}>-</span>
                                  )}
                                </td>
                                <td className="text-center py-10 px-4">
                                  <button
                                    className="btn btn-sm p-4"
                                    style={{ color: "#9ca3af", lineHeight: 1 }}
                                    title="점수 입력으로 이동"
                                    onClick={() => navigate(`/teacher/grades/section/${sectionId}`)}
                                  >
                                    <i className="ri-edit-line" style={{ fontSize: 14 }} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
