import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import AdminLayout from "@/components/layout/admin/AdminLayout";
import admin from "@/api/adminApi";
import { ADMIN_ROUTES } from "@/constants/routes";
import { useSchool } from "@/context/SchoolContext";

// [soojin] 관리자 대시보드 디자인 전면 개편 (원본: admin/Dashboard.tsx 유지)

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalStaffs: number;
}

interface SystemSettings {
  schoolYear: number;
  semester: number;
}

interface ClassItem {
  grade: number;
  classNum: number;
  studentCount: number;
  status: string;
}

interface ScheduleEvent {
  id: number;
  title: string;
  eventType: "ACADEMIC" | "HOLIDAY" | "EXAM" | "EVENT" | "VACATION";
  start: string;
  end: string;
  targetGrade: string | null;
}

// [soojin] 대시보드 대기 목록용 인터페이스
interface PendingEntry {
  uid: number;
  name: string;
  latestClass?: string;
  subject?: string;
  roleRequestCreateDate?: string;
}

// [soojin] 1행 탭 타입
type ActiveTab = "STUDENT" | "TEACHER" | "STAFF";

// [soojin] 2행 RoleRequest 필터 타입 및 상태별 라벨/색상
type RRStatus = "ACTIVE" | "PENDING" | "SUSPENDED" | "REJECTED";

const RR_STATUS_LABEL: Record<RRStatus, string> = {
  ACTIVE: "승인",
  PENDING: "대기",
  SUSPENDED: "정지",
  REJECTED: "거절",
};

const RR_STATUS_COLOR: Record<RRStatus, string> = {
  ACTIVE: "#25A194",
  PENDING: "#0ea5e9",
  SUSPENDED: "#d97706",
  REJECTED: "#ef4444",
};

// [soojin] 버튼 soft 스타일용 연한 배경색
const RR_STATUS_SOFT_BG: Record<RRStatus, string> = {
  ACTIVE: "#d1faf6",
  PENDING: "#e0f2fe",
  SUSPENDED: "#fef3c7",
  REJECTED: "#fee2e2",
};

const EVENT_CFG: Record<string, { label: string; color: string; bg: string }> = {
  ACADEMIC: { label: "학사", color: "#25A194", bg: "rgba(37,161,148,0.12)" },
  HOLIDAY: { label: "휴일", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  EXAM: { label: "시험", color: "#d97706", bg: "rgba(217,119,6,0.12)" },
  EVENT: { label: "행사", color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  VACATION: { label: "방학", color: "#0ea5e9", bg: "rgba(14,165,233,0.12)" },
};

// [soojin] 탭별 아이콘 (참고 디자인 반영)
const TAB_ICON: Record<ActiveTab, string> = {
  STUDENT: "ri-graduation-cap-line",
  TEACHER: "ri-user-follow-line",
  STAFF: "ri-user-2-line",
};

function getDday(start: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(start.split("T")[0]);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "오늘";
  return diff < 0 ? `D+${Math.abs(diff)}` : `D-${diff}`;
}

function fmtDate(start: string, end: string) {
  const s = start.split("T")[0],
    e = end.split("T")[0];
  return s === e ? s : `${s} ~ ${e}`;
}

// [soojin] 과목별 분포 집계 (교사 탭 차트용)
function computeSubjectDist(list: any[]): { name: string; value: number }[] {
  const map: Record<string, number> = {};
  list.forEach((t) => {
    const s = t.subject ?? "미지정";
    map[s] = (map[s] ?? 0) + 1;
  });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));
}

// [soojin] 부서별 분포 집계 (교직원 탭 차트용)
function computeDeptDist(list: any[]): { name: string; value: number }[] {
  const map: Record<string, number> = {};
  list.forEach((s) => {
    const d = s.department ?? "미지정";
    map[d] = (map[d] ?? 0) + 1;
  });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));
}

