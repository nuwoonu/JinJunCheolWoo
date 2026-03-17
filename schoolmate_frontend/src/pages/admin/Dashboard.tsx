import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Rectangle,
} from "recharts";
import AdminLayout from '@/components/layout/admin/AdminLayout';
import admin from '@/api/adminApi';
import { ADMIN_ROUTES } from '@/constants/routes';
import { useSchool } from '@/context/SchoolContext';

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
  ACTIVE: "#25A194", EMPLOYED: "#25A194", ENROLLED: "#25A194",
  // 대기
  PENDING: "#0ea5e9",
  // 휴직/휴학
  LEAVE: "#d97706", LEAVE_OF_ABSENCE: "#d97706",
  // 퇴직/졸업
  RETIRED: "#6366f1", GRADUATED: "#6366f1",
  // 비활성/기타
  INACTIVE: "#94a3b8", OTHERS: "#94a3b8",
  DISPATCHED: "#a78bfa",
  // 차단/제적
  BLOCKED: "#ef4444", EXPELLED: "#ef4444",
};

const EVENT_CFG: Record<string, { label: string; color: string; bg: string }> = {
  ACADEMIC: { label: "학사", color: "#25A194", bg: "rgba(37,161,148,0.12)" },
  HOLIDAY:  { label: "휴일", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  EXAM:     { label: "시험", color: "#d97706", bg: "rgba(217,119,6,0.12)" },
  EVENT:    { label: "행사", color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  VACATION: { label: "방학", color: "#0ea5e9", bg: "rgba(14,165,233,0.12)" },
};

function getDday(start: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(start.split("T")[0]); target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "오늘";
  return diff < 0 ? `D+${Math.abs(diff)}` : `D-${diff}`;
}

function fmtDate(start: string, end: string) {
  const s = start.split("T")[0], e = end.split("T")[0];
  return s === e ? s : `${s} ~ ${e}`;
}

/** 엔드포인트별 상태 인원 수 병렬 조회 */
async function fetchStatusCounts(
  endpoint: string,
  statuses: string[],
): Promise<Record<string, number>> {
  const results = await Promise.allSettled(
    statuses.map((s) =>
      admin
        .get(`/${endpoint}?status=${s}&size=1&page=0`)
        .then((r) => [s, (r.data.totalElements as number | undefined) ?? 0] as const)
        .catch(() => [s, 0] as const),
    ),
  );
  return Object.fromEntries(
    results
      .filter(
        (r): r is PromiseFulfilledResult<readonly [string, number]> =>
          r.status === "fulfilled",
      )
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
  data: { name: string; value: number; color: string }[];
  accentColor: string;
}) {
  const chartHeight = Math.max(data.length * 36 + 20, 100);
  return (
    <div className="card h-100" style={{ borderTop: `3px solid ${accentColor}` }}>
      <div className="d-flex align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">
        <div>
          <h6 className="fw-semibold mb-1" style={{ fontSize: 14 }}>{title}</h6>
          <p className="text-secondary-light mb-0" style={{ fontSize: 12 }}>
            총{" "}
            <span className="fw-semibold text-primary-light">
              {total.toLocaleString()}
            </span>
            {unit}
          </p>
        </div>
        <Link
          to={link}
          className="text-secondary-light text-decoration-none"
          style={{ fontSize: 12 }}
        >
          관리 →
        </Link>
      </div>
      <div className="card-body px-16 py-12">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 0, right: 28, left: 0, bottom: 0 }}
            barSize={16}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="var(--neutral-200)"
            />
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
                <Rectangle {...props} fill={data[props.index]?.color ?? props.fill} radius={[0, 4, 4, 0]} />
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
    totalStudents: 0, totalTeachers: 0, totalStaffs: 0,
  });
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [teacherCounts, setTeacherCounts] = useState<Record<string, number>>({});
  const [staffCounts,   setStaffCounts]   = useState<Record<string, number>>({});
  const [classesByGrade, setClassesByGrade] = useState<
    Record<number, { count: number; students: number }>
  >({});
  const [schedules, setSchedules] = useState<ScheduleEvent[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);

  useEffect(() => {
    // 기본 stats
    admin.get("/dashboard/stats").then((r) => setStats(r.data)).catch(() => {});
    // 시스템 설정
    admin.get("/settings").then((r) => setSettings(r.data)).catch(() => {});

    // 각 구성원 상태별 인원 병렬 조회
    fetchStatusCounts("students", ["ENROLLED", "LEAVE_OF_ABSENCE", "GRADUATED", "DROPOUT"]).then(setStudentCounts);
    fetchStatusCounts("teachers", ["EMPLOYED", "PENDING", "LEAVE", "RETIRED"]).then(setTeacherCounts);
    fetchStatusCounts("staffs",   ["EMPLOYED", "LEAVE", "DISPATCHED", "RETIRED"]).then(setStaffCounts);

    // 학사 일정 (오늘 ~ 60일 후)
    const end = new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0];
    admin
      .get(`/schedule?start=${today}&end=${end}`)
      .then((r) => {
        const data: ScheduleEvent[] = Array.isArray(r.data) ? r.data : [];
        setSchedules(
          data
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
            .slice(0, 8),
        );
      })
      .catch(() => setSchedules([]))
      .finally(() => setScheduleLoading(false));
  }, [today]);

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

  const studentTotal = stats.totalStudents;
  const studentKnown = g(studentCounts, "ENROLLED") + g(studentCounts, "LEAVE_OF_ABSENCE") + g(studentCounts, "GRADUATED") + g(studentCounts, "DROPOUT");
  const studentChartData = [
    { name: "재학",  value: g(studentCounts, "ENROLLED"),          color: STATUS_COLOR.ENROLLED },
    { name: "휴학",  value: g(studentCounts, "LEAVE_OF_ABSENCE"),  color: STATUS_COLOR.LEAVE_OF_ABSENCE },
    { name: "졸업",  value: g(studentCounts, "GRADUATED"),         color: STATUS_COLOR.GRADUATED },
    { name: "자퇴",  value: g(studentCounts, "DROPOUT"),           color: STATUS_COLOR.EXPELLED },
    { name: "기타",  value: Math.max(0, studentTotal - studentKnown), color: STATUS_COLOR.OTHERS },
  ].filter((d) => d.value > 0 || d.name === "재학");

  const teacherChartData = [
    { name: "재직", value: g(teacherCounts, "EMPLOYED") || stats.totalTeachers, color: STATUS_COLOR.EMPLOYED },
    { name: "대기", value: g(teacherCounts, "PENDING"),  color: STATUS_COLOR.PENDING },
    { name: "휴직", value: g(teacherCounts, "LEAVE"),    color: STATUS_COLOR.LEAVE },
    { name: "퇴직", value: g(teacherCounts, "RETIRED"),  color: STATUS_COLOR.RETIRED },
  ];

  const staffChartData = [
    { name: "재직", value: g(staffCounts, "EMPLOYED") || stats.totalStaffs, color: STATUS_COLOR.EMPLOYED },
    { name: "휴직", value: g(staffCounts, "LEAVE"),      color: STATUS_COLOR.LEAVE },
    { name: "파견", value: g(staffCounts, "DISPATCHED"), color: STATUS_COLOR.DISPATCHED },
    { name: "퇴직", value: g(staffCounts, "RETIRED"),    color: STATUS_COLOR.RETIRED },
  ];

  const gradeKeys = Object.keys(classesByGrade).map(Number).sort((a, b) => a - b);

  return (
    <AdminLayout>
      {/* 헤더 */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-0">관리자 대시보드</h6>
          <p className="text-neutral-600 mt-4 mb-0">
            {selectedSchool ? (
              <>
                <span className="fw-semibold">{selectedSchool.name}</span>
                <span className="text-muted ms-1 small">
                  ({selectedSchool.schoolKind} · {selectedSchool.officeOfEducation})
                </span>
              </>
            ) : (
              "학교 관리 시스템 현황을 한눈에 확인합니다."
            )}
          </p>
        </div>
        <span className="text-muted" style={{ fontSize: 13 }}>{today}</span>
      </div>

      {/* ── 구성원 현황 차트 3개 ── */}
      <div className="row g-24 mb-24">
        <div className="col-xl-4 col-md-6">
          <StatusBarCard
            title="학생 현황"
            total={stats.totalStudents}
            link={ADMIN_ROUTES.STUDENTS.LIST}
            data={studentChartData}
            accentColor="#25A194"
          />
        </div>
        <div className="col-xl-4 col-md-6">
          <StatusBarCard
            title="교사 현황"
            total={stats.totalTeachers}
            link={ADMIN_ROUTES.TEACHERS.LIST}
            data={teacherChartData}
            accentColor="#1d4ed8"
          />
        </div>
        <div className="col-xl-4 col-md-6">
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
      <div className="border-top border-neutral-200 mb-24" />

      {/* ── 학급 현황 + 학사 일정 ── */}
      <div className="row g-24">

        {/* 학급 현황 */}
        <div className="col-lg-6 mb-24">
          <div className="card h-100" style={{ borderTop: "3px solid #d97706" }}>
            <div className="d-flex align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">
              <div>
                <h6 className="fw-semibold mb-1" style={{ fontSize: 14 }}>학급 현황</h6>
                <p className="text-secondary-light mb-0" style={{ fontSize: 12 }}>
                  {settings
                    ? `${settings.currentSchoolYear}년 ${settings.currentSemester}학기 편성 학급`
                    : "로딩 중…"}
                </p>
              </div>
              <Link
                to={ADMIN_ROUTES.CLASSES.LIST}
                className="text-secondary-light text-decoration-none"
                style={{ fontSize: 12 }}
              >
                관리 →
              </Link>
            </div>
            <div className="card-body px-20 py-20">
              {gradeKeys.length === 0 ? (
                <div className="d-flex align-items-center justify-content-center h-100 py-24 text-neutral-400">
                  <div className="text-center">
                    <i className="ri-building-2-line d-block mb-8" style={{ fontSize: 28 }} />
                    <p className="mb-0" style={{ fontSize: 13 }}>
                      {settings ? "편성된 학급이 없습니다." : "로딩 중…"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="row g-16">
                  {gradeKeys.map((grade) => {
                    const { count, students } = classesByGrade[grade];
                    return (
                      <div key={grade} className="col-4">
                        <div
                          className="text-center py-16 px-8 radius-8"
                          style={{ background: "var(--neutral-50)" }}
                        >
                          <p
                            className="fw-semibold text-primary-light mb-6"
                            style={{ fontSize: 13 }}
                          >
                            {grade}학년
                          </p>
                          <p
                            className="fw-bold text-primary-light mb-4"
                            style={{ fontSize: 22, lineHeight: 1.2 }}
                          >
                            {count}
                            <span
                              className="fw-normal ms-1"
                              style={{ fontSize: 13 }}
                            >
                              반
                            </span>
                          </p>
                          <p
                            className="text-secondary-light mb-0"
                            style={{ fontSize: 11 }}
                          >
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
        <div className="col-lg-6 mb-24">
          <div className="card h-100" style={{ borderTop: "3px solid #0ea5e9", display: "flex", flexDirection: "column" }}>
            <div className="d-flex align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">
              <div>
                <h6 className="fw-semibold mb-1" style={{ fontSize: 14 }}>다가오는 학사 일정</h6>
                <p className="text-secondary-light mb-0" style={{ fontSize: 12 }}>
                  오늘 이후 60일 이내
                </p>
              </div>
              <Link
                to={ADMIN_ROUTES.MASTER.SCHEDULE}
                className="text-secondary-light text-decoration-none"
                style={{ fontSize: 12 }}
              >
                전체 보기 →
              </Link>
            </div>
            <div className="card-body p-0" style={{ flex: 1, overflowY: "auto" }}>
              {scheduleLoading ? (
                <div className="d-flex align-items-center justify-content-center h-100 py-40">
                  <div className="spinner-border spinner-border-sm text-neutral-400" />
                </div>
              ) : schedules.length === 0 ? (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 py-40 text-neutral-400">
                  <i className="ri-calendar-line mb-8" style={{ fontSize: 28 }} />
                  <p className="mb-0" style={{ fontSize: 13 }}>예정된 일정이 없습니다.</p>
                </div>
              ) : (
                <ul className="list-unstyled mb-0">
                  {schedules.map((ev, idx) => {
                    const cfg = EVENT_CFG[ev.eventType] ?? EVENT_CFG.ACADEMIC;
                    const dday = getDday(ev.start);
                    const isLast = idx === schedules.length - 1;
                    return (
                      <li
                        key={ev.id}
                        className={`px-20 py-11 d-flex align-items-start gap-12${!isLast ? " border-bottom border-neutral-200" : ""}`}
                      >
                        <div
                          className="flex-shrink-0"
                          style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: cfg.color, marginTop: 5,
                          }}
                        />
                        <div className="flex-grow-1 min-w-0">
                          <p
                            className="fw-semibold text-primary-light mb-1"
                            style={{
                              fontSize: 13,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}
                          >
                            {ev.title}
                          </p>
                          <p className="text-secondary-light mb-0" style={{ fontSize: 11 }}>
                            {fmtDate(ev.start, ev.end)}
                            {ev.targetGrade && (
                              <span className="ms-1 text-neutral-400">· {ev.targetGrade}학년</span>
                            )}
                          </p>
                        </div>
                        <div className="d-flex flex-column align-items-end gap-4 flex-shrink-0">
                          <span
                            className="badge"
                            style={{
                              background: cfg.bg, color: cfg.color,
                              fontSize: 9, fontWeight: 600,
                              padding: "2px 6px", borderRadius: 5,
                            }}
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
