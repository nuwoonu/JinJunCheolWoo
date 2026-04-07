// [woo] 학생 전용 API
import api from "@/api/client";

export interface HomeworkItem {
  id: number;
  title: string;
  subjectName?: string;
  teacherName?: string;
  dueDate: string;
  status: "OPEN" | "CLOSED" | "GRADED"; // HomeworkStatus
  submitted?: boolean;
  submissionStatus?: "SUBMITTED" | "LATE" | "GRADED"; // HomeworkSubmission.SubmissionStatus
}

export interface QuizItem {
  id: number;
  title: string;
  subjectName?: string;
  dueDate: string;
  status: string;
}

export interface BoardPost {
  id: number;
  title: string;
  content: string;
  writerName: string;
  createDate: string;
  viewCount: number;
}

export interface AttendanceRecord {
  date: string;
  status: "PRESENT" | "LATE" | "ABSENT" | "EARLY_LEAVE" | "SICK" | "NONE";
}

// 대시보드 데이터
export const getStudentDashboard = () =>
  api.get("/dashboard/student").then((r) => r.data);

// 과제 목록
export const getHomeworkList = (page = 0) =>
  api.get(`/homework/student?page=${page}&size=20`).then((r) => r.data).catch(() => ({ content: [] }));

// 퀴즈 목록
export const getQuizList = (page = 0) =>
  api.get(`/quiz/student?page=${page}&size=20`).then((r) => r.data).catch(() => ({ content: [] }));

// 게시글 상세
export const getBoardDetail = (id: number) =>
  api.get(`/board/${id}`).then((r) => r.data);

// 공지사항 목록
export const getSchoolNotices = (page = 0) =>
  api.get(`/board/school-notice?page=${page}&size=20`).then((r) => r.data);

// 알림장
export const getClassDiary = (page = 0) =>
  api.get(`/board/class-diary?page=${page}&size=20`).then((r) => r.data);

// 학급 게시판
export const getClassBoard = (page = 0) =>
  api.get(`/board/class-board?page=${page}&size=20`).then((r) => r.data);

// 내 출결 (월별 - 백엔드 구현 필요 시 대체)
export const getMyAttendance = (date: string) =>
  api.get(`/attendance/student?date=${date}`).then((r) => r.data).catch(() => []);

// [woo] 오늘 시간표 (NEIS) — /api/calendar/timetable
export const getStudentTimetable = (grade: number, classNum: number, schoolId?: number) => {
  let url = `/calendar/timetable?grade=${grade}&classNum=${classNum}`;
  if (schoolId) url += `&schoolId=${schoolId}`;
  return api.get(url).then((r) => r.data ?? []).catch(() => []);
};
