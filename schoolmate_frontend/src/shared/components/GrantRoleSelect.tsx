const GRANT_ROLES = [
  { value: "SCHOOL_ADMIN",     label: "학교 관리자 (전체 관리)" },
  { value: "STUDENT_MANAGER",  label: "학생 관리" },
  { value: "TEACHER_MANAGER",  label: "교사 관리" },
  { value: "STAFF_MANAGER",    label: "교직원 관리" },
  { value: "CLASS_MANAGER",    label: "학급 관리" },
  { value: "PARENT_MANAGER",   label: "학부모 관리" },
  { value: "SCHEDULE_MANAGER", label: "일정 관리" },
  { value: "NOTICE_MANAGER",   label: "공지 관리" },
  { value: "FACILITY_MANAGER", label: "시설 관리" },
  { value: "ASSET_MANAGER",    label: "기자재 관리" },
  { value: "DORMITORY_MANAGER",label: "기숙사 관리" },
  { value: "LIBRARIAN",        label: "도서 관리" },
  { value: "NURSE",            label: "보건 관리" },
  { value: "NUTRITIONIST",     label: "급식 관리" },
];

interface GrantRoleSelectProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * 관리 권한 부여 드롭다운 (교사/교직원 등록 시 공용)
 */
export default function GrantRoleSelect({ value, onChange }: GrantRoleSelectProps) {
  return (
    <div className="col-md-12">
      <label className="form-label fw-bold">관리 권한 부여</label>
      <select
        className="form-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">권한 없음</option>
        {GRANT_ROLES.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
      <div className="form-text">등록 즉시 해당 관리 권한이 부여됩니다.</div>
    </div>
  );
}
