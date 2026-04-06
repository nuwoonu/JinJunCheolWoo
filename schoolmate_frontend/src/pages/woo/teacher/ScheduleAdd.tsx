import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";

// [woo] /teacher/schedule/add - 수업 일정 추가 (TimetableApp에서 링크)

const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

// [woo] TimetableApp의 PERIOD_TIMES와 동일 — startTime → 교시 자동 매핑용
const PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: "09:00", end: "09:50" },
  2: { start: "10:00", end: "10:50" },
  3: { start: "11:00", end: "11:50" },
  4: { start: "12:00", end: "12:50" },
  5: { start: "13:50", end: "14:40" },
  6: { start: "14:50", end: "15:40" },
  7: { start: "15:50", end: "16:40" },
  8: { start: "16:50", end: "17:40" },
};

const DAY_LABELS: Record<string, string> = {
  MONDAY: "월",
  TUESDAY: "화",
  WEDNESDAY: "수",
  THURSDAY: "목",
  FRIDAY: "금",
  SATURDAY: "토",
  SUNDAY: "일",
};

interface FormData {
  dayOfWeek: string;
  period: string;
  startTime: string;
  endTime: string;
  subjectName: string;
  className: string;
  location: string;
  repeatType: string;
  specificDate: string;
  memo: string;
}

const EMPTY_FORM: FormData = {
  dayOfWeek: "MONDAY",
  period: "",
  startTime: "",
  endTime: "",
  subjectName: "",
  className: "",
  location: "",
  repeatType: "WEEKLY",
  specificDate: "",
  memo: "",
};

