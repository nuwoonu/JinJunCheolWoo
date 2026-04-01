import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "@/api/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";

// [woo] /teacher/schedule/edit/:id - 수업 일정 수정 (TimetableApp에서 링크)

const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
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

export default function ScheduleEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/teacher/schedule/${id}`)
      .then((res) => {
        const s = res.data;
        setForm({
          dayOfWeek: s.dayOfWeek,
          period: s.period != null ? String(s.period) : "",
          startTime: s.startTime ?? "",
          endTime: s.endTime ?? "",
          subjectName: s.subjectName ?? "",
          className: s.className ?? "",
          location: s.location ?? "",
          repeatType: s.repeatType,
          specificDate: s.specificDate ?? "",
          memo: s.memo ?? "",
        });
      })
      .catch(() => navigate("/teacher/schedule"))
      .finally(() => setLoading(false));
  }, [id]);

  const set =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => (f ? { ...f, [field]: e.target.value } : f));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.subjectName.trim()) {
      setError("과목명은 필수입니다.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.put(`/teacher/schedule/${id}`, {
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
      setError("일정 수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-48 text-secondary-light">불러오는 중...</div>
      </DashboardLayout>
    );
  }

  if (!form) return null;

  return (
    <DashboardLayout>
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">수업 일정</h6>
          <p className="text-neutral-600 mt-4 mb-0">일정 수정</p>
        </div>
      </div>

      <div className="card radius-12" style={{ maxWidth: 720 }}>
        <div className="card-header py-16 px-24 border-bottom">
          <h6 className="mb-0">수업 일정 수정</h6>
        </div>
        <div className="card-body p-24">
          {error && <div className="alert alert-danger radius-8 mb-16">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="row gy-16">
              <div className="col-md-6">
                <label className="form-label fw-semibold text-sm">요일 *</label>
                <select className="form-select" value={form.dayOfWeek} onChange={set("dayOfWeek")}>
                  {DAY_ORDER.map((d) => (
                    <option key={d} value={d}>
                      {DAY_LABELS[d]}요일
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold text-sm">교시</label>
                <input
                  type="number"
                  className="form-control"
                  min={1}
                  max={10}
                  placeholder="예: 1"
                  value={form.period}
                  onChange={set("period")}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold text-sm">시작 시간</label>
                <input type="time" className="form-control" value={form.startTime} onChange={set("startTime")} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold text-sm">종료 시간</label>
                <input type="time" className="form-control" value={form.endTime} onChange={set("endTime")} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold text-sm">과목명 *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="예: 수학"
                  value={form.subjectName}
                  onChange={set("subjectName")}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold text-sm">담당 반</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="예: 3학년 2반"
                  value={form.className}
                  onChange={set("className")}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold text-sm">장소</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="예: 3-2 교실"
                  value={form.location}
                  onChange={set("location")}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold text-sm">반복</label>
                <select className="form-select" value={form.repeatType} onChange={set("repeatType")}>
                  <option value="WEEKLY">매주</option>
                  <option value="ONCE">1회</option>
                  <option value="BIWEEKLY">2주마다</option>
                </select>
              </div>
              {form.repeatType === "ONCE" && (
                <div className="col-12">
                  <label className="form-label fw-semibold text-sm">날짜 (1회성)</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.specificDate}
                    onChange={set("specificDate")}
                  />
                </div>
              )}
              <div className="col-12">
                <label className="form-label fw-semibold text-sm">메모</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="메모 (선택)"
                  value={form.memo}
                  onChange={set("memo")}
                />
              </div>
            </div>

            <div className="d-flex gap-8 mt-24">
              <button
                type="button"
                className="btn btn-outline-neutral-300 radius-8"
                onClick={() => navigate("/teacher/schedule")}
              >
                취소
              </button>
              <button type="submit" className="btn btn-primary-600 radius-8" disabled={saving}>
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
