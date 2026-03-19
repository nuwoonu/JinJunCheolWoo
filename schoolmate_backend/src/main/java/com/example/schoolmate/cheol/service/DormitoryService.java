package com.example.schoolmate.cheol.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.cheol.dto.DormitoryAssignDTO;
import com.example.schoolmate.cheol.dto.DormitoryDTO;
import com.example.schoolmate.cheol.entity.Dormitory;
import com.example.schoolmate.cheol.repository.DormitoryRepository;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.user.constant.RoomType;
import com.example.schoolmate.common.repository.info.student.StudentInfoRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Log4j2
public class DormitoryService {

    private final DormitoryRepository dormitoryRepository;
    private final StudentInfoRepository studentInfoRepository;

    /**
     * 기숙사 초기 데이터 생성
     * - 3개 동, 각 5층, 층당 4호실
     * - 101, 102(2인실), 103(1인실), 104(4인실)
     */
    @Transactional
    public void initializeDormitories() {
        List<Dormitory> dormitories = new ArrayList<>();

        String[] buildings = { "1동", "2동", "3동" };
        int[] floors = { 1, 2, 3, 4, 5 };

        for (String building : buildings) {
            for (int floor : floors) {
                // 101호 - 2인실
                dormitories.add(createDormitoryBed(building, floor, "101", "A", RoomType.DOUBLE));
                dormitories.add(createDormitoryBed(building, floor, "101", "B", RoomType.DOUBLE));

                // 102호 - 4인실
                dormitories.add(createDormitoryBed(building, floor, "102", "1", RoomType.QUADRUPLE));
                dormitories.add(createDormitoryBed(building, floor, "102", "2", RoomType.QUADRUPLE));
                dormitories.add(createDormitoryBed(building, floor, "102", "3", RoomType.QUADRUPLE));
                dormitories.add(createDormitoryBed(building, floor, "102", "4", RoomType.QUADRUPLE));

                // 103호 - 1인실
                dormitories.add(createDormitoryBed(building, floor, "103", "1", RoomType.SINGLE));

                // 104호 - 2인실
                dormitories.add(createDormitoryBed(building, floor, "104", "A", RoomType.DOUBLE));
                dormitories.add(createDormitoryBed(building, floor, "104", "B", RoomType.DOUBLE));
            }
        }

        dormitoryRepository.saveAll(dormitories);
        log.info("기숙사 초기 데이터 생성 완료: {} 개 침대", dormitories.size());
    }

    private Dormitory createDormitoryBed(String building, int floor, String roomNumber, String bedNumber,
            RoomType roomType) {
        return Dormitory.builder()
                .building(building)
                .floor(floor)
                .roomNumber(roomNumber)
                .bedNumber(bedNumber)
                .roomType(roomType)
                .build();
    }

    /**
     * 특정 건물의 모든 방 조회 (층별, 호수별 그룹화)
     */
    public Map<Integer, Map<String, List<DormitoryDTO>>> getBuildingRooms(String building) {
        List<Dormitory> dormitories = dormitoryRepository.findByBuildingWithStudents(building);

        return dormitories.stream()
                .collect(Collectors.groupingBy(
                        Dormitory::getFloor,
                        Collectors.groupingBy(
                                Dormitory::getRoomNumber,
                                Collectors.mapping(
                                        DormitoryDTO::from,
                                        Collectors.toList()))));
    }

    /**
     * 빈 침대 목록 조회
     */
    public List<DormitoryDTO> getEmptyBeds() {
        return dormitoryRepository.findEmptyBeds().stream()
                .map(DormitoryDTO::from)
                .collect(Collectors.toList());
    }

    /**
     * 특정 건물의 빈 침대 조회
     */
    public List<DormitoryDTO> getEmptyBedsByBuilding(String building) {
        return dormitoryRepository.findEmptyBedsByBuilding(building).stream()
                .map(DormitoryDTO::from)
                .collect(Collectors.toList());
    }

    /**
     * 학생에게 기숙사 배정
     */
    @Transactional
    public DormitoryDTO assignDormitory(DormitoryAssignDTO assignDTO) {
        // 1. 학생 조회
        StudentInfo student = studentInfoRepository.findById(assignDTO.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

        // 2. 기숙사 침대 조회
        Dormitory dormitory = dormitoryRepository.findByLocation(
                assignDTO.getBuilding(),
                assignDTO.getFloor(),
                assignDTO.getRoomNumber(),
                assignDTO.getBedNumber()).orElseThrow(() -> new IllegalArgumentException("해당 침대를 찾을 수 없습니다."));

        // 3. 침대가 비어있는지 확인
        if (!dormitory.isEmpty()) {
            throw new IllegalStateException(
                    String.format("이미 배정된 침대입니다. 현재 사용자: %s",
                            dormitory.getStudents().get(0).getUser().getName()));
        }

        // 4. 학생이 이미 다른 기숙사에 배정되어 있는지 확인
        if (student.hasDormitory()) {
            throw new IllegalStateException(
                    String.format("학생이 이미 %s에 배정되어 있습니다.",
                            student.getDormitory().getFullAddress()));
        }

        // 5. 배정
        student.assignDormitory(dormitory);

        log.info("기숙사 배정 완료: {} -> {}",
                student.getUser().getName(), dormitory.getFullAddress());

        return DormitoryDTO.from(dormitory);
    }

    /**
     * 특정 학생의 기숙사 배정 정보 조회
     */
    public java.util.Optional<DormitoryDTO> getDormitoryByStudentInfoId(Long studentInfoId) {
        return studentInfoRepository.findById(studentInfoId)
                .filter(StudentInfo::hasDormitory)
                .map(s -> DormitoryDTO.from(s.getDormitory()));
    }

    /**
     * 기숙사 배정 해제
     */
    @Transactional
    public void unassignDormitory(Long studentId) {
        StudentInfo student = studentInfoRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

        if (!student.hasDormitory()) {
            throw new IllegalStateException("배정된 기숙사가 없습니다.");
        }

        String dormitoryInfo = student.getDormitory().getFullAddress();
        student.removeDormitory();

        log.info("기숙사 배정 해제: {} <- {}", student.getUser().getName(), dormitoryInfo);
    }

    /**
     * 특정 호실의 모든 침대 및 배정 현황 조회
     */
    public List<DormitoryDTO> getRoomDetails(String building, Integer floor, String roomNumber) {
        return dormitoryRepository.findByRoom(building, floor, roomNumber).stream()
                .map(DormitoryDTO::from)
                .collect(Collectors.toList());
    }
}