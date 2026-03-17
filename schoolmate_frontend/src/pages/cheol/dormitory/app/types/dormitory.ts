export interface Student {
  id: string;
  name: string;
}

export interface Bed {
  bedNumber: number;
  student: Student | null;
}

export interface Room {
  roomNumber: string;
  floor: number;
  beds: Bed[];
}

export interface Building {
  id: string;
  name: string;
  color: string;
  floors: number;
  roomsPerFloor: number;
  rooms: Room[];
}

export interface DormitoryData {
  buildings: Building[];
}
