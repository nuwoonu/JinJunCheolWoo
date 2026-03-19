// cheol: API 전환 후 Provider는 레이아웃 래퍼로만 사용
import type { ReactNode } from "react";

export function DormitoryProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
