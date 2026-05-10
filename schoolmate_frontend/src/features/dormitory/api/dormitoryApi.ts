import axios from "axios";
import { auth } from "@/shared/api/auth";
import type { BuildingSummary, DormitoryDTO, StudentSummary } from "../app/types/dormitory";

// JWT + X-School-Id(어드민 컨텍스트) 헤더를 자동 첨부하는 기숙사 전용 axios 인스턴스
const dormApi = axios.create({ baseURL: "/api", withCredentials: true });
dormApi.interceptors.request.use((config) => {
  const token = auth.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  try {
    const raw = localStorage.getItem("admin_selected_school");
    if (raw) {
      const school = JSON.parse(raw) as { id?: number };
      if (school?.id) config.headers["X-School-Id"] = String(school.id);
    }
  } catch {
    /* 무시 */
  }
  return config;
});

// cheol: 기숙사 API 호출 함수 모음

// 전체 건물 목록 + 통계
export async function fetchBuildings(): Promise<BuildingSummary[]> {
  const res = await dormApi.get("/dormitories/buildings");
  return res.data;
}

// 특정 건물의 층별/호수별 침대 목록
// 응답 구조: { [floor]: { [roomNumber]: DormitoryDTO[] } }
export async function fetchBuildingRooms(
  building: string
): Promise<Record<string, Record<string, DormitoryDTO[]>>> {
  const res = await dormApi.get(`/dormitories/buildings/${encodeURIComponent(building)}`);
  return res.data;
}

// 특정 호실의 침대 상세 목록
export async function fetchRoomDetails(
  building: string,
  floor: number,
  roomNumber: string
): Promise<DormitoryDTO[]> {
  const res = await dormApi.get("/dormitories/rooms", {
    params: { building, floor, roomNumber },
  });
  return res.data;
}

// 학생에게 침대 배정
export async function assignStudent(
  studentId: number,
  building: string,
  floor: number,
  roomNumber: string,
  bedNumber: string
): Promise<DormitoryDTO> {
  const res = await dormApi.post("/dormitories/assign", {
    studentId,
    building,
    floor,
    roomNumber,
    bedNumber,
  });
  return res.data;
}

// 배정 해제
export async function unassignStudent(studentId: number): Promise<void> {
  await dormApi.delete(`/dormitories/students/${studentId}`);
}

// 건물 추가 (층별 호실 수를 배열로 전달)
export async function addBuilding(
  buildingName: string,
  floors: number,
  roomsPerFloor: number[],
  bedsPerRoom: number
): Promise<void> {
  await dormApi.post("/dormitories/buildings", { buildingName, floors, roomsPerFloor, bedsPerRoom });
}

// 기숙사 초기 데이터 생성
export async function initializeDormitories(): Promise<void> {
  await dormApi.post("/dormitories/initialize");
}

// 건물 삭제
export async function deleteBuilding(buildingName: string): Promise<void> {
  await dormApi.delete(`/dormitories/buildings/${encodeURIComponent(buildingName)}`);
}

// 건물 수정 (층별 호실 수를 배열로 전달)
export async function updateBuilding(
  buildingName: string,
  newBuildingName: string,
  floors: number,
  roomsPerFloor: number[],
  bedsPerRoom: number
): Promise<void> {
  await dormApi.put(`/dormitories/buildings/${encodeURIComponent(buildingName)}`, {
    newBuildingName,
    floors,
    roomsPerFloor,
    bedsPerRoom,
  });
}

// 특정 호실 침대 수 수정
export async function updateRoomBeds(
  buildingName: string,
  floor: number,
  roomNumber: string,
  bedsPerRoom: number
): Promise<void> {
  await dormApi.patch(`/dormitories/rooms/beds`, { buildingName, floor, roomNumber, bedsPerRoom });
}

// cheol: 학생 이름으로 해당 학생이 배정된 건물명 목록 검색
export async function searchBuildingsByStudent(name: string): Promise<string[]> {
  const res = await dormApi.get("/dormitories/search", { params: { name } });
  return res.data ?? [];
}

// 현재 학기 전체 배정 현황 (studentInfoId → fullAddress 맵)
export async function fetchActiveAssignments(): Promise<Record<number, string>> {
  const res = await dormApi.get("/dormitories/assignments/active");
  return res.data ?? {};
}

// [woo] 기숙사 배정용 학생 목록 — 역할 필터 없이 학교 전체 학생 반환
export async function fetchAllStudents(): Promise<StudentSummary[]> {
  const [studentsRes, assignmentsRes] = await Promise.all([
    dormApi.get("/dormitories/available-students"),
    dormApi.get("/dormitories/assignments/active").catch(() => ({ data: {} })),
  ]);
  const assignmentMap: Record<number, string> = assignmentsRes.data ?? {};
  return (studentsRes.data ?? []).map((s: any) => ({
    id: s.id,
    name: s.userName ?? s.name,
    studentNumber: s.studentNumber,
    fullStudentNumber: s.fullStudentNumber,
    dormitoryInfo: assignmentMap[s.id] ?? undefined,
  }));
}
