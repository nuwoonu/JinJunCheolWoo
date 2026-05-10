// [woo] 학부모 자녀 성적 조회 API + 성적 알림 관련
import api from "@/api/client";

// ── 타입 정의 ──────────────────────────────────────────────────

// [woo] 백엔드 GradeResponseDTO 매칭
export interface GradeItem {
  gradeId: number;
  studentId?: number;
  studentName?: string;
  subjectId?: number;
  subjectName: string;
  testType: "MIDTERMTEST" | "FINALTEST" | "QUIZ" | "HOMEWORK" | "PERFORMANCEASSESSMENT";
  score: number;
  schoolYear?: number;
  semester?: number;
  // 학급 비교 정보 (class-info API에서 별도 조회)
  classAverage?: number;
  classRank?: number;
  classTotal?: number;
}

export interface ChildGradeInfo {
  studentInfoId: number;
  name: string;
  grade: number;
  classNum: number;
}

export interface TermInfo {
  id: number;
  schoolYear: number;
  semester: number;
  label: string; // "2026학년도 1학기"
}

// [woo] 백엔드 SubjectClassAvgDTO 매칭
export interface SubjectAvgDTO {
  subjectName: string;
  midtermAvg?: number;
  finalAvg?: number;
  quizAvg?: number;
  homeworkAvg?: number;
}

// [woo] 백엔드 ChildClassInfoDTO 매칭
export interface ClassInfo {
  homeroomTeacherName?: string;
  className?: string;
  termId?: number;
  classAvgs?: SubjectAvgDTO[];
  gradeAvgs?: SubjectAvgDTO[];
}

// ── 시험 유형 라벨 ──────────────────────────────────────────────

// [woo] 백엔드 TestType enum 값과 동일하게 맞춤
export const TEST_TYPE_LABEL: Record<string, string> = {
  MIDTERMTEST: "중간고사",
  FINALTEST: "기말고사",
  QUIZ: "퀴즈",
  HOMEWORK: "과제",
  PERFORMANCEASSESSMENT: "수행평가",
};

// ── API 함수 ──────────────────────────────────────────────────

// [woo] 학부모: 자녀 목록 (성적용)
export const getMyChildren = () =>
  api.get<ChildGradeInfo[]>("/grades/my-children").then((r) => r.data);

// [woo] 학부모: 자녀 성적 조회
export const getChildGrades = (studentInfoId: number, termId?: number) =>
  api
    .get<GradeItem[]>(`/grades/child/${studentInfoId}`, {
      params: termId ? { termId } : undefined,
    })
    .then((r) => r.data);

// [woo] 학부모: 자녀 학급 비교 정보
export const getChildClassInfo = (studentInfoId: number, termId?: number) =>
  api
    .get<ClassInfo>(`/grades/child/${studentInfoId}/class-info`, {
      params: termId ? { termId } : undefined,
    })
    .then((r) => r.data);

// [woo] 학기 목록 조회
export const getTerms = () =>
  api.get<TermInfo[]>("/grades/terms").then((r) => r.data);
