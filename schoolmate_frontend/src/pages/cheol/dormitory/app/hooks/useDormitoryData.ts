import { useState, useEffect } from "react";
import type { DormitoryData, Building, Room, Bed, Student } from "../types/dormitory";

const STORAGE_KEY = "dormitory_data";

const getInitialData = (): DormitoryData => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  
  // 기본 데이터
  return {
    buildings: [
      {
        id: "1",
        name: "1동",
        color: "#4A90E2",
        floors: 5,
        roomsPerFloor: 4,
        rooms: generateRooms(5, 4, 2), // 5층, 층당 4개 방, 방당 2개 침대
      },
      {
        id: "2",
        name: "2동",
        color: "#E94E77",
        floors: 5,
        roomsPerFloor: 4,
        rooms: generateRooms(5, 4, 2),
      },
      {
        id: "3",
        name: "3동",
        color: "#50C878",
        floors: 5,
        roomsPerFloor: 4,
        rooms: generateRooms(5, 4, 2),
      },
      {
        id: "4",
        name: "4동",
        color: "#F39C12",
        floors: 5,
        roomsPerFloor: 4,
        rooms: generateRooms(5, 4, 2),
      },
    ],
  };
};

function generateRooms(floors: number, roomsPerFloor: number, bedsPerRoom: number): Room[] {
  const rooms: Room[] = [];
  
  for (let floor = 1; floor <= floors; floor++) {
    for (let roomIndex = 1; roomIndex <= roomsPerFloor; roomIndex++) {
      const roomNumber = `${floor}0${roomIndex}`;
      const beds: Bed[] = [];
      
      for (let bedNum = 1; bedNum <= bedsPerRoom; bedNum++) {
        beds.push({
          bedNumber: bedNum,
          student: null,
        });
      }
      
      rooms.push({
        roomNumber,
        floor,
        beds,
      });
    }
  }
  
  return rooms;
}

export function useDormitoryData() {
  const [data, setData] = useState<DormitoryData>(getInitialData);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const addBuilding = (name: string, color: string, floors: number, roomsPerFloor: number, bedsPerRoom: number) => {
    const newBuilding: Building = {
      id: String(data.buildings.length + 1),
      name,
      color,
      floors,
      roomsPerFloor,
      rooms: generateRooms(floors, roomsPerFloor, bedsPerRoom),
    };
    
    setData((prev) => ({
      ...prev,
      buildings: [...prev.buildings, newBuilding],
    }));
  };

  const deleteBuilding = (buildingId: string) => {
    setData((prev) => ({
      ...prev,
      buildings: prev.buildings.filter((building) => building.id !== buildingId),
    }));
  };

  const updateRoomBeds = (buildingId: string, roomNumber: string, bedCount: number) => {
    setData((prev) => ({
      ...prev,
      buildings: prev.buildings.map((building) => {
        if (building.id !== buildingId) return building;
        
        return {
          ...building,
          rooms: building.rooms.map((room) => {
            if (room.roomNumber !== roomNumber) return room;
            
            const currentBeds = room.beds;
            const newBeds: Bed[] = [];
            
            // 기존 침대 유지 (학생 정보 포함)
            for (let i = 0; i < bedCount; i++) {
              if (i < currentBeds.length) {
                newBeds.push(currentBeds[i]);
              } else {
                // 새 침대 추가
                newBeds.push({
                  bedNumber: i + 1,
                  student: null,
                });
              }
            }
            
            return {
              ...room,
              beds: newBeds,
            };
          }),
        };
      }),
    }));
  };

  const assignStudent = (buildingId: string, roomNumber: string, bedNumber: number, student: Student) => {
    setData((prev) => ({
      ...prev,
      buildings: prev.buildings.map((building) => {
        if (building.id !== buildingId) return building;
        
        return {
          ...building,
          rooms: building.rooms.map((room) => {
            if (room.roomNumber !== roomNumber) return room;
            
            return {
              ...room,
              beds: room.beds.map((bed) => {
                if (bed.bedNumber !== bedNumber) return bed;
                return { ...bed, student };
              }),
            };
          }),
        };
      }),
    }));
  };

  const unassignStudent = (buildingId: string, roomNumber: string, bedNumber: number) => {
    setData((prev) => ({
      ...prev,
      buildings: prev.buildings.map((building) => {
        if (building.id !== buildingId) return building;
        
        return {
          ...building,
          rooms: building.rooms.map((room) => {
            if (room.roomNumber !== roomNumber) return room;
            
            return {
              ...room,
              beds: room.beds.map((bed) => {
                if (bed.bedNumber !== bedNumber) return bed;
                return { ...bed, student: null };
              }),
            };
          }),
        };
      }),
    }));
  };

  const getBuilding = (buildingId: string) => {
    return data.buildings.find((b) => b.id === buildingId);
  };

  const getRoom = (buildingId: string, roomNumber: string) => {
    const building = getBuilding(buildingId);
    return building?.rooms.find((r) => r.roomNumber === roomNumber);
  };

  return {
    data,
    addBuilding,
    deleteBuilding,
    updateRoomBeds,
    assignStudent,
    unassignStudent,
    getBuilding,
    getRoom,
  };
}