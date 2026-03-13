export const DAY_LABELS = ["월", "화", "수", "목", "금"];

export const TIME_SLOTS = [
  "오전 9시",
  "오전 10시",
  "오전 11시",
  "오후 12시",
  "오후 1시",
  "오후 2시",
  "오후 3시",
  "오후 4시",
  "오후 5시",
  "오후 6시",
];

export const TIME_MAP: Record<string, string> = {
  "오전 9시": "09:00",
  "오전 10시": "10:00",
  "오전 11시": "11:00",
  "오후 12시": "12:00",
  "오후 1시": "13:00",
  "오후 2시": "14:00",
  "오후 3시": "15:00",
  "오후 4시": "16:00",
  "오후 5시": "17:00",
  "오후 6시": "18:00",
};

export const TIME_LABEL: Record<string, string> = {
  "09:00": "오전 9시",
  "10:00": "오전 10시",
  "11:00": "오전 11시",
  "12:00": "오후 12시",
  "13:00": "오후 1시",
  "14:00": "오후 2시",
  "15:00": "오후 3시",
  "16:00": "오후 4시",
  "17:00": "오후 5시",
  "18:00": "오후 6시",
};

export function normalizeTime(t: string): string {
  return t ? t.substring(0, 5) : t;
}

export function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function fmt(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export const CONSULTATION_TYPE_LABEL: Record<string, string> = {
  VISIT: "방문 상담",
  PHONE: "전화 상담",
};

export function fmtDisplay(d: Date): string {
  return `${d.getMonth() + 1}. ${d.getDate()}. (${DAY_LABELS[d.getDay() - 1] ?? ""})`;
}
