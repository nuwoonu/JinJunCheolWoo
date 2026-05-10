// [woo] 교사 - 담임반 학생 일일 태그 메모 입력 페이지
// 태그 탭 선택으로 빠르게 입력, 추가 메모 선택 가능
// 매일 오후 4시 GPT 요약 자동 생성 → 학부모 FCM 푸시

import { useEffect, useState } from "react";
import api from "@/shared/api/authApi";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";

// ──────────────────────────────
// 태그 정의 (카테고리별)
// ──────────────────────────────
const TAG_GROUPS = [
  {
    label: "수업 태도",
    icon: "ri-book-open-line",
    color: "#3b82f6",
    bg: "#eff6ff",
    tags: ["집중함", "산만함", "발표 적극적", "질문 많음", "조용히 참여"],
  },
  {
    label: "사회성",
    icon: "ri-group-line",
    color: "#10b981",
    bg: "#ecfdf5",
    tags: ["친구관계 좋음", "다툼 있었음", "도움 잘 줌", "리더십 발휘"],
  },
  {
    label: "컨디션",
    icon: "ri-heart-pulse-line",
    color: "#f59e0b",
    bg: "#fffbeb",
    tags: ["기분 좋음", "몸 안 좋아 보임", "피곤해 보임", "활기참"],
  },
  {
    label: "기타",
    icon: "ri-sticky-note-line",
    color: "#8b5cf6",
    bg: "#f5f3ff",
    tags: ["특이사항 없음", "칭찬함", "면담 필요", "학부모 연락 필요"],
  },
];

interface StudentNoteStatus {
  studentId: number;
  studentName: string;
  tags: string[];
  memo: string | null;
  hasNote: boolean;
}

