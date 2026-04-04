import { useEffect, useState, useMemo, useCallback } from "react";
import api from '@/shared/api/authApi';
import { useAuth } from '@/shared/contexts/AuthContext';
import DashboardLayout from '@/shared/components/layout/DashboardLayout';
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
} from '@/features/consultation/utils/consultationUtils';

// [soojin] 상담 예약 캘린더
// PARENT: 상담 신청 캘린더 + 폼 + 하단 예약 목록
// TEACHER: 확정 캘린더 + 클릭 시 일정 조정 모달

interface Reservation {
  id?: number;
  date: string;
  startTime: string;
  endTime: string;
  writerName: string;
  content?: string;
  status?: string;
  studentName?: string;
  studentNumber?: string;
  local?: boolean;
  isMine?: boolean;
}

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
  consultationType?: string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  PENDING: { label: "대기", bg: "#fff3cd", text: "#856404" },
  CONFIRMED: { label: "확정", bg: "#d4edda", text: "#155724" },
  CANCELLED: { label: "취소", bg: "#f8d7da", text: "#721c24" },
  COMPLETED: { label: "완료", bg: "#e2e3e5", text: "#383d41" },
};

interface ChildInfo {
  id: number;
  name: string;
  grade: number | null;
  classNum: number | null;
  number: number | null;
}

