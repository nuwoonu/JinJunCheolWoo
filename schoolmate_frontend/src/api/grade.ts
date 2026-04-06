import api from "./auth";

// [woo] 성적 API

export type TestType = "MIDTERMTEST" | "FINALTEST" | "QUIZ" | "HOMEWORK";

export const TEST_TYPE_LABELS: Record<TestType, string> = {
  MIDTERMTEST: "중간고사",
  FINALTEST: "기말고사",
  QUIZ: "퀴즈",
  HOMEWORK: "과제",
};

export interface CourseSectionDTO {
  courseSectionId: number;
  subjectId: number;
  subjectName: string;
  classroomId: number;
  grade: number;
  classNum: number;
  className: string;
  schoolYear: number;
  semester: number;
  /** [woo] 담임교사 권한으로 열람 가능한 분반 (본인 담당 분반 아님 → 성적 입력 불가) */
  homeroomAccess: boolean;
}

export interface GradeResponseDTO {
  gradeId: number | null;
  studentId: number;
  studentName: string;
  attendanceNum: number | null;
  subjectId: number;
  subjectName: string;
  testType: TestType;
  score: number | null;
  schoolYear: number;
  semester: number;
}

export interface GradeInputDTO {
  courseSectionId: number;
  studentId: number;
  testType: TestType;
  score: number;
}

export interface TermDTO {
  termId: number;
  schoolYear: number;
  semester: number;
  displayName: string;
  active: boolean;
}

export interface SectionRatioDTO {
  sectionId: number;
  subjectId?: number;
  subjectName?: string;
  midtermRatio: number;
  finalRatio: number;
  quizRatio: number;
  homeworkRatio: number;
}

// [woo] 교사: 내 분반 목록
export const getMyCourseSections = (termId?: number) =>
  api.get<CourseSectionDTO[]>("/grades/my-sections", { params: { termId } });

// [woo] 교사: 분반 학생 목록 (성적 포함)
export const getSectionStudents = (sectionId: number, testType: string) =>
  api.get<GradeResponseDTO[]>(`/grades/section/${sectionId}/students`, {
    params: { testType },
  });

// [woo] 교사: 성적 입력 (단건)
export const inputGrade = (dto: GradeInputDTO) =>
  api.post<GradeResponseDTO>("/grades", dto);

// [woo] 교사: 성적 일괄 입력
export const inputGradeBatch = (dtos: GradeInputDTO[]) =>
  api.post<GradeResponseDTO[]>("/grades/batch", dtos);

// [woo] 교사: 성적 수정
export const updateGrade = (gradeId: number, score: number) =>
  api.put<GradeResponseDTO>(`/grades/${gradeId}`, { score });


// [woo] 학생: 본인 성적
export const getMyGrades = (termId?: number) =>
  api.get<GradeResponseDTO[]>("/grades/my", { params: { termId } });

// [woo] 학부모: 자녀 성적
export const getChildGrades = (studentInfoId: number, termId?: number) =>
  api.get<GradeResponseDTO[]>(`/grades/child/${studentInfoId}`, {
    params: { termId },
  });

// [woo] 학생: 본인 학급 평균 비교
export const getMyClassInfo = (termId?: number) =>
  api.get<ChildClassInfoDTO>("/grades/my/class-info", { params: { termId } });

// [woo] 학기 목록
export const getTerms = () => api.get<TermDTO[]>("/grades/terms");

// [woo] 학부모: 자녀 담임교사 + 학급 비교 정보
export interface SubjectClassAvgDTO {
  subjectName: string;
  midtermAvg: number | null;
  finalAvg: number | null;
  quizAvg: number | null;
  homeworkAvg: number | null;
}

export interface ChildClassInfoDTO {
  homeroomTeacherName: string | null;
  className: string | null;
  termId: number;
  classAvgs: SubjectClassAvgDTO[];
  // [woo] 학년 전체 평균 (동일 학교 + 동일 학년 모든 반)
  gradeAvgs: SubjectClassAvgDTO[];
}

export const getChildClassInfo = (studentInfoId: number, termId?: number) =>
  api.get<ChildClassInfoDTO>(`/grades/child/${studentInfoId}/class-info`, { params: { termId } });


// [woo] 분반 비율 설정 조회
export const getSectionRatio = (sectionId: number) =>
  api.get<SectionRatioDTO>(`/grades/section/${sectionId}/ratio`);

// [woo] 분반 비율 설정 저장
export const setSectionRatio = (sectionId: number, dto: SectionRatioDTO) =>
  api.put<SectionRatioDTO>(`/grades/section/${sectionId}/ratio`, dto);

// [woo] 분반 성적 요약 타입
export interface StudentSummaryDTO {
  studentId: number;
  studentName: string;
  attendanceNum: number | null;
  midterm: number | null;
  finalExam: number | null;
  quiz: number | null;
  homework: number | null;
  finalScore: number | null;
  grade: string | null;
  rank: number | null;
  submissionRate: number | null;
}

export interface SectionSummaryDTO {
  students: StudentSummaryDTO[];
  ratio: SectionRatioDTO;
  stats: {
    totalStudents: number;
    average: number;
    gradeDist: Record<string, number>;
    scoreDist: Record<string, number>;
  };
  subjectName: string;
  schoolYear: number;
  semester: number;
  ratioSet: boolean; // [woo] false면 비율 미설정 → 성적 미표시
  ungradedCount: number; // [woo] 마감된 과제 중 미채점 제출 수
}

// [woo] 분반 성적 요약 대시보드 조회
export const getSectionSummary = (sectionId: number) =>
  api.get<SectionSummaryDTO>(`/grades/section/${sectionId}/summary`);
