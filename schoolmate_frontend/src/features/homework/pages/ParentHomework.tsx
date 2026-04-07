import { useEffect, useState } from "react";
import api from "@/shared/api/authApi";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";

// [woo] 학부모 - 자녀 과제/퀴즈 조회 페이지
// - GET /dashboard/parent 로 자녀 목록 로드
// - GET /api/homework/parent/{childUserUid} 로 자녀 과제 현황 조회
// - GET /api/quiz/parent/{childUserUid} 로 자녀 퀴즈 현황 조회

interface Child {
  id: number;
  name: string;
  grade: number | null;
  classNum: number | null;
}

interface HomeworkItem {
  id: number;
  title: string;
  teacherName: string;
  classroomName: string;
  status: "OPEN" | "CLOSED" | "GRADED";
  dueDate: string;
  maxScore: number | null;
  submitted: boolean | null;
  score: number | null;
  feedback: string | null;
  submissionStatus: "SUBMITTED" | "LATE" | "GRADED" | null;
}

interface QuizItem {
  id: number;
  title: string;
  teacherName: string;
  classroomName: string;
  status: "OPEN" | "CLOSED";
  dueDate: string;
  questionCount: number;
  totalPoints: number;
  maxAttempts: number | null;
  myAttemptCount: number | null;
  myBestScore: number | null;
}

