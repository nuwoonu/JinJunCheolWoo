import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  getSectionStudents,
  getSectionRatio,
  setSectionRatio,
  inputGradeBatch,
  TEST_TYPE_LABELS,
} from "@/api/grade";
import type { GradeResponseDTO, GradeInputDTO, SectionRatioDTO, TestType } from "@/api/grade";

// [woo] 교사 성적 입력 - TeacherList UI 패턴 적용 (화면 꽉 채움, inline style)
// /teacher/grades/section/:sectionId

const TEST_TYPES: TestType[] = ["MIDTERMTEST", "FINALTEST", "HOMEWORK", "QUIZ"];

const RATIO_FIELDS: { key: keyof Omit<SectionRatioDTO, "sectionId" | "subjectId" | "subjectName">; label: string }[] = [
  { key: "midtermRatio", label: "중간고사" },
  { key: "finalRatio", label: "기말고사" },
  { key: "homeworkRatio", label: "과제" },
  { key: "quizRatio", label: "퀴즈" },
];

// [woo] 학생별 전 유형 점수 상태: { studentId → { testType → score } }
type ScoreMap = Record<number, Record<TestType, string>>;
// [woo] 학생별 전 유형 gradeId 상태 (저장됨 여부 표시용)
type GradeIdMap = Record<number, Record<TestType, number | null>>;

