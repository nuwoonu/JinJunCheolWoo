import { useNavigate, useLocation } from "react-router";
import { Building2, Search, Plus, Trash2, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext"; // cheol
import { useBuildingList } from "../hooks/useDormitoryData"; // cheol
import { addBuilding, deleteBuilding, updateBuilding, updateRoomBeds, fetchBuildingRooms, searchBuildingsByStudent, initializeDormitories } from "../../api/dormitoryApi"; // cheol

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
  const location = useLocation();
  const baseRoute = location.pathname.startsWith("/admin") ? "/admin/dormitory" : "/student/dormitory";
  const { user } = useAuth(); // cheol
  const isStudent = user?.role === "STUDENT"; // cheol
  const [searchQuery, setSearchQuery] = useState(""); // cheol

  // cheol: 기숙사 초기화 상태
  const [initializing, setInitializing] = useState(false);

  const handleInitialize = async () => {
    if (!confirm("기숙사 초기 데이터를 생성하시겠습니까?\n(3개 동, 각 5층, 층당 4호실 구성으로 생성됩니다)")) return;
    setInitializing(true);
    try {
      await initializeDormitories();
      alert("기숙사 초기 데이터 생성이 완료되었습니다.");
      refetch();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "초기화 중 오류가 발생했습니다.");
    } finally {
      setInitializing(false);
    }
  };

  // cheol: 건물 추가 폼 상태
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBuilding, setNewBuilding] = useState({ name: "", floors: 5, bedsPerRoom: 2 });
  const [addFloorRooms, setAddFloorRooms] = useState<number[]>(Array(5).fill(4));
  const [adding, setAdding] = useState(false);

  // cheol: 건물 수정 폼 상태
  const [editingBuilding, setEditingBuilding] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", floors: 5, bedsPerRoom: 2 });
  const [editSaving, setEditSaving] = useState(false);
  // cheol: 층별 호실 수 (index 0 = 1층)
  const [floorRooms, setFloorRooms] = useState<number[]>([]);
  // cheol: 기존 호실 데이터 (수정 폼 진입 시 API에서 로드)
  const [existingRoomData, setExistingRoomData] = useState<Record<string, Record<string, any[]>> | null>(null);
  // cheol: 특정 호실 침대 수 조정용
  const [roomAdjustFloor, setRoomAdjustFloor] = useState<number>(1);
  const [roomAdjustRoom, setRoomAdjustRoom] = useState<string>("");
  const [roomAdjustBeds, setRoomAdjustBeds] = useState<number>(2);
  const [roomAdjustSaving, setRoomAdjustSaving] = useState(false);

  // cheol: API 기반 건물 목록
  const { buildings, loading, error, refetch } = useBuildingList();

  // cheol: 건물 추가 핸들러
  const handleAddBuilding = async () => {
    if (!newBuilding.name.trim()) { alert("건물 이름을 입력하세요."); return; }
    setAdding(true);
    try {
      await addBuilding(newBuilding.name.trim(), newBuilding.floors, addFloorRooms, newBuilding.bedsPerRoom);
      setShowAddForm(false);
      setNewBuilding({ name: "", floors: 5, bedsPerRoom: 2 });
      setAddFloorRooms(Array(5).fill(4));
      refetch();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "건물 추가 중 오류가 발생했습니다.");
    } finally {
      setAdding(false);
    }
  };

  // cheol: 건물 수정 시작 핸들러 — 기존 호실 데이터 로드 후 층별 호실 수 초기화
  const handleStartEdit = async (building: { name: string; floors: number }) => {
    setEditingBuilding(building.name);
    setEditForm({ name: building.name, floors: building.floors, bedsPerRoom: 2 });
    setFloorRooms(Array(building.floors).fill(4));
    setRoomAdjustFloor(1);
    setRoomAdjustRoom("");
    setRoomAdjustBeds(2);
    setShowAddForm(false);
    try {
      const data = await fetchBuildingRooms(building.name);
      setExistingRoomData(data);
      // 기존 층별 호실 수로 초기화
      const initial = Array(building.floors).fill(4);
      Object.entries(data).forEach(([floorStr, rooms]) => {
        const idx = Number(floorStr) - 1;
        if (idx >= 0 && idx < building.floors) initial[idx] = Object.keys(rooms).length;
      });
      setFloorRooms(initial);
      // 첫 번째 층/호실 선택
      const sortedFloors = Object.keys(data).map(Number).sort((a, b) => a - b);
      if (sortedFloors.length > 0) {
        const firstFloor = sortedFloors[0];
        setRoomAdjustFloor(firstFloor);
        const roomNums = Object.keys(data[String(firstFloor)] ?? {}).sort();
        if (roomNums.length > 0) {
          setRoomAdjustRoom(roomNums[0]);
          const dtos = data[String(firstFloor)][roomNums[0]] ?? [];
          setRoomAdjustBeds(dtos.length > 0 ? dtos.length : 2);
        }
      }
    } catch {
      setExistingRoomData(null);
    }
  };

  // cheol: 건물 수정 저장 핸들러
  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) { alert("건물 이름을 입력하세요."); return; }
    if (!editingBuilding) return;
    setEditSaving(true);
    try {
      await updateBuilding(editingBuilding, editForm.name.trim(), editForm.floors, floorRooms, editForm.bedsPerRoom);
      setEditingBuilding(null);
      setExistingRoomData(null);
      refetch();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "건물 수정 중 오류가 발생했습니다.");
    } finally {
      setEditSaving(false);
    }
  };

  // cheol: 특정 호실 침대 수 조정 핸들러
  const handleRoomBedAdjust = async () => {
    if (!editingBuilding || !roomAdjustRoom) return;
    setRoomAdjustSaving(true);
    try {
      await updateRoomBeds(editingBuilding, roomAdjustFloor, roomAdjustRoom, roomAdjustBeds);
      const data = await fetchBuildingRooms(editingBuilding);
      setExistingRoomData(data);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "침대 수 수정 중 오류가 발생했습니다.");
    } finally {
      setRoomAdjustSaving(false);
    }
  };

  // cheol: 건물 삭제 핸들러
  const handleDeleteBuilding = async (buildingName: string) => {
    if (!confirm(`"${buildingName}"을 삭제하시겠습니까?\n배정된 학생 연결도 모두 해제됩니다.`)) return;
    try {
      await deleteBuilding(buildingName);
      refetch();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "삭제 중 오류가 발생했습니다.");
    }
  };

  // cheol: 학생 이름으로 배정된 건물 검색 (300ms 디바운스)
  const [studentMatchBuildings, setStudentMatchBuildings] = useState<string[]>([]);
  const hasSearch = searchQuery.trim().length > 0;

  useEffect(() => {
    if (!hasSearch) {
      setStudentMatchBuildings([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const result = await searchBuildingsByStudent(searchQuery.trim());
        setStudentMatchBuildings(result);
      } catch {
        setStudentMatchBuildings([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, hasSearch]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100%" }}>
        <p style={{ color: "#64748b", fontSize: "16px" }}>불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100%", gap: "12px" }}>
        <p style={{ color: "#ef4444" }}>{error}</p>
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
        background: "linear-gradient(150deg, #f8fafc 0%, #e2e8f0 100%)",
        padding: "32px",
        overflowY: "auto",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b", margin: 0 }}>기숙사 건물</h1>
          {!isStudent && ( // cheol
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleInitialize}
                disabled={initializing}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "9px 18px", background: initializing ? "#94a3b8" : "#0f766e", color: "#fff",
                  border: "none", borderRadius: "10px", cursor: initializing ? "not-allowed" : "pointer",
                  fontSize: "14px", fontWeight: 600,
                }}
              >
                {initializing ? "생성 중..." : "초기 데이터 생성"}
              </button>
              <button
                onClick={() => setShowAddForm((v) => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "9px 18px", background: "#334155", color: "#fff",
                  border: "none", borderRadius: "10px", cursor: "pointer",
                  fontSize: "14px", fontWeight: 600,
                }}
              >
                <Plus size={16} />
                건물 추가
              </button>
            </div>
          )}
        </div>

        {/* 건물 추가 폼 — 교사/관리자 전용 */}
        {!isStudent && showAddForm && ( // cheol
          <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", padding: "24px", marginBottom: "28px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 20px", color: "#1e293b" }}>새 건물 추가</h2>

            {/* 기본 정보: 건물 이름 / 층 수 / 호실당 침대 수 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px" }}>건물 이름</label>
                <input
                  type="text"
                  value={newBuilding.name}
                  onChange={(e) => setNewBuilding((v) => ({ ...v, name: e.target.value }))}
                  placeholder="예: 4동"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px" }}>층 수</label>
                <input
                  type="number" min={1}
                  value={newBuilding.floors}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setNewBuilding((v) => ({ ...v, floors: n }));
                    setAddFloorRooms((prev) => {
                      const next = Array(n).fill(4);
                      for (let i = 0; i < Math.min(prev.length, n); i++) next[i] = prev[i];
                      return next;
                    });
                  }}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px" }}>호실당 침대 수</label>
                <input
                  type="number" min={1} max={4}
                  value={newBuilding.bedsPerRoom}
                  onChange={(e) => setNewBuilding((v) => ({ ...v, bedsPerRoom: Number(e.target.value) }))}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none" }}
                />
              </div>
            </div>

            {/* 층별 호실 수 개별 입력 */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "8px" }}>층별 호실 수</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {Array.from({ length: newBuilding.floors }).map((_, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", minWidth: "60px" }}>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>{i + 1}층</span>
                    <input
                      type="number" min={1}
                      value={addFloorRooms[i] ?? 4}
                      onChange={(e) => setAddFloorRooms((prev) => {
                        const next = [...prev];
                        next[i] = Number(e.target.value);
                        return next;
                      })}
                      style={{ width: "60px", padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", textAlign: "center", outline: "none" }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleAddBuilding}
                disabled={adding}
                style={{ padding: "8px 20px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 500 }}
              >
                {adding ? "추가 중..." : "추가"}
              </button>
              <button
                onClick={() => { setShowAddForm(false); setAddFloorRooms(Array(5).fill(4)); setNewBuilding({ name: "", floors: 5, bedsPerRoom: 2 }); }}
                style={{ padding: "8px 20px", background: "#e2e8f0", color: "#475569", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 500 }}
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 건물 수정 폼 — 교사/관리자 전용 */}
        {!isStudent && editingBuilding && (
          <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", padding: "24px", marginBottom: "28px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 20px", color: "#1e293b" }}>
              건물 정보 수정 — {editingBuilding}
            </h2>

            {/* 기본 정보: 건물 이름 / 층 수 / 신규 호실 기본 침대 수 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px" }}>건물 이름</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((v) => ({ ...v, name: e.target.value }))}
                  placeholder="예: 4동"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px" }}>층 수</label>
                <input
                  type="number" min={1}
                  value={editForm.floors}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setEditForm((v) => ({ ...v, floors: n }));
                    setFloorRooms((prev) => {
                      const next = Array(n).fill(4);
                      for (let i = 0; i < Math.min(prev.length, n); i++) next[i] = prev[i];
                      return next;
                    });
                  }}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px" }}>신규 호실 기본 침대 수</label>
                <input
                  type="number" min={1} max={4}
                  value={editForm.bedsPerRoom}
                  onChange={(e) => setEditForm((v) => ({ ...v, bedsPerRoom: Number(e.target.value) }))}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none" }}
                />
              </div>
            </div>

            {/* 층별 호실 수 개별 입력 */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "8px" }}>층별 호실 수</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {Array.from({ length: editForm.floors }).map((_, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", minWidth: "60px" }}>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>{i + 1}층</span>
                    <input
                      type="number" min={1}
                      value={floorRooms[i] ?? 4}
                      onChange={(e) => setFloorRooms((prev) => {
                        const next = [...prev];
                        next[i] = Number(e.target.value);
                        return next;
                      })}
                      style={{ width: "60px", padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", textAlign: "center", outline: "none" }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 특정 호실 침대 수 조정 */}
            {existingRoomData && Object.keys(existingRoomData).length > 0 && (
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "16px", marginBottom: "20px" }}>
                <label style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "8px" }}>특정 호실 침대 수 조정</label>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", flexWrap: "wrap" }}>
                  {/* 층 선택 */}
                  <div>
                    <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>층</span>
                    <select
                      value={roomAdjustFloor}
                      onChange={(e) => {
                        const floor = Number(e.target.value);
                        setRoomAdjustFloor(floor);
                        const rooms = Object.keys(existingRoomData[String(floor)] ?? {}).sort();
                        const firstRoom = rooms[0] ?? "";
                        setRoomAdjustRoom(firstRoom);
                        const dtos = firstRoom ? (existingRoomData[String(floor)]?.[firstRoom] ?? []) : [];
                        setRoomAdjustBeds(dtos.length > 0 ? dtos.length : 2);
                      }}
                      style={{ padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", outline: "none", background: "#fff" }}
                    >
                      {Object.keys(existingRoomData).map(Number).sort((a, b) => a - b).map((floor) => (
                        <option key={floor} value={floor}>{floor}층</option>
                      ))}
                    </select>
                  </div>
                  {/* 호실 선택 */}
                  <div>
                    <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>호실</span>
                    <select
                      value={roomAdjustRoom}
                      onChange={(e) => {
                        setRoomAdjustRoom(e.target.value);
                        const dtos = existingRoomData[String(roomAdjustFloor)]?.[e.target.value] ?? [];
                        setRoomAdjustBeds(dtos.length > 0 ? dtos.length : 2);
                      }}
                      style={{ padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", outline: "none", background: "#fff" }}
                    >
                      {Object.keys(existingRoomData[String(roomAdjustFloor)] ?? {}).sort().map((room) => (
                        <option key={room} value={room}>{room}호</option>
                      ))}
                    </select>
                  </div>
                  {/* 침대 수 */}
                  <div>
                    <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>침대 수</span>
                    <input
                      type="number" min={1} max={4}
                      value={roomAdjustBeds}
                      onChange={(e) => setRoomAdjustBeds(Number(e.target.value))}
                      style={{ width: "70px", padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", outline: "none", textAlign: "center" }}
                    />
                  </div>
                  <button
                    onClick={handleRoomBedAdjust}
                    disabled={roomAdjustSaving || !roomAdjustRoom}
                    style={{ padding: "7px 16px", background: "#0ea5e9", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 500, fontSize: "14px" }}
                  >
                    {roomAdjustSaving ? "적용 중..." : "적용"}
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleSaveEdit}
                disabled={editSaving}
                style={{ padding: "8px 20px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 500 }}
              >
                {editSaving ? "저장 중..." : "저장"}
              </button>
              <button
                onClick={() => { setEditingBuilding(null); setExistingRoomData(null); }}
                style={{ padding: "8px 20px", background: "#e2e8f0", color: "#475569", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 500 }}
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 검색창 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "8px 14px",
            marginBottom: "36px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <Search size={16} style={{ color: "#94a3b8", flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="건물 이름으로 검색"
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

        {/* 건물 목록 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "48px", alignItems: "flex-end" }}>
          {buildings.map((building) => {
            const isMatch = !hasSearch ||
              building.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              studentMatchBuildings.includes(building.name);
            return (
            <div key={building.id} style={{ position: "relative", flexShrink: 0, opacity: hasSearch && !isMatch ? 0.3 : 1, transition: "opacity 0.2s ease" }}>

              {/* 건물 카드 */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "140px" }}>

                {/* 옥상 구조물 */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: "5px", marginBottom: "2px" }}>
                  <div style={{ width: "16px", height: "20px", background: shadeColor(building.color, -40), borderRadius: "2px 2px 0 0" }} />
                  <div style={{ width: "10px", height: "28px", background: shadeColor(building.color, -35), borderRadius: "2px 2px 0 0" }} />
                  <div style={{ width: "8px", height: "16px", background: shadeColor(building.color, -38), borderRadius: "2px 2px 0 0" }} />
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

                {/* 건물 본체 래퍼 — 삭제 버튼 위치 기준 */}
                <div style={{ position: "relative" }}>
                  {/* 건물 본체 */}
                  <div
                    style={{
                      width: "140px",
                      height: "280px",
                      background: `linear-gradient(175deg, ${building.color} 0%, ${shadeColor(building.color, -18)} 100%)`,
                      position: "relative",
                      overflow: "hidden",
                      boxShadow: "6px 8px 24px rgba(0,0,0,0.22), inset -5px 0 10px rgba(0,0,0,0.08)",
                    }}
                  >
                    {/* 창문 그리드 (3열 × 5행) */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", padding: "14px 12px 48px" }}>
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

                    {/* 건물 아이콘 */}
                    <div style={{ position: "absolute", bottom: "40px", left: "50%", transform: "translateX(-50%)" }}>
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
                      <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(255,255,255,0.7)" }} />
                    </div>
                  </div>

                  {/* 수정/삭제 버튼 — 교사/관리자 전용 */}
                  {!isStudent && ( // cheol
                    <>
                      {/* 수정 버튼 — 건물 좌상단 */}
                      <button
                        onClick={() => handleStartEdit(building)}
                        title={`${building.name} 수정`}
                        style={{
                          position: "absolute",
                          top: "8px",
                          left: "8px",
                          width: "28px",
                          height: "28px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(0,0,0,0.45)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          transition: "background 0.15s",
                          zIndex: 10,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#3b82f6")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.45)")}
                      >
                        <Pencil size={14} />
                      </button>
                      {/* 삭제 버튼 — 건물 우상단 */}
                      <button
                        onClick={() => handleDeleteBuilding(building.name)}
                        title={`${building.name} 삭제`}
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                          width: "28px",
                          height: "28px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(0,0,0,0.45)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          transition: "background 0.15s",
                          zIndex: 10,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#ef4444")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.45)")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
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

                {/* 배정 현황 */}
                {!isStudent && ( // cheol
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                    {building.occupiedBeds}/{building.totalBeds} 배정
                  </div>
                )}

                {/* 동 이름 버튼 */}
                <button
                  onClick={() => navigate(`${baseRoute}/building/${encodeURIComponent(building.name)}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = `0 6px 18px ${building.color}80`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = `0 3px 12px ${building.color}55`;
                  }}
                  style={{
                    marginTop: "10px",
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
          ); })}
        </div>

        {/* 빈 상태 */}
        {buildings.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>
            <div style={{ fontSize: "52px", marginBottom: "12px" }}>🏢</div>
            <p style={{ fontSize: "16px", margin: 0 }}>등록된 건물이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
