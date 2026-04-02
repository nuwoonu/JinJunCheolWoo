import api from "@/api/auth";

// [woo] 성적 시스템 API 함수 모음

export interface GradeInputRequest {
  classroomId: number;
  studentId: number;
  subjectId: number;
  testType: "MIDTERMTEST" | "FINALTEST";
  semester: string;
  schoolYear: number;
  score: number;
}

export interface GradeRatioRequest {
  classroomId: number;
  subjectId: number;
  semester: string;
  schoolYear: number;
  midtermRatio: number;
  finalRatio: number;
  homeworkRatio: number;
  quizRatio: number;
}

export interface FinalGradeCalcRequest {
  classroomId: number;
  subjectId: number;
  semester: string;
  schoolYear: number;
}

// 교사: 접근 가능한 학급 목록 (담임반 + 담당 학생 학급)
export const getMyGradeClassrooms = () =>
  api.get("/teacher/grade/my-classrooms");

// 교사: 학교 과목 목록
export const getSubjectList = () =>
  api.get("/teacher/grade/subjects");

// 교사: 학급+과목 성적 목록
export const getClassGrades = (
  classroomId: number,
  subjectId: number,
  semester: string,
  schoolYear: number
) =>
  api.get(
    `/teacher/grade/classroom/${classroomId}/subject/${subjectId}`,
    { params: { semester, schoolYear } }
  );

// 교사: 성적 입력 (upsert)
export const inputGrade = (data: GradeInputRequest) =>
  api.post("/teacher/grade", data);

// 교사: 성적 수정
export const updateGrade = (gradeId: number, score: number) =>
  api.put(`/teacher/grade/${gradeId}`, { score });

// 교사: 성적 삭제
export const deleteGrade = (gradeId: number) =>
  api.delete(`/teacher/grade/${gradeId}`);

// 교사: 비율 조회
export const getGradeRatio = (
  classroomId: number,
  subjectId: number,
  semester: string,
  schoolYear: number
) =>
  api.get(`/teacher/grade/ratio/${classroomId}/${subjectId}`, {
    params: { semester, schoolYear },
  });

// 교사: 비율 설정
export const setGradeRatio = (data: GradeRatioRequest) =>
  api.post("/teacher/grade/ratio", data);

// 교사: FinalGrade 계산 트리거
export const calculateFinalGrades = (data: FinalGradeCalcRequest) =>
  api.post("/teacher/final-grade/calculate", data);

// 교사: 학급 최종 성적 목록
export const getClassFinalGrades = (
  classroomId: number,
  subjectId: number,
  semester: string,
  schoolYear: number
) =>
  api.get(
    `/teacher/final-grade/classroom/${classroomId}/subject/${subjectId}`,
    { params: { semester, schoolYear } }
  );

// 학생/학부모: 학생 최종 성적 조회
export const getStudentFinalGrades = (
  studentId: number,
  semester?: string,
  schoolYear?: number
) =>
  api.get(`/grades/student/${studentId}/final`, {
    params: { semester, schoolYear },
  });
