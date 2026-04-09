import { useNavigate, useParams, useLocation } from "react-router";
import { ArrowLeft, User, UserPlus, UserMinus, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/shared/contexts/AuthContext"; // cheol
import { useRoomDetail } from "../hooks/useDormitoryData"; // cheol
import { fetchAllStudents } from "@/features/dormitory/api/dormitoryApi"; // cheol
import type { StudentSummary } from "../types/dormitory";

export default function RoomView() {
  const navigate = useNavigate();
  const location = useLocation();
  const baseRoute = location.pathname.startsWith("/admin") ? "/admin/dormitory" : "/student/dormitory";
  const { buildingId, roomNumber } = useParams<{ buildingId: string; roomNumber: string }>();
  const buildingName = decodeURIComponent(buildingId ?? "");
  const floor = parseInt(roomNumber?.charAt(0) ?? "1"); // 호수 첫 자리가 층 (예: "101" → 1층)

  const { user } = useAuth(); // cheol
  const isStudent = user?.role === "STUDENT"; // cheol

  // cheol: API 기반 방 데이터
  const { building, room, loading, error, assign, unassign, refetch } = useRoomDetail(
    buildingName,
    floor,
    roomNumber ?? ""
  );

  // cheol: 학생 배정 폼 상태
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedBed, setSelectedBed] = useState<{ dormitoryId: number; bedNumber: string } | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [allStudents, setAllStudents] = useState<StudentSummary[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);
  const [assigning, setAssigning] = useState(false);

  // 전체 학생 목록 로드 (배정 폼 열릴 때)
  useEffect(() => {
    if (showAssignForm && allStudents.length === 0) {
      fetchAllStudents().then(setAllStudents).catch(() => {});
    }
  }, [showAssignForm]);

  const filteredStudents = studentSearch.trim()
    ? allStudents.filter((s) => s.name.includes(studentSearch) || String(s.studentNumber ?? "").includes(studentSearch))
    : allStudents.slice(0, 30); // 검색어 없으면 최대 30명만 표시

  const handleOpenAssign = (dormitoryId: number, bedNumber: string) => {
    setSelectedBed({ dormitoryId, bedNumber });
    setStudentSearch("");
    setSelectedStudent(null);
    setShowAssignForm(true);
  };

  const handleConfirmAssign = async () => {
    if (!selectedStudent || !selectedBed) {
      alert("학생을 선택하세요.");
      return;
    }
    setAssigning(true);
    try {
      await assign(selectedBed.dormitoryId, selectedStudent.id);
      setShowAssignForm(false);
    } catch (e: unknown) {
      // [soojin] any → unknown, axios 응답 구조 타입 캐스팅
      const errMsg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(errMsg ?? "배정 중 오류가 발생했습니다.");
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (studentId: number) => {
    if (!confirm("배정을 해제하시겠습니까?")) return;
    try {
      await unassign(studentId);
    } catch (e: unknown) {
      // [soojin] any → unknown, axios 응답 구조 타입 캐스팅
      const errMsg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(errMsg ?? "해제 중 오류가 발생했습니다.");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none",
  };

  const formCardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    padding: "24px",
    marginBottom: "24px",
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100%" }}>
        <p style={{ color: "#64748b" }}>불러오는 중...</p>
      </div>
    );
  }

  if (error || !building || !room) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100%", gap: "12px" }}>
        <p style={{ color: "#ef4444" }}>{error ?? "방을 찾을 수 없습니다."}</p>
        <button
          onClick={refetch}
          style={{ padding: "8px 20px", background: "#334155", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#f8fafc",
        padding: "32px",
        overflowY: "auto",
      }}
    >
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>

        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
          <button
            onClick={() => navigate(`${baseRoute}/building/${buildingId}`)}
            style={{ padding: "8px", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <ArrowLeft size={24} style={{ color: "#475569" }} />
          </button>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b", margin: 0, flex: 1 }}>
            {building.name} {roomNumber}호
          </h1>
        </div>

        {/* 학생 배정 폼 — 학생 제한 */}
        {!isStudent && showAssignForm && ( // cheol
          <div style={formCardStyle}>
            <p style={{ fontSize: "13px", fontWeight: 600, margin: "0 0 4px", color: "#1e293b" }}>
              학생 배정 — {selectedBed?.bedNumber}번 침대
            </p>

            {/* 학생 검색 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "8px 12px",
                marginBottom: "10px",
              }}
            >
              <Search size={14} style={{ color: "#94a3b8" }} />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="이름 또는 학번으로 검색"
                style={{ flex: 1, border: "none", outline: "none", fontSize: "14px" }}
                autoFocus
              />
            </div>

            {/* 학생 목록 — 3명 초과 시 스크롤 */}
            <div
              style={{
                maxHeight: "186px",
                overflowY: "auto",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                marginBottom: "14px",
              }}
            >
              {filteredStudents.length === 0 ? (
                <div style={{ padding: "16px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                  학생이 없습니다.
                </div>
              ) : (
                filteredStudents.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    style={{
                      padding: "10px 14px",
                      cursor: "pointer",
                      background: selectedStudent?.id === s.id ? `${building.color}18` : "#fff",
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      if (selectedStudent?.id !== s.id)
                        e.currentTarget.style.background = "#f8fafc";
                    }}
                    onMouseLeave={(e) => {
                      if (selectedStudent?.id !== s.id)
                        e.currentTarget.style.background = "#fff";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <User size={14} style={{ color: building.color, flexShrink: 0 }} />
                      <span style={{ fontWeight: selectedStudent?.id === s.id ? 600 : 400, color: "#1e293b", fontSize: "14px" }}>
                        {s.name}
                      </span>
                    </div>
                    {s.fullStudentNumber && (
                      <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginTop: "2px", paddingLeft: "22px" }}>
                        {s.fullStudentNumber}
                      </span>
                    )}
                    {s.dormitoryInfo && (
                      <span style={{
                        fontSize: "11px", display: "block", marginTop: "3px", paddingLeft: "22px",
                        color: "#ef4444", fontWeight: 500,
                      }}>
                        배정됨: {s.dormitoryInfo}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {selectedStudent && (
              <div style={{ fontSize: "13px", color: "#475569", marginBottom: "12px" }}>
                선택: <strong>{selectedStudent.name}</strong>
                {selectedStudent.fullStudentNumber && ` (${selectedStudent.fullStudentNumber})`}
              </div>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleConfirmAssign}
                disabled={assigning || !selectedStudent}
                style={{
                  padding: "8px 20px",
                  background: selectedStudent ? "#3b82f6" : "#cbd5e1",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: selectedStudent ? "pointer" : "not-allowed",
                  fontWeight: 500,
                }}
              >
                {assigning ? "배정 중..." : "배정"}
              </button>
              <button
                onClick={() => setShowAssignForm(false)}
                style={{ padding: "8px 20px", background: "#e2e8f0", color: "#475569", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 500 }}
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 방 내부 — 침대 목록 */}
        <div style={{ background: "#fff", borderRadius: "16px", boxShadow: "0 8px 32px rgba(0,0,0,0.10)", padding: "36px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            {room.beds.map((bed) => (
              <div key={bed.bedNumber} style={{ display: "flex", alignItems: "center", gap: "28px" }}>

                {/* 침대 */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div
                    style={{
                      position: "absolute", top: "-12px", left: "-12px",
                      width: "32px", height: "32px",
                      background: "#334155", color: "#fff", borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: "13px", zIndex: 2,
                    }}
                  >
                    {bed.bedNumber}
                  </div>

                  <div style={{ width: "280px", height: "112px", borderRadius: "10px", background: `${building.color}28`, position: "relative", boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}>
                    <div style={{ position: "absolute", top: "8px", left: "8px", right: "8px", height: "72px", borderRadius: "6px", background: building.color, overflow: "hidden" }}>
                      <div style={{ position: "absolute", top: "-4px", left: "14px", width: "56px", height: "36px", background: "#fff", borderRadius: "6px", border: `2px solid ${building.color}` }} />
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: 0.25 }}>
                        {[0, 1, 2].map((n) => (
                          <div key={n} style={{ width: "3px", height: "100%", background: "#fff", borderRadius: "2px" }} />
                        ))}
                      </div>
                    </div>
                    <div style={{ position: "absolute", bottom: "-14px", left: "14px", width: "10px", height: "18px", borderRadius: "0 0 4px 4px", background: building.color }} />
                    <div style={{ position: "absolute", bottom: "-14px", right: "14px", width: "10px", height: "18px", borderRadius: "0 0 4px 4px", background: building.color }} />
                  </div>
                </div>

                {/* 학생 정보 / 배정 버튼 — 학생 제한 */}
                {bed.student ? (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        flex: 1, maxWidth: "280px", padding: "18px 24px", borderRadius: "12px",
                        background: building.color, color: "#fff", fontSize: "20px", fontWeight: 600,
                        display: "flex", alignItems: "center", gap: "10px",
                        boxShadow: `0 4px 16px ${building.color}44`,
                      }}
                    >
                      <User size={22} />
                      {bed.student.name}
                    </div>
                    {!isStudent && ( // cheol
                      <button
                        onClick={() => handleUnassign(bed.student!.id)}
                        style={{
                          display: "flex", alignItems: "center", gap: "6px",
                          padding: "10px 16px", background: "#ef4444", color: "#fff",
                          border: "none", borderRadius: "8px", cursor: "pointer",
                          fontWeight: 500, fontSize: "14px",
                        }}
                      >
                        <UserMinus size={16} />
                        해제
                      </button>
                    )}
                  </div>
                ) : !isStudent ? ( // cheol
                  <button
                    onClick={() => handleOpenAssign(bed.dormitoryId, bed.bedNumber)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `0 4px 16px ${building.color}44`;
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                    style={{
                      flex: 1, maxWidth: "280px", padding: "18px 24px", borderRadius: "12px",
                      border: `2px dashed ${building.color}`, background: "transparent",
                      color: building.color, fontSize: "18px", fontWeight: 600,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                      cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    }}
                  >
                    <UserPlus size={20} />
                    학생 배정
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          {/* 방 정보 요약 */}
          <div
            style={{
              marginTop: "36px", padding: "20px 24px", background: "#f8fafc",
              borderRadius: "10px", display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: "12px", fontSize: "14px", color: "#475569",
            }}
          >
            <div><span style={{ fontWeight: 600 }}>건물:</span> {building.name}</div>
            <div><span style={{ fontWeight: 600 }}>호수:</span> {roomNumber}호</div>
            <div><span style={{ fontWeight: 600 }}>침대 수:</span> {room.beds.length}개</div>
            <div>
              <span style={{ fontWeight: 600 }}>배정 현황:</span>{" "}
              {room.beds.filter((b) => b.student !== null).length}/{room.beds.length}
            </div>
            <div><span style={{ fontWeight: 600 }}>층:</span> {floor}층</div>
          </div>
        </div>
      </div>
    </div>
  );
}
