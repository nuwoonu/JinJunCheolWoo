// cheol: localStorage → DB API 기반으로 전환
import { useState, useEffect, useCallback } from "react";
import {
  fetchBuildings,
  fetchBuildingRooms,
  fetchRoomDetails,
  assignStudent as apiAssign,
  unassignStudent as apiUnassign,
} from "@/features/dormitory/api/dormitoryApi";
import type { Building, Room, Bed, DormitoryDTO, BuildingSummary } from "../types/dormitory";

// 건물별 고정 색상 (DB에 없으므로 프론트에서 관리)
const BUILDING_COLORS: Record<string, string> = {
  "1동": "#4A90E2",
  "2동": "#E94E77",
  "3동": "#50C878",
  "4동": "#F39C12",
  "5동": "#9B59B6",
};
const DEFAULT_COLORS = ["#4A90E2", "#E94E77", "#50C878", "#F39C12", "#9B59B6", "#1ABC9C"];

function getColor(name: string, index: number): string {
  return BUILDING_COLORS[name] ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

// DormitoryDTO[] (한 방의 침대들) → Room
function dtosToRoom(dtos: DormitoryDTO[]): Room {
  const first = dtos[0];
  const beds: Bed[] = dtos.map((d) => ({
    dormitoryId: d.id,
    bedNumber: d.bedNumber,
    student:
      d.studentNames.length > 0
        ? { id: d.studentIds[0], name: d.studentNames[0] }
        : null,
  }));
  return { roomNumber: first.roomNumber, floor: first.floor, beds };
}

// ─── 건물 목록 훅 ────────────────────────────────────────────
export function useBuildingList() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summaries: BuildingSummary[] = await fetchBuildings();
      setBuildings(
        summaries.map((s, i) => ({
          id: s.building,
          name: s.building,
          color: getColor(s.building, i),
          floors: s.maxFloor,
          totalBeds: s.totalBeds,
          occupiedBeds: s.occupiedBeds,
          rooms: [],
        }))
      );
    } catch {
      setError("건물 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { buildings, loading, error, refetch: load };
}

// ─── 층별 호수 훅 ─────────────────────────────────────────────
export function useFloorRooms(buildingName: string) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [building, setBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!buildingName) return;
    setLoading(true);
    setError(null);
    try {
      // 건물 통계 (색상, 층수용)
      const summaries: BuildingSummary[] = await fetchBuildings();
      const summary = summaries.find((s) => s.building === buildingName);
      const idx = summaries.findIndex((s) => s.building === buildingName);

      if (!summary) throw new Error("건물 없음");

      const b: Building = {
        id: buildingName,
        name: buildingName,
        color: getColor(buildingName, idx),
        floors: summary.maxFloor,
        totalBeds: summary.totalBeds,
        occupiedBeds: summary.occupiedBeds,
        rooms: [],
      };

      // 층별 방 데이터
      const floorMap = await fetchBuildingRooms(buildingName);
      const allRooms: Room[] = [];
      for (const floorKey of Object.keys(floorMap)) {
        const roomMap = floorMap[floorKey];
        for (const roomNumber of Object.keys(roomMap)) {
          allRooms.push(dtosToRoom(roomMap[roomNumber]));
        }
      }
      b.rooms = allRooms;

      setBuilding(b);
      setRooms(allRooms);
    } catch {
      setError("층 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [buildingName]);

  useEffect(() => { load(); }, [load]);

  return { building, rooms, loading, error, refetch: load };
}

// ─── 호실 상세 훅 ─────────────────────────────────────────────
export function useRoomDetail(buildingName: string, floor: number, roomNumber: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [building, setBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!buildingName || !floor || !roomNumber) return;
    setLoading(true);
    setError(null);
    try {
      const [summaries, dtos] = await Promise.all([
        fetchBuildings(),
        fetchRoomDetails(buildingName, floor, roomNumber),
      ]);

      const summary = summaries.find((s) => s.building === buildingName);
      const idx = summaries.findIndex((s) => s.building === buildingName);

      if (!summary) throw new Error("건물 없음");

      setBuilding({
        id: buildingName,
        name: buildingName,
        color: getColor(buildingName, idx),
        floors: summary.maxFloor,
        totalBeds: summary.totalBeds,
        occupiedBeds: summary.occupiedBeds,
        rooms: [],
      });
      setRoom(dtosToRoom(dtos));
    } catch {
      setError("방 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [buildingName, floor, roomNumber]);

  useEffect(() => { load(); }, [load]);

  // 학생 배정
  const assign = async (dormitoryId: number, studentId: number) => {
    const dto = await apiAssign(studentId, buildingName, floor, roomNumber,
      room?.beds.find((b) => b.dormitoryId === dormitoryId)?.bedNumber ?? "");
    await load();
    return dto;
  };

  // 배정 해제
  const unassign = async (studentId: number) => {
    await apiUnassign(studentId);
    await load();
  };

  return { building, room, loading, error, assign, unassign, refetch: load };
}
