import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../../../api/auth";
import { useAuth } from "../../../contexts/AuthContext";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import {
  TIME_SLOTS,
  TIME_MAP,
  TIME_LABEL,
  CONSULTATION_TYPE_LABEL,
  normalizeTime,
  getMonday,
  addDays,
  fmt,
  fmtDisplay,
} from "./consultationUtils";

// [soojin] 상담 예약 확인 - PARENT: 내 예약 목록, TEACHER: 전체 예약 관리 (일정 조정 + 확정) + 상담 일정 캘린더

interface ReservationItem {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  writerName: string;
  content: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  studentName?: string;
  studentNumber?: string;
  createDate?: string;
  consultationType?: string;
}

interface CalendarReservation {
  id?: number;
  date: string;
  startTime: string;
  endTime: string;
  writerName: string;
  content?: string;
  status?: string;
  studentName?: string;
  studentNumber?: string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  PENDING: { label: "대기", bg: "#fff3cd", text: "#856404" },
  CONFIRMED: { label: "확정", bg: "#d4edda", text: "#155724" },
  CANCELLED: { label: "취소", bg: "#f8d7da", text: "#721c24" },
  COMPLETED: { label: "완료", bg: "#e2e3e5", text: "#383d41" },
};

const STATUS_ORDER: Record<string, number> = { PENDING: 0, CONFIRMED: 1, COMPLETED: 2, CANCELLED: 3 };

