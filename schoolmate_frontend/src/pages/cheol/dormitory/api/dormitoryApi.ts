import api from "@/api/auth";
import type { BuildingSummary, DormitoryDTO, StudentSummary } from "../app/types/dormitory";

// cheol: 기숙사 API 호출 함수 모음

// 전체 건물 목록 + 통계
export async function fetchBuildings(): Promise<BuildingSummary[]> {
  const res = await api.get("/dormitories/buildings");
  return res.data;
}

// 특정 건물의 층별/호수별 침대 목록
// 응답 구조: { [floor]: { [roomNumber]: DormitoryDTO[] } }
export async function fetchBuildingRooms(
  building: string
): Promise<Record<string, Record<string, DormitoryDTO[]>>> {
  const res = await api.get(`/dormitories/buildings/${encodeURIComponent(building)}`);
  return res.data;
}

// 특정 호실의 침대 상세 목록
export async function fetchRoomDetails(
  building: string,
  floor: number,
  roomNumber: string
): Promise<DormitoryDTO[]> {
  const res = await api.get("/dormitories/rooms", {
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
  const res = await api.post("/dormitories/assign", {
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
  await api.delete(`/dormitories/students/${studentId}`);
}

// 건물 추가
export async function addBuilding(
  buildingName: string,
  floors: number,
  roomsPerFloor: number,
  bedsPerRoom: number
): Promise<void> {
  await api.post("/dormitories/buildings", { buildingName, floors, roomsPerFloor, bedsPerRoom });
}

// 건물 삭제
export async function deleteBuilding(buildingName: string): Promise<void> {
  await api.delete(`/dormitories/buildings/${encodeURIComponent(buildingName)}`);
}

// cheol: 학생 이름으로 해당 학생이 배정된 건물명 목록 검색
export async function searchBuildingsByStudent(name: string): Promise<string[]> {
  const res = await api.get("/dormitories/search", { params: { name } });
  return res.data ?? [];
}

// 전체 학생 목록 (배정 시 선택용)
export async function fetchAllStudents(): Promise<StudentSummary[]> {
  const res = await api.get("/students");
  return (res.data ?? []).map((s: any) => ({
    id: s.id,
    name: s.name,
    studentNumber: s.studentNumber,
    fullStudentNumber: s.fullStudentNumber,
  }));
}
