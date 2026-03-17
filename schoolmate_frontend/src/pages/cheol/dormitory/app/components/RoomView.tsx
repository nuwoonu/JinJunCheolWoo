import { useNavigate, useParams } from "react-router";
import { ArrowLeft, User, UserPlus, UserMinus, Settings } from "lucide-react";
import { useDormitory } from "./DormitoryProvider";
import { useState } from "react";

export default function RoomView() {
  const navigate = useNavigate();
  const { buildingId, roomNumber } = useParams<{ buildingId: string; roomNumber: string }>();
  const { getBuilding, getRoom, assignStudent, unassignStudent, updateRoomBeds } = useDormitory();

  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedBed, setSelectedBed] = useState<number | null>(null);
  const [studentName, setStudentName] = useState("");
  const [showBedSettings, setShowBedSettings] = useState(false);
  const [bedCount, setBedCount] = useState(2);

  const building = getBuilding(buildingId || "");
  const room = getRoom(buildingId || "", roomNumber || "");

  if (!building || !room) {
    return (
      <div className="size-full flex items-center justify-center">
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

  return (
    <div className="size-full bg-gradient-to-br from-slate-50 to-slate-100 p-8 overflow-auto">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(`/building/${buildingId}`)}
            className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </button>
          <h1 className="text-4xl text-slate-800">
            {building.name} {roomNumber}호
          </h1>
          <button
            onClick={() => {
              setBedCount(room.beds.length);
              setShowBedSettings(!showBedSettings);
            }}
            className="ml-auto px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 flex items-center gap-2"
          >
            <Settings className="w-5 h-5" />
            침대 설정
          </button>
        </div>

        {/* 침대 설정 폼 */}
        {showBedSettings && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl mb-4">침대 개수 조절</h2>
            <div className="mb-4">
              <label className="block text-sm mb-1">침대 수</label>
              <input
                type="number"
                value={bedCount}
                onChange={(e) => setBedCount(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border rounded-lg"
                min="1"
                max="10"
              />
              <p className="text-xs text-slate-500 mt-1">
                현재 침대 수: {room.beds.length}개 → {bedCount}개로 변경
              </p>
              {bedCount < room.beds.length && (
                <p className="text-xs text-red-500 mt-1">
                  ⚠️ 침대를 줄이면 마지막 침대들이 삭제됩니다. 배정된 학생 정보도 함께 삭제됩니다.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleUpdateBeds}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                적용
              </button>
              <button
                onClick={() => setShowBedSettings(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 배정 폼 */}
        {showAssignForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl mb-4">학생 배정 - 침대 {selectedBed}</h2>
            <div className="mb-4">
              <label className="block text-sm mb-1">학생 이름</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="이름을 입력하세요"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmAssign}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                배정
              </button>
              <button
                onClick={() => {
                  setShowAssignForm(false);
                  setStudentName("");
                  setSelectedBed(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 방 내부 */}
        <div className="bg-white rounded-2xl shadow-2xl p-12">
          <div className="space-y-8">
            {room.beds.map((bed) => (
                <div key={bed.bedNumber} className="flex items-center gap-8">
                  {/* 침대 (옆면) */}
                  <div className="relative">
                    {/* 침대 프레임 */}
                    <div
                      className="w-80 h-32 rounded-lg shadow-lg relative"
                      style={{ backgroundColor: `${building.color}30` }}
                    >
                      {/* 침대 매트리스 */}
                      <div
                        className="absolute top-2 left-2 right-2 h-20 rounded"
                        style={{ backgroundColor: building.color }}
                      >
                        {/* 베개 */}
                        <div
                          className="absolute -top-1 left-4 w-16 h-10 bg-white rounded-md border-2"
                          style={{ borderColor: building.color }}
                        />

                        {/* 침대 패턴 */}
                        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-30">
                          <div className="w-1 h-full bg-white rounded" />
                          <div className="w-1 h-full bg-white rounded" />
                          <div className="w-1 h-full bg-white rounded" />
                        </div>
                      </div>

                      {/* 침대 다리 */}
                      <div
                        className="absolute -bottom-4 left-4 w-3 h-6 rounded-b"
                        style={{ backgroundColor: building.color }}
                      />
                      <div
                        className="absolute -bottom-4 right-4 w-3 h-6 rounded-b"
                        style={{ backgroundColor: building.color }}
                      />
                    </div>

                    {/* 침대 번호 */}
                    <div className="absolute -top-3 -left-3 w-10 h-10 bg-slate-700 text-white rounded-full flex items-center justify-center font-bold">
                      {bed.bedNumber}
                    </div>
                  </div>

                  {/* 학생 정보 또는 배정 버튼 */}
                  {bed.student ? (
                    <div className="flex-1 flex items-center gap-4">
                      <button
                        className="flex-1 max-w-xs px-8 py-6 rounded-xl text-white text-2xl font-semibold shadow-lg flex items-center justify-center gap-3"
                        style={{ backgroundColor: building.color }}
                      >
                        <User className="w-6 h-6" />
                        {bed.student.name}
                      </button>
                      <button
                        onClick={() => handleUnassign(bed.bedNumber)}
                        className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
                      >
                        <UserMinus className="w-5 h-5" />
                        해제
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAssign(bed.bedNumber)}
                      className="flex-1 max-w-xs px-8 py-6 rounded-xl border-2 border-dashed text-slate-400 text-xl font-semibold hover:border-current hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-3"
                      style={{ borderColor: building.color, color: building.color }}
                    >
                      <UserPlus className="w-6 h-6" />
                      학생 배정
                    </button>
                  )}
                </div>
              ),
            )}
          </div>

          {/* 방 정보 */}
          <div className="mt-12 p-6 bg-slate-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-slate-700">
              <div>
                <span className="font-semibold">건물:</span> {building.name}
              </div>
              <div>
                <span className="font-semibold">호수:</span> {roomNumber}호
              </div>
              <div>
                <span className="font-semibold">침대 수:</span> {room.beds.length}개
              </div>
              <div>
                <span className="font-semibold">배정 현황:</span> {room.beds.filter((b) => b.student !== null).length}/
                {room.beds.length}
              </div>
              <div>
                <span className="font-semibold">층:</span> {room.floor}층
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