export default function DailyNoteInput() {
  const [students, setStudents] = useState<StudentNoteStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentNoteStatus | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  // [woo] toISOString()은 UTC 기준 → KST 자정~오전9시 사이 하루 전 날짜 버그 → 로컬 날짜 직접 계산
  const _d = new Date();
  const today = `${_d.getFullYear()}-${String(_d.getMonth()+1).padStart(2,"0")}-${String(_d.getDate()).padStart(2,"0")}`;

  useEffect(() => {
    api
      .get("/daily-summary/teacher/students", { params: { date: today } })
      .then((r) => {
        setStudents(r.data);
        setSavedIds(
          new Set(r.data.filter((s: StudentNoteStatus) => s.hasNote).map((s: StudentNoteStatus) => s.studentId)),
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [today]);

  const openStudent = (s: StudentNoteStatus) => {
    setSelectedStudent(s);
    setSelectedTags(s.tags ?? []);
    setMemo(s.memo ?? "");
    setGeneratedContent(null);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setSelectedStudent(null);
    document.body.style.overflow = "";
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const generateNow = async () => {
    if (!selectedStudent) return;
    setGenerating(true);
    setGeneratedContent(null);
    try {
      // [woo] 태그/메모를 먼저 저장해야 백엔드 hasAnyActivity() 통과
      await api.post("/daily-summary/teacher/note", {
        studentId: selectedStudent.studentId,
        date: today,
        tags: selectedTags,
        memo: memo || null,
      });
      setSavedIds((prev) => new Set([...prev, selectedStudent.studentId]));
      const res = await api.post(`/daily-summary/trigger/student/${selectedStudent.studentId}`, null, {
        params: { date: today },
      });
      setGeneratedContent(res.data?.content ?? "요약이 생성되었습니다.");
    } catch {
      setGeneratedContent("요약 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    if (!selectedStudent) return;
    setSaving(true);
    try {
      await api.post("/daily-summary/teacher/note", {
        studentId: selectedStudent.studentId,
        date: today,
        tags: selectedTags,
        memo: memo || null,
      });
      setSavedIds((prev) => new Set([...prev, selectedStudent.studentId]));
      setStudents((prev) =>
        prev.map((s) =>
          s.studentId === selectedStudent.studentId
            ? { ...s, tags: selectedTags, memo: memo || null, hasNote: true }
            : s,
        ),
      );
      setSelectedStudent(null);
      document.body.style.overflow = "";
    } catch {
      alert("저장 실패. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const savedCount = savedIds.size;
  const totalCount = students.length;

  return (
    <DashboardLayout>
      <div className="page-content">
        <div className="row">
          <div className="col-12">
            {/* 헤더 */}
            <div className="d-flex align-items-center justify-content-between mb-24">
              <div>
                <h4 className="fw-bold mb-4" style={{ color: "#1e293b" }}>
                  <i className="ri-file-list-3-line me-8 text-primary-600" />
                  오늘의 학생 메모
                </h4>
                <p className="text-secondary-light text-sm mb-0">
                  {today} · 태그를 선택하면 GPT가 자동으로 학부모에게 요약을 전송합니다
                </p>
              </div>
              {/* 진행률 */}
              <div className="text-end">
                <div
                  className="fw-bold text-lg"
                  style={{ color: savedCount === totalCount && totalCount > 0 ? "#10b981" : "#6b7280" }}
                >
                  {savedCount} / {totalCount}
                </div>
                <div className="text-secondary-light text-xs">입력 완료</div>
                {totalCount > 0 && (
                  <div
                    style={{
                      width: 80,
                      height: 6,
                      background: "#e5e7eb",
                      borderRadius: 4,
                      marginTop: 4,
                    }}
                  >
                    <div
                      style={{
                        width: `${(savedCount / totalCount) * 100}%`,
                        height: "100%",
                        background: "#10b981",
                        borderRadius: 4,
                        transition: "width 0.3s",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-40 text-secondary-light">
                <i className="ri-loader-4-line ri-spin text-2xl" />
                <p className="mt-8">학생 목록을 불러오는 중...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="card text-center py-40">
                <i className="ri-user-unfollow-line text-4xl text-secondary-light" />
                <p className="mt-12 text-secondary-light">담임 학급 정보가 없습니다.</p>
              </div>
            ) : (
              <div className="row gy-3">
                {students.map((s) => (
                  <div key={s.studentId} className="col-xl-3 col-md-4 col-sm-6">
                    <div
                      onClick={() => openStudent(s)}
                      style={{
                        background: "#fff",
                        borderRadius: 14,
                        padding: "16px 18px",
                        border: `2px solid ${savedIds.has(s.studentId) ? "#10b981" : "#e5e7eb"}`,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                      }}
                    >
                      <div className="d-flex align-items-center gap-10 mb-8">
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: savedIds.has(s.studentId) ? "#d1fae5" : "#f1f5f9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {savedIds.has(s.studentId) ? (
                            <i className="ri-check-line" style={{ color: "#10b981", fontSize: 18 }} />
                          ) : (
                            <i className="ri-user-line" style={{ color: "#94a3b8", fontSize: 18 }} />
                          )}
                        </div>
                        <div>
                          <div className="fw-semibold text-sm" style={{ color: "#1e293b" }}>
                            {s.studentName}
                          </div>
                          {savedIds.has(s.studentId) && (
                            <div className="text-xs" style={{ color: "#10b981" }}>
                              메모 완료
                            </div>
                          )}
                        </div>
                      </div>
                      {s.tags.length > 0 && (
                        <div className="d-flex flex-wrap gap-4">
                          {s.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              style={{
                                fontSize: 11,
                                background: "#eff6ff",
                                color: "#3b82f6",
                                borderRadius: 6,
                                padding: "2px 7px",
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                          {s.tags.length > 3 && (
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>+{s.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 학생 태그 입력 모달 */}
      {selectedStudent && (
        <div
          onClick={() => closeModal()}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1050,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 20,
              width: "100%",
              maxWidth: 520,
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            {/* 모달 헤더 */}
            <div
              style={{
                padding: "20px 24px 16px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                position: "sticky",
                top: 0,
                background: "#fff",
                borderRadius: "20px 20px 0 0",
              }}
            >
              <div className="d-flex align-items-center gap-10">
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "#eff6ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i className="ri-user-line" style={{ color: "#3b82f6", fontSize: 20 }} />
                </div>
                <div>
                  <div className="fw-bold" style={{ fontSize: 16, color: "#1e293b" }}>
                    {selectedStudent.studentName}
                  </div>
                  <div className="text-xs text-secondary-light">{today} 메모</div>
                </div>
              </div>
              <button
                onClick={() => closeModal()}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}
              >
                <i className="ri-close-line" />
              </button>
            </div>

            {/* 태그 그룹 */}
            <div style={{ padding: "20px 24px" }}>
              {TAG_GROUPS.map((group) => (
                <div key={group.label} style={{ marginBottom: 20 }}>
                  <div className="d-flex align-items-center gap-6 mb-10">
                    <i className={group.icon} style={{ color: group.color, fontSize: 15 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>{group.label}</span>
                  </div>
                  <div className="d-flex flex-wrap gap-8">
                    {group.tags.map((tag) => {
                      const active = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          style={{
                            padding: "7px 14px",
                            borderRadius: 20,
                            border: `1.5px solid ${active ? group.color : "#e2e8f0"}`,
                            background: active ? group.bg : "#fff",
                            color: active ? group.color : "#64748b",
                            fontSize: 13,
                            fontWeight: active ? 600 : 400,
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          {active && <i className="ri-check-line me-4" />}
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* 추가 메모 */}
              <div style={{ marginBottom: 20 }}>
                <div className="d-flex align-items-center gap-6 mb-10">
                  <i className="ri-edit-line" style={{ color: "#8b5cf6", fontSize: 15 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
                    추가 메모 <span style={{ color: "#94a3b8", fontWeight: 400 }}>(선택)</span>
                  </span>
                </div>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="태그로 표현하기 어려운 내용을 짧게 입력하세요..."
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 10,
                    fontSize: 13,
                    color: "#374151",
                    resize: "none",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {/* 선택된 태그 미리보기 */}
              {selectedTags.length > 0 && (
                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: 10,
                    padding: "12px 14px",
                    marginBottom: 20,
                  }}
                >
                  <div className="text-xs text-secondary-light mb-6">
                    <i className="ri-eye-line me-4" />
                    선택된 태그
                  </div>
                  <div className="d-flex flex-wrap gap-6">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 12,
                          background: "#e0e7ff",
                          color: "#4f46e5",
                          borderRadius: 6,
                          padding: "3px 9px",
                          fontWeight: 500,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 지금 요약 생성 버튼 */}
              <button
                onClick={generateNow}
                disabled={generating || saving}
                style={{
                  width: "100%",
                  padding: "13px",
                  background: generating ? "#f1f5f9" : "#f0fdf4",
                  color: generating ? "#94a3b8" : "#16a34a",
                  border: `1.5px solid ${generating ? "#e2e8f0" : "#86efac"}`,
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: generating ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginBottom: 10,
                  transition: "all 0.2s",
                }}
              >
                {generating ? (
                  <>
                    <i className="ri-loader-4-line ri-spin" /> GPT 요약 생성 중...
                  </>
                ) : (
                  <>
                    <i className="ri-sparkling-2-line" /> 지금 요약 생성하기
                  </>
                )}
              </button>

              {/* 생성된 요약 미리보기 */}
              {generatedContent && (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1.5px solid #86efac",
                    borderRadius: 12,
                    padding: "14px 16px",
                    marginBottom: 14,
                  }}
                >
                  <div className="d-flex align-items-center gap-6 mb-8">
                    <i className="ri-sparkling-2-line" style={{ color: "#16a34a", fontSize: 14 }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#16a34a" }}>생성된 요약</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#166534", lineHeight: 1.6, margin: 0 }}>{generatedContent}</p>
                </div>
              )}

              {/* 저장 버튼 */}
              <button
                onClick={save}
                disabled={saving}
                style={{
                  width: "100%",
                  padding: "13px",
                  background: saving ? "#94a3b8" : "#3b82f6",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {saving ? (
                  <>
                    <i className="ri-loader-4-line ri-spin" /> 저장 중...
                  </>
                ) : (
                  <>
                    <i className="ri-save-line" /> 저장하기
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
