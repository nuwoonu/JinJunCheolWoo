// cheol: API 기반 타입 (DB 구조 반영)

export interface Student {
  id: number; // studentInfoId (배정 해제 시 사용)
  name: string;
}

export interface Bed {
  dormitoryId: number; // Dormitory entity PK
  bedNumber: string; // "A", "B", "1", "2" 등
  student: Student | null;
}

export interface Room {
  roomNumber: string;
  floor: number;
  beds: Bed[];
}

export interface Building {
  id: string; // building name ("1동", "2동" ...)
  name: string;
  color: string; // 프론트에서 할당 (DB 없음)
  floors: number; // maxFloor from API
  totalBeds: number;
  occupiedBeds: number;
  rooms: Room[]; // 상세 페이지 진입 시 로드
}

// API 응답 타입
export interface BuildingSummary {
  building: string;
  totalBeds: number;
  occupiedBeds: number;
  maxFloor: number;
}

// GET /api/dormitories/buildings/{building} 응답
// Map<floor, Map<roomNumber, DormitoryDTO[]>>
export interface DormitoryDTO {
  id: number;
  building: string;
  floor: number;
  roomNumber: string;
  bedNumber: string;
  roomType: string;
  roomTypeDescription: string;
  studentNames: string[];
  studentIds: number[];
  isEmpty: boolean;
  occupiedCount: number;
  fullAddress: string;
}

export interface StudentSummary {
  id: number; // studentInfoId
  name: string;
  studentNumber?: number;
  fullStudentNumber?: string;
}