export default function ScheduleAdd() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // [woo] 교사의 담당 과목 목록
  const [subjects, setSubjects] = useState<{ id: number; code: string; name: string }[]>([]);

  useEffect(() => {
    api
      .get<{ id: number; code: string; name: string }[]>("/teacher/schedule/subjects")
      .then((r) => setSubjects(r.data ?? []))
      .catch(() => {});
  }, []);

  const set =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subjectName.trim()) {
      setError("과목명은 필수입니다.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.post("/teacher/schedule", {
        dayOfWeek: form.dayOfWeek,
        period: form.period ? Number(form.period) : null,
        startTime: form.startTime || null,
        endTime: form.endTime || null,
        subjectName: form.subjectName,
        className: form.className || null,
        location: form.location || null,
        repeatType: form.repeatType,
        specificDate: form.specificDate || null,
        memo: form.memo || null,
      });
      navigate("/teacher/schedule");
    } catch {
      setError("일정이 이미 존재합니다.");
    } finally {
      setSaving(false);
    }
  };

  const pt = form.period ? PERIOD_TIMES[Number(form.period)] : null;

  return (
    <DashboardLayout>
      <div className="d-flex align-items-center justify-content-between mb-24">
        <div>
          <h6 className="fw-bold mb-0" style={{ fontSize: 18 }}>일정 등록</h6>
          <p className="text-secondary-light text-sm mt-4 mb-0">새 수업 일정을 등록합니다</p>
        </div>
        <button type="button" className="btn btn-outline-neutral-300 radius-8 btn-sm" onClick={() => navigate("/teacher/schedule")}>
          <i className="ri-arrow-left-line me-4" /> 시간표로 돌아가기
        </button>
      </div>

      {error && <div className="alert alert-danger radius-8 mb-16">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="row">
          {/* [woo] 왼쪽: 입력 폼 */}
          <div className="col-lg-8">
            {/* 요일 + 교시 선택 */}
            <div className="card radius-12 mb-16">
              <div className="card-body p-24">
                <label className="form-label fw-semibold text-sm mb-12">요일 <span className="text-danger">*</span></label>
                <div className="d-flex gap-12 mb-20">
                  {DAY_ORDER.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, dayOfWeek: d }))}
                      style={{
                        width: 56, height: 56, borderRadius: 12,
                        border: form.dayOfWeek === d ? '2px solid #25A194' : '1px solid #e2e8f0',
                        background: form.dayOfWeek === d ? '#25A194' : '#fff',
                        color: form.dayOfWeek === d ? '#fff' : '#475569',
                        fontWeight: 700, fontSize: 16, cursor: 'pointer',
                        transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {DAY_LABELS[d]}
                    </button>
                  ))}
                </div>

                <label className="form-label fw-semibold text-sm mb-12">교시</label>
                <div className="d-flex gap-8 flex-wrap">
                  {Object.entries(PERIOD_TIMES).map(([p, t]) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, period: p, startTime: t.start, endTime: t.end }))}
                      style={{
                        minWidth: 64, padding: '8px 12px', borderRadius: 10,
                        border: form.period === p ? '2px solid #25A194' : '1px solid #e2e8f0',
                        background: form.period === p ? 'rgba(37,161,148,0.08)' : '#fff',
                        color: form.period === p ? '#25A194' : '#475569',
                        fontWeight: 600, fontSize: 13, cursor: 'pointer',
                        transition: 'all 0.15s',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                      }}
                    >
                      <span>{p}교시</span>
                      <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.6 }}>{t.start}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 수업 정보 */}
            <div className="card radius-12 mb-16">
              <div className="card-body p-24">
                <div className="row gy-16">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold text-sm">과목명 <span className="text-danger">*</span></label>
                    {subjects.length > 0 ? (
                      <select className="form-select" value={form.subjectName} onChange={set("subjectName")} required>
                        <option value="">과목 선택</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input type="text" className="form-control" placeholder="예: 수학" value={form.subjectName} onChange={set("subjectName")} required />
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold text-sm">담당 반</label>
                    <input type="text" className="form-control" placeholder="예: 3학년 2반" value={form.className} onChange={set("className")} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold text-sm">장소</label>
                    <input type="text" className="form-control" placeholder="예: 3-2 교실" value={form.location} onChange={set("location")} />
                  </div>
                </div>
              </div>
            </div>

            {/* 반복 + 메모 */}
            <div className="card radius-12 mb-24">
              <div className="card-body p-24">
                <div className="row gy-16">
                  <div className={form.repeatType === "ONCE" ? "col-md-6" : "col-12"}>
                    <label className="form-label fw-semibold text-sm">반복</label>
                    <div className="d-flex gap-8">
                      {[
                        { value: "WEEKLY", label: "매주" },
                        { value: "BIWEEKLY", label: "2주마다" },
                        { value: "ONCE", label: "1회" },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, repeatType: opt.value }))}
                          style={{
                            padding: '6px 16px', borderRadius: 8,
                            border: form.repeatType === opt.value ? '2px solid #25A194' : '1px solid #e2e8f0',
                            background: form.repeatType === opt.value ? 'rgba(37,161,148,0.08)' : '#fff',
                            color: form.repeatType === opt.value ? '#25A194' : '#475569',
                            fontWeight: 500, fontSize: 13, cursor: 'pointer',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {form.repeatType === "ONCE" && (
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-sm">날짜</label>
                      <input type="date" className="form-control" value={form.specificDate} onChange={set("specificDate")} />
                    </div>
                  )}
                  <div className="col-12">
                    <label className="form-label fw-semibold text-sm">메모</label>
                    <textarea className="form-control" rows={2} placeholder="메모를 입력하세요 (선택)" value={form.memo} onChange={set("memo")} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* [woo] 오른쪽: 미리보기 */}
          <div className="col-lg-4">
            <div className="card radius-12" style={{ position: 'sticky', top: 24 }}>
              <div className="card-body p-24">
                <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 16, letterSpacing: '0.03em' }}>
                  미리보기
                </div>

                {/* 시간표 셀 미리보기 */}
                <div style={{
                  background: form.subjectName ? '#dbeafe' : '#f8fafc',
                  borderRadius: 10, padding: '20px 16px',
                  textAlign: 'center', minHeight: 100,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  border: '1px solid #e2e8f0',
                  marginBottom: 20,
                }}>
                  {form.subjectName ? (
                    <>
                      <div style={{ fontWeight: 700, fontSize: 16, color: '#1e40af' }}>{form.subjectName}</div>
                      {form.className && <div style={{ fontSize: 12, color: '#1e40af', opacity: 0.65, marginTop: 4 }}>{form.className}</div>}
                      {form.location && <div style={{ fontSize: 11, color: '#1e40af', opacity: 0.45, marginTop: 2 }}>{form.location}</div>}
                    </>
                  ) : (
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>과목명을 입력하면 여기에 표시됩니다</span>
                  )}
                </div>

                {/* 요약 정보 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>요일</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{DAY_LABELS[form.dayOfWeek]}요일</span>
                  </div>
                  {form.period && (
                    <div className="d-flex justify-content-between align-items-center">
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>교시</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{form.period}교시</span>
                    </div>
                  )}
                  {pt && (
                    <div className="d-flex justify-content-between align-items-center">
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>시간</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{pt.start} ~ {pt.end}</span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between align-items-center">
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>반복</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                      {{ WEEKLY: "매주", BIWEEKLY: "2주마다", ONCE: "1회" }[form.repeatType]}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* [woo] 등록 버튼 */}
            <div className="d-grid gap-8 mt-16">
              <button type="submit" className="btn btn-primary-600 radius-8 py-12" disabled={saving} style={{ fontSize: 15, fontWeight: 600 }}>
                {saving ? "추가 중..." : "일정 등록"}
              </button>
              <button type="button" className="btn btn-outline-neutral-300 radius-8 py-10" onClick={() => navigate("/teacher/schedule")}>
                취소
              </button>
            </div>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
