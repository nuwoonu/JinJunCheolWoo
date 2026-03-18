import { useNavigate } from "react-router";
import { Building2, Plus, Trash2, Search } from "lucide-react";
import { useDormitory } from "./DormitoryProvider";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext"; // cheol

// cheol: 건물 색상 어둡게/밝게 조정
function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

export default function BuildingList() {
  const navigate = useNavigate();
  const { data, addBuilding, deleteBuilding } = useDormitory();
  const { user } = useAuth(); // cheol
  const isStudent = user?.role === "STUDENT"; // cheol
  const [searchQuery, setSearchQuery] = useState(""); // cheol
  const [showAddForm, setShowAddForm] = useState(false);

  // cheol: 건물 내 학생 이름 검색 매칭
  const hasSearch = searchQuery.trim().length > 0;
  const buildingMatchesSearch = (building: (typeof data.buildings)[0]) =>
    building.rooms.some((room) =>
      room.beds.some((bed) =>
        bed.student?.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  const [newBuilding, setNewBuilding] = useState({
    name: "",
    color: "#4A90E2",
    floors: 5,
    roomsPerFloor: 4,
    bedsPerRoom: 2,
  });

  const handleAddBuilding = () => {
    if (!newBuilding.name) {
      alert("건물 이름을 입력하세요.");
      return;
    }
    addBuilding(
      newBuilding.name,
      newBuilding.color,
      newBuilding.floors,
      newBuilding.roomsPerFloor,
      newBuilding.bedsPerRoom,
    );
    setShowAddForm(false);
    setNewBuilding({ name: "", color: "#4A90E2", floors: 5, roomsPerFloor: 4, bedsPerRoom: 2 });
  };

  return (
    <div
      style={{
        minHeight: "100%",
        background: "linear-gradient(150deg, #f8fafc 0%, #e2e8f0 100%)",
        padding: "32px",
        overflowY: "auto",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "40px",
          }}
        >
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b", margin: 0 }}>기숙사 건물</h1>
          {!isStudent && ( // cheol
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 18px",
                background: "#334155",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              <Plus size={16} />
              건물 추가
            </button>
          )}
        </div>

        {/* 검색창 */} {/* cheol */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "8px 14px",
            marginBottom: "28px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <Search size={16} style={{ color: "#94a3b8", flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="학생 이름으로 검색"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "14px",
              color: "#1e293b",
              background: "transparent",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8", padding: 0, fontSize: "16px", lineHeight: 1 }}
            >
              ✕
            </button>
          )}
        </div>

        {/* 건물 추가 폼 */}
        {showAddForm && (
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
              padding: "24px",
              marginBottom: "36px",
            }}
          >
            <h2 style={{ fontSize: "17px", fontWeight: 600, margin: "0 0 18px", color: "#1e293b" }}>새 건물 추가</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              {[
                { label: "건물 이름", key: "name", type: "text", placeholder: "예: 5동" },
                { label: "층수", key: "floors", type: "number" },
                { label: "층당 호수", key: "roomsPerFloor", type: "number" },
                { label: "호수당 침대 수", key: "bedsPerRoom", type: "number" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#475569",
                      marginBottom: "4px",
                    }}
                  >
                    {label}
                  </label>
                  <input
                    type={type}
                    value={(newBuilding as any)[key]}
                    onChange={(e) =>
                      setNewBuilding({
                        ...newBuilding,
                        [key]: type === "number" ? parseInt(e.target.value) || 1 : e.target.value,
                      })
                    }
                    placeholder={placeholder}
                    min={type === "number" ? "1" : undefined}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
              <div>
                <label
                  style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}
                >
                  건물 색상
                </label>
                <input
                  type="color"
                  value={newBuilding.color}
                  onChange={(e) => setNewBuilding({ ...newBuilding, color: e.target.value })}
                  style={{
                    width: "100%",
                    height: "38px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    cursor: "pointer",
                    padding: "2px 6px",
                  }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleAddBuilding}
                style={{
                  padding: "8px 22px",
                  background: "#3b82f6",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                추가
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                style={{
                  padding: "8px 22px",
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

        {/* 건물 목록 — flex wrap으로 가로 꽉참 방지 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "48px", alignItems: "flex-end" }}>
          {data.buildings.map((building) => {
            const isMatch = buildingMatchesSearch(building); // cheol
            return (
            <div
              key={building.id}
              style={{
                position: "relative",
                flexShrink: 0,
                opacity: hasSearch && !isMatch ? 0.3 : 1, // cheol
                transition: "opacity 0.2s ease",
              }}
            >
              {/* 삭제 버튼 — 학생 제한 */}
              {!isStudent && ( // cheol
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`${building.name}을(를) 삭제하시겠습니까?`)) {
                      deleteBuilding(building.id);
                    }
                  }}
                  style={{
                    position: "absolute",
                    top: "-10px",
                    right: "-10px",
                    width: "28px",
                    height: "28px",
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(239,68,68,0.4)",
                    zIndex: 10,
                  }}
                >
                  <Trash2 size={13} />
                </button>
              )}

              {/* 건물 카드 */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "140px" }}>
                {/* 옥상 구조물 */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: "5px", marginBottom: "2px" }}>
                  <div
                    style={{
                      width: "16px",
                      height: "20px",
                      background: shadeColor(building.color, -40),
                      borderRadius: "2px 2px 0 0",
                    }}
                  />
                  <div
                    style={{
                      width: "10px",
                      height: "28px",
                      background: shadeColor(building.color, -35),
                      borderRadius: "2px 2px 0 0",
                    }}
                  />
                  <div
                    style={{
                      width: "8px",
                      height: "16px",
                      background: shadeColor(building.color, -38),
                      borderRadius: "2px 2px 0 0",
                    }}
                  />
                </div>

                {/* 지붕 처마 */}
                <div
                  style={{
                    width: "148px",
                    height: "10px",
                    background: shadeColor(building.color, -20),
                    borderRadius: "3px 3px 0 0",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                  }}
                />

                {/* 건물 본체 */}
                <div
                  style={{
                    width: "140px",
                    height: "280px" /* 세로로 긴 건물 */,
                    background: `linear-gradient(175deg, ${building.color} 0%, ${shadeColor(building.color, -18)} 100%)`,
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: "6px 8px 24px rgba(0,0,0,0.22), inset -5px 0 10px rgba(0,0,0,0.08)",
                  }}
                >
                  {/* 창문 그리드 (3열 × 5행) */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "8px",
                      padding: "14px 12px 48px",
                    }}
                  >
                    {Array.from({ length: 15 }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          height: "18px",
                          background: i % 5 === 1 ? "rgba(255,250,140,0.75)" : "rgba(255,255,255,0.35)",
                          borderRadius: "2px",
                          border: "1px solid rgba(255,255,255,0.55)",
                        }}
                      />
                    ))}
                  </div>

                  {/* 건물 아이콘 (하단 장식) */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "40px",
                      left: "50%",
                      transform: "translateX(-50%)",
                    }}
                  >
                    <Building2 size={32} style={{ color: "rgba(255,255,255,0.25)" }} />
                  </div>

                  {/* 현관 입구 */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "32px",
                      height: "44px",
                      background: "rgba(0,0,0,0.28)",
                      borderRadius: "4px 4px 0 0",
                      display: "flex",
                      justifyContent: "center",
                      paddingTop: "16px",
                    }}
                  >
                    <div
                      style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(255,255,255,0.7)" }}
                    />
                  </div>
                </div>

                {/* 기초 */}
                <div
                  style={{
                    width: "150px",
                    height: "10px",
                    background: "linear-gradient(180deg, #94a3b8 0%, #64748b 100%)",
                    borderRadius: "0 0 3px 3px",
                  }}
                />

                {/* 지면 그림자 */}
                <div
                  style={{
                    width: "120px",
                    height: "8px",
                    background: "radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, transparent 70%)",
                    marginTop: "3px",
                  }}
                />

                {/* 동 이름 버튼 */}
                <button
                  onClick={() => navigate(`/student/dormitory/building/${building.id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = `0 6px 18px ${building.color}80`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = `0 3px 12px ${building.color}55`;
                  }}
                  style={{
                    marginTop: "14px",
                    width: "140px",
                    padding: "10px 12px",
                    background: building.color,
                    color: "#fff",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: `0 3px 12px ${building.color}55`,
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    letterSpacing: "0.5px",
                  }}
                >
                  {building.name}
                </button>
              </div>
            </div>
            );
          })}
        </div>

        {/* 빈 상태 */}
        {data.buildings.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>
            <div style={{ fontSize: "52px", marginBottom: "12px" }}>🏢</div>
            <p style={{ fontSize: "16px", margin: "0 0 4px" }}>등록된 건물이 없습니다.</p>
            <p style={{ fontSize: "13px", margin: 0 }}>건물 추가 버튼을 눌러 기숙사 건물을 등록하세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