function endTimeOf(startTime: string): string {
  const [h, m] = startTime.split(":").map(Number);
  return `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function ConsultationReservation() {
  const { user } = useAuth();
  const isTeacher = user?.role === "TEACHER";
  const isParent = user?.role === "PARENT";

  const [monday, setMonday] = useState(() => getMonday(new Date()));
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selected, setSelected] = useState<{ date: string; time: string } | null>(null);
  const [content, setContent] = useState("");
  const [consultationType, setConsultationType] = useState<"VISIT" | "PHONE">("VISIT");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // PARENT: 대시보드에서 선택된 자녀 id
  const selectedChildId = isParent ? Number(sessionStorage.getItem("selectedChildId")) || null : null;

  // PARENT: 선택된 자녀 정보
  const [selectedChild, setSelectedChild] = useState<ChildInfo | null>(null);

  // PARENT: 예약 목록
  const [myItems, setMyItems] = useState<ReservationItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listFilter, setListFilter] = useState<string>("ALL");

  // TEACHER: 일정 조정 모달
  const [adjusting, setAdjusting] = useState<Reservation | null>(null);
  const [adjDate, setAdjDate] = useState("");
  const [adjStart, setAdjStart] = useState("");
  const [adjEnd, setAdjEnd] = useState("");
  const [adjSaving, setAdjSaving] = useState(false);

  const weekDates = useMemo(() => Array.from({ length: 5 }, (_, i) => addDays(monday, i)), [monday]);

  const startStr = fmt(monday);
  const endStr = fmt(addDays(monday, 4));

  const fetchMyList = useCallback(() => {
    if (!isParent) return;
    setListLoading(true);
    const params = selectedChildId ? `?studentUserUid=${selectedChildId}` : "";
    api
      .get(`/consultation/reservations/my${params}`)
      .then((res) => {
        const list: ReservationItem[] = Array.isArray(res.data) ? res.data : [];
        setMyItems(
          list.map((r) => ({
            ...r,
            startTime: r.startTime ? r.startTime.substring(0, 5) : r.startTime,
            endTime: r.endTime ? r.endTime.substring(0, 5) : r.endTime,
          })),
        );
      })
      .catch(() => setMyItems([]))
      .finally(() => setListLoading(false));
  }, [isParent, selectedChildId]);

  const handleCancel = async (id: number) => {
    if (!confirm("상담 일정을 취소하시겠습니까?")) return;
    try {
      await api.delete(`/consultation/reservations/${id}`);
      fetchMyList();
      fetchReservations();
    } catch {
      alert("취소에 실패했습니다.");
    }
  };

  const fetchReservations = useCallback(() => {
    const params = new URLSearchParams({ startDate: startStr, endDate: endStr });
    if (isParent && selectedChildId) params.append("studentUserUid", String(selectedChildId));
    api
      .get(`/consultation/reservations?${params.toString()}`)
      .then((res) => {
        const list: Reservation[] = Array.isArray(res.data) ? res.data : [];
        setReservations(
          list.map((r) => ({
            ...r,
            startTime: normalizeTime(r.startTime),
            endTime: normalizeTime(r.endTime),
          })),
        );
      })
      .catch(() => {});
  }, [startStr, endStr, isParent, selectedChildId]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  useEffect(() => {
    fetchMyList();
  }, [fetchMyList]);

  // 선택된 자녀 정보 fetch
  useEffect(() => {
    if (!isParent || !selectedChildId) return;
    api.get("/consultation/reservations/children").then((res) => {
      const list: ChildInfo[] = Array.isArray(res.data) ? res.data : [];
      const child = list.find((c) => c.id === selectedChildId) ?? null;
      setSelectedChild(child);
    }).catch(() => {});
  }, [isParent, selectedChildId]);

  const prevWeek = () => {
    setMonday((prev) => addDays(prev, -7));
    setSelected(null);
  };
  const nextWeek = () => {
    setMonday((prev) => addDays(prev, 7));
    setSelected(null);
  };
  const goToday = () => {
    setMonday(getMonday(new Date()));
    setSelected(null);
  };

  const reservationMap = useMemo(() => {
    const map: Record<string, Reservation> = {};
    for (const r of reservations) {
      if (r.status === "CANCELLED") continue; // 취소된 예약은 신청 가능으로 표시
      if (isTeacher && r.status !== "CONFIRMED") continue;
      map[`${r.date}_${r.startTime}`] = r;
    }
    return map;
  }, [reservations, isTeacher]);

  // PARENT: 셀 클릭 → 시간 선택
  const handleCellClick = (date: string, timeLabel: string) => {
    if (isTeacher) return;
    const timeStr = TIME_MAP[timeLabel];
    const key = `${date}_${timeStr}`;
    if (reservationMap[key]) return;
    const slotTime = new Date(date + "T00:00:00");
    slotTime.setHours(parseInt(timeStr.split(":")[0]), 0, 0, 0);
    if (slotTime < new Date()) return;
    if (selected?.date === date && selected?.time === timeStr) {
      setSelected(null);
    } else {
      setSelected({ date, time: timeStr });
    }
  };

  // TEACHER: 확정 예약 클릭 → 조정 모달
  const handleReservationClick = (reservation: Reservation) => {
    if (!isTeacher || !reservation.id) return;
    setAdjusting(reservation);
    setAdjDate(reservation.date);
    setAdjStart(reservation.startTime);
    setAdjEnd(reservation.endTime);
  };

  // TEACHER: 일정 조정 저장
  const handleAdjustSave = async () => {
    if (!adjusting?.id) return;
    setAdjSaving(true);
    try {
      await api.patch(`/consultation/reservations/${adjusting.id}/confirm`, {
        date: adjDate,
        startTime: adjStart,
        endTime: adjEnd,
      });
      setAdjusting(null);
      fetchReservations();
    } catch {
      alert("일정 변경에 실패했습니다.");
    } finally {
      setAdjSaving(false);
    }
  };

  const handleReserve = async () => {
    if (!selected) {
      alert("날짜와 시간을 선택해주세요.");
      return;
    }
    if (!content.trim()) {
      alert("상담 내용을 입력해주세요.");
      return;
    }
    setSaving(true);

    try {
      await api.post("/consultation/reservations", {
        date: selected.date,
        startTime: selected.time,
        endTime: endTimeOf(selected.time),
        content,
        studentUserUid: selectedChildId,
        consultationType,
      });
      setSelected(null);
      setContent("");
      setConsultationType("VISIT");
      setSuccessMsg("신청이 완료되었습니다!");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchReservations();
      fetchMyList();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "신청에 실패했습니다. 다시 시도해주세요.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const rangeLabel = `${monday.getFullYear()}년 ${monday.getMonth() + 1}월 ${monday.getDate()}일 - ${addDays(monday, 4).getDate()}일`;
  const confirmedCount = reservations.filter((r) => r.status === "CONFIRMED").length;
  const pendingCount = reservations.filter((r) => r.status === "PENDING").length;

  return (
    <DashboardLayout>
      <div style={{ background: "#fff", borderRadius: 16, padding: "24px" }}>
        {/* 헤더 */}
        <div className="d-flex align-items-center gap-12 mb-24">
          <div>
            <h5 className="fw-bold mb-4">{isTeacher ? "상담 일정" : "상담 신청"}</h5>
            <p className="text-secondary-light text-sm mb-0">
              {isTeacher
                ? "확정된 상담 날짜가 캘린더에 표시됩니다. 클릭하면 일정을 조정할 수 있습니다."
                : "원하시는 날짜와 시간을 선택해주세요"}
            </p>
          </div>
        </div>

        {successMsg && (
          <div
            className="alert d-flex align-items-center gap-8 mb-16 py-12 px-16"
            style={{ background: "#d4edda", border: "1px solid #c3e6cb", borderRadius: 12, color: "#155724" }}
          >
            <i className="ri-checkbox-circle-line" style={{ fontSize: 20 }} />
            <span className="fw-medium">{successMsg}</span>
          </div>
        )}

        {/* 교사: 통계 카드 */}
        {isTeacher && (
          <div className="row g-16 mb-20">
            <div className="col-6 col-md-3">
              <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
                <div className="card-body p-16 d-flex align-items-center gap-12">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle"
                    style={{ width: 40, height: 40, background: "#2ecc7118" }}
                  >
                    <i className="ri-checkbox-circle-line" style={{ fontSize: 18, color: "#2ecc71" }} />
                  </div>
                  <div>
                    <div className="text-xs text-secondary-light">이번 주 확정</div>
                    <div className="fw-bold text-lg">{confirmedCount}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
                <div className="card-body p-16 d-flex align-items-center gap-12">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle"
                    style={{ width: 40, height: 40, background: "#f0ad4e18" }}
                  >
                    <i className="ri-time-line" style={{ fontSize: 18, color: "#f0ad4e" }} />
                  </div>
                  <div>
                    <div className="text-xs text-secondary-light">대기</div>
                    <div className="fw-bold text-lg">{pendingCount}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="row g-20">
          <div className={isTeacher ? "col-12" : "col-lg-8 d-flex"}>
            <div className="card shadow-sm w-100" style={{ borderRadius: 16, border: "1px solid #e5e7eb" }}>
              <div className="card-body p-24">
                <h6 className="fw-semibold mb-16">상담 일정</h6>

                <div className="d-flex align-items-center justify-content-between mb-16">
                  <div style={{ width: 80 }} />
                  <div className="d-flex align-items-center gap-8">
                    <button className="btn btn-sm btn-outline-secondary px-10 py-4" onClick={prevWeek}>
                      ‹
                    </button>
                    <span className="fw-semibold text-lg">{rangeLabel}</span>
                    <button className="btn btn-sm btn-outline-secondary px-10 py-4" onClick={nextWeek}>
                      ›
                    </button>
                  </div>
                  <div style={{ width: 80 }} className="d-flex justify-content-end">
                    <button className="btn btn-sm btn-outline-secondary px-12 py-4" onClick={goToday}>
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
                              const isSelected = selected?.date === dateStr && selected?.time === timeStr;
                              const slotTime = new Date(dateStr + "T00:00:00");
                              slotTime.setHours(parseInt(timeStr.split(":")[0]), 0, 0, 0);
                              const isPastSlot = slotTime < new Date();

                              // [soojin] 3.png 참조: 예약 있으면 셀 전체를 채움
                              if (reservation) {
                                // 학부모: 내 자녀 예약이 아니면 신청 불가 표시
                                if (isParent && !reservation.isMine) {
                                  return (
                                    <td
                                      key={i}
                                      style={{
                                        background: "#f0f0f0",
                                        height: 48,
                                        verticalAlign: "middle",
                                        cursor: "default",
                                        padding: 0,
                                      }}
                                    />
                                  );
                                }
                                const label = isTeacher
                                  ? `${reservation.studentName ?? reservation.writerName} 학부모`
                                  : reservation.studentName;
                                return (
                                  <td
                                    key={i}
                                    style={{
                                      background: "#2ecc71",
                                      height: 48,
                                      verticalAlign: "middle",
                                      cursor: isTeacher ? "pointer" : "default",
                                      padding: 0,
                                    }}
                                    onClick={() => isTeacher && handleReservationClick(reservation)}
                                  >
                                    <span className="text-white fw-semibold" style={{ fontSize: 12 }}>
                                      {label}
                                    </span>
                                  </td>
                                );
                              }

                              return (
                                <td
                                  key={i}
                                  style={{
                                    height: 48,
                                    verticalAlign: "middle",
                                    background: isPastSlot ? "#f0f0f0" : isSelected ? "#fff9c4" : "",
                                    cursor: isTeacher || isPastSlot ? "default" : "pointer",
                                    transition: "background 0.15s",
                                  }}
                                  onClick={() => handleCellClick(dateStr, timeLabel)}
                                ></td>
                              );
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
                        background: "#f0f0f0",
                        border: "1px solid #dee2e6",
                        borderRadius: 4,
                        display: "inline-block",
                      }}
                    />
                    신청 불가
                  </span>
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
                    {isTeacher ? "확정" : "신청"}
                  </span>
                  {isParent && (
                    <span className="d-flex align-items-center gap-6">
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          background: "#fff9c4",
                          border: "1px solid #f0e68c",
                          borderRadius: 4,
                          display: "inline-block",
                        }}
                      />
                      선택
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* PARENT: 오른쪽 예약 폼 */}
          {isParent && (
            <div className="col-lg-4 d-flex">
              <div className="card shadow-sm w-100" style={{ borderRadius: 16, border: "1px solid #e5e7eb" }}>
                <div className="card-body p-24 d-flex flex-column">
                  <h6 className="fw-semibold mb-20">신청 정보</h6>

                  {selectedChild && (
                    <div className="mb-16">
                      <label className="form-label text-sm fw-medium">자녀 정보</label>
                      <div
                        className="form-control"
                        style={{ background: "#f8f9fa", color: "#555", cursor: "default" }}
                      >
                        {selectedChild.name}
                        {selectedChild.grade != null
                          ? ` (${selectedChild.grade}학년 ${selectedChild.classNum}반 ${selectedChild.number}번)`
                          : ""}
                      </div>
                    </div>
                  )}

                  <div className="mb-16">
                    <label className="form-label text-sm fw-medium">날짜</label>
                    <input
                      type="text"
                      className="form-control"
                      readOnly
                      placeholder="달력 선택"
                      value={selected?.date?.replace(/-/g, "/") ?? ""}
                    />
                  </div>

                  <div className="row g-12 mb-16">
                    <div className="col-6">
                      <label className="form-label text-sm fw-medium">시작 시간</label>
                      <input
                        type="text"
                        className="form-control"
                        readOnly
                        placeholder="--:--"
                        value={selected?.time ?? ""}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label text-sm fw-medium">종료 시간</label>
                      <input
                        type="text"
                        className="form-control"
                        readOnly
                        placeholder="--:--"
                        value={selected ? endTimeOf(selected.time) : ""}
                      />
                    </div>
                  </div>

                  <div className="mb-16">
                    <label className="form-label text-sm fw-semibold">상담 유형</label>
                    <div className="d-flex gap-8 mt-4">
                      {(["VISIT", "PHONE"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setConsultationType(type)}
                          style={{
                            padding: "6px 18px",
                            borderRadius: 6,
                            fontSize: 13,
                            border: `1.5px solid ${consultationType === type ? "#2ecc71" : "#dee2e6"}`,
                            background: consultationType === type ? "#2ecc71" : "#fff",
                            color: consultationType === type ? "#fff" : "#555",
                            cursor: "pointer",
                            fontWeight: consultationType === type ? 600 : 400,
                            transition: "all 0.15s",
                          }}
                        >
                          {CONSULTATION_TYPE_LABEL[type]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-20 d-flex flex-column flex-grow-1">
                    <label className="form-label text-sm fw-semibold">상담 내용</label>
                    <textarea
                      className="form-control flex-grow-1"
                      placeholder="상담하고 싶은 내용을 입력해주세요"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </div>

                  <button
                    className="btn w-100 text-white py-12 fw-semibold"
                    style={{ background: selected ? "#2ecc71" : "#a0a0a0", borderRadius: 10 }}
                    onClick={handleReserve}
                    disabled={saving || !selected}
                  >
                    {saving ? "신청 중..." : "신청하기"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* [soojin] PARENT: 예약 목록 */}
        {isParent && (
          <div className="mt-32">
            <div className="d-flex align-items-center justify-content-between mb-24">
              <h5 className="fw-bold mb-0">상담 신청 확인</h5>
              <div
                className="d-flex align-items-center"
                style={{ background: "#f0f0f0", borderRadius: 10, padding: "6px 6px", gap: 4 }}
              >
                {(
                  [
                    { key: "ALL", label: "전체" },
                    { key: "PENDING", label: "대기" },
                    { key: "CONFIRMED", label: "확정" },
                    { key: "COMPLETED", label: "완료" },
                    { key: "CANCELLED", label: "취소" },
                  ] as const
                ).map((s) => {
                  const count = s.key === "ALL" ? myItems.length : myItems.filter((i) => i.status === s.key).length;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setListFilter(s.key)}
                      style={{
                        border: "none",
                        borderRadius: 8,
                        padding: "7px 14px",
                        fontSize: 14,
                        fontWeight: listFilter === s.key ? 600 : 400,
                        background: listFilter === s.key ? "#fff" : "transparent",
                        color: listFilter === s.key ? "#000" : "#666",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        boxShadow: listFilter === s.key ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
                      }}
                    >
                      {s.label} {count}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 목록 */}
            {listLoading ? (
              <div className="text-center py-48 text-secondary-light">불러오는 중...</div>
            ) : (
              (() => {
                const filtered = listFilter === "ALL" ? myItems : myItems.filter((i) => i.status === listFilter);
                return filtered.length === 0 ? (
                  <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
                    <div className="card-body text-center py-48">
                      <i className="ri-calendar-close-line text-neutral-300" style={{ fontSize: 48 }} />
                      <p className="text-secondary-light mt-12 mb-0">신청 내역이 없습니다</p>
                    </div>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-12">
                    {filtered.map((item) => {
                      const st = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.PENDING;
                      const dateObj = new Date(item.date + "T00:00:00");
                      const dayLabel = ["일", "월", "화", "수", "목", "금", "토"][dateObj.getDay()];
                      const dateDisplay = `${dateObj.getFullYear()}. ${dateObj.getMonth() + 1}. ${dateObj.getDate()}. (${dayLabel})`;
                      const timeDisplay = `${TIME_LABEL[item.startTime] ?? item.startTime} ~ ${TIME_LABEL[item.endTime] ?? item.endTime}`;
                      return (
                        <div
                          key={item.id}
                          className="card shadow-sm"
                          style={{ borderRadius: 14, border: "1px solid #e5e7eb" }}
                        >
                          <div className="card-body p-20">
                            <div className="d-flex align-items-start justify-content-between">
                              <div className="d-flex gap-16">
                                {/* <div
                                className="text-center flex-shrink-0"
                                style={{ width: 56, padding: "8px 0", background: "#f0faf0", borderRadius: 10 }}
                              >
                                <div className="fw-bold text-lg" style={{ color: "#2ecc71" }}>
                                  {dateObj.getDate()}
                                </div>
                                <div className="text-xs text-secondary-light">{dateObj.getMonth() + 1}월</div>
                              </div> */}
                                <div>
                                  <div className="d-flex align-items-center gap-8 mb-6">
                                    <span className="fw-semibold">{dateDisplay}</span>
                                    <span
                                      className="badge px-8 py-4 rounded-pill text-xs"
                                      style={{ background: st.bg, color: st.text }}
                                    >
                                      {st.label}
                                    </span>
                                    {item.consultationType && (
                                      <span
                                        className="badge px-8 py-4 rounded-pill text-xs"
                                        style={{ background: "#e3f2fd", color: "#1565c0" }}
                                      >
                                        {CONSULTATION_TYPE_LABEL[item.consultationType] ?? item.consultationType}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-secondary-light mb-6">
                                    <i className="ri-time-line me-4" />
                                    {timeDisplay}
                                    {item.studentName && (
                                      <>
                                        {" "}
                                        · <i className="ri-user-line me-4" />
                                        {item.studentName}
                                        {item.studentNumber
                                          ? ` (${item.studentNumber.replace(/^(\d+)-(\d+)-(\d+)$/, "$1학년 $2반 $3번")})`
                                          : ""}
                                      </>
                                    )}
                                  </div>
                                  {item.content && (
                                    <div className="text-sm" style={{ color: "#555" }}>
                                      {item.content.length > 80 ? item.content.slice(0, 80) + "..." : item.content}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {item.status === "PENDING" && (
                                <button
                                  className="btn btn-sm btn-outline-danger px-12 py-4 flex-shrink-0"
                                  onClick={() => handleCancel(item.id)}
                                >
                                  취소
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* TEACHER: 일정 조정 모달 */}
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
                  <h6 className="fw-bold mb-0">
                    <i className="ri-calendar-event-line text-primary me-8" />
                    일정 조정
                  </h6>
                  <button
                    className="btn btn-sm p-0 border-0 bg-transparent"
                    onClick={() => setAdjusting(null)}
                    style={{ fontSize: 20 }}
                  >
                    <i className="ri-close-line" />
                  </button>
                </div>

                {/* 예약 정보 */}
                <div className="p-12 mb-16 rounded-12" style={{ background: "#f8f9fa" }}>
                  <div className="text-sm">
                    <span className="fw-semibold">{adjusting.writerName}</span> (학부모)
                    {adjusting.studentName && (
                      <span className="text-secondary-light">
                        {" "}· {adjusting.studentName}
                        {adjusting.studentNumber
                          ? ` (${adjusting.studentNumber.replace(/^(\d+)-(\d+)-(\d+)$/, "$1학년 $2반 $3번")})`
                          : ""}
                      </span>
                    )}
                  </div>
                  {adjusting.content && (
                    <div className="text-sm text-secondary-light mt-4">
                      {adjusting.content.length > 100 ? adjusting.content.slice(0, 100) + "..." : adjusting.content}
                    </div>
                  )}
                </div>

                {/* 현재 일정 */}
                <div className="mb-12">
                  <label className="form-label text-xs text-secondary-light fw-medium mb-4">현재 확정 일정</label>
                  <div className="text-sm fw-medium">
                    {adjusting.date} · {TIME_LABEL[adjusting.startTime] ?? adjusting.startTime} ~{" "}
                    {TIME_LABEL[adjusting.endTime] ?? adjusting.endTime}
                  </div>
                </div>

                <hr className="my-16" />

                {/* 변경 폼 */}
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
                    disabled={adjSaving}
                    onClick={handleAdjustSave}
                  >
                    {adjSaving ? "처리 중..." : "일정 변경"}
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
