// [woo] 선택된 자녀 전역 컨텍스트 — 내정보에서 선택 시 게시판/성적 등 전체 반영
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Child } from "@/api/parent";

const STORAGE_KEY = "selectedChild";

type SelectedChildContextType = {
  selectedChild: Child | null;
  setSelectedChild: (child: Child | null) => void;
};

const SelectedChildContext = createContext<SelectedChildContextType>({
  selectedChild: null,
  setSelectedChild: () => {},
});

export function SelectedChildProvider({ children: node }: { children: React.ReactNode }) {
  const [selectedChild, setSelectedChildState] = useState<Child | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v) setSelectedChildState(JSON.parse(v));
    });
  }, []);

  const setSelectedChild = (child: Child | null) => {
    setSelectedChildState(child);
    if (child) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(child));
    else AsyncStorage.removeItem(STORAGE_KEY);
  };

  return (
    <SelectedChildContext.Provider value={{ selectedChild, setSelectedChild }}>
      {node}
    </SelectedChildContext.Provider>
  );
}

export const useSelectedChild = () => useContext(SelectedChildContext);
