import { createContext, useContext, ReactNode } from "react";
import { useDormitoryData } from "../hooks/useDormitoryData";
import { DormitoryData, Student } from "../types/dormitory";

interface DormitoryContextType {
  data: DormitoryData;
  addBuilding: (name: string, color: string, floors: number, roomsPerFloor: number, bedsPerRoom: number) => void;
  deleteBuilding: (buildingId: string) => void;
  updateRoomBeds: (buildingId: string, roomNumber: string, bedCount: number) => void;
  assignStudent: (buildingId: string, roomNumber: string, bedNumber: number, student: Student) => void;
  unassignStudent: (buildingId: string, roomNumber: string, bedNumber: number) => void;
  getBuilding: (buildingId: string) => any;
  getRoom: (buildingId: string, roomNumber: string) => any;
}

const DormitoryContext = createContext<DormitoryContextType | null>(null);

export function DormitoryProvider({ children }: { children: ReactNode }) {
  const dormitoryData = useDormitoryData();

  return (
    <DormitoryContext.Provider value={dormitoryData}>
      {children}
    </DormitoryContext.Provider>
  );
}

export function useDormitory() {
  const context = useContext(DormitoryContext);
  if (!context) {
    throw new Error("useDormitory must be used within DormitoryProvider");
  }
  return context;
}