import { useNavigate } from "react-router";
import { Building2, Plus, Trash2 } from "lucide-react";
import { useDormitory } from "./DormitoryProvider";
import { useState } from "react";

export default function BuildingList() {
  const navigate = useNavigate();
  const { data, addBuilding, deleteBuilding } = useDormitory();
  const [showAddForm, setShowAddForm] = useState(false);
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
      newBuilding.bedsPerRoom
    );
    setShowAddForm(false);
    setNewBuilding({
      name: "",
      color: "#4A90E2",
      floors: 5,
      roomsPerFloor: 4,
      bedsPerRoom: 2,
    });
  };

  return (
    <div className="size-full bg-gradient-to-br from-slate-50 to-slate-100 p-8 overflow-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl text-slate-800">기숙사 건물</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            건물 추가
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl mb-4">새 건물 추가</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm mb-1">건물 이름</label>
                <input
                  type="text"
                  value={newBuilding.name}
                  onChange={(e) => setNewBuilding({ ...newBuilding, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="예: 5동"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">건물 색상</label>
                <input
                  type="color"
                  value={newBuilding.color}
                  onChange={(e) => setNewBuilding({ ...newBuilding, color: e.target.value })}
                  className="w-full h-10 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">층수</label>
                <input
                  type="number"
                  value={newBuilding.floors}
                  onChange={(e) => setNewBuilding({ ...newBuilding, floors: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border rounded-lg"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">층당 호수</label>
                <input
                  type="number"
                  value={newBuilding.roomsPerFloor}
                  onChange={(e) => setNewBuilding({ ...newBuilding, roomsPerFloor: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border rounded-lg"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">호수당 침대 수</label>
                <input
                  type="number"
                  value={newBuilding.bedsPerRoom}
                  onChange={(e) => setNewBuilding({ ...newBuilding, bedsPerRoom: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border rounded-lg"
                  min="1"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddBuilding}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                추가
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                취소
              </button>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {data.buildings.map((building) => (
            <div
              key={building.id}
              className="flex flex-col items-center relative"
            >
              {/* 삭제 버튼 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`${building.name}을(를) 삭제하시겠습니까?`)) {
                    deleteBuilding(building.id);
                  }
                }}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg z-10"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* 건물 시각화 */}
              <div className="relative mb-6">
                <div
                  className="w-48 h-64 rounded-lg shadow-2xl relative overflow-hidden"
                  style={{ backgroundColor: building.color }}
                >
                  {/* 건물 창문 */}
                  <div className="grid grid-cols-3 gap-3 p-4">
                    {Array.from({ length: 15 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-full h-8 bg-white/30 rounded border border-white/50"
                      />
                    ))}
                  </div>
                  
                  {/* 건물 아이콘 */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <Building2 className="w-12 h-12 text-white/40" />
                  </div>
                </div>
                
                {/* 건물 그림자 */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-44 h-4 bg-black/10 rounded-full blur-md" />
              </div>

              {/* 동 버튼 */}
              <button
                onClick={() => navigate(`/building/${building.id}`)}
                className="px-8 py-4 rounded-xl text-white text-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                style={{ backgroundColor: building.color }}
              >
                {building.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}