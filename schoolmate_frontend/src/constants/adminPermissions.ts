/**
 * 어드민 권한 상수 관리
 *
 * 백엔드 GrantedRole enum과 1:1 대응.
 * GrantedRole 추가·변경 시 이 파일만 수정하면 PrivateRoute, App.tsx, AdminMain 전부 반영됨.
 */

// ─── GrantedRole 값 상수 ──────────────────────────────────────────────────────
export const GRANTED_ROLE = {
  SUPER_ADMIN:      'SUPER_ADMIN',
  SCHOOL_ADMIN:     'SCHOOL_ADMIN',
  STUDENT_MANAGER:  'STUDENT_MANAGER',
  TEACHER_MANAGER:  'TEACHER_MANAGER',
  STAFF_MANAGER:    'STAFF_MANAGER',
  PARENT_MANAGER:   'PARENT_MANAGER',
  CLASS_MANAGER:    'CLASS_MANAGER',
  NOTICE_MANAGER:   'NOTICE_MANAGER',
  SCHEDULE_MANAGER: 'SCHEDULE_MANAGER',
  FACILITY_MANAGER: 'FACILITY_MANAGER',
  ASSET_MANAGER:    'ASSET_MANAGER',
  LIBRARIAN:        'LIBRARIAN',
  NURSE:            'NURSE',
  NUTRITIONIST:     'NUTRITIONIST',
} as const;

// ─── 공통 그룹 ────────────────────────────────────────────────────────────────
/** 학교 전체 관리 권한 (SCHOOL_ADMIN 이상). 하위 모든 기능 접근 허용 */
const SCHOOL_LEVEL = [GRANTED_ROLE.SUPER_ADMIN, GRANTED_ROLE.SCHOOL_ADMIN] as const;

// ─── 페이지(섹션)별 허용 Grant 목록 ──────────────────────────────────────────
/**
 * ADMIN_GRANTS[섹션] = 해당 어드민 페이지에 접근 가능한 GrantedRole 목록
 *
 * ADMIN role(UserRole.ADMIN) 사용자는 grants 체크 없이 항상 통과.
 * 이 목록은 GrantedRole 위임 권한자에게만 적용됨.
 */
export const ADMIN_GRANTS = {
  /** 대시보드: 어드민 접근 권한이 있는 모든 grant */
  DASHBOARD: Object.values(GRANTED_ROLE),

  /** 학생 관리 */
  STUDENTS:  [...SCHOOL_LEVEL, GRANTED_ROLE.STUDENT_MANAGER],

  /** 교사 관리 */
  TEACHERS:  [...SCHOOL_LEVEL, GRANTED_ROLE.TEACHER_MANAGER],

  /** 교직원 관리 */
  STAFFS:    [...SCHOOL_LEVEL, GRANTED_ROLE.STAFF_MANAGER],

  /** 학부모 관리 */
  PARENTS:   [...SCHOOL_LEVEL, GRANTED_ROLE.PARENT_MANAGER],

  /** 학급 관리 */
  CLASSES:   [...SCHOOL_LEVEL, GRANTED_ROLE.CLASS_MANAGER],

  /** 공지사항 관리 */
  NOTICES:   [...SCHOOL_LEVEL, GRANTED_ROLE.NOTICE_MANAGER],

  /** 학사 일정 관리 */
  SCHEDULE:  [...SCHOOL_LEVEL, GRANTED_ROLE.SCHEDULE_MANAGER],

  /** 시설 관리 */
  FACILITIES: [...SCHOOL_LEVEL, GRANTED_ROLE.FACILITY_MANAGER],

  /** 기자재 관리 */
  ASSETS:    [...SCHOOL_LEVEL, GRANTED_ROLE.ASSET_MANAGER],

  /** 기준 정보 (교과목·시스템 설정): SUPER_ADMIN 전용 */
  MASTER:    [GRANTED_ROLE.SUPER_ADMIN],

  /** 감사 로그: SUPER_ADMIN 전용 */
  AUDIT:     [GRANTED_ROLE.SUPER_ADMIN],
} as const;

export type AdminGrantSection = keyof typeof ADMIN_GRANTS;
