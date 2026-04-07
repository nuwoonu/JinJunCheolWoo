import { useEffect, useState } from "react";
import api from "@/shared/api/authApi";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";
import ParentBackButton from "@/shared/components/ParentBackButton";

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

const HW_STATUS: Record<string, { text: string; cls: string }> = {
  OPEN: { text: "진행중", cls: "bg-success-100 text-success-600" },
  CLOSED: { text: "마감", cls: "bg-danger-100 text-danger-600" },
  GRADED: { text: "채점완료", cls: "bg-primary-100 text-primary-600" },
};

const SUB_STATUS: Record<string, { text: string; cls: string }> = {
  SUBMITTED: { text: "제출", cls: "bg-success-100 text-success-600" },
  LATE: { text: "지각제출", cls: "bg-warning-100 text-warning-600" },
  GRADED: { text: "채점완료", cls: "bg-primary-100 text-primary-600" },
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-40 text-secondary-light">불러오는 중...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* 브레드크럼 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">과제 / 퀴즈</h6>
          <p className="text-neutral-600 mt-4 mb-0">자녀 과제·퀴즈 현황</p>
        </div>
        <ParentBackButton />
      </div>

      {/* 자녀 선택 (자녀가 여러 명일 때) */}
      {children.length > 1 && (
        <div className="d-flex align-items-center gap-8 mb-24">
          <span className="text-sm fw-semibold me-4">자녀 선택:</span>
          {children.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`btn btn-sm radius-8 ${selectedId === c.id ? "btn-primary-600" : "btn-outline-neutral-300"}`}
              onClick={() => setSelectedId(c.id)}
            >
              {c.name}
              {c.grade && c.classNum && (
                <span className="ms-4 text-xs opacity-75">
                  ({c.grade}학년 {c.classNum}반)
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* 탭 */}
      <ul className="nav bordered-tab mb-24">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link${tab === "homework" ? " active" : ""}`}
            onClick={() => setTab("homework")}
          >
            <i className="ri-draft-line me-6" />
            과제
            {!dataLoading && <span className="ms-6 badge bg-neutral-100 text-neutral-600">{homeworks.length}</span>}
          </button>
        </li>
        <li className="nav-item">
          <button type="button" className={`nav-link${tab === "quiz" ? " active" : ""}`} onClick={() => setTab("quiz")}>
            <i className="ri-question-line me-6" />
            퀴즈
            {!dataLoading && <span className="ms-6 badge bg-neutral-100 text-neutral-600">{quizzes.length}</span>}
          </button>
        </li>
      </ul>

      {dataLoading ? (
        <div className="text-center py-32 text-secondary-light">불러오는 중...</div>
      ) : tab === "homework" ? (
        /* ========== 과제 탭 ========== */
        <div className="card radius-12">
          <div className="card-header py-16 px-24 border-bottom">
            <h6 className="mb-0">{selectedChild ? `${selectedChild.name}의 과제 목록` : "과제 목록"}</h6>
          </div>
          {homeworks.length === 0 ? (
            <div className="card-body text-center py-32 text-secondary-light">과제가 없습니다.</div>
          ) : (
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table bordered-table mb-0">
                  <thead>
                    <tr>
                      <th>제목</th>
                      <th style={{ width: 120 }}>학급</th>
                      <th style={{ width: 100 }}>교사</th>
                      <th style={{ width: 110 }}>마감일</th>
                      <th style={{ width: 80 }}>상태</th>
                      <th style={{ width: 80 }}>제출</th>
                      <th style={{ width: 100 }}>점수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {homeworks.map((hw) => {
                      const hwSt = HW_STATUS[hw.status] ?? HW_STATUS.OPEN;
                      const subSt = hw.submissionStatus ? SUB_STATUS[hw.submissionStatus] : null;
                      const isOverdue = new Date(hw.dueDate) < new Date();
                      return (
                        <tr key={hw.id}>
                          <td className="fw-medium">{hw.title}</td>
                          <td className="text-secondary-light">{hw.classroomName}</td>
                          <td className="text-secondary-light">{hw.teacherName}</td>
                          <td className={isOverdue && !hw.submitted ? "text-danger-600" : "text-secondary-light"}>
                            {hw.dueDate?.slice(0, 10)}
                          </td>
                          <td>
                            <span className={`badge ${hwSt.cls}`}>{hwSt.text}</span>
                          </td>
                          <td>
                            {hw.submitted == null ? (
                              <span className="text-secondary-light">-</span>
                            ) : hw.submitted ? (
                              <span className={`badge ${subSt?.cls ?? "bg-success-100 text-success-600"}`}>
                                {subSt?.text ?? "제출"}
                              </span>
                            ) : (
                              <span className="badge bg-neutral-100 text-neutral-600">미제출</span>
                            )}
                          </td>
                          <td>
                            {hw.score != null ? (
                              <div>
                                <span className="fw-bold text-primary-600">
                                  {hw.score}/{hw.maxScore ?? 100}
                                </span>
                                {hw.feedback && (
                                  <div
                                    className="text-xs text-secondary-light mt-2"
                                    style={{
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
                              <span className="text-secondary-light">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ========== 퀴즈 탭 ========== */
        <div className="card radius-12">
          <div className="card-header py-16 px-24 border-bottom">
            <h6 className="mb-0">{selectedChild ? `${selectedChild.name}의 퀴즈 목록` : "퀴즈 목록"}</h6>
          </div>
          {quizzes.length === 0 ? (
            <div className="card-body text-center py-32 text-secondary-light">퀴즈가 없습니다.</div>
          ) : (
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table bordered-table mb-0">
                  <thead>
                    <tr>
                      <th>제목</th>
                      <th style={{ width: 120 }}>학급</th>
                      <th style={{ width: 100 }}>교사</th>
                      <th style={{ width: 110 }}>마감일</th>
                      <th style={{ width: 80 }}>상태</th>
                      <th style={{ width: 100 }}>응시</th>
                      <th style={{ width: 100 }}>최고점수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizzes.map((qz) => {
                      const isOpen = qz.status === "OPEN";
                      return (
                        <tr key={qz.id}>
                          <td className="fw-medium">{qz.title}</td>
                          <td className="text-secondary-light">{qz.classroomName}</td>
                          <td className="text-secondary-light">{qz.teacherName}</td>
                          <td className="text-secondary-light">{qz.dueDate?.slice(0, 10)}</td>
                          <td>
                            <span
                              className={`badge ${isOpen ? "bg-success-100 text-success-600" : "bg-danger-100 text-danger-600"}`}
                            >
                              {isOpen ? "진행중" : "마감"}
                            </span>
                          </td>
                          <td className="text-secondary-light">
                            {qz.myAttemptCount != null ? (
                              <span>
                                {qz.myAttemptCount}회
                                {qz.maxAttempts && (
                                  <span className="text-xs ms-2 opacity-75">/ {qz.maxAttempts}회</span>
                                )}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td>
                            {qz.myBestScore != null ? (
                              <span className="fw-bold text-primary-600">
                                {qz.myBestScore}/{qz.totalPoints}
                              </span>
                            ) : (
                              <span className="text-secondary-light">미응시</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