export default function GradeEntryInput() {
  const { sectionId } = useParams<{ sectionId: string }>();

  // [woo] 학생 목록 (중간고사 기준으로 불러와 이름/번호 확보)
  const [students, setStudents] = useState<GradeResponseDTO[]>([]);
  const [scores, setScores] = useState<ScoreMap>({});
  const [gradeIds, setGradeIds] = useState<GradeIdMap>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // [woo] 비율 설정
  const [ratio, setRatio] = useState<SectionRatioDTO | null>(null);
  const [ratioEdit, setRatioEdit] = useState<SectionRatioDTO | null>(null);
  const [ratioText, setRatioText] = useState<Record<string, string>>({});
  const [showRatio, setShowRatio] = useState(false);
  const [ratioSaving, setRatioSaving] = useState(false);
  const [ratioMsg, setRatioMsg] = useState("");

  const fetchAll = useCallback(async () => {
    if (!sectionId) return;
    setLoading(true);
    try {
      // [woo] 4개 유형 병렬 조회
      const results = await Promise.all(
        TEST_TYPES.map((tt) => getSectionStudents(Number(sectionId), tt))
      );

      // [woo] 학생 목록은 첫 번째(중간고사) 기준
      const baseStudents = results[0].data;
      setStudents(baseStudents);

      // [woo] 점수/gradeId 초기화
      const initScores: ScoreMap = {};
      const initGradeIds: GradeIdMap = {};
      for (const s of baseStudents) {
        initScores[s.studentId] = { MIDTERMTEST: "", FINALTEST: "", HOMEWORK: "", QUIZ: "" };
        initGradeIds[s.studentId] = { MIDTERMTEST: null, FINALTEST: null, HOMEWORK: null, QUIZ: null };
      }

      TEST_TYPES.forEach((tt, idx) => {
        for (const s of results[idx].data) {
          if (initScores[s.studentId]) {
            initScores[s.studentId][tt] = s.score != null ? String(s.score) : "";
            initGradeIds[s.studentId][tt] = s.gradeId ?? null;
          }
        }
      });

      setScores(initScores);
      setGradeIds(initGradeIds);
      setDirty(new Set()); // [woo] 로드 후 dirty 초기화
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [sectionId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!sectionId) return;
    getSectionRatio(Number(sectionId))
      .then((res) => {
        setRatio(res.data);
        setRatioEdit(res.data);
        setRatioText({
          midtermRatio: String(res.data.midtermRatio),
          finalRatio: String(res.data.finalRatio),
          homeworkRatio: String(res.data.homeworkRatio),
          quizRatio: String(res.data.quizRatio),
        });
      })
      .catch(() => {});
  }, [sectionId]);

  const handleScoreChange = (studentId: number, tt: TestType, value: string) => {
    if (value !== "" && !/^\d*\.?\d*$/.test(value)) return;
    setScores((prev) => ({ ...prev, [studentId]: { ...prev[studentId], [tt]: value } }));
    setDirty((prev) => new Set(prev).add(`${studentId}:${tt}`));
  };

  // [woo] Enter 키로 해당 셀만 저장
  const handleEnterSave = async (studentId: number, tt: TestType) => {
    if (!sectionId) return;
    const val = scores[studentId]?.[tt];
    if (val === "" || val === undefined) return;
    const num = parseFloat(val);
    if (isNaN(num) || num < 0 || num > 100) {
      alert(`점수가 유효하지 않습니다. (0~100)`);
      return;
    }
    const student = students.find((s) => s.studentId === studentId);
    if (!student) return;
    setSaving(true);
    try {
      await inputGradeBatch([{ courseSectionId: Number(sectionId), studentId, testType: tt, score: num }]);
      setSavedMsg("저장되었습니다.");
      setTimeout(() => setSavedMsg(""), 2000);
      setDirty((prev) => { const next = new Set(prev); next.delete(`${studentId}:${tt}`); return next; });
      // [woo] gradeId 갱신을 위해 전체 재로드
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.error || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    if (!sectionId) return;
    const dtos: GradeInputDTO[] = [];
    for (const s of students) {
      for (const tt of TEST_TYPES) {
        const val = scores[s.studentId]?.[tt];
        if (val === "" || val === undefined) continue;
        const num = parseFloat(val);
        if (isNaN(num) || num < 0 || num > 100) {
          alert(`${s.studentName}의 ${TEST_TYPE_LABELS[tt]} 점수가 유효하지 않습니다. (0~100)`);
          return;
        }
        dtos.push({ courseSectionId: Number(sectionId), studentId: s.studentId, testType: tt, score: num });
      }
    }
    if (dtos.length === 0) { alert("입력된 점수가 없습니다."); return; }
    setSaving(true);
    try {
      await inputGradeBatch(dtos);
      setSavedMsg("저장되었습니다.");
      setTimeout(() => setSavedMsg(""), 2000);
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.error || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const ratioTotal = ratioEdit
    ? ratioEdit.midtermRatio + ratioEdit.finalRatio + ratioEdit.quizRatio + ratioEdit.homeworkRatio
    : 0;

  const handleSaveRatio = async () => {
    if (!sectionId || !ratioEdit) return;
    if (ratioTotal !== 100) { setRatioMsg(`비율 합계가 ${ratioTotal}%입니다. 합계가 100%가 되어야 합니다.`); return; }
    setRatioSaving(true);
    setRatioMsg("");
    try {
      const res = await setSectionRatio(Number(sectionId), ratioEdit);
      setRatio(res.data);
      setRatioEdit(res.data);
      setRatioMsg("비율이 저장되었습니다.");
      setTimeout(() => setRatioMsg(""), 2000);
    } catch (err: any) {
      setRatioMsg(err.response?.data?.error || "저장에 실패했습니다.");
    } finally {
      setRatioSaving(false);
    }
  };

  const getRatioLabel = (tt: TestType) => {
    if (!ratio) return "";
    const map: Record<TestType, number> = {
      MIDTERMTEST: ratio.midtermRatio,
      FINALTEST: ratio.finalRatio,
      HOMEWORK: ratio.homeworkRatio,
      QUIZ: ratio.quizRatio,
    };
    return `${map[tt]}%`;
  };

  const subjectName = students[0]?.subjectName ?? "";
  const schoolYear = students[0]?.schoolYear;
  const semester = students[0]?.semester;

  return (
    <DashboardLayout>
      {/* [woo] TeacherList 패턴 - 화면 꽉 채우는 flex column */}
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4.5rem - 48px)' }}>

        {/* [woo] 제목 + 브레드크럼 */}
        <div style={{ marginBottom: 16, flexShrink: 0 }}>
          <h5 style={{ fontWeight: 700, color: '#111827', marginBottom: 4, display: 'flex', alignItems: 'baseline', gap: 8 }}>
            {subjectName || '점수 입력'}
            {schoolYear && (
              <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280' }}>
                {schoolYear}학년도 {semester}학기
              </span>
            )}
          </h5>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
            <Link to="/teacher/grades" style={{ color: '#25A194', textDecoration: 'none' }}>성적 입력</Link>
            {' > '}점수 입력
          </p>
        </div>

        {/* [woo] 컨트롤 바: 비율설정(좌) + 저장(우) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
          <button
            type="button"
            style={{ padding: '5px 12px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center', gap: 4 }}
            onClick={() => setShowRatio((v) => !v)}
          >
            <i className="ri-equalizer-line" style={{ fontSize: 14 }} />
            비율 설정
            <i className={showRatio ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"} style={{ fontSize: 14 }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {savedMsg && (
              <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 500 }}>{savedMsg}</span>
            )}
            <button
              type="button"
              style={{ padding: '5px 16px', background: '#25A194', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, whiteSpace: 'nowrap' }}
              onClick={handleSaveAll}
              disabled={saving}
            >
              {saving ? '저장 중...' : '일괄 저장'}
            </button>
          </div>
        </div>

        {/* [woo] 비율 설정 패널 (카드 밖, 접힘 가능) */}
        {showRatio && ratioEdit && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px', marginBottom: 12, flexShrink: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: '0 0 12px 0' }}>성적 반영 비율 설정</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              {RATIO_FIELDS.map(({ key, label }) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 90 }}>
                  <label style={{ fontSize: 12, color: '#6b7280' }}>{label} (%)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    style={{ padding: '5px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, width: 80, textAlign: 'center' }}
                    value={ratioText[key] ?? String(ratioEdit[key])}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v !== "" && !/^\d+$/.test(v)) return;
                      setRatioText((t) => ({ ...t, [key]: v }));
                      setRatioEdit((r) => r ? { ...r, [key]: v === "" ? 0 : Math.min(100, Number(v)) } : r);
                    }}
                    onBlur={() => {
                      if (ratioText[key] === "") setRatioText((t) => ({ ...t, [key]: "0" }));
                    }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: ratioTotal === 100 ? '#16a34a' : '#dc2626' }}>
                  합계: {ratioTotal}%
                </span>
                {ratioMsg && (
                  <span style={{ fontSize: 13, color: ratioMsg.includes('저장') ? '#16a34a' : '#dc2626' }}>
                    {ratioMsg}
                  </span>
                )}
                <button
                  type="button"
                  style={{ padding: '5px 14px', background: ratioTotal === 100 ? '#25A194' : '#e5e7eb', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, color: ratioTotal === 100 ? '#fff' : '#9ca3af', cursor: ratioSaving || ratioTotal !== 100 ? 'not-allowed' : 'pointer' }}
                  onClick={handleSaveRatio}
                  disabled={ratioSaving || ratioTotal !== 100}
                >
                  {ratioSaving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* [woo] 메인 카드: flex:1, 스크롤 가능 테이블 */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <div className="spinner-border text-primary" />
            </div>
          ) : students.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#9ca3af', fontSize: 14 }}>
              학생이 없습니다.
            </div>
          ) : (
            <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', minHeight: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: 60 }} />
                  <col style={{ width: 120 }} />
                  {TEST_TYPES.map((tt) => <col key={tt} style={{ width: 160 }} />)}
                </colgroup>
                <thead>
                  <tr>
                    {[
                      { label: '번호', center: true },
                      { label: '이름', center: false },
                      ...TEST_TYPES.map((tt) => ({
                        label: TEST_TYPE_LABELS[tt],
                        sub: ratio ? getRatioLabel(tt) : undefined,
                        center: true,
                      })),
                    ].map((h, i) => (
                      <th key={i} style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: h.center ? 'center' : 'left', whiteSpace: 'nowrap' }}>
                        {h.label}
                        {'sub' in h && h.sub && (
                          <span style={{ marginLeft: 4, fontSize: 11, fontWeight: 400, color: '#9ca3af' }}>{h.sub}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.studentId}>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle', textAlign: 'center' }}>
                        {s.attendanceNum ?? '-'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: '#374151', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        {s.studentName}
                      </td>
                      {TEST_TYPES.map((tt) => {
                        const gId = gradeIds[s.studentId]?.[tt];
                        const val = scores[s.studentId]?.[tt] ?? "";
                        const isDirty = dirty.has(`${s.studentId}:${tt}`);
                        return (
                          <td key={tt} style={{ padding: '10px 16px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={val}
                                onChange={(e) => handleScoreChange(s.studentId, tt, e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleEnterSave(s.studentId, tt); }}
                                placeholder="-"
                                style={{ width: 64, padding: '4px 6px', border: `1px solid ${isDirty ? '#f59e0b' : '#d1d5db'}`, borderRadius: 6, fontSize: 13, textAlign: 'center', outline: 'none', transition: 'border-color 0.15s' }}
                              />
                              {(() => {
                                if (isDirty) return (
                                  <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: 'rgba(245,158,11,0.1)', color: '#d97706', whiteSpace: 'nowrap' }}>미저장</span>
                                );
                                if (gId != null) return (
                                  <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: 'rgba(22,163,74,0.1)', color: '#16a34a', whiteSpace: 'nowrap' }}>저장됨</span>
                                );
                                if (val !== "") return (
                                  <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', whiteSpace: 'nowrap' }}>자동계산</span>
                                );
                                return (
                                  <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: '#f3f4f6', color: '#9ca3af', whiteSpace: 'nowrap' }}>미입력</span>
                                );
                              })()}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
