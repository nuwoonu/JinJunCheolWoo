import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Rectangle } from "recharts";
import AdminLayout from "@/components/layout/admin/AdminLayout";
import admin from "@/api/adminApi";
import { ADMIN_ROUTES } from "@/constants/routes";
import { useSchool } from "@/context/SchoolContext";

// [joon] 관리자 대시보드

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalStaffs: number;
}

interface SystemSettings {
  currentSchoolYear: number;
  currentSemester: number;
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

// 공통 상태 색상 (유사 상태끼리 같은 색)
const STATUS_COLOR: Record<string, string> = {
  // 활성/재직/재학
  ACTIVE: "#25A194",
  EMPLOYED: "#25A194",
  ENROLLED: "#25A194",
  // 대기
  PENDING: "#0ea5e9",
  // 휴직/휴학
  LEAVE: "#d97706",
  LEAVE_OF_ABSENCE: "#d97706",
  // 퇴직/졸업
  RETIRED: "#6366f1",
  GRADUATED: "#6366f1",
  // 비활성/기타
  INACTIVE: "#94a3b8",
  OTHERS: "#94a3b8",
  DISPATCHED: "#a78bfa",
  // 차단/제적
  BLOCKED: "#ef4444",
  EXPELLED: "#ef4444",
  // RoleRequest
  REJECTED: "#ef4444",
  SUSPENDED: "#d97706",
};

const EVENT_CFG: Record<string, { label: string; color: string; bg: string }> = {
  ACADEMIC: { label: "학사", color: "#25A194", bg: "rgba(37,161,148,0.12)" },
  HOLIDAY: { label: "휴일", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  EXAM: { label: "시험", color: "#d97706", bg: "rgba(217,119,6,0.12)" },
  EVENT: { label: "행사", color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  VACATION: { label: "방학", color: "#0ea5e9", bg: "rgba(14,165,233,0.12)" },
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

/** 엔드포인트별 상태 인원 수 병렬 조회 */
async function fetchStatusCounts(endpoint: string, statuses: string[], schoolId?: string | number): Promise<Record<string, number>> {
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

/** 가로 막대 차트 카드 */
function StatusBarCard({
  title,
  total,
  unit = "명",
  link,
  data,
  accentColor,
}: {
  title: string;
  total: number;
  unit?: string;
  link: string;
  data: { name: string; value: number; fill: string }[];
  accentColor: string;
}) {
  const chartHeight = Math.max(data.length * 36 + 20, 100);
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", borderTop: `3px solid ${accentColor}`, height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
        <div>
          <h6 style={{ fontWeight: 600, marginBottom: 4, fontSize: 14, color: "#111827" }}>
            {title}
          </h6>
          <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
            총 <span style={{ fontWeight: 600, color: "#111827" }}>{total.toLocaleString()}</span>
            {unit}
          </p>
        </div>
        <Link to={link} style={{ fontSize: 12, color: "#6b7280", textDecoration: "none" }}>
          관리 →
        </Link>
      </div>
      <div style={{ padding: "12px 16px" }}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart layout="vertical" data={data} margin={{ top: 0, right: 28, left: 0, bottom: 0 }} barSize={16}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--neutral-200)" />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--text-secondary-light)", fontSize: 10 }}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={48}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--text-secondary-light)", fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--white)",
                border: "1px solid var(--border-color)",
                borderRadius: 8,
                color: "var(--text-primary-light)",
                fontSize: 12,
              }}
              formatter={(v) => [`${Number(v ?? 0).toLocaleString()}${unit}`, ""]}
            />
            <Bar
              dataKey="value"
              shape={(props: any) => (
                <Rectangle {...props} fill={data[props.index]?.fill ?? props.fill} radius={[0, 4, 4, 0]} />
              )}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { selectedSchool } = useSchool();
  const today = new Date().toISOString().split("T")[0];

  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalStaffs: 0,
  });
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [teacherCounts, setTeacherCounts] = useState<Record<string, number>>({});
  const [staffCounts, setStaffCounts] = useState<Record<string, number>>({});
  const [classesByGrade, setClassesByGrade] = useState<Record<number, { count: number; students: number }>>({});
  const [schedules, setSchedules] = useState<ScheduleEvent[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [roleRequestCounts, setRoleRequestCounts] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    const schoolId = selectedSchool?.id;
    const schoolParam = schoolId ? `?schoolId=${schoolId}` : "";

    // 기본 stats
    admin
      .get(`/dashboard/stats${schoolParam}`)
      .then((r) => setStats(r.data))
      .catch(() => {});
    // 시스템 설정
    admin
      .get("/settings")
      .then((r) => setSettings(r.data))
      .catch(() => {});

    // 각 구성원 상태별 인원 병렬 조회
    fetchStatusCounts("students", ["ENROLLED", "LEAVE_OF_ABSENCE", "GRADUATED", "DROPOUT", "TRANSFERRED", "EXPELLED"], schoolId).then(setStudentCounts);
    fetchStatusCounts("teachers", ["EMPLOYED", "LEAVE", "RETIRED"], schoolId).then(setTeacherCounts);
    fetchStatusCounts("staffs", ["EMPLOYED", "LEAVE", "DISPATCHED", "RETIRED"], schoolId).then(setStaffCounts);

    // 역할별 RoleRequest 승인 상태 인원 조회 (학생/교사만; 학부모는 ParentList에서 별도 표시)
    const rrSchoolParam = schoolId ? `&schoolId=${schoolId}` : "";
    Promise.all([
      admin.get(`/role-requests/counts?role=STUDENT${rrSchoolParam}`).then((r) => r.data as Record<string, number>).catch(() => ({})),
      admin.get(`/role-requests/counts?role=TEACHER${rrSchoolParam}`).then((r) => r.data as Record<string, number>).catch(() => ({})),
    ]).then(([s, t]) => {
      setRoleRequestCounts({ STUDENT: s, TEACHER: t });
    }).catch(() => {});

    // 학사 일정 (오늘 ~ 60일 후)
    const end = new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0];
    const scheduleSchoolParam = schoolId ? `&schoolId=${schoolId}` : "";
    admin
      .get(`/schedule?start=${today}&end=${end}${scheduleSchoolParam}`)
      .then((r) => {
        const data: ScheduleEvent[] = Array.isArray(r.data) ? r.data : [];
        setSchedules(data.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()).slice(0, 8));
      })
      .catch(() => setSchedules([]))
      .finally(() => setScheduleLoading(false));
  }, [today, selectedSchool]);

  // 설정 로드 후 학급 데이터 조회
  useEffect(() => {
    if (!settings) return;
    admin
      .get(`/classes?size=200&year=${settings.currentSchoolYear}`)
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
  }, [settings]);

  const g = (counts: Record<string, number>, key: string) => counts[key] ?? 0;

  const studentChartData = [
    { name: "재학",   value: g(studentCounts, "ENROLLED"),          fill: STATUS_COLOR.ENROLLED },
    { name: "휴학",   value: g(studentCounts, "LEAVE_OF_ABSENCE"),  fill: STATUS_COLOR.LEAVE_OF_ABSENCE },
    { name: "졸업",   value: g(studentCounts, "GRADUATED"),         fill: STATUS_COLOR.GRADUATED },
    { name: "자퇴",   value: g(studentCounts, "DROPOUT"),           fill: STATUS_COLOR.EXPELLED },
    { name: "전학",   value: g(studentCounts, "TRANSFERRED"),       fill: STATUS_COLOR.DISPATCHED },
    { name: "퇴학",   value: g(studentCounts, "EXPELLED"),          fill: STATUS_COLOR.BLOCKED },
  ];

  const teacherChartData = [
    { name: "재직", value: g(teacherCounts, "EMPLOYED") || stats.totalTeachers, fill: STATUS_COLOR.EMPLOYED },
    { name: "휴직", value: g(teacherCounts, "LEAVE"), fill: STATUS_COLOR.LEAVE },
    { name: "퇴직", value: g(teacherCounts, "RETIRED"), fill: STATUS_COLOR.RETIRED },
  ];

  const staffChartData = [
    { name: "재직", value: g(staffCounts, "EMPLOYED") || stats.totalStaffs, fill: STATUS_COLOR.EMPLOYED },
    { name: "휴직", value: g(staffCounts, "LEAVE"), fill: STATUS_COLOR.LEAVE },
    { name: "파견", value: g(staffCounts, "DISPATCHED"), fill: STATUS_COLOR.DISPATCHED },
    { name: "퇴직", value: g(staffCounts, "RETIRED"), fill: STATUS_COLOR.RETIRED },
  ];

  const gradeKeys = Object.keys(classesByGrade)
    .map(Number)
    .sort((a, b) => a - b);

  const rrg = (role: string, status: string) => roleRequestCounts[role]?.[status] ?? 0;

  const makeRRChartData = (role: string) => [
    { name: "활성", value: rrg(role, "ACTIVE"),    fill: STATUS_COLOR.ACTIVE },
    { name: "대기", value: rrg(role, "PENDING"),   fill: STATUS_COLOR.PENDING },
    { name: "정지", value: rrg(role, "SUSPENDED"), fill: STATUS_COLOR.SUSPENDED },
    { name: "거절", value: rrg(role, "REJECTED"),  fill: STATUS_COLOR.REJECTED },
  ];

  return (
    <AdminLayout>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
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
        <span style={{ color: "#9ca3af", fontSize: 13 }}>
          {today}
        </span>
      </div>

      {/* ── 구성원 현황 차트 3개 ── */}
      <div style={{ display: "flex", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 280px", minWidth: 260 }}>
          <StatusBarCard
            title="학생 현황"
            total={stats.totalStudents}
            link={ADMIN_ROUTES.STUDENTS.LIST}
            data={studentChartData}
            accentColor="#25A194"
          />
        </div>
        <div style={{ flex: "1 1 280px", minWidth: 260 }}>
          <StatusBarCard
            title="교사 현황"
            total={stats.totalTeachers}
            link={ADMIN_ROUTES.TEACHERS.LIST}
            data={teacherChartData}
            accentColor="#1d4ed8"
          />
        </div>
        <div style={{ flex: "1 1 280px", minWidth: 260 }}>
          <StatusBarCard
            title="교직원 현황"
            total={stats.totalStaffs}
            link={ADMIN_ROUTES.STAFFS.LIST}
            data={staffChartData}
            accentColor="#6366f1"
          />
        </div>
      </div>

      {/* ── 구분선 ── */}
      <div style={{ borderTop: "1px solid #e5e7eb", marginBottom: 24 }} />

      {/* ── 계정 승인 현황 (학생/교사) ── */}
      <div style={{ display: "flex", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 400px", minWidth: 320 }}>
          <StatusBarCard
            title="학생 계정 승인 현황"
            total={rrg("STUDENT", "ACTIVE") + rrg("STUDENT", "PENDING") + rrg("STUDENT", "SUSPENDED") + rrg("STUDENT", "REJECTED")}
            link={ADMIN_ROUTES.STUDENTS.LIST}
            data={makeRRChartData("STUDENT")}
            accentColor="#25A194"
          />
        </div>
        <div style={{ flex: "1 1 400px", minWidth: 320 }}>
          <StatusBarCard
            title="교사 계정 승인 현황"
            total={rrg("TEACHER", "ACTIVE") + rrg("TEACHER", "PENDING") + rrg("TEACHER", "SUSPENDED") + rrg("TEACHER", "REJECTED")}
            link={ADMIN_ROUTES.TEACHERS.LIST}
            data={makeRRChartData("TEACHER")}
            accentColor="#1d4ed8"
          />
        </div>
      </div>

      {/* ── 구분선 ── */}
      <div style={{ borderTop: "1px solid #e5e7eb", marginBottom: 24 }} />

      {/* ── 학급 현황 + 학사 일정 ── */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {/* 학급 현황 */}
        <div style={{ flex: "1 1 400px", minWidth: 320, marginBottom: 24 }}>
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", borderTop: "3px solid #d97706", height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
              <div>
                <h6 style={{ fontWeight: 600, marginBottom: 4, fontSize: 14, color: "#111827" }}>
                  학급 현황
                </h6>
                <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
                  {settings ? `${settings.currentSchoolYear}년 ${settings.currentSemester}학기 편성 학급` : "로딩 중…"}
                </p>
              </div>
              <Link
                to={ADMIN_ROUTES.CLASSES.LIST}
                style={{ fontSize: 12, color: "#6b7280", textDecoration: "none" }}
              >
                관리 →
              </Link>
            </div>
            <div style={{ padding: 20 }}>
              {gradeKeys.length === 0 ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 0", color: "#9ca3af" }}>
                  <div style={{ textAlign: "center" }}>
                    <i className="ri-building-2-line" style={{ fontSize: 28, display: "block", marginBottom: 8 }} />
                    <p style={{ margin: 0, fontSize: 13 }}>
                      {settings ? "편성된 학급이 없습니다." : "로딩 중…"}
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {gradeKeys.map((grade) => {
                    const { count, students } = classesByGrade[grade];
                    return (
                      <div key={grade} style={{ flex: "1 1 80px" }}>
                        <div style={{ textAlign: "center", padding: "16px 8px", borderRadius: 8, background: "#f9fafb" }}>
                          <p style={{ fontWeight: 600, color: "#111827", marginBottom: 6, fontSize: 13 }}>
                            {grade}학년
                          </p>
                          <p style={{ fontWeight: 700, color: "#111827", marginBottom: 4, fontSize: 22, lineHeight: 1.2 }}>
                            {count}
                            <span style={{ fontWeight: 400, marginLeft: 4, fontSize: 13 }}>
                              반
                            </span>
                          </p>
                          <p style={{ color: "#6b7280", margin: 0, fontSize: 11 }}>
                            재학생 {students.toLocaleString()}명
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 다가오는 학사 일정 */}
        <div style={{ flex: "1 1 400px", minWidth: 320, marginBottom: 24 }}>
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", borderTop: "3px solid #0ea5e9", height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
              <div>
                <h6 style={{ fontWeight: 600, marginBottom: 4, fontSize: 14, color: "#111827" }}>
                  다가오는 학사 일정
                </h6>
                <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
                  오늘 이후 60일 이내
                </p>
              </div>
              <Link
                to={ADMIN_ROUTES.MASTER.SCHEDULE}
                style={{ fontSize: 12, color: "#6b7280", textDecoration: "none" }}
              >
                전체 보기 →
              </Link>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {scheduleLoading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0" }}>
                  <div className="spinner-border spinner-border-sm" style={{ color: "#9ca3af" }} />
                </div>
              ) : schedules.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", color: "#9ca3af" }}>
                  <i className="ri-calendar-line" style={{ fontSize: 28, marginBottom: 8 }} />
                  <p style={{ margin: 0, fontSize: 13 }}>
                    예정된 일정이 없습니다.
                  </p>
                </div>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {schedules.map((ev, idx) => {
                    const cfg = EVENT_CFG[ev.eventType] ?? EVENT_CFG.ACADEMIC;
                    const dday = getDday(ev.start);
                    const isLast = idx === schedules.length - 1;
                    return (
                      <li
                        key={ev.id}
                        style={{ padding: "11px 20px", display: "flex", alignItems: "flex-start", gap: 12, borderBottom: isLast ? "none" : "1px solid #e5e7eb" }}
                      >
                        <div
                          style={{ flexShrink: 0, width: 8, height: 8, borderRadius: "50%", background: cfg.color, marginTop: 5 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{ fontWeight: 600, color: "#111827", marginBottom: 4, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          >
                            {ev.title}
                          </p>
                          <p style={{ color: "#6b7280", margin: 0, fontSize: 11 }}>
                            {fmtDate(ev.start, ev.end)}
                            {ev.targetGrade && <span style={{ marginLeft: 4, color: "#9ca3af" }}>· {ev.targetGrade}학년</span>}
                          </p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                          <span
                            style={{ background: cfg.bg, color: cfg.color, fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 5 }}
                          >
                            {cfg.label}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              color: dday === "오늘" ? "#25A194" : "var(--text-secondary-light)",
                              fontWeight: dday === "오늘" ? 700 : 400,
                            }}
                          >
                            {dday}
                          </span>
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
