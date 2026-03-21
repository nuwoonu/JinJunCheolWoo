// [Joon] 2026-03-13 기능, 디자인 부분 1차 수정 완료
import { useEffect, useRef, useState } from "react";
import AdminLayout from '@/components/layout/admin/AdminLayout';
import admin from '@/api/adminApi';

const EVENT_TYPES = ["ACADEMIC", "HOLIDAY", "EXAM", "EVENT", "VACATION"];
const TYPE_LABELS: Record<string, string> = {
  ACADEMIC: "학사",
  HOLIDAY: "공휴일",
  EXAM: "시험",
  EVENT: "행사",
  VACATION: "방학",
};
const TYPE_COLORS_STYLE: Record<string, React.CSSProperties> = {
  ACADEMIC: { background: "rgba(37,161,148,0.12)", color: "#25A194", border: "1px solid rgba(37,161,148,0.3)" },
  HOLIDAY: { background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5" },
  EXAM: { background: "#fffbeb", color: "#d97706", border: "1px solid #fcd34d" },
  EVENT: { background: "#f5f3ff", color: "#7c3aed", border: "1px solid #c4b5fd" },
  VACATION: { background: "#eff6ff", color: "#2563eb", border: "1px solid #93c5fd" },
};
const EMPTY_FORM = {
  title: "",
  eventType: "ACADEMIC",
  start: "",
  end: "",
  targetGrade: "",
  description: "",
};

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildCalendar(year: number, month: number): (Date | null)[] {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++)
    cells.push(new Date(year, month - 1, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function eventOnDate(ev: any, date: Date) {
  const s = ev.start ? new Date(ev.start).setHours(0, 0, 0, 0) : null;
  const e = ev.end ? new Date(ev.end).setHours(23, 59, 59, 999) : null;
  if (!s || !e) return false;
  return date.getTime() >= s && date.getTime() <= e;
}

const th: React.CSSProperties = { padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#6b7280", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap", textAlign: "left" };
const td: React.CSSProperties = { padding: "12px 16px", fontSize: 13, color: "#374151", borderBottom: "1px solid #f3f4f6", verticalAlign: "middle", whiteSpace: "nowrap" };

export default function Schedule() {
  const now = new Date();
  const todayStr = toDateStr(now);

  const [events, setEvents] = useState<any[]>([]);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [view, setView] = useState<"month" | "list">("month");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const csvRef = useRef<HTMLInputElement>(null);

  const load = (y = year, m = month) => {
    const start = toDateStr(new Date(y, m - 1, 1));
    const end = toDateStr(new Date(y, m, 0));
    admin
      .get("/schedule", { params: { start, end } })
      .then((r) => setEvents(r.data ?? []));
  };

  useEffect(() => {
    load();
  }, []);

  const goMonth = (delta: number) => {
    let nm = month + delta,
      ny = year;
    if (nm < 1) {
      nm = 12;
      ny--;
    }
    if (nm > 12) {
      nm = 1;
      ny++;
    }
    setMonth(nm);
    setYear(ny);
    load(ny, nm);
  };

  const goToday = () => {
    const ny = now.getFullYear(),
      nm = now.getMonth() + 1;
    setYear(ny);
    setMonth(nm);
    load(ny, nm);
  };

  const openCreate = (dateStr = "") => {
    setForm({ ...EMPTY_FORM, start: dateStr, end: dateStr });
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (ev: any) => {
    setForm({
      title: ev.title,
      eventType: ev.eventType,
      start: ev.start?.split("T")[0] ?? "",
      end: ev.end?.split("T")[0] ?? "",
      targetGrade: ev.targetGrade ?? "",
      description: ev.description ?? "",
    });
    setEditId(ev.id);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, targetGrade: form.targetGrade || null };
    if (editId !== null) await admin.put(`/schedule/${editId}`, payload);
    else await admin.post("/schedule", payload);
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 일정을 삭제하시겠습니까?")) return;
    await admin.delete(`/schedule/${id}`);
    load();
  };

  const exportCsv = () => {
    const rows = events
      .map(
        (e: any) =>
          `${e.title},${e.eventType},${e.start?.split("T")[0]},${e.end?.split("T")[0]},${e.targetGrade ?? "전체"}`,
      )
      .join("\n");
    const blob = new Blob([`일정명,유형,시작일,종료일,대상학년\n${rows}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `학사일정_${year}년${month}월.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      await admin.post("/schedule/import-csv", fd);
      alert("일정이 일괄 등록되었습니다.");
      load();
    } catch (err: any) {
      alert(`등록 실패: ${err.response?.data ?? err.message}`);
    } finally {
      setImporting(false);
    }
    e.target.value = "";
  };

  const cells = buildCalendar(year, month);

  const navBtnStyle: React.CSSProperties = { padding: "6px 12px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", fontSize: 13, color: "#374151", cursor: "pointer" };

  return (
    <AdminLayout>
      {/* 등록/수정 모달 */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "var(--white)",
              borderRadius: 12,
              width: "100%",
              maxWidth: 480,
              margin: "0 16px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              <h6 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>
                {editId !== null ? "일정 수정" : "일정 등록"}
              </h6>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 18,
                  cursor: "pointer",
                  color: "var(--text-secondary-light)",
                }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ padding: "20px" }}>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-semibold">제목</label>
                    <input
                      className="form-control"
                      required
                      value={form.title}
                      onChange={(e) =>
                        setForm((f: any) => ({ ...f, title: e.target.value }))
                      }
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">유형</label>
                    <select
                      className="form-select"
                      value={form.eventType}
                      onChange={(e) =>
                        setForm((f: any) => ({
                          ...f,
                          eventType: e.target.value,
                        }))
                      }
                    >
                      {EVENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {TYPE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">대상 학년</label>
                    <select
                      className="form-select"
                      value={form.targetGrade}
                      onChange={(e) =>
                        setForm((f: any) => ({
                          ...f,
                          targetGrade: e.target.value,
                        }))
                      }
                    >
                      <option value="">전체</option>
                      <option value="1">1학년</option>
                      <option value="2">2학년</option>
                      <option value="3">3학년</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">시작일</label>
                    <input
                      type="date"
                      className="form-control"
                      required
                      value={form.start}
                      onChange={(e) =>
                        setForm((f: any) => ({ ...f, start: e.target.value }))
                      }
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">종료일</label>
                    <input
                      type="date"
                      className="form-control"
                      required
                      value={form.end}
                      onChange={(e) =>
                        setForm((f: any) => ({ ...f, end: e.target.value }))
                      }
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">설명</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={form.description}
                      onChange={(e) =>
                        setForm((f: any) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  padding: "12px 20px",
                  borderTop: "1px solid var(--border-color)",
                }}
              >
                {editId !== null && (
                  <button
                    type="button"
                    style={{ padding: "7px 16px", background: "#fff", border: "1px solid #ef4444", borderRadius: 8, fontSize: 14, color: "#ef4444", cursor: "pointer", marginRight: "auto" }}
                    onClick={() => {
                      handleDelete(editId!);
                      setShowModal(false);
                    }}
                  >
                    삭제
                  </button>
                )}
                <button
                  type="button"
                  style={{ padding: "7px 16px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, color: "#374151", cursor: "pointer" }}
                  onClick={() => setShowModal(false)}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{ padding: "7px 16px", background: "linear-gradient(135deg, #25A194, #1a7a6e)", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}
                >
                  {editId !== null ? "수정" : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {importing && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              className="spinner-border text-light"
              style={{ width: "3rem", height: "3rem" }}
            />
            <h5 style={{ color: "#fff", marginTop: 12 }}>일정 데이터를 등록 중입니다...</h5>
          </div>
        </div>
      )}
      <input
        type="file"
        ref={csvRef}
        accept=".csv"
        style={{ display: "none" }}
        onChange={importCsv}
      />

      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h5 style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>학사 일정 관리</h5>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
            학년도별 학사 일정을 등록하고 관리합니다.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            style={{ padding: "9px 16px", background: "#6b7280", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, color: "#fff", cursor: "pointer" }}
            onClick={exportCsv}
          >
            <i className="bi bi-file-earmark-arrow-down" /> CSV 내보내기
          </button>
          <button
            style={{ padding: "9px 16px", background: "#22c55e", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, color: "#fff", cursor: "pointer" }}
            onClick={() => csvRef.current?.click()}
          >
            <i className="bi bi-file-earmark-spreadsheet" /> CSV 일괄 등록
          </button>
          <button
            style={{ padding: "9px 20px", background: "linear-gradient(135deg, #25A194, #1a7a6e)", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}
            onClick={() => openCreate()}
          >
            <i className="bi bi-plus-lg" /> 일정 등록
          </button>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        {/* 네비게이션: 간격 및 정렬 개선 */}
        <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
          {/* 1. 좌측 (월 이동 및 오늘 버튼) */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <div style={{ display: "flex" }}>
              <button
                style={navBtnStyle}
                onClick={() => goMonth(-1)}
              >
                <i className="bi bi-chevron-left" />
              </button>
              <button
                style={navBtnStyle}
                onClick={() => goMonth(1)}
              >
                <i className="bi bi-chevron-right" />
              </button>
            </div>
            <button
              style={navBtnStyle}
              onClick={goToday}
            >
              Today
            </button>
          </div>

          {/* 2. 중앙 (현재 년/월 타이틀) */}
          <div style={{ textAlign: "center", flex: 1 }}>
            <h5 style={{ margin: 0, fontWeight: 700, fontSize: 18, color: "#25A194" }}>
              {year}년 {month}월
            </h5>
          </div>

          {/* 3. 우측 (Month / List 토글 버튼) */}
          <div style={{ display: "flex", justifyContent: "flex-end", flex: 1 }}>
            <div style={{ display: "flex" }}>
              <button
                style={view === "month"
                  ? { ...navBtnStyle, background: "#25A194", color: "#fff", border: "1px solid #25A194" }
                  : navBtnStyle}
                onClick={() => setView("month")}
              >
                Month
              </button>
              <button
                style={view === "list"
                  ? { ...navBtnStyle, background: "#25A194", color: "#fff", border: "1px solid #25A194" }
                  : navBtnStyle}
                onClick={() => setView("list")}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* 캘린더 뷰 */}
        {view === "month" ? (
          <div>
            {/* 요일 헤더 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              {DAYS.map((d, i) => (
                <div
                  key={d}
                  style={{
                    textAlign: "center",
                    padding: "8px 0",
                    fontSize: 13,
                    fontWeight: 600,
                    color: i === 0 ? "#dc3545" : i === 6 ? "#0d6efd" : "#6c757d",
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}
            >
              {cells.map((date, idx) => {
                if (!date) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      style={{
                        minHeight: 95,
                        borderRight: "1px solid rgba(0,0,0,0.05)",
                        borderBottom: "1px solid rgba(0,0,0,0.05)",
                        background: "var(--bg-neutral-50, #f8f9fa)",
                      }}
                    />
                  );
                }
                const ds = toDateStr(date);
                const isToday = ds === todayStr;
                const dow = date.getDay();
                const dayEvents = events.filter((ev) => eventOnDate(ev, date));

                return (
                  <div
                    key={ds}
                    style={{
                      minHeight: 95,
                      borderRight: "1px solid rgba(0,0,0,0.05)",
                      borderBottom: "1px solid rgba(0,0,0,0.05)",
                      background: isToday
                        ? "rgba(var(--primary-rgb), 0.05)"
                        : "transparent",
                      cursor: "pointer",
                    }}
                    onClick={() => openCreate(ds)}
                  >
                    {/* 날짜 숫자 */}
                    <div className="px-12 pt-8">
                      <a
                        href="#"
                        className="text-decoration-none fw-bold"
                        style={{
                          fontSize: "0.8rem",
                          color: isToday
                            ? "var(--text-primary-light)"
                            : dow === 0
                              ? "#dc3545"
                              : dow === 6
                                ? "#0d6efd"
                                : "var(--text-primary-light)",
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openCreate(ds);
                        }}
                      >
                        {date.getDate()}일
                      </a>
                    </div>

                    {/* 이벤트 뱃지 */}
                    <div className="px-6 mt-4">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <div
                          key={ev.id}
                          style={{ fontSize: "0.68rem", cursor: "pointer", lineHeight: "1.4", borderRadius: 4, padding: "2px 6px", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...(TYPE_COLORS_STYLE[ev.eventType] ?? {}) }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(ev);
                          }}
                          title={ev.title}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div
                          style={{ color: "#6c757d", paddingLeft: 4, fontSize: "0.7rem" }}
                        >
                          +{dayEvents.length - 3}개 더
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* 리스트 뷰 */
          <div style={{ padding: 16 }}>
            <div className="table-responsive">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>제목</th>
                    <th style={th}>유형</th>
                    <th style={th}>시작일</th>
                    <th style={th}>종료일</th>
                    <th style={th}>대상 학년</th>
                    <th style={th}>설명</th>
                    <th style={{ ...th, textAlign: "right" }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev: any) => (
                    <tr key={ev.id}>
                      <td style={{ ...td, fontWeight: 600 }}>{ev.title}</td>
                      <td style={td}>
                        <span style={{ ...TYPE_COLORS_STYLE[ev.eventType], borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 500 }}>
                          {TYPE_LABELS[ev.eventType] ?? ev.eventType}
                        </span>
                      </td>
                      <td style={td}>{ev.start?.split("T")[0]}</td>
                      <td style={td}>{ev.end?.split("T")[0]}</td>
                      <td style={td}>
                        {ev.targetGrade ? `${ev.targetGrade}학년` : "전체"}
                      </td>
                      <td style={{ ...td, color: "#9ca3af", fontSize: 12 }}>{ev.description}</td>
                      <td style={{ ...td, textAlign: "right" }}>
                        <button
                          style={{ padding: "5px 12px", background: "#fff", border: "1px solid #22c55e", borderRadius: 6, fontSize: 13, color: "#22c55e", cursor: "pointer", marginRight: 8 }}
                          onClick={() => openEdit(ev)}
                        >
                          수정
                        </button>
                        <button
                          style={{ padding: "5px 12px", background: "#fff", border: "1px solid #ef4444", borderRadius: 6, fontSize: 13, color: "#ef4444", cursor: "pointer" }}
                          onClick={() => handleDelete(ev.id)}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                  {events.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ ...td, textAlign: "center", padding: "40px 16px", color: "#9ca3af" }}>
                        이 달의 일정이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
