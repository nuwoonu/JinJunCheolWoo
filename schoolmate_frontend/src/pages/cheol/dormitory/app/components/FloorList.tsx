import { useNavigate, useParams } from "react-router";
import { ArrowLeft, DoorOpen, Search } from "lucide-react";
import { useState } from "react";
import { useFloorRooms } from "../hooks/useDormitoryData"; // cheol

export default function FloorList() {
  const navigate = useNavigate();
  const { buildingId } = useParams<{ buildingId: string }>();
  const buildingName = decodeURIComponent(buildingId ?? "");

  const [searchQuery, setSearchQuery] = useState(""); // cheol

  // cheol: API 기반 층/호수 데이터
  const { building, loading, error, refetch } = useFloorRooms(buildingName);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100%" }}>
        <p style={{ color: "#64748b" }}>불러오는 중...</p>
      </div>
    );
  }

  if (error || !building) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100%", gap: "12px" }}>
        <p style={{ color: "#ef4444" }}>{error ?? "건물을 찾을 수 없습니다."}</p>
        <button
          onClick={refetch}
          style={{ padding: "8px 20px", background: "#334155", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}
        >
          다시 시도
        </button>
      </div>
    );
  }

  const floors = Array.from({ length: building.floors }, (_, i) => building.floors - i);
  const getRoomsByFloor = (floor: number) => building.rooms.filter((r) => r.floor === floor);

  // cheol: 방 내 학생 이름 검색
  const hasSearch = searchQuery.trim().length > 0;
  const roomMatchesSearch = (room: (typeof building.rooms)[0]) =>
    room.beds.some((bed) =>
      bed.student?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div
      style={{
        minHeight: "100%",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        padding: "32px",
        overflowY: "auto",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
          <button
            onClick={() => navigate("/student/dormitory")}
            style={{ padding: "8px", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <ArrowLeft size={24} style={{ color: "#475569" }} />
          </button>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b", margin: 0 }}>
            {building.name} — 층별 호수
          </h1>
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
            marginBottom: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <Search size={16} style={{ color: "#94a3b8", flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="학생 이름으로 검색"
            style={{ flex: 1, border: "none", outline: "none", fontSize: "14px", color: "#1e293b", background: "transparent" }}
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

        {/* 건물 층 구조 */}
        <div style={{ background: "#fff", borderRadius: "16px", boxShadow: "0 8px 32px rgba(0,0,0,0.10)", padding: "32px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {floors.map((floor) => {
              const rooms = getRoomsByFloor(floor);
              return (
                <div key={floor} style={{ display: "flex", alignItems: "center", gap: "24px" }}>

                  {/* 층 표시 */}
                  <div
                    style={{
                      width: "72px",
                      height: "80px",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "10px",
                      background: building.color,
                      color: "#fff",
                      fontSize: "18px",
                      fontWeight: 700,
                      boxShadow: `0 4px 12px ${building.color}55`,
                    }}
                  >
                    {floor}층
                  </div>

                  {/* 호수 목록 */}
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      background: "#f8fafc",
                      borderRadius: "10px",
                      padding: "12px 16px",
                      border: "2px solid #e2e8f0",
                    }}
                  >
                    {rooms.map((room) => {
                      const occupiedBeds = room.beds.filter((bed) => bed.student !== null).length;
                      const totalBeds = room.beds.length;
                      const isFull = occupiedBeds === totalBeds;
                      const isMatch = roomMatchesSearch(room); // cheol

                      return (
                        <button
                          key={room.roomNumber}
                          onClick={() =>
                            navigate(`/student/dormitory/building/${buildingId}/room/${room.roomNumber}`)
                          }
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = `0 6px 18px ${building.color}44`;
                            e.currentTarget.style.transform = "translateY(-2px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                          style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "6px",
                            padding: "12px",
                            background: hasSearch && isMatch ? `${building.color}12` : "#fff", // cheol
                            border: `2px solid ${building.color}`,
                            borderRadius: "10px",
                            cursor: "pointer",
                            boxShadow: hasSearch && isMatch ? `0 4px 14px ${building.color}44` : "0 2px 8px rgba(0,0,0,0.08)", // cheol
                            opacity: hasSearch && !isMatch ? 0.3 : 1, // cheol
                            transition: "transform 0.15s ease, box-shadow 0.15s ease, opacity 0.2s ease",
                          }}
                        >
                          <div
                            style={{
                              width: "52px",
                              height: "64px",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: `${building.color}20`,
                            }}
                          >
                            <DoorOpen size={32} style={{ color: building.color }} />
                          </div>
                          <span style={{ fontWeight: 700, fontSize: "16px", color: building.color }}>
                            {room.roomNumber}호
                          </span>
                          <span style={{ fontSize: "11px", color: isFull ? "#ef4444" : "#64748b", fontWeight: isFull ? 600 : 400 }}>
                            {occupiedBeds}/{totalBeds}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
