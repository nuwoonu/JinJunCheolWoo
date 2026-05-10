// [woo] 교사 전용 API
import api from "@/api/client";

export interface AttendanceRecord {
  id: number;
  studentInfoId: number;
  studentName: string;
  studentNumber: number;
  status: "PRESENT" | "LATE" | "ABSENT" | "EARLY_LEAVE" | "SICK" | "NONE";
}

export interface Schedule {
  id: number;
  dayOfWeek: string;
  period: number;
  startTime: string;
  endTime: string;
  subjectName: string;
  className?: string;
  location?: string;
  memo?: string;
}

export interface BoardPost {
  id: number;
  title: string;
  content: string;
  writerName: string;
  createDate: string;
  viewCount: number;
}

export interface HomeworkItem {
  id: number;
  title: string;
  subjectName?: string;
  dueDate: string;
  status: string;
  submissionCount?: number;
  totalCount?: number;
}

// 오늘 수업 일정
export const getTodaySchedules = () =>
  api.get<{ label: string; schedules: Schedule[] }>("/teacher/schedule/today").then((r) => r.data);

// 학급 출결 목록
export const getClassAttendance = (date: string) =>
  api.get<AttendanceRecord[]>(`/attendance/student?date=${date}`).then((r) => r.data).catch(() => []);

// 출결 변경
export const updateAttendance = (studentInfoId: number, date: string, status: string) =>
  api.put(`/attendance/student/update?studentInfoId=${studentInfoId}&date=${date}`, { status });

// 전원 출석 처리
export const markAllPresent = (date: string) =>
  api.post(`/attendance/student/all-present?date=${date}`);

// 알림장 목록
export const getClassDiary = (page = 0) =>
  api.get(`/board/class-diary?page=${page}&size=20`).then((r) => r.data);

// 가정통신문 목록
export const getParentNotices = (page = 0) =>
  api.get(`/board/parent-notice?page=${page}&size=20`).then((r) => r.data);

// 교직원 게시판
export const getTeacherBoard = (page = 0) =>
  api.get(`/board/teacher-board?page=${page}&size=20`).then((r) => r.data);

// 게시글 상세
export const getBoardDetail = (id: number) =>
  api.get(`/board/${id}`).then((r) => r.data);

// 게시글 등록
export const createBoardPost = (data: { title: string; content: string; boardType: string }) =>
  api.post("/board", data).then((r) => r.data);

// 과제 목록
export const getHomeworkList = (page = 0) =>
  api.get(`/homework?page=${page}&size=20`).then((r) => r.data).catch(() => ({ content: [] }));

// 학급 학생 목록
export const getMyClassStudents = () =>
  api.get("/teacher/myclass").then((r) => r.data);
