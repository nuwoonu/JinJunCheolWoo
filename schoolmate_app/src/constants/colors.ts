// [woo] 앱 브랜드 컬러 상수 (웹 schoolmate 동일 팔레트)
export const COLORS = {
  primary: "#25A194",
  primaryLight: "#e0f4f0",
  primaryDark: "#1a7a70",

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

  // 공통
  bg: "#f5f7fa",
  card: "#ffffff",
  border: "#f0f0f0",
  text: "#111827",
  textSecondary: "#6b7280",
  textLight: "#9ca3af",

  danger: "#ef4444",
  warning: "#f59e0b",
  success: "#22c55e",
  info: "#3b82f6",
};

export const STATUS_CONFIG = {
  PRESENT:    { label: "출석",  color: COLORS.present,    bg: COLORS.presentBg },
  LATE:       { label: "지각",  color: COLORS.late,       bg: COLORS.lateBg },
  ABSENT:     { label: "결석",  color: COLORS.absent,     bg: COLORS.absentBg },
  EARLY_LEAVE:{ label: "조퇴",  color: COLORS.earlyLeave, bg: COLORS.earlyLeaveBg },
  SICK:       { label: "병결",  color: COLORS.sick,       bg: COLORS.sickBg },
  NONE:       { label: "미처리",color: COLORS.none,       bg: COLORS.noneBg },
} as const;

export type StatusKey = keyof typeof STATUS_CONFIG;
