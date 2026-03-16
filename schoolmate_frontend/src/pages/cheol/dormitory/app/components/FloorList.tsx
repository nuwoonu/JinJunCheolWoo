import { useNavigate, useParams } from "react-router";
import { ArrowLeft, DoorOpen } from "lucide-react";
import { useDormitory } from "./DormitoryProvider";

export default function FloorList() {
  const navigate = useNavigate();
  const { buildingId } = useParams<{ buildingId: string }>();
  const { getBuilding } = useDormitory();

  const building = getBuilding(buildingId || "");

  if (!building) {
    return (
      <div className="size-full flex items-center justify-center">
        <p>건물을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const floors = Array.from({ length: building.floors }, (_, i) => building.floors - i);

  // 층별로 방 그룹화
  const getRoomsByFloor = (floor: number) => {
    return building.rooms.filter((room) => room.floor === floor);
  };

  return (
    <div className="size-full bg-gradient-to-br from-slate-50 to-slate-100 p-8 overflow-auto">
      <div className="max-w-5xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate("/")} className="p-2 rounded-lg hover:bg-slate-200 transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </button>
          <h1 className="text-4xl text-slate-800">{building.name} - 층별 호수</h1>
        </div>

        {/* 건물 옆면 (층 구조) */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="space-y-4">
            {floors.map((floor) => {
              const rooms = getRoomsByFloor(floor);

              return (
                <div key={floor} className="flex items-center gap-6">
                  {/* 층 표시 */}
                  <div
                    className="w-20 h-24 flex items-center justify-center rounded-lg text-white text-xl font-bold shadow-md"
                    style={{ backgroundColor: building.color }}
                  >
                    {floor}층
                  </div>

                  {/* 각 층의 호수들 */}
                  <div className="flex-1 flex items-center gap-4 bg-slate-50 rounded-lg p-4 border-2 border-slate-200">
                    {rooms.map((room) => {
                        const occupiedBeds = room.beds.filter((bed) => bed.student !== null).length;
                        const totalBeds = room.beds.length;

                        return (
                          <button
                            key={room.roomNumber}
                            onClick={() => navigate(`/building/${buildingId}/room/${room.roomNumber}`)}
                            className="flex-1 flex flex-col items-center gap-2 p-4 bg-white rounded-lg border-2 hover:border-current hover:shadow-lg transition-all duration-200 group"
                            style={{ borderColor: building.color }}
                          >
                            {/* 문 아이콘 */}
                            <div
                              className="w-16 h-20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
                              style={{ backgroundColor: `${building.color}20` }}
                            >
                              <DoorOpen className="w-10 h-10" style={{ color: building.color }} />
                            </div>

                            {/* 호수 번호 */}
                            <span className="font-bold text-lg" style={{ color: building.color }}>
                              {room.roomNumber}호
                            </span>

                            {/* 배정 현황 */}
                            <span className="text-xs text-slate-600">
                              {occupiedBeds}/{totalBeds}
                            </span>
                          </button>
                        );
                      },
                    )}
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