// [soojin] 뱃지 인라인 스타일 - HomeworkList 동일 패턴
const badgeBase: React.CSSProperties = {
  padding: "3px 8px",
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const HW_BADGE: Record<string, React.CSSProperties> = {
  OPEN: { background: "rgba(22,163,74,0.1)", color: "#16a34a" },
  CLOSED: { background: "rgba(239,68,68,0.1)", color: "#dc2626" },
  GRADED: { background: "rgba(14,165,233,0.1)", color: "#0284c7" },
};
const HW_LABEL: Record<string, string> = { OPEN: "진행중", CLOSED: "마감", GRADED: "채점완료" };

const QZ_BADGE: Record<string, React.CSSProperties> = {
  OPEN: { background: "rgba(22,163,74,0.1)", color: "#16a34a" },
  CLOSED: { background: "rgba(239,68,68,0.1)", color: "#dc2626" },
};
const QZ_LABEL: Record<string, string> = { OPEN: "진행중", CLOSED: "마감" };

const SUB_STATUS: Record<string, { text: string; color: string; bg: string }> = {
  SUBMITTED: { text: "제출", color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
  LATE: { text: "지각제출", color: "#ca8a04", bg: "rgba(234,179,8,0.1)" },
  GRADED: { text: "채점완료", color: "#0284c7", bg: "rgba(14,165,233,0.1)" },
};

// [soojin] th/td 공통 스타일 - HomeworkList 동일 패턴
const thSt: React.CSSProperties = {
  padding: "10px 16px",
  fontSize: 13,
  fontWeight: 600,
  color: "#6b7280",
  background: "#f9fafb",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
  textAlign: "left",
};
const tdSt: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: 13,
  color: "#374151",
  borderBottom: "1px solid #f3f4f6",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};

export default function ParentHomework() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tab, setTab] = useState<"homework" | "quiz">("homework");
  const [homeworks, setHomeworks] = useState<HomeworkItem[]>([]);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  // [woo] 자녀 목록 로드
  useEffect(() => {
    api
      .get("/dashboard/parent")
      .then((res) => {
        const kids: Child[] = res.data.children ?? [];
        setChildren(kids);
        if (kids.length > 0) setSelectedId(kids[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // [woo] 선택된 자녀의 과제 + 퀴즈 병렬 로드
  useEffect(() => {
    if (selectedId == null) return;
    setDataLoading(true);
    Promise.all([
      api
        .get(`/homework/parent/${selectedId}`)
        .then((res) => res.data ?? [])
        .catch(() => []),
      api
        .get(`/quiz/parent/${selectedId}`)
        .then((res) => res.data ?? [])
        .catch(() => []),
    ])
      .then(([hw, qz]) => {
        setHomeworks(hw);
        setQuizzes(qz);
      })
      .finally(() => setDataLoading(false));
  }, [selectedId]);

  const selectedChild = children.find((c) => c.id === selectedId);
  const totalCount = tab === "homework" ? homeworks.length : quizzes.length;

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: "center", paddingTop: 160, color: "#9ca3af" }}>불러오는 중...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 4.5rem - 48px)" }}>
        {/* [soojin] 제목 - HomeworkList 동일 패턴 */}
        <div style={{ marginBottom: 12, flexShrink: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 20,
              lineHeight: 1.3,
              color: "#111827",
              marginBottom: 4,
              display: "flex",
              alignItems: "baseline",
              gap: 8,
            }}
          >
            {tab === "homework" ? "과제 목록" : "퀴즈 목록"}
            {!dataLoading && (
              <span style={{ fontSize: 13, fontWeight: 400, color: "#6b7280" }}>전체 {totalCount}건</span>
            )}
          </div>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
            {selectedChild ? `${selectedChild.name}의 과제·퀴즈 현황` : "자녀 과제·퀴즈 현황"}
          </p>
        </div>

        {/* [soojin] 탭 - HomeworkList 동일 스타일 */}
        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", marginBottom: 12, flexShrink: 0 }}>
          {(["homework", "quiz"] as const).map((t) => (
            <button
              key={t}
              type="button"
              style={{
                padding: "8px 20px",
                fontSize: 14,
                fontWeight: tab === t ? 600 : 400,
                color: tab === t ? "#25A194" : "#6b7280",
                background: "none",
                border: "none",
                borderBottom: tab === t ? "2px solid #25A194" : "2px solid transparent",
                cursor: "pointer",
                marginBottom: -1,
              }}
              onClick={() => setTab(t)}
            >
              <i
                className={t === "homework" ? "ri-draft-line" : "ri-question-answer-line"}
                style={{ marginRight: 4 }}
              />
              {t === "homework" ? "과제" : "퀴즈"}
              {!dataLoading && (
                <span
                  style={{
                    marginLeft: 6,
                    padding: "1px 6px",
                    background: "#f3f4f6",
                    color: "#6b7280",
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                >
                  {t === "homework" ? homeworks.length : quizzes.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* [soojin] 테이블 컨테이너 - HomeworkList 동일 패턴 */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            overflow: "hidden",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div style={{ flex: 1, overflowX: "auto", overflowY: "auto", minHeight: 0 }}>
            {dataLoading ? (
              <div style={{ textAlign: "center", padding: "48px 16px", color: "#9ca3af" }}>불러오는 중...</div>
            ) : tab === "homework" ? (
              /* ===== 과제 테이블 ===== */
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: 55 }} />
                  <col />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 110 }} />
                  <col style={{ width: 110 }} />
                  <col style={{ width: 90 }} />
                  <col style={{ width: 80 }} />
                  <col style={{ width: 110 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={thSt}>번호</th>
                    <th style={thSt}>제목</th>
                    <th style={thSt}>학급</th>
                    <th style={thSt}>출제 교사</th>
                    <th style={thSt}>마감일</th>
                    <th style={thSt}>상태</th>
                    <th style={thSt}>제출</th>
                    <th style={thSt}>점수</th>
                  </tr>
                </thead>
                <tbody>
                  {homeworks.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ ...tdSt, textAlign: "center", padding: "48px 16px", color: "#9ca3af" }}>
                        과제가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    homeworks.map((hw, i) => {
                      const isOverdue = new Date(hw.dueDate) < new Date();
                      const subSt = hw.submissionStatus ? SUB_STATUS[hw.submissionStatus] : null;
                      return (
                        <tr key={hw.id}>
                          <td style={tdSt}>{homeworks.length - i}</td>
                          <td style={{ ...tdSt, overflow: "hidden", textOverflow: "ellipsis" }}>
                            <span style={{ fontWeight: 600 }}>{hw.title}</span>
                          </td>
                          <td style={{ ...tdSt, color: "#6b7280" }}>{hw.classroomName}</td>
                          <td style={{ ...tdSt, color: "#6b7280" }}>{hw.teacherName}</td>
                          <td style={{ ...tdSt, color: isOverdue && !hw.submitted ? "#dc2626" : "#6b7280" }}>
                            {hw.dueDate?.slice(0, 10)}
                          </td>
                          <td style={tdSt}>
                            <span style={{ ...badgeBase, ...(HW_BADGE[hw.status] ?? HW_BADGE.OPEN) }}>
                              {HW_LABEL[hw.status] ?? "진행중"}
                            </span>
                          </td>
                          <td style={tdSt}>
                            {hw.submitted == null ? (
                              <span style={{ color: "#9ca3af" }}>-</span>
                            ) : hw.submitted ? (
                              <span
                                style={{
                                  ...badgeBase,
                                  background: subSt?.bg ?? "rgba(22,163,74,0.1)",
                                  color: subSt?.color ?? "#16a34a",
                                }}
                              >
                                {subSt?.text ?? "제출"}
                              </span>
                            ) : (
                              <span style={{ ...badgeBase, background: "rgba(234,179,8,0.1)", color: "#ca8a04" }}>
                                미제출
                              </span>
                            )}
                          </td>
                          <td style={tdSt}>
                            {hw.score != null ? (
                              <div>
                                <span style={{ fontWeight: 700, color: "#25A194" }}>
                                  {hw.score}/{hw.maxScore ?? 100}
                                </span>
                                {hw.feedback && (
                                  <div
                                    style={{
                                      fontSize: 11,
                                      color: "#9ca3af",
                                      marginTop: 2,
                                      maxWidth: 120,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                    title={hw.feedback}
                                  >
                                    {hw.feedback}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: "#9ca3af" }}>-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            ) : (
              /* ===== 퀴즈 테이블 ===== */
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: 55 }} />
                  <col />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 110 }} />
                  <col style={{ width: 110 }} />
                  <col style={{ width: 90 }} />
                  <col style={{ width: 100 }} />
                  <col style={{ width: 110 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={thSt}>번호</th>
                    <th style={thSt}>제목</th>
                    <th style={thSt}>학급</th>
                    <th style={thSt}>출제 교사</th>
                    <th style={thSt}>마감일</th>
                    <th style={thSt}>상태</th>
                    <th style={thSt}>응시</th>
                    <th style={thSt}>최고점수</th>
                  </tr>
                </thead>
                <tbody>
                  {quizzes.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ ...tdSt, textAlign: "center", padding: "48px 16px", color: "#9ca3af" }}>
                        퀴즈가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    quizzes.map((qz, i) => (
                      <tr key={qz.id}>
                        <td style={tdSt}>{quizzes.length - i}</td>
                        <td style={{ ...tdSt, overflow: "hidden", textOverflow: "ellipsis" }}>
                          <span style={{ fontWeight: 600 }}>{qz.title}</span>
                        </td>
                        <td style={{ ...tdSt, color: "#6b7280" }}>{qz.classroomName}</td>
                        <td style={{ ...tdSt, color: "#6b7280" }}>{qz.teacherName}</td>
                        <td style={{ ...tdSt, color: "#6b7280" }}>{qz.dueDate?.slice(0, 10)}</td>
                        <td style={tdSt}>
                          <span style={{ ...badgeBase, ...(QZ_BADGE[qz.status] ?? QZ_BADGE.OPEN) }}>
                            {QZ_LABEL[qz.status] ?? "진행중"}
                          </span>
                        </td>
                        <td style={{ ...tdSt, color: "#6b7280" }}>
                          {qz.myAttemptCount != null ? (
                            <span>
                              {qz.myAttemptCount}회
                              {qz.maxAttempts != null && (
                                <span style={{ fontSize: 11, marginLeft: 4, color: "#9ca3af" }}>
                                  / {qz.maxAttempts}회
                                </span>
                              )}
                            </span>
                          ) : (
                            <span style={{ color: "#9ca3af" }}>-</span>
                          )}
                        </td>
                        <td style={tdSt}>
                          {qz.myBestScore != null ? (
                            <span style={{ fontWeight: 700, color: "#25A194" }}>
                              {qz.myBestScore}/{qz.totalPoints}
                            </span>
                          ) : (
                            <span style={{ color: "#9ca3af" }}>미응시</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
