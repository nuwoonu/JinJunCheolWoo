import React, { useState, useEffect } from 'react';
import { Building2, Bed, User, UserPlus, UserMinus } from 'lucide-react';

interface BedData {
  bedNumber: number;
  studentNames: string[];
  studentId?: number;
  roomType: string;
}

interface SelectedRoom {
  building: string;
  floor: number;
  roomNumber: string;
}

type BuildingData = Record<number, Record<string, BedData[]>>;

const DormitoryManagementSystem: React.FC = () => {
  const [buildings] = useState<string[]>(['1동', '2동', '3동']);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<SelectedRoom | null>(null);
  const [buildingData, setBuildingData] = useState<BuildingData | null>(null);
  const [roomDetails, setRoomDetails] = useState<BedData[] | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBuildingData = async (building: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dormitories/buildings/${building}`);
      const data = await response.json();
      setBuildingData(data);
    } catch (error) {
      console.error('Failed to fetch building data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomDetails = async (building: string, floor: number, roomNumber: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/dormitories/rooms?building=${building}&floor=${floor}&roomNumber=${roomNumber}`
      );
      const data = await response.json();
      setRoomDetails(data);
    } catch (error) {
      console.error('Failed to fetch room details:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignStudent = async (studentId: string, bed: BedData) => {
    if (!selectedRoom) return;
    try {
      const response = await fetch('/api/dormitories/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: studentId,
          building: selectedRoom.building,
          floor: selectedRoom.floor,
          roomNumber: selectedRoom.roomNumber,
          bedNumber: bed.bedNumber
        })
      });

      if (response.ok) {
        fetchRoomDetails(selectedRoom.building, selectedRoom.floor, selectedRoom.roomNumber);
        if (selectedBuilding) fetchBuildingData(selectedBuilding);
      } else {
        const error = await response.text();
        alert(error);
      }
    } catch (error) {
      console.error('Failed to assign student:', error);
      alert('배정에 실패했습니다.');
    }
  };

  const unassignStudent = async (studentId: number) => {
    if (!confirm('기숙사 배정을 해제하시겠습니까?')) return;
    if (!selectedRoom) return;
    try {
      const response = await fetch(`/api/dormitories/students/${studentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchRoomDetails(selectedRoom.building, selectedRoom.floor, selectedRoom.roomNumber);
        if (selectedBuilding) fetchBuildingData(selectedBuilding);
      }
    } catch (error) {
      console.error('Failed to unassign student:', error);
    }
  };

  useEffect(() => {
    if (selectedBuilding) {
      fetchBuildingData(selectedBuilding);
      setSelectedRoom(null);
      setRoomDetails(null);
    }
  }, [selectedBuilding]);

  useEffect(() => {
    if (selectedRoom) {
      fetchRoomDetails(selectedRoom.building, selectedRoom.floor, selectedRoom.roomNumber);
    }
  }, [selectedRoom]);

  const getRoomTypeKorean = (type: string) => {
    const types: Record<string, string> = {
      'SINGLE': '1인실',
      'DOUBLE': '2인실',
      'QUADRUPLE': '4인실'
    };
    return types[type] || type;
  };

  const getRoomColor = (beds: BedData[]) => {
    const occupiedCount = beds.filter(bed => bed.studentNames.length > 0).length;
    const totalBeds = beds.length;

    if (occupiedCount === 0) return 'bg-green-100 border-green-400 hover:bg-green-200';
    if (occupiedCount === totalBeds) return 'bg-red-100 border-red-400 hover:bg-red-200';
    return 'bg-yellow-100 border-yellow-400 hover:bg-yellow-200';
  };

  const BedCard: React.FC<{
    bed: BedData;
    onAssign: (bed: BedData) => void;
    onUnassign: (studentId: number) => void;
  }> = ({ bed, onAssign, onUnassign }) => {
    const isOccupied = bed.studentNames && bed.studentNames.length > 0;

    return (
      <div className={`border-2 rounded-lg p-4 w-36 h-40 flex flex-col items-center justify-between ${
        isOccupied ? 'bg-blue-50 border-blue-400' : 'bg-gray-50 border-gray-300'
      }`}>
        <div className="flex flex-col items-center flex-grow justify-center">
          <Bed className={`w-12 h-12 mb-2 ${isOccupied ? 'text-blue-600' : 'text-gray-400'}`} />
          <div className="text-xs text-gray-600 mb-1">침대 {bed.bedNumber}</div>
          {isOccupied ? (
            <>
              <User className="w-4 h-4 text-blue-600 mb-1" />
              <div className="text-sm font-semibold text-center">{bed.studentNames[0]}</div>
            </>
          ) : (
            <div className="text-sm text-gray-400">빈 침대</div>
          )}
        </div>

        {isOccupied ? (
          <button
            onClick={() => bed.studentId && onUnassign(bed.studentId)}
            className="mt-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 flex items-center gap-1"
          >
            <UserMinus size={12} />
            해제
          </button>
        ) : (
          <button
            onClick={() => onAssign(bed)}
            className="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 flex items-center gap-1"
          >
            <UserPlus size={12} />
            배정
          </button>
        )}
      </div>
    );
  };

  const renderBeds = (beds: BedData[]) => {
    const bedCount = beds.length;
    const handleAssign = (bed: BedData) => {
      const studentId = prompt('학생 ID를 입력하세요:');
      if (studentId) assignStudent(studentId, bed);
    };

    if (bedCount === 1) {
      return (
        <div className="flex justify-center">
          <BedCard bed={beds[0]} onAssign={handleAssign} onUnassign={unassignStudent} />
        </div>
      );
    } else if (bedCount === 2) {
      return (
        <div className="flex gap-4 justify-center">
          {beds.map((bed, idx) => (
            <BedCard key={idx} bed={bed} onAssign={handleAssign} onUnassign={unassignStudent} />
          ))}
        </div>
      );
    } else if (bedCount === 4) {
      return (
        <div className="grid grid-cols-2 gap-4">
          {beds.map((bed, idx) => (
            <BedCard key={idx} bed={bed} onAssign={handleAssign} onUnassign={unassignStudent} />
          ))}
        </div>
      );
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Building2 size={32} />
        기숙사 관리 시스템
      </h1>

      <div className="flex gap-6">
        {/* 1단계: 건물 선택 */}
        <div className="bg-white rounded-lg shadow-md p-6 w-64">
          <h2 className="text-xl font-semibold mb-4">건물 선택</h2>
          <div className="space-y-3">
            {buildings.map((building) => (
              <button
                key={building}
                onClick={() => setSelectedBuilding(building)}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  selectedBuilding === building
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Building2 size={20} />
                {building}
              </button>
            ))}
          </div>
        </div>

        {/* 2단계: 층별 호실 단면도 */}
        {selectedBuilding && buildingData && (
          <div className="bg-white rounded-lg shadow-md p-6 flex-1">
            <h2 className="text-xl font-semibold mb-4">{selectedBuilding} 단면도</h2>
            {loading ? (
              <div className="text-center py-20">로딩 중...</div>
            ) : (
              <div className="space-y-4">
                {[5, 4, 3, 2, 1].map((floor) => (
                  <div key={floor} className="flex items-center gap-4">
                    <div className="w-16 text-center font-bold text-gray-700">{floor}층</div>
                    <div className="flex gap-2 flex-wrap">
                      {buildingData[floor] && Object.entries(buildingData[floor]).map(([roomNumber, beds]) => (
                        <button
                          key={roomNumber}
                          onClick={() => setSelectedRoom({ building: selectedBuilding, floor, roomNumber })}
                          className={`px-4 py-2 rounded-lg border-2 font-semibold transition-all ${getRoomColor(beds)} ${
                            selectedRoom?.roomNumber === roomNumber && selectedRoom?.floor === floor
                              ? 'ring-4 ring-blue-300'
                              : ''
                          }`}
                        >
                          <div className="text-sm">{roomNumber}호</div>
                          <div className="text-xs text-gray-600">{getRoomTypeKorean(beds[0].roomType)}</div>
                          <div className="text-xs text-gray-500">
                            {beds.filter(b => b.studentNames.length > 0).length}/{beds.length}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border-2 border-green-400 rounded"></div>
                <span>공실</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-400 rounded"></div>
                <span>일부 배정</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border-2 border-red-400 rounded"></div>
                <span>만실</span>
              </div>
            </div>
          </div>
        )}

        {/* 3단계: 호실 상세 (침대 배치) */}
        {selectedRoom && roomDetails && (
          <div className="bg-white rounded-lg shadow-md p-6 w-96">
            <h2 className="text-xl font-semibold mb-4">
              {selectedRoom.building} {selectedRoom.floor}층 {selectedRoom.roomNumber}호
            </h2>
            <div className="mb-4 text-sm text-gray-600">
              {getRoomTypeKorean(roomDetails[0].roomType)}
              <span className="ml-2">
                ({roomDetails.filter(b => b.studentNames.length > 0).length}/{roomDetails.length} 배정)
              </span>
            </div>
            {renderBeds(roomDetails)}
          </div>
        )}
      </div>
    </div>
  );
};

export default DormitoryManagementSystem;
