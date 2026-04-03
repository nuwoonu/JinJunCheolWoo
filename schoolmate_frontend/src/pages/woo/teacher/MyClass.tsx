import { Navigate } from "react-router-dom";

// [soojin] 학급 현황 + 학생 관리 페이지 통합 → /teacher/myclass/students 로 리다이렉트
export default function TeacherMyClass() {
  return <Navigate to="/teacher/myclass/students" replace />;
}
