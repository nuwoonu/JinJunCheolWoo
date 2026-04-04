import { createContext, useContext, useState, type ReactNode } from "react";

const STORAGE_KEY = "admin_selected_school";

export interface SelectedSchool {
  id: number;
  name: string;
  schoolCode: string;
  schoolKind: string;
  officeOfEducation: string;
}

interface SchoolContextType {
  selectedSchool: SelectedSchool | null;
  setSelectedSchool: (school: SelectedSchool) => void;
  clearSelectedSchool: () => void;
}

const SchoolContext = createContext<SchoolContextType | null>(null);

function loadFromStorage(): SelectedSchool | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as SelectedSchool) : null;
  } catch {
    return null;
  }
}

export function SchoolProvider({ children }: { children: ReactNode }) {
  const [selectedSchool, setSelectedSchoolState] = useState<SelectedSchool | null>(loadFromStorage);

  const setSelectedSchool = (school: SelectedSchool) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(school));
    setSelectedSchoolState(school);
  };

  const clearSelectedSchool = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSelectedSchoolState(null);
  };

  return (
    <SchoolContext.Provider value={{ selectedSchool, setSelectedSchool, clearSelectedSchool }}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool(): SchoolContextType {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error("useSchool must be used within SchoolProvider");
  return ctx;
}