// [soojin] roleRequestCreateDate 포맷 함수 (대기 목록 요청일시 표시용)
function formatRequestDate(dt?: string): string {
  if (!dt) return "-";
  const d = new Date(dt);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${d.getFullYear()}.${mm}.${dd} ${hh}:${mi}`;
}

/** 엔드포인트별 상태 인원 수 병렬 조회 */
async function fetchStatusCounts(
  endpoint: string,
  statuses: string[],
  schoolId?: string | number,
): Promise<Record<string, number>> {
  const schoolParam = schoolId ? `&schoolId=${schoolId}` : "";
  const results = await Promise.allSettled(
    statuses.map((s) =>
      admin
        .get(`/${endpoint}?status=${s}&size=1&page=0${schoolParam}`)
        .then((r) => [s, (r.data.totalElements as number | undefined) ?? 0] as const)
        .catch(() => [s, 0] as const),
    ),
  );
  return Object.fromEntries(
    results
      .filter((r): r is PromiseFulfilledResult<readonly [string, number]> => r.status === "fulfilled")
      .map((r) => r.value),
  );
}

export default function AdminDashboard() {
  const { selectedSchool } = useSchool();
  const today = new Date().toISOString().split("T")[0];

  const [stats, setStats] = useState<DashboardStats>({ totalStudents: 0, totalTeachers: 0, totalStaffs: 0 });
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [teacherCounts, setTeacherCounts] = useState<Record<string, number>>({});
  const [staffCounts, setStaffCounts] = useState<Record<string, number>>({});
  const [classesByGrade, setClassesByGrade] = useState<Record<number, { count: number; students: number }>>({});
  const [schedules, setSchedules] = useState<ScheduleEvent[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);

  // [soojin] 1행 탭 전환 및 분포 차트용 state
  const [activeTab, setActiveTab] = useState<ActiveTab>("STUDENT");
  const [teacherList, setTeacherList] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);

  // [soojin] 2행: RoleRequest 필터 탭 상태 (기본 대기)
  const [studentRRFilter, setStudentRRFilter] = useState<RRStatus>("PENDING");
  const [teacherRRFilter, setTeacherRRFilter] = useState<RRStatus>("PENDING");
  const [studentFilterOpen, setStudentFilterOpen] = useState(false); // [soojin] 학생 필터 아코디언
  const [teacherFilterOpen, setTeacherFilterOpen] = useState(false); // [soojin] 교사 필터 아코디언
  const [roleRequestCounts, setRoleRequestCounts] = useState<Record<string, Record<string, number>>>({});
  const [pendingStudents, setPendingStudents] = useState<PendingEntry[]>([]);
  const [pendingTeachers, setPendingTeachers] = useState<PendingEntry[]>([]);

  useEffect(() => {
    const schoolId = selectedSchool?.id;
    const schoolParam = schoolId ? `?schoolId=${schoolId}` : "";
    const ampSchoolParam = schoolId ? `&schoolId=${schoolId}` : "";

    admin
      .get(`/dashboard/stats${schoolParam}`)
      .then((r) => setStats(r.data))
      .catch(() => {});
    admin
      .get("/settings")
      .then((r) => setSettings(r.data))
      .catch(() => {});

    fetchStatusCounts(
      "students",
      ["ENROLLED", "LEAVE_OF_ABSENCE", "GRADUATED", "DROPOUT", "TRANSFERRED", "EXPELLED"],
      schoolId,
    ).then(setStudentCounts);
    fetchStatusCounts("teachers", ["EMPLOYED", "LEAVE", "RETIRED"], schoolId).then(setTeacherCounts);
    fetchStatusCounts("staffs", ["EMPLOYED", "LEAVE", "DISPATCHED", "RETIRED"], schoolId).then(setStaffCounts);

    // [soojin] 교사/교직원 전체 목록 조회 (과목별/부서별 분포 집계용)
    admin
      .get(`/teachers?size=500${ampSchoolParam}`)
      .then((r) => setTeacherList(r.data.content ?? []))
      .catch(() => {});
    admin
      .get(`/staffs?size=500${ampSchoolParam}`)
      .then((r) => setStaffList(r.data.content ?? []))
      .catch(() => {});

    // [soojin] 학년별 학생 현황 차트용 학급 데이터 조회 (year 생략 시 백엔드가 현재 학년도 자동 사용)
    admin
      .get(`/classes?size=200${ampSchoolParam}`)
      .then((r) => {
        const list: ClassItem[] = r.data.content ?? [];
        const map: Record<number, { count: number; students: number }> = {};
        list
          .filter((c) => c.status === "ACTIVE")
          .forEach((c) => {
            if (!map[c.grade]) map[c.grade] = { count: 0, students: 0 };
            map[c.grade].count++;
            map[c.grade].students += c.studentCount;
          });
        setClassesByGrade(map);
      })
      .catch(() => {});

    // [soojin] 역할별 RoleRequest 상태별 인원 수 조회 (필터 탭 배지용)
    const rrSchoolParam = schoolId ? `&schoolId=${schoolId}` : "";
    Promise.all([
      admin
        .get(`/role-requests/counts?role=STUDENT${rrSchoolParam}`)
        .then((r) => r.data as Record<string, number>)
        .catch(() => ({})),
      admin
        .get(`/role-requests/counts?role=TEACHER${rrSchoolParam}`)
        .then((r) => r.data as Record<string, number>)
        .catch(() => ({})),
    ])
      .then(([s, t]) => setRoleRequestCounts({ STUDENT: s, TEACHER: t }))
      .catch(() => {});

    // 학사 일정 (오늘 ~ 60일 후)
    const end = new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0];
    admin
      .get(`/schedule?start=${today}&end=${end}${ampSchoolParam}`)
      .then((r) => {
        const data: ScheduleEvent[] = Array.isArray(r.data) ? r.data : [];
        setSchedules(data.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()).slice(0, 8));
      })
      .catch(() => setSchedules([]))
      .finally(() => setScheduleLoading(false));
  }, [today, selectedSchool]);

  // [soojin] 학생 RoleRequest 목록 — 필터 탭 변경 시 재조회
  useEffect(() => {
    const schoolId = selectedSchool?.id;
    const ampSchoolParam = schoolId ? `&schoolId=${schoolId}` : "";
    admin
      .get(`/students?roleRequestStatus=${studentRRFilter}&size=5${ampSchoolParam}`)
      .then((r) => {
        const content = r.data.content ?? [];
        setPendingStudents(
          content.map((s: any) => ({
            uid: s.uid,
            name: s.name,
            latestClass: s.latestClass,
            roleRequestCreateDate: s.roleRequestCreateDate,
          })),
        );
      })
      .catch(() => setPendingStudents([]));
  }, [studentRRFilter, selectedSchool]);

  // [soojin] 교사 RoleRequest 목록 — 필터 탭 변경 시 재조회
  useEffect(() => {
    const schoolId = selectedSchool?.id;
    const ampSchoolParam = schoolId ? `&schoolId=${schoolId}` : "";
    admin
      .get(`/teachers?roleRequestStatus=${teacherRRFilter}&size=5${ampSchoolParam}`)
      .then((r) => {
        const content = r.data.content ?? [];
        setPendingTeachers(
          content.map((t: any) => ({
            uid: t.uid,
            name: t.name,
            subject: t.subject,
            roleRequestCreateDate: t.roleRequestCreateDate,
          })),
        );
      })
      .catch(() => setPendingTeachers([]));
  }, [teacherRRFilter, selectedSchool]);

  // [soojin] 학급 조회는 메인 useEffect로 이동됨

  const g = (counts: Record<string, number>, key: string) => counts[key] ?? 0;

  const gradeKeys = Object.keys(classesByGrade)
    .map(Number)
    .sort((a, b) => a - b);

  // [soojin] 탭별 데이터 설정
  const TAB_CONFIGS = {
    STUDENT: {
      label: "학생 현황",
      totalLabel: "전체 학생",
      total: stats.totalStudents,
      activeLabel: "활동 중",
      activeCount: g(studentCounts, "ENROLLED"),
      inactiveLabel: "비활성",
      inactiveCount: g(studentCounts, "LEAVE_OF_ABSENCE"),
      chartData: gradeKeys.map((gr) => ({ name: `${gr}학년`, value: classesByGrade[gr].students })),
      chartTitle: "학년별 분포",
    },
    TEACHER: {
      label: "교사 현황",
      totalLabel: "전체 교사",
      total: stats.totalTeachers,
      activeLabel: "활동 중",
      activeCount: g(teacherCounts, "EMPLOYED") || stats.totalTeachers,
      inactiveLabel: "휴직/휴가",
      inactiveCount: g(teacherCounts, "LEAVE"),
      chartData: computeSubjectDist(teacherList),
      chartTitle: "과목별 분포",
    },
    STAFF: {
      label: "교직원 현황",
      totalLabel: "전체 교직원",
      total: stats.totalStaffs,
      activeLabel: "활동 중",
      activeCount: g(staffCounts, "EMPLOYED") || stats.totalStaffs,
      inactiveLabel: "휴직/휴가",
      inactiveCount: g(staffCounts, "LEAVE"),
      chartData: computeDeptDist(staffList),
      chartTitle: "부서별 분포",
    },
  } as const;

  const currentTab = TAB_CONFIGS[activeTab];
  const activeRate = currentTab.total > 0 ? Math.round((currentTab.activeCount / currentTab.total) * 100) : 0;
  const inactiveRate = currentTab.total > 0 ? Math.round((currentTab.inactiveCount / currentTab.total) * 100) : 0;

  return (
    <AdminLayout>
      {/* 헤더 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h5 style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>관리자 대시보드</h5>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
            {selectedSchool ? (
              <>
                <span style={{ fontWeight: 600 }}>{selectedSchool.name}</span>
                <span style={{ color: "#9ca3af", marginLeft: 4, fontSize: 13 }}>
                  ({selectedSchool.schoolKind} · {selectedSchool.officeOfEducation})
                </span>
              </>
            ) : (
              "학교 관리 시스템 현황을 한눈에 확인합니다."
            )}
          </p>
        </div>
        <span style={{ color: "#9ca3af", fontSize: 13 }}>{today}</span>
      </div>

      {/* ── 1행: 탭 전환형 현황 카드 ── */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", marginBottom: 24 }}>
        {/* [soojin] 탭 헤더: 아이콘 추가, 활성 색 변경, 밑줄 텍스트 중앙 정렬 (참고 디자인 반영) */}
        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", padding: "0 20px" }}>
          {(["STUDENT", "TEACHER", "STAFF"] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: "none",
                border: "none",
                padding: "14px 16px 0",
                cursor: "pointer",
                marginBottom: -1,
              }}
            >
              <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    paddingBottom: 10,
                    fontSize: 14,
                    fontWeight: activeTab === tab ? 600 : 400,
                    color: activeTab === tab ? "#25A194" : "#6b7280",
                  }}
                >
                  <i className={TAB_ICON[tab]} style={{ fontSize: 15 }} />
                  {TAB_CONFIGS[tab].label}
                </div>
                <div
                  style={{
                    width: "100%",
                    height: 2,
                    background: activeTab === tab ? "#25A194" : "transparent",
                    borderRadius: 2,
                  }}
                />
              </div>
            </button>
          ))}
        </div>

        {/* 탭 내용 */}
        <div style={{ padding: 20 }}>
          {/* [soojin] 요약 3칸: 참고 디자인 맞춰 카드 스타일 전면 변경 */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            {/* [soojin] 전체 카드: 연한 초록 배경으로 변경 */}
            <div
              style={{
                flex: 1,
                background: "#25a1942e",
                borderRadius: 10,
                padding: "18px 20px",
                border: "1px solid #25a1944d",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <p style={{ fontSize: 12, color: "#065f46", margin: 0, marginBottom: 6 }}>{currentTab.totalLabel}</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: "#064e3b", margin: 0 }}>
                {currentTab.total.toLocaleString()}
                <span style={{ fontSize: 13, fontWeight: 400, marginLeft: 4 }}>명</span>
              </p>
              <i
                className={TAB_ICON[activeTab]}
                style={{
                  position: "absolute",
                  right: 12,
                  bottom: 6,
                  fontSize: 60,
                  color: "rgba(6,95,70,0.12)",
                  lineHeight: 1,
                }}
              />
            </div>
            {/* 활동 중 카드: 흰 배경 + 체크 아이콘 */}
            <div
              style={{
                flex: 1,
                background: "#fff",
                borderRadius: 10,
                padding: "18px 20px",
                border: "1px solid #e5e7eb",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>{currentTab.activeLabel}</p>
                <i className="ri-checkbox-circle-fill" style={{ fontSize: 16, color: "#25A194" }} />
              </div>
              <p style={{ fontSize: 28, fontWeight: 700, color: "#111827", margin: 0 }}>
                {currentTab.activeCount.toLocaleString()}
                <span style={{ fontSize: 13, fontWeight: 400, marginLeft: 4 }}>명</span>
              </p>
              <div style={{ background: "#e5e7eb", borderRadius: 4, height: 4, marginTop: 8 }}>
                <div
                  style={{
                    background: "#25A194",
                    borderRadius: 4,
                    height: 4,
                    width: `${activeRate}%`,
                    transition: "width 0.3s",
                  }}
                />
              </div>
              <p style={{ fontSize: 11, color: "#6b7280", margin: 0, marginTop: 4 }}>{activeRate}% 활동률</p>
            </div>
            {/* [soojin] 비활성 카드: 연한 회색 배경으로 변경 */}
            <div
              style={{
                flex: 1,
                background: "#f3f4f6",
                borderRadius: 10,
                padding: "18px 20px",
                border: "1px solid #d1d5db" /* [soojin] 회색 조금 더 진하게 */,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>{currentTab.inactiveLabel}</p>
                <i className="ri-error-warning-fill" style={{ fontSize: 16, color: "#9ca3af" }} />
              </div>
              <p style={{ fontSize: 28, fontWeight: 700, color: "#374151", margin: 0 }}>
                {currentTab.inactiveCount.toLocaleString()}
                <span style={{ fontSize: 13, fontWeight: 400, marginLeft: 4 }}>명</span>
              </p>
              <p style={{ fontSize: 11, color: "#9ca3af", margin: 0, marginTop: 12 }}>{inactiveRate}%</p>
            </div>
          </div>

          {/* [soojin] 차트 제목 추가 (참고 디자인 반영) */}
          <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", margin: 0, marginBottom: 8 }}>
            {currentTab.chartTitle}
          </p>
          {currentTab.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={currentTab.chartData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 11 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [`${Number(v ?? 0).toLocaleString()}명`, ""]}
                />
                <Bar dataKey="value" fill="#25A194" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 100,
                color: "#9ca3af",
                fontSize: 13,
              }}
            >
              데이터가 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* ── 2행: 계정 승인 대기 목록 ── */}
      <div style={{ display: "flex", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
        {/* 학생 대기 목록 */}
        <div style={{ flex: "1 1 400px", minWidth: 320 }}>
          {/* [soojin] 2행 학생 카드: 필터 탭(승인/대기/정지/거절) + 고정 높이 목록 */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb" }}>
            {/* [soojin] 필터 탭을 헤더 우측으로 이동 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 20px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <h6 style={{ fontWeight: 600, fontSize: 14, color: "#111827", margin: 0 }}>학생 계정 승인 현황</h6>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {(["ACTIVE", "PENDING", "SUSPENDED", "REJECTED"] as RRStatus[]).map((status) => {
                  const count = roleRequestCounts.STUDENT?.[status] ?? 0;
                  const isActive = studentRRFilter === status;
                  return (
                    <button
                      key={status}
                      onClick={() => setStudentRRFilter(status)}
                      style={{
                        background: "none",
                        border: "none",
                        borderBottom: isActive ? `2px solid ${RR_STATUS_COLOR[status]}` : "2px solid transparent",
                        color: isActive ? RR_STATUS_COLOR[status] : "#9ca3af",
                        padding: "2px 0",
                        fontSize: 11,
                        fontWeight: isActive ? 700 : 500,
                        cursor: "pointer",
                      }}
                    >
                      {RR_STATUS_LABEL[status]}
                      {count > 0 ? ` ${count}` : ""}
                    </button>
                  );
                })}
                <Link
                  to={ADMIN_ROUTES.STUDENTS.LIST}
                  style={{ fontSize: 12, color: "#6b7280", textDecoration: "none", marginLeft: 4 }}
                >
                  관리 →
                </Link>
              </div>
            </div>
            {/* 목록: 5건 기준 고정 높이 + 스크롤 */}
            <div style={{ height: 300, overflowY: "auto" }}>
              {pendingStudents.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    color: "#9ca3af",
                  }}
                >
                  <i className="ri-error-warning-line" style={{ fontSize: 28, marginBottom: 8 }} />
                  <p style={{ margin: 0, fontSize: 13 }}>해당 항목이 없습니다</p>
                </div>
              ) : (
                <ul style={{ listStyle: "none", padding: "0 12px", margin: 0 }}>
                  {pendingStudents.map((s, idx) => (
                    <li
                      key={s.uid}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 20px",
                        borderBottom: idx === pendingStudents.length - 1 ? "none" : "1px solid #f3f4f6",
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: "#25a1942e" /* [soojin] 사이드바 학생 프로필 바탕색(bg-primary-100) 적용 */,
                          color: "#25A194",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: 14,
                          flexShrink: 0,
                        }}
                      >
                        {s.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, color: "#111827", fontSize: 13, margin: 0, marginBottom: 2 }}>
                          {s.name}
                        </p>
                        <p style={{ color: "#6b7280", fontSize: 11, margin: 0 }}>
                          {studentRRFilter === "ACTIVE"
                            ? `${s.latestClass ?? "-"} · ${formatRequestDate(s.roleRequestCreateDate)}`
                            : formatRequestDate(s.roleRequestCreateDate)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* [soojin] 2행 교사 카드: 필터 탭(승인/대기/정지/거절) + 고정 높이 목록 */}
        <div style={{ flex: "1 1 400px", minWidth: 320 }}>
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb" }}>
            {/* [soojin] 필터 탭을 헤더 우측으로 이동 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 20px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <h6 style={{ fontWeight: 600, fontSize: 14, color: "#111827", margin: 0 }}>교사 계정 승인 현황</h6>
              {/* [soojin] 현재 선택 필터만 표시, 클릭 시 드롭다운으로 나머지 옵션 노출 */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setTeacherFilterOpen((o) => !o)}
                    style={{
                      background: RR_STATUS_SOFT_BG[teacherRRFilter],
                      color: RR_STATUS_COLOR[teacherRRFilter],
                      border: "none",
                      borderRadius: 14,
                      padding: "4px 10px",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    {RR_STATUS_LABEL[teacherRRFilter]}
                    {(roleRequestCounts.TEACHER?.[teacherRRFilter] ?? 0) > 0
                      ? ` ${roleRequestCounts.TEACHER?.[teacherRRFilter]}`
                      : ""}
                    <i
                      className={teacherFilterOpen ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}
                      style={{ fontSize: 12 }}
                    />
                  </button>
                  {teacherFilterOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        right: 0,
                        zIndex: 100,
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
                        padding: "6px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        minWidth: 80,
                      }}
                    >
                      {(["ACTIVE", "PENDING", "SUSPENDED", "REJECTED"] as RRStatus[]).map((status) => {
                        const count = roleRequestCounts.TEACHER?.[status] ?? 0;
                        const isActive = teacherRRFilter === status;
                        return (
                          <button
                            key={status}
                            onClick={() => {
                              setTeacherRRFilter(status);
                              setTeacherFilterOpen(false);
                            }}
                            style={{
                              background: isActive ? RR_STATUS_SOFT_BG[status] : "transparent",
                              color: isActive ? RR_STATUS_COLOR[status] : "#374151",
                              border: "none",
                              borderRadius: 6,
                              padding: "5px 10px",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              textAlign: "left",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {RR_STATUS_LABEL[status]}
                            {count > 0 ? ` ${count}` : ""}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <Link
                  to={ADMIN_ROUTES.TEACHERS.LIST}
                  style={{ fontSize: 12, color: "#6b7280", textDecoration: "none", marginLeft: 4 }}
                >
                  관리 →
                </Link>
              </div>
            </div>
            {/* 목록: 5건 기준 고정 높이 + 스크롤 */}
            <div style={{ height: 300, overflowY: "auto" }}>
              {pendingTeachers.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    color: "#9ca3af",
                  }}
                >
                  <i className="ri-error-warning-line" style={{ fontSize: 28, marginBottom: 8 }} />
                  <p style={{ margin: 0, fontSize: 13 }}>해당 항목이 없습니다</p>
                </div>
              ) : (
                <ul style={{ listStyle: "none", padding: "0 12px", margin: 0 }}>
                  {pendingTeachers.map((t, idx) => (
                    <li
                      key={t.uid}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 20px",
                        borderBottom: idx === pendingTeachers.length - 1 ? "none" : "1px solid #f3f4f6",
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: "#25a1942e" /* [soojin] 사이드바 학생 프로필 바탕색(bg-primary-100) 적용 */,
                          color: "#25A194",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: 14,
                          flexShrink: 0,
                        }}
                      >
                        {t.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, color: "#111827", fontSize: 13, margin: 0, marginBottom: 2 }}>
                          {t.name}
                        </p>
                        <p style={{ color: "#6b7280", fontSize: 11, margin: 0 }}>
                          {teacherRRFilter === "ACTIVE"
                            ? `${t.subject ?? "-"} · ${formatRequestDate(t.roleRequestCreateDate)}`
                            : formatRequestDate(t.roleRequestCreateDate)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3행: 학급 현황 + 학사 일정 ── */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {/* 학급 현황 */}
        <div style={{ flex: "1 1 400px", minWidth: 320, marginBottom: 24 }}>
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              {/* [soojin] "N년 N학기 편성 학급"을 제목 우측으로 이동 */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <h6 style={{ fontWeight: 600, fontSize: 14, color: "#111827", margin: 0 }}>학급 현황</h6>
                <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
                  {settings ? `${settings.schoolYear}년 ${settings.semester}학기 편성 학급` : "로딩 중…"}
                </p>
              </div>
              <Link to={ADMIN_ROUTES.CLASSES.LIST} style={{ fontSize: 12, color: "#6b7280", textDecoration: "none" }}>
                관리 →
              </Link>
            </div>
            <div style={{ padding: "20px 20px 20px" }}>
              {gradeKeys.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "40px 0",
                    color: "#9ca3af",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <i className="ri-building-2-line" style={{ fontSize: 28, display: "block", marginBottom: 8 }} />
                    <p style={{ margin: 0, fontSize: 13 }}>{settings ? "편성된 학급이 없습니다." : "로딩 중…"}</p>
                  </div>
                </div>
              ) : (
                <>
                  {gradeKeys.map((grade) => {
                    const { count, students } = classesByGrade[grade];
                    return (
                      <div
                        key={grade}
                        style={{
                          background: "#f9fafb",
                          borderRadius: 10,
                          padding: "14px 16px",
                          marginBottom: 10,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 12,
                          }}
                        >
                          <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>{grade}학년</p>
                        </div>
                        <div style={{ display: "flex" }}>
                          <div style={{ flex: 1, textAlign: "center" }}>
                            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0, marginBottom: 4 }}>총 학생 수</p>
                            <p style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>
                              {students.toLocaleString()}
                              <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 2 }}>명</span>
                            </p>
                          </div>
                          <div style={{ width: 1, background: "#f3f4f6", margin: "0 4px" }} />
                          <div style={{ flex: 1, textAlign: "center" }}>
                            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0, marginBottom: 4 }}>학급 수</p>
                            <p style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>
                              {count}
                              <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 2 }}>개</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {/* 전체 합계 */}
                  {(() => {
                    const totalClasses = gradeKeys.reduce((sum, gr) => sum + classesByGrade[gr].count, 0);
                    const totalStudentsAll = gradeKeys.reduce((sum, gr) => sum + classesByGrade[gr].students, 0);
                    return (
                      <div style={{ display: "flex", paddingTop: 8 }}>
                        <div style={{ flex: 1 }} />
                        <div style={{ width: 1 }} />
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                          <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>전체 합계</p>
                          <span style={{ fontSize: 20, fontWeight: 700, color: "#25A194" }}>
                            {totalStudentsAll.toLocaleString()}명
                          </span>
                          <span style={{ color: "#d1d5db" }}>|</span>
                          <span style={{ fontSize: 20, fontWeight: 700, color: "#25A194" }}>
                            {totalClasses}개 학급
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        </div>

        {/* 다가오는 학사 일정 */}
        <div style={{ flex: "1 1 400px", minWidth: 320, marginBottom: 24 }}>
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <h6 style={{ fontWeight: 600, fontSize: 14, color: "#111827", margin: 0 }}>다가오는 학사 일정</h6>
                <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>오늘 이후 60일 이내</p>
              </div>
              <Link
                to={ADMIN_ROUTES.MASTER.SCHEDULE}
                style={{ fontSize: 12, color: "#6b7280", textDecoration: "none" }}
              >
                전체 보기 →
              </Link>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 20px" }}>
              {scheduleLoading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0" }}>
                  <div className="spinner-border spinner-border-sm" style={{ color: "#9ca3af" }} />
                </div>
              ) : schedules.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "40px 0",
                    color: "#9ca3af",
                  }}
                >
                  <i className="ri-calendar-line" style={{ fontSize: 28, marginBottom: 8 }} />
                  <p style={{ margin: 0, fontSize: 13 }}>예정된 일정이 없습니다.</p>
                </div>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {schedules.map((ev) => {
                    const cfg = EVENT_CFG[ev.eventType] ?? EVENT_CFG.ACADEMIC;
                    const dday = getDday(ev.start);
                    return (
                      <li
                        key={ev.id}
                        style={{
                          background: "#f9fafb",
                          borderRadius: 10,
                          padding: "12px 14px",
                          marginBottom: 10,
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                        }}
                      >
                        <div
                          style={{
                            minWidth: 52,
                            height: 44,
                            background: dday === "오늘" ? "#25A194" : "#e0f2fe",
                            borderRadius: 8,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <span style={{ fontSize: 12, fontWeight: 700, color: dday === "오늘" ? "#fff" : "#0369a1" }}>
                            {dday}
                          </span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <span
                              style={{
                                background: cfg.bg,
                                color: cfg.color,
                                fontSize: 10,
                                fontWeight: 600,
                                padding: "2px 6px",
                                borderRadius: 4,
                                flexShrink: 0,
                              }}
                            >
                              {cfg.label}
                            </span>
                            <p
                              style={{
                                fontWeight: 600,
                                color: "#111827",
                                fontSize: 13,
                                margin: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {ev.title}
                            </p>
                          </div>
                          <p style={{ color: "#6b7280", margin: 0, fontSize: 11 }}>
                            {fmtDate(ev.start, ev.end)}
                            {ev.targetGrade && (
                              <span style={{ marginLeft: 4, color: "#9ca3af" }}>· {ev.targetGrade}학년</span>
                            )}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
