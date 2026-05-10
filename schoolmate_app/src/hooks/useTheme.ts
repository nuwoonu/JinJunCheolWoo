// [woo] 다크/라이트 모드 테마 훅 — useColorScheme 기반
import { useColorScheme } from "react-native";

export const lightColors = {
  // 브랜드
  primary: "#25A194",
  primaryLight: "#e0f4f0",
  primaryDark: "#1a7a70",

  // 배경
  background: "#ffffff",
  backgroundSecondary: "#f5f7fa",
  card: "#ffffff",
  cardSecondary: "#f9fafb",

  // 텍스트
  text: "#111827",
  textSecondary: "#6b7280",
  textLight: "#9ca3af",
  textInverse: "#ffffff",

  // 테두리
  border: "#e5e7eb",
  borderLight: "#f0f0f0",

  // 출결 상태
  present: "#22c55e",
  presentBg: "#f0fdf4",
  late: "#f97316",
  lateBg: "#fff7ed",
  absent: "#ef4444",
  absentBg: "#fef2f2",
  earlyLeave: "#3b82f6",
  earlyLeaveBg: "#eff6ff",
  sick: "#a855f7",
  sickBg: "#faf5ff",
  none: "#9ca3af",
  noneBg: "#f9fafb",

  // 기타
  danger: "#ef4444",
  warning: "#f59e0b",
  success: "#22c55e",
  info: "#3b82f6",

  // 탭바 / 헤더
  tabBar: "#ffffff",
  tabBarBorder: "#e5e7eb",
  header: "#ffffff",
  headerText: "#111827",

  // 입력창
  inputBg: "#ffffff",
  inputBorder: "#e5e7eb",
  placeholder: "#9ca3af",

  // 오버레이
  overlay: "rgba(0,0,0,0.5)",
  shadowColor: "#000000",
};

export const darkColors: typeof lightColors = {
  // 브랜드
  primary: "#2BAD9E",
  primaryLight: "#1a3d3a",
  primaryDark: "#22c9b8",

  // 배경
  background: "#111827",
  backgroundSecondary: "#1f2937",
  card: "#1f2937",
  cardSecondary: "#374151",

  // 텍스트
  text: "#f9fafb",
  textSecondary: "#9ca3af",
  textLight: "#6b7280",
  textInverse: "#111827",

  // 테두리
  border: "#374151",
  borderLight: "#1f2937",

  // 출결 상태 (다크에서도 읽기 좋게)
  present: "#4ade80",
  presentBg: "#052e16",
  late: "#fb923c",
  lateBg: "#1c0a00",
  absent: "#f87171",
  absentBg: "#1c0f0f",
  earlyLeave: "#60a5fa",
  earlyLeaveBg: "#0f1f3d",
  sick: "#c084fc",
  sickBg: "#1e0a3c",
  none: "#6b7280",
  noneBg: "#1f2937",

  // 기타
  danger: "#f87171",
  warning: "#fbbf24",
  success: "#4ade80",
  info: "#60a5fa",

  // 탭바 / 헤더
  tabBar: "#1f2937",
  tabBarBorder: "#374151",
  header: "#1f2937",
  headerText: "#f9fafb",

  // 입력창
  inputBg: "#374151",
  inputBorder: "#4b5563",
  placeholder: "#6b7280",

  // 오버레이
  overlay: "rgba(0,0,0,0.7)",
  shadowColor: "#000000",
};

export type ThemeColors = typeof lightColors;

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = isDark ? darkColors : lightColors;
  return { colors, isDark, scheme };
}