export default function ConsultationList() {
  const { user } = useAuth();
  const isParent = user?.role === "PARENT";
  const isTeacher = user?.role === "TEACHER";

  const [items, setItems] = useState<ReservationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  // [soojin] 교사 일정 조정 모달 상태 (목록용)
  const [adjusting, setAdjusting] = useState<ReservationItem | null>(null);
  const [adjDate, setAdjDate] = useState("");
  const [adjStart, setAdjStart] = useState("");
  const [adjEnd, setAdjEnd] = useState("");
  const [confirming, setConfirming] = useState(false);

  // [soojin] 교사 캘린더 상태
  const [monday, setMonday] = useState(() => getMonday(new Date()));
  const [calendarReservations, setCalendarReservations] = useState<CalendarReservation[]>([]);
  const [calAdjusting, setCalAdjusting] = useState<CalendarReservation | null>(null);
  const [calAdjDate, setCalAdjDate] = useState("");
  const [calAdjStart, setCalAdjStart] = useState("");
  const [calAdjEnd, setCalAdjEnd] = useState("");
  const [calAdjSaving, setCalAdjSaving] = useState(false);

  const weekDates = useMemo(() => Array.from({ length: 5 }, (_, i) => addDays(monday, i)), [monday]);
  const startStr = fmt(monday);
  const endStr = fmt(addDays(monday, 4));

  const fetchList = useCallback(() => {
    setLoading(true);
    const childId = isParent ? Number(sessionStorage.getItem("selectedChildId")) || null : null;
    const params = childId ? `?studentUserUid=${childId}` : "";
    api
      .get(`/consultation/reservations/my${params}`)
      .then((res) => {
        const list: ReservationItem[] = Array.isArray(res.data) ? res.data : [];
        setItems(
          list.map((r) => ({
            ...r,
            startTime: r.startTime ? r.startTime.substring(0, 5) : r.startTime,
            endTime: r.endTime ? r.endTime.substring(0, 5) : r.endTime,
          })),
        );
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [isParent]);

  const fetchCalendarReservations = useCallback(() => {
    api
      .get(`/consultation/reservations?startDate=${startStr}&endDate=${endStr}`)
      .then((res) => {
        const list: CalendarReservation[] = Array.isArray(res.data) ? res.data : [];
        setCalendarReservations(
          list.map((r) => ({
            ...r,
            startTime: normalizeTime(r.startTime),
            endTime: normalizeTime(r.endTime),
          })),
        );
      })
      .catch(() => {});
  }, [startStr, endStr]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (!isTeacher) return;
    fetchCalendarReservations();
  }, [fetchCalendarReservations, isTeacher]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const PAGE_SIZE = 6;

  // 대기중 → 확정 → 완료 → 취소 순, 같은 상태 내에서는 날짜 오름차순
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const statusDiff = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
      if (statusDiff !== 0) return statusDiff;
      return a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime);
    });
  }, [items]);

  const filtered = filter === "ALL" ? sorted : sorted.filter((i) => i.status === filter);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  // 취소 등으로 아이템 수 감소 시 현재 페이지가 범위 초과하면 마지막 페이지로 이동
  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  const handleCancel = async (id: number) => {
    if (!confirm("상담 일정을 취소하시겠습니까?")) return;
    try {
      await api.delete(`/consultation/reservations/${id}`);
      fetchList();
    } catch {
      alert("취소에 실패했습니다.");
    }
  };

  // [soojin] 완료 처리 (교사, 지난 CONFIRMED)
  const handleComplete = async (id: number) => {
    if (!confirm("상담을 완료 처리하시겠습니까?")) return;
    try {
      await api.patch(`/consultation/reservations/${id}/complete`);
      fetchList();
      fetchCalendarReservations();
    } catch {
      alert("완료 처리에 실패했습니다.");
    }
  };

  // [soojin] 교사 취소 (지난 예약 정리)
  const handleTeacherCancel = async (id: number) => {
    if (!confirm("상담 일정을 취소 처리하시겠습니까?")) return;
    try {
      await api.patch(`/consultation/reservations/${id}/cancel`);
      fetchList();
      fetchCalendarReservations();
    } catch {
      alert("취소 처리에 실패했습니다.");
    }
  };

  // [soojin] 바로 확정 (일정 변경 없이)
  const handleQuickConfirm = async (id: number) => {
    try {
      await api.patch(`/consultation/reservations/${id}/confirm`);
      fetchList();
      fetchCalendarReservations();
    } catch {
      alert("확정에 실패했습니다.");
    }
  };

  // [soojin] 일정 조정 모달 열기 (목록)
  const openAdjustModal = (item: ReservationItem) => {
    setAdjusting(item);
    setAdjDate(item.date);
    setAdjStart(item.startTime);
    setAdjEnd(item.endTime);
  };

  // [soojin] 일정 조정 후 확정 (목록)
  const handleAdjustConfirm = async () => {
    if (!adjusting) return;
    setConfirming(true);
    try {
      await api.patch(`/consultation/reservations/${adjusting.id}/confirm`, {
        date: adjDate,
        startTime: adjStart,
        endTime: adjEnd,
      });
      setAdjusting(null);
      fetchList();
      fetchCalendarReservations();
    } catch {
      alert("확정에 실패했습니다.");
    } finally {
      setConfirming(false);
    }
  };

  // [soojin] 캘린더 예약 클릭 → 일정 조정 모달
  const handleCalReservationClick = (reservation: CalendarReservation) => {
    if (!reservation.id) return;
    setCalAdjusting(reservation);
    setCalAdjDate(reservation.date);
    setCalAdjStart(reservation.startTime);
    setCalAdjEnd(reservation.endTime);
  };

  // [soojin] 캘린더 일정 변경 저장
  const handleCalAdjustSave = async () => {
    if (!calAdjusting?.id) return;
    setCalAdjSaving(true);
    try {
      await api.patch(`/consultation/reservations/${calAdjusting.id}/confirm`, {
        date: calAdjDate,
        startTime: calAdjStart,
        endTime: calAdjEnd,
      });
      setCalAdjusting(null);
      fetchList();
      fetchCalendarReservations();
    } catch {
      alert("일정 변경에 실패했습니다.");
    } finally {
      setCalAdjSaving(false);
    }
  };

  const reservationMap = useMemo(() => {
    const map: Record<string, CalendarReservation> = {};
    for (const r of calendarReservations) {
      if (r.status !== "CONFIRMED") continue;
      map[`${r.date}_${r.startTime}`] = r;
    }
    return map;
  }, [calendarReservations]);

  const pagedItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = {
    ALL: items.length,
    PENDING: items.filter((i) => i.status === "PENDING").length,
    CONFIRMED: items.filter((i) => i.status === "CONFIRMED").length,
    COMPLETED: items.filter((i) => i.status === "COMPLETED").length,
    CANCELLED: items.filter((i) => i.status === "CANCELLED").length,
  };

  const rangeLabel = `${monday.getFullYear()}년 ${monday.getMonth() + 1}월 ${monday.getDate()}일 - ${addDays(monday, 4).getDate()}일`;

  return (
    <DashboardLayout>
      <div style={{ background: "#fff", borderRadius: 16, padding: "24px" }}>
        {/* 헤더 + 필터 */}
        <div className="d-flex align-items-center justify-content-between mb-24">
          <div className="d-flex align-items-center gap-10">
            <div>
              <h5 className="fw-bold mb-0">{isTeacher ? "상담 신청 목록" : "상담 신청 확인"}</h5>
              {isTeacher && (
                <p className="text-sm text-secondary-light mb-0 mt-4">
                  상담 확정 버튼을 누르면 상담 일정에 표시됩니다.
                </p>
              )}
            </div>
          </div>
          <div
            className="d-flex align-items-center"
            style={{
              background: "#f0f0f0",
              borderRadius: 10,
              padding: "6px 6px",
              gap: 4,
            }}
          >
            {(
              [
                { key: "ALL", label: "전체" },
                { key: "PENDING", label: "대기" },
                { key: "CONFIRMED", label: "확정" },
                { key: "COMPLETED", label: "완료" },
                { key: "CANCELLED", label: "취소" },
              ] as const
            ).map((s) => (
              <button
                key={s.key}
                onClick={() => setFilter(s.key)}
                style={{
                  border: "none",
                  borderRadius: 8,
                  padding: "7px 14px",
                  fontSize: 14,
                  fontWeight: filter === s.key ? 600 : 400,
                  background: filter === s.key ? "#fff" : "transparent",
                  color: filter === s.key ? "#000" : "#666",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  boxShadow: filter === s.key ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
                }}
              >
                {s.label} {counts[s.key]}
              </button>
            ))}
          </div>
          {isParent && (
            <Link
              to="/consultation/reservation"
              className="btn text-white px-16 py-6 ms-8"
              style={{ background: "#2ecc71", borderRadius: 20, fontSize: 13 }}
            >
              <i className="ri-add-line me-4" />새 신청
            </Link>
          )}
        </div>

        {/* 예약 목록 */}
        {loading ? (
          <div className="text-center py-48 text-secondary-light">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
            <div className="card-body text-center py-48">
              <i className="ri-calendar-close-line text-neutral-300" style={{ fontSize: 48 }} />
              <p className="text-secondary-light mt-12 mb-0">신청 내역이 없습니다</p>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {pagedItems.map((item) => {
              const st = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.PENDING;
              const dateObj = new Date(item.date + "T00:00:00");
              const dayLabel = ["일", "월", "화", "수", "목", "금", "토"][dateObj.getDay()];
              const dateDisplay = `${dateObj.getFullYear()}. ${dateObj.getMonth() + 1}. ${dateObj.getDate()}. (${dayLabel})`;
              const timeDisplay = `${TIME_LABEL[item.startTime] ?? item.startTime} ~ ${TIME_LABEL[item.endTime] ?? item.endTime}`;
              const nameDisplay = item.studentName
                ? `${item.studentName}${item.studentNumber ? ` (${item.studentNumber.replace(/^(\d+)-(\d+)-(\d+)$/, "$1학년 $2반 $3번")})` : ""}`
                : item.writerName;
              const isPast = new Date(`${item.date}T${item.endTime}:00`) < new Date();

              return (
                <div key={item.id} style={{ width: "calc(50% - 8px)" }}>
                  <div
                    className="card h-100"
                    style={{ borderRadius: 14, border: "1px solid #e5e7eb", boxShadow: "none", overflow: "hidden" }}
                  >
                    <div style={{ display: "flex", height: "100%" }}>
                      {/* 왼쪽 증명사진 패널 (3:4 비율) */}
                      <div
                        className="d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: 130, minHeight: 147, background: "#2ecc71" }}
                      >
                        <i className="ri-user-line text-white" style={{ fontSize: 36 }} />
                      </div>

                      {/* 오른쪽 정보 */}
                      <div className="flex-grow-1 min-width-0" style={{ padding: "16px 16px 16px 24px" }}>
                        {/* 이름+배지(왼쪽) / 교사 액션 버튼(오른쪽) */}
                        <div className="d-flex align-items-start justify-content-between gap-8 mb-6">
                          <div className="d-flex align-items-center gap-8 flex-wrap min-width-0">
                            <span className="fw-semibold text-truncate">{nameDisplay}</span>
                            <span
                              className="badge px-8 py-4 rounded-pill text-xs flex-shrink-0"
                              style={{ background: st.bg, color: st.text }}
                            >
                              {st.label}
                            </span>
                            {item.consultationType && (
                              <span
                                className="badge px-8 py-4 rounded-pill text-xs flex-shrink-0"
                                style={{ background: "#e3f2fd", color: "#1565c0" }}
                              >
                                {CONSULTATION_TYPE_LABEL[item.consultationType] ?? item.consultationType}
                              </span>
                            )}
                          </div>
                          {isTeacher && item.status === "PENDING" && !isPast && (
                            <div className="d-flex gap-6 flex-shrink-0">
                              <button
                                className="btn btn-sm btn-outline-primary px-12 py-4"
                                onClick={() => openAdjustModal(item)}
                              >
                                일정 변경
                              </button>
                              <button
                                className="btn btn-sm text-white px-12 py-4"
                                style={{ background: "#2ecc71" }}
                                onClick={() => handleQuickConfirm(item.id)}
                              >
                                확정
                              </button>
                            </div>
                          )}
                          {isTeacher && item.status === "CONFIRMED" && isPast && (
                            <div className="d-flex gap-6 flex-shrink-0">
                              <button
                                className="btn btn-sm btn-outline-danger px-12 py-4"
                                onClick={() => handleTeacherCancel(item.id)}
                              >
                                취소
                              </button>
                              <button
                                className="btn btn-sm text-white px-12 py-4"
                                style={{ background: "#6c757d" }}
                                onClick={() => handleComplete(item.id)}
                              >
                                완료
                              </button>
                            </div>
                          )}
                          {isTeacher && item.status === "PENDING" && isPast && (
                            <div className="d-flex gap-6 flex-shrink-0">
                              <button
                                className="btn btn-sm btn-outline-danger px-12 py-4"
                                onClick={() => handleTeacherCancel(item.id)}
                              >
                                취소
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-secondary-light mb-4">
                          <i className="ri-calendar-line me-4" />
                          {dateDisplay}
                        </div>
                        <div className="text-sm text-secondary-light mb-6">
                          <i className="ri-time-line me-4" />
                          {timeDisplay}
                        </div>
                        {item.content && (
                          <div className="text-sm" style={{ color: "#555" }}>
                            {item.content.length > 60 ? item.content.slice(0, 60) + "..." : item.content}
                          </div>
                        )}
                        {item.status === "PENDING" && isParent && (
                          <div className="mt-10">
                            <button
                              className="btn btn-sm btn-outline-danger px-12 py-4"
                              onClick={() => handleCancel(item.id)}
                            >
                              취소
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-center gap-16 mt-20">
            {Array.from({ length: totalPages }, (_, i) => (
              <span
                key={i + 1}
                onClick={() => setPage(i + 1)}
                style={{
                  fontSize: 14,
                  fontWeight: page === i + 1 ? 700 : 400,
                  color: page === i + 1 ? "#2ecc71" : "#888",
                  cursor: "pointer",
                }}
              >
                {i + 1}
              </span>
            ))}
          </div>
        )}

        {/* [soojin] 교사 전용: 상담 일정 캘린더 */}
        {isTeacher && (
          <div className="mt-32">
            <div className="mb-16">
              <h5 className="fw-bold mb-0">상담 일정</h5>
              <p className="text-sm text-secondary-light mb-0 mt-4">확정된 상담 클릭 시 일정 변경이 가능합니다.</p>
            </div>

            <div className="card" style={{ borderRadius: 16, border: "1px solid #e5e7eb", boxShadow: "none" }}>
              <div className="card-body p-24">
                {/* 주간 네비게이션 */}
                <div className="d-flex align-items-center justify-content-between mb-16">
                  <div style={{ width: 80 }} />
                  <div className="d-flex align-items-center gap-8">
                    <button
                      className="btn btn-sm btn-outline-secondary px-10 py-4"
                      onClick={() => setMonday((prev) => addDays(prev, -7))}
                    >
                      ‹
                    </button>
                    <span className="fw-semibold text-lg">{rangeLabel}</span>
                    <button
                      className="btn btn-sm btn-outline-secondary px-10 py-4"
                      onClick={() => setMonday((prev) => addDays(prev, 7))}
                    >
                      ›
                    </button>
                  </div>
                  <div style={{ width: 80 }} className="d-flex justify-content-end">
                    <button
                      className="btn btn-sm btn-outline-secondary px-12 py-4"
                      onClick={() => setMonday(getMonday(new Date()))}
                    >
                      오늘
                    </button>
                  </div>
                </div>

                {/* 주간 그리드 */}
                <div className="table-responsive">
                  <table className="table table-bordered mb-0 text-center" style={{ tableLayout: "fixed" }}>
                    <thead>
                      <tr style={{ background: "#f8f9fa" }}>
                        <th style={{ width: 90 }} className="py-12 text-sm fw-semibold text-center">
                          시간
                        </th>
                        {weekDates.map((d, i) => (
                          <th key={i} className="py-12 text-sm fw-semibold text-center">
                            {fmtDisplay(d)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {TIME_SLOTS.map((timeLabel) => {
                        const timeStr = TIME_MAP[timeLabel];
                        return (
                          <tr key={timeLabel}>
                            <td className="py-12 text-sm fw-medium" style={{ background: "#fafafa" }}>
                              {timeLabel}
                            </td>
                            {weekDates.map((d, i) => {
                              const dateStr = fmt(d);
                              const key = `${dateStr}_${timeStr}`;
                              const reservation = reservationMap[key];

                              if (reservation) {
                                return (
                                  <td
                                    key={i}
                                    style={{
                                      background: "#2ecc71",
                                      height: 48,
                                      verticalAlign: "middle",
                                      cursor: "pointer",
                                      padding: 0,
                                    }}
                                    onClick={() => handleCalReservationClick(reservation)}
                                  >
                                    <span className="text-white fw-semibold" style={{ fontSize: 12 }}>
                                      {reservation.studentName ?? reservation.writerName} 학부모
                                    </span>
                                  </td>
                                );
                              }

                              return <td key={i} style={{ height: 48, verticalAlign: "middle" }} />;
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 범례 */}
                <div className="d-flex align-items-center gap-20 mt-16 text-sm">
                  <span className="d-flex align-items-center gap-6">
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        border: "1px solid #dee2e6",
                        borderRadius: 4,
                        display: "inline-block",
                      }}
                    />
                    상담 가능
                  </span>
                  <span className="d-flex align-items-center gap-6">
                    <span
                      style={{ width: 16, height: 16, background: "#2ecc71", borderRadius: 4, display: "inline-block" }}
                    />
                    확정
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* [soojin] 교사 일정 조정 모달 (목록) */}
        {adjusting && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => setAdjusting(null)}
          >
            <div
              className="card border-0 shadow-lg"
              style={{ borderRadius: 16, width: 440, maxWidth: "90vw" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="card-body p-24">
                <div className="d-flex align-items-center justify-content-between mb-20">
                  <h6 className="fw-bold mb-0">일정 조정</h6>
                  <button
                    className="btn btn-sm p-0 border-0 bg-transparent"
                    onClick={() => setAdjusting(null)}
                    style={{ fontSize: 20 }}
                  >
                    <i className="ri-close-line" />
                  </button>
                </div>

                {/* 신청자 정보 */}
                <div className="p-12 mb-16 rounded-12" style={{ background: "#f8f9fa" }}>
                  <div className="text-sm">
                    <span className="fw-semibold">{adjusting.writerName}</span> (학부모)
                    {adjusting.studentName && <span className="text-secondary-light"> · {adjusting.studentName}</span>}
                  </div>
                  {adjusting.content && (
                    <div className="text-sm text-secondary-light mt-4">
                      {adjusting.content.length > 100 ? adjusting.content.slice(0, 100) + "..." : adjusting.content}
                    </div>
                  )}
                </div>

                {/* 원래 일정 */}
                <div className="mb-12">
                  <label className="form-label text-xs text-secondary-light fw-medium mb-4">원래 신청 일정</label>
                  <div className="text-sm fw-medium">
                    {adjusting.date} · {TIME_LABEL[adjusting.startTime] ?? adjusting.startTime} ~{" "}
                    {TIME_LABEL[adjusting.endTime] ?? adjusting.endTime}
                  </div>
                </div>

                <hr className="my-16" />

                {/* 조정 폼 */}
                <div className="mb-12">
                  <label className="form-label text-sm fw-medium">날짜</label>
                  <input
                    type="date"
                    className="form-control"
                    value={adjDate}
                    onChange={(e) => setAdjDate(e.target.value)}
                  />
                </div>
                <div className="row g-12 mb-20">
                  <div className="col-6">
                    <label className="form-label text-sm fw-medium">시작 시간</label>
                    <select
                      className="form-select"
                      value={adjStart}
                      onChange={(e) => {
                        setAdjStart(e.target.value);
                        const [h, m] = e.target.value.split(":").map(Number);
                        setAdjEnd(`${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
                      }}
                    >
                      <option value="09:00">오전 9시</option>
                      <option value="10:00">오전 10시</option>
                      <option value="11:00">오전 11시</option>
                      <option value="12:00">오후 12시</option>
                      <option value="13:00">오후 1시</option>
                      <option value="14:00">오후 2시</option>
                      <option value="15:00">오후 3시</option>
                      <option value="16:00">오후 4시</option>
                      <option value="17:00">오후 5시</option>
                      <option value="18:00">오후 6시</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label text-sm fw-medium">종료 시간</label>
                    <input type="text" className="form-control" readOnly value={adjEnd} />
                  </div>
                </div>

                <div className="d-flex gap-8">
                  <button className="btn btn-outline-secondary flex-fill py-10" onClick={() => setAdjusting(null)}>
                    취소
                  </button>
                  <button
                    className="btn text-white flex-fill py-10 fw-semibold"
                    style={{ background: "#2ecc71" }}
                    disabled={confirming}
                    onClick={handleAdjustConfirm}
                  >
                    {confirming ? "처리 중..." : "확정"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* [soojin] 교사 캘린더 일정 조정 모달 */}
        {calAdjusting && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => setCalAdjusting(null)}
          >
            <div
              className="card border-0 shadow-lg"
              style={{ borderRadius: 16, width: 440, maxWidth: "90vw" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="card-body p-24">
                <div className="d-flex align-items-center justify-content-between mb-20">
                  <h6 className="fw-bold mb-0">
                    <i className="ri-calendar-event-line text-primary me-8" />
                    일정 조정
                  </h6>
                  <button
                    className="btn btn-sm p-0 border-0 bg-transparent"
                    onClick={() => setCalAdjusting(null)}
                    style={{ fontSize: 20 }}
                  >
                    <i className="ri-close-line" />
                  </button>
                </div>

                {/* 예약 정보 */}
                <div className="p-12 mb-16 rounded-12" style={{ background: "#f8f9fa" }}>
                  <div className="text-sm">
                    <span className="fw-semibold">{calAdjusting.writerName}</span> (학부모)
                    {calAdjusting.studentName && (
                      <span className="text-secondary-light"> · {calAdjusting.studentName}</span>
                    )}
                  </div>
                  {calAdjusting.content && (
                    <div className="text-sm text-secondary-light mt-4">
                      {calAdjusting.content.length > 100
                        ? calAdjusting.content.slice(0, 100) + "..."
                        : calAdjusting.content}
                    </div>
                  )}
                </div>

                {/* 현재 일정 */}
                <div className="mb-12">
                  <label className="form-label text-xs text-secondary-light fw-medium mb-4">현재 확정 일정</label>
                  <div className="text-sm fw-medium">
                    {calAdjusting.date} · {TIME_LABEL[calAdjusting.startTime] ?? calAdjusting.startTime} ~{" "}
                    {TIME_LABEL[calAdjusting.endTime] ?? calAdjusting.endTime}
                  </div>
                </div>

                <hr className="my-16" />

                {/* 변경 폼 */}
                <div className="mb-12">
                  <label className="form-label text-sm fw-medium">날짜</label>
                  <input
                    type="date"
                    className="form-control"
                    value={calAdjDate}
                    onChange={(e) => setCalAdjDate(e.target.value)}
                  />
                </div>
                <div className="row g-12 mb-20">
                  <div className="col-6">
                    <label className="form-label text-sm fw-medium">시작 시간</label>
                    <select
                      className="form-select"
                      value={calAdjStart}
                      onChange={(e) => {
                        setCalAdjStart(e.target.value);
                        const [h, m] = e.target.value.split(":").map(Number);
                        setCalAdjEnd(`${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
                      }}
                    >
                      <option value="09:00">오전 9시</option>
                      <option value="10:00">오전 10시</option>
                      <option value="11:00">오전 11시</option>
                      <option value="12:00">오후 12시</option>
                      <option value="13:00">오후 1시</option>
                      <option value="14:00">오후 2시</option>
                      <option value="15:00">오후 3시</option>
                      <option value="16:00">오후 4시</option>
                      <option value="17:00">오후 5시</option>
                      <option value="18:00">오후 6시</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label text-sm fw-medium">종료 시간</label>
                    <input type="text" className="form-control" readOnly value={calAdjEnd} />
                  </div>
                </div>

                <div className="d-flex gap-8">
                  <button className="btn btn-outline-secondary flex-fill py-10" onClick={() => setCalAdjusting(null)}>
                    취소
                  </button>
                  <button
                    className="btn text-white flex-fill py-10 fw-semibold"
                    style={{ background: "#2ecc71" }}
                    disabled={calAdjSaving}
                    onClick={handleCalAdjustSave}
                  >
                    {calAdjSaving ? "처리 중..." : "일정 변경"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
