import { useNavigate, useParams } from "react-router";
import { ArrowLeft, User, UserPlus, UserMinus, Settings } from "lucide-react";
import { useDormitory } from "./DormitoryProvider";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext"; // cheol

export default function RoomView() {
  const navigate = useNavigate();
  const { buildingId, roomNumber } = useParams<{ buildingId: string; roomNumber: string }>();
  const { getBuilding, getRoom, assignStudent, unassignStudent, updateRoomBeds } = useDormitory();

  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedBed, setSelectedBed] = useState<number | null>(null);
  const [studentName, setStudentName] = useState("");
  const [showBedSettings, setShowBedSettings] = useState(false);
  const [bedCount, setBedCount] = useState(2);

  const { user } = useAuth(); // cheol
  const isStudent = user?.role === "STUDENT"; // cheol

  const building = getBuilding(buildingId || "");
  const room = getRoom(buildingId || "", roomNumber || "");

  if (!building || !room) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p>방을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const handleAssign = (bedNumber: number) => {
    setSelectedBed(bedNumber);
    setShowAssignForm(true);
  };

  const handleConfirmAssign = () => {
    if (!studentName.trim()) {
      alert("학생 이름을 입력하세요.");
      return;
    }
    if (selectedBed !== null) {
      assignStudent(buildingId || "", roomNumber || "", selectedBed, {
        id: `${buildingId}-${roomNumber}-${selectedBed}-${Date.now()}`,
        name: studentName,
      });
      setShowAssignForm(false);
      setStudentName("");
      setSelectedBed(null);
    }
  };

  const handleUnassign = (bedNumber: number) => {
    if (confirm("배정을 해제하시겠습니까?")) {
      unassignStudent(buildingId || "", roomNumber || "", bedNumber);
    }
  };

  const handleUpdateBeds = () => {
    if (bedCount < 1) {
      alert("침대 수는 최소 1개 이상이어야 합니다.");
      return;
    }
    updateRoomBeds(buildingId || "", roomNumber || "", bedCount);
    setShowBedSettings(false);
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

  return (
    <div
      style={{
        minHeight: "100%",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        padding: "32px",
        overflowY: "auto",
      }}
    >
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>

        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
          <button
            onClick={() => navigate(`/student/dormitory/building/${buildingId}`)}
            style={{
              padding: "8px",
              borderRadius: "8px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <ArrowLeft size={24} style={{ color: "#475569" }} />
          </button>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b", margin: 0, flex: 1 }}>
            {building.name} {roomNumber}호
          </h1>
          {!isStudent && ( // cheol
            <button
              onClick={() => {
                setBedCount(room.beds.length);
                setShowBedSettings(!showBedSettings);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 18px",
                background: "#475569",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              <Settings size={16} />
              침대 설정
            </button>
          )}
        </div>

        {/* 침대 설정 폼 — 학생 제한 */}
        {!isStudent && showBedSettings && ( // cheol
          <div style={formCardStyle}>
            <h2 style={{ fontSize: "17px", fontWeight: 600, margin: "0 0 16px", color: "#1e293b" }}>
              침대 개수 조절
            </h2>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                침대 수
              </label>
              <input
                type="number"
                value={bedCount}
                onChange={(e) => setBedCount(parseInt(e.target.value) || 1)}
                style={inputStyle}
                min="1"
                max="10"
              />
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: "4px 0 0" }}>
                현재 침대 수: {room.beds.length}개 → {bedCount}개로 변경
              </p>
              {bedCount < room.beds.length && (
                <p style={{ fontSize: "12px", color: "#ef4444", margin: "4px 0 0" }}>
                  ⚠️ 침대를 줄이면 마지막 침대들이 삭제됩니다. 배정된 학생 정보도 함께 삭제됩니다.
                </p>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleUpdateBeds}
                style={{
                  padding: "8px 20px",
                  background: "#3b82f6",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                적용
              </button>
              <button
                onClick={() => setShowBedSettings(false)}
                style={{
                  padding: "8px 20px",
                  background: "#e2e8f0",
                  color: "#475569",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 배정 폼 — 학생 제한 */}
        {!isStudent && showAssignForm && ( // cheol
          <div style={formCardStyle}>
            <h2 style={{ fontSize: "17px", fontWeight: 600, margin: "0 0 16px", color: "#1e293b" }}>
              학생 배정 — 침대 {selectedBed}번
            </h2>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                학생 이름
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                style={inputStyle}
                placeholder="이름을 입력하세요"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleConfirmAssign()}
              />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleConfirmAssign}
                style={{
                  padding: "8px 20px",
                  background: "#3b82f6",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                배정
              </button>
              <button
                onClick={() => {
                  setShowAssignForm(false);
                  setStudentName("");
                  setSelectedBed(null);
                }}
                style={{
                  padding: "8px 20px",
                  background: "#e2e8f0",
                  color: "#475569",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 방 내부 — 침대 목록 */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
            padding: "36px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            {room.beds.map((bed) => (
              <div key={bed.bedNumber} style={{ display: "flex", alignItems: "center", gap: "28px" }}>

                {/* 침대 */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  {/* 침대 번호 뱃지 */}
                  <div
                    style={{
                      position: "absolute",
                      top: "-12px",
                      left: "-12px",
                      width: "32px",
                      height: "32px",
                      background: "#334155",
                      color: "#fff",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "13px",
                      zIndex: 2,
                    }}
                  >
                    {bed.bedNumber}
                  </div>

                  {/* 침대 프레임 */}
                  <div
                    style={{
                      width: "280px",
                      height: "112px",
                      borderRadius: "10px",
                      background: `${building.color}28`,
                      position: "relative",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
                    }}
                  >
                    {/* 매트리스 */}
                    <div
                      style={{
                        position: "absolute",
                        top: "8px",
                        left: "8px",
                        right: "8px",
                        height: "72px",
                        borderRadius: "6px",
                        background: building.color,
                        overflow: "hidden",
                      }}
                    >
                      {/* 베개 */}
                      <div
                        style={{
                          position: "absolute",
                          top: "-4px",
                          left: "14px",
                          width: "56px",
                          height: "36px",
                          background: "#fff",
                          borderRadius: "6px",
                          border: `2px solid ${building.color}`,
                        }}
                      />
                      {/* 이불 선 패턴 */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          opacity: 0.25,
                        }}
                      >
                        {[0, 1, 2].map((n) => (
                          <div key={n} style={{ width: "3px", height: "100%", background: "#fff", borderRadius: "2px" }} />
                        ))}
                      </div>
                    </div>

                    {/* 침대 다리 */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "-14px",
                        left: "14px",
                        width: "10px",
                        height: "18px",
                        borderRadius: "0 0 4px 4px",
                        background: building.color,
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: "-14px",
                        right: "14px",
                        width: "10px",
                        height: "18px",
                        borderRadius: "0 0 4px 4px",
                        background: building.color,
                      }}
                    />
                  </div>
                </div>

                {/* 학생 정보 / 배정 버튼 — 학생 제한 */}
                {bed.student ? (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        flex: 1,
                        maxWidth: "280px",
                        padding: "18px 24px",
                        borderRadius: "12px",
                        background: building.color,
                        color: "#fff",
                        fontSize: "20px",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        boxShadow: `0 4px 16px ${building.color}44`,
                      }}
                    >
                      <User size={22} />
                      {bed.student.name}
                    </div>
                    {!isStudent && ( // cheol
                      <button
                        onClick={() => handleUnassign(bed.bedNumber)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "10px 16px",
                          background: "#ef4444",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: 500,
                          fontSize: "14px",
                        }}
                      >
                        <UserMinus size={16} />
                        해제
                      </button>
                    )}
                  </div>
                ) : !isStudent ? ( // cheol
                  <button
                    onClick={() => handleAssign(bed.bedNumber)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `0 4px 16px ${building.color}44`;
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                    style={{
                      flex: 1,
                      maxWidth: "280px",
                      padding: "18px 24px",
                      borderRadius: "12px",
                      border: `2px dashed ${building.color}`,
                      background: "transparent",
                      color: building.color,
                      fontSize: "18px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      cursor: "pointer",
                      transition: "transform 0.15s ease, box-shadow 0.15s ease",
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
              marginTop: "36px",
              padding: "20px 24px",
              background: "#f8fafc",
              borderRadius: "10px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              fontSize: "14px",
              color: "#475569",
            }}
          >
            <div><span style={{ fontWeight: 600 }}>건물:</span> {building.name}</div>
            <div><span style={{ fontWeight: 600 }}>호수:</span> {roomNumber}호</div>
            <div><span style={{ fontWeight: 600 }}>침대 수:</span> {room.beds.length}개</div>
            <div>
              <span style={{ fontWeight: 600 }}>배정 현황:</span>{" "}
              {room.beds.filter((b) => b.student !== null).length}/{room.beds.length}
            </div>
            <div><span style={{ fontWeight: 600 }}>층:</span> {room.floor}층</div>
          </div>
        </div>
      </div>
    </div>
  );
}
