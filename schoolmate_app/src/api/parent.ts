// [woo] 학부모 전용 API
import api from "@/api/client";

export interface Child {
  id: number;           // [woo] user uid — board API의 studentUserUid
  studentInfoId: number | null; // [woo] StudentInfo.id — 출결 API용
  name: string;
  grade: number | null;
  classNum: number | null;
  schoolName: string | null;
  classroomId: number | null;
}

// [woo] 백엔드 AttendanceDTO.ChildAttendanceRecord 매칭
export interface ChildAttendanceRecord {
  id?: number;
  attendanceDate: string; // "YYYY-MM-DD" (LocalDate 직렬화)
  status: "PRESENT" | "LATE" | "ABSENT" | "EARLY_LEAVE" | "SICK" | "NONE";
  statusDesc?: string;
  checkInTime?: string;
  reason?: string;
}

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

export interface BoardPost {
  id: number;
  title: string;
  content: string;
  writerName: string;
  createDate: string;
  viewCount: number;
}

// [woo] 백엔드 ReservationDTO.Response 매칭
export interface Consultation {
  id: number;
  date: string;           // LocalDate 직렬화 (YYYY-MM-DD)
  startTime: string;      // LocalTime 직렬화 (HH:mm:ss)
  endTime?: string;
  writerName: string;     // 예약자 이름
  content?: string;       // 상담 내용/메모
  status: string;         // "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED"
  studentName?: string;
  studentNumber?: string;
  consultationType?: string; // "VISIT" | "PHONE"
  isMine?: boolean;
}

// 자녀 목록 조회
export const getChildren = () =>
  api.get<{ children: Child[] }>("/dashboard/parent").then((r) => r.data.children ?? []);

// [woo] 특정 자녀 월별 출결 상세 조회 — 경로: /attendance/parent/children/{studentInfoId}
export const getChildAttendanceRecords = (
  studentInfoId: number,
  year: number,
  month: number
) => {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return api
    .get<ChildAttendanceRecord[]>(
      `/attendance/parent/children/${studentInfoId}?startDate=${start}&endDate=${end}`
    )
    .then((r) => r.data)
    .catch(() => [] as ChildAttendanceRecord[]);
};

// 자녀 과제 목록
export const getChildHomework = (childId: number) =>
  api.get<{ content: HomeworkItem[] }>(`/homework/parent/${childId}`)
    .then((r) => Array.isArray(r.data) ? r.data : r.data.content ?? [])
    .catch(() => [] as HomeworkItem[]);

// 가정통신문 목록 — [woo] studentUid 전달 시 해당 자녀 학급 기준 필터링
export const getParentNotices = (page = 0, studentUid?: number) =>
  api.get(`/board/parent-notice?page=${page}&size=20${studentUid ? `&studentUserUid=${studentUid}` : ""}`).then((r) => r.data);

// 알림장 목록 — [woo] studentUid 전달 시 해당 자녀 학급 기준 필터링
export const getClassDiary = (page = 0, studentUid?: number) =>
  api.get(`/board/class-diary?page=${page}&size=20${studentUid ? `&studentUserUid=${studentUid}` : ""}`).then((r) => r.data);

// 학부모 게시판 목록
export const getParentBoard = (page = 0) =>
  api.get(`/board/parent?page=${page}&size=20`).then((r) => r.data);

// 게시글 상세
export const getBoardDetail = (id: number) =>
  api.get(`/board/${id}`).then((r) => r.data);

// [woo] 상담 목록 — 경로: /consultation/reservations/my
export const getConsultations = (studentUserUid?: number) =>
  api
    .get<Consultation[]>(
      `/consultation/reservations/my${studentUserUid ? `?studentUserUid=${studentUserUid}` : ""}`
    )
    .then((r) => r.data)
    .catch(() => []);

// [woo] 상담 예약 생성 — 백엔드 ReservationDTO.CreateRequest 매칭
export const createConsultation = (data: {
  date: string;
  startTime: string;
  endTime: string;
  content?: string;
  studentUserUid: number;
  consultationType: "VISIT" | "PHONE";
}) => api.post("/consultation/reservations", data).then((r) => r.data);

// 상담 취소
export const cancelConsultation = (id: number) =>
  api.delete(`/consultation/reservations/${id}`);
