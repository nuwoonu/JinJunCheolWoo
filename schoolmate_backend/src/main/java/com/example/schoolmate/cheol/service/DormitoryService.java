package com.example.schoolmate.cheol.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.cheol.dto.DormitoryAssignDTO;
import com.example.schoolmate.cheol.dto.DormitoryDTO;
import com.example.schoolmate.cheol.entity.Dormitory;
import com.example.schoolmate.cheol.entity.DormitoryAssignment;
import com.example.schoolmate.cheol.repository.DormitoryAssignmentRepository;
import com.example.schoolmate.cheol.repository.DormitoryRepository;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.user.constant.RoomType;
import com.example.schoolmate.common.repository.info.student.StudentInfoRepository;
import com.example.schoolmate.config.school.SchoolContextHolder;
import com.example.schoolmate.domain.term.entity.AcademicTerm;
import com.example.schoolmate.domain.term.entity.AcademicTermStatus;
import com.example.schoolmate.domain.term.repository.AcademicTermRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Log4j2
public class DormitoryService {

    private final DormitoryRepository dormitoryRepository;
    private final DormitoryAssignmentRepository dormitoryAssignmentRepository;
    private final StudentInfoRepository studentInfoRepository;
    private final AcademicTermRepository academicTermRepository;

    /**
     * cheol: 앱 시작 시 DB가 비어있으면 자동 초기화
     */
    @PostConstruct
    @Transactional
    public void initIfEmpty() {
        if (dormitoryRepository.count() == 0) {
            initializeDormitories();
            log.info("기숙사 초기 데이터 자동 생성 완료");
        }
    }

    /**
     * 기숙사 초기 데이터 생성
     */
    @Transactional
    public void initializeDormitories() {
        List<Dormitory> dormitories = new ArrayList<>();

        String[] buildings = { "1동", "2동", "3동" };
        int[] floors = { 1, 2, 3, 4, 5 };

        for (String building : buildings) {
            for (int floor : floors) {
                String r01 = String.format("%d01", floor);
                String r02 = String.format("%d02", floor);
                String r03 = String.format("%d03", floor);
                String r04 = String.format("%d04", floor);

                dormitories.add(createDormitoryBed(building, floor, r01, "A", RoomType.DOUBLE));
                dormitories.add(createDormitoryBed(building, floor, r01, "B", RoomType.DOUBLE));
                dormitories.add(createDormitoryBed(building, floor, r02, "1", RoomType.QUADRUPLE));
                dormitories.add(createDormitoryBed(building, floor, r02, "2", RoomType.QUADRUPLE));
                dormitories.add(createDormitoryBed(building, floor, r02, "3", RoomType.QUADRUPLE));
                dormitories.add(createDormitoryBed(building, floor, r02, "4", RoomType.QUADRUPLE));
                dormitories.add(createDormitoryBed(building, floor, r03, "1", RoomType.SINGLE));
                dormitories.add(createDormitoryBed(building, floor, r04, "A", RoomType.DOUBLE));
                dormitories.add(createDormitoryBed(building, floor, r04, "B", RoomType.DOUBLE));
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
     * cheol: 건물 추가
     */
    @Transactional
    public void addBuilding(String buildingName, int floors, int roomsPerFloor, int bedsPerRoom) {
        if (dormitoryRepository.findBuildingSummaries().stream()
                .anyMatch(row -> buildingName.equals(row[0]))) {
            throw new IllegalArgumentException("이미 존재하는 건물명입니다: " + buildingName);
        }
        List<Dormitory> beds = new ArrayList<>();
        RoomType roomType = bedsPerRoom == 1 ? RoomType.SINGLE
                : bedsPerRoom <= 2 ? RoomType.DOUBLE : RoomType.QUADRUPLE;
        for (int floor = 1; floor <= floors; floor++) {
            for (int r = 1; r <= roomsPerFloor; r++) {
                String roomNumber = String.format("%d%02d", floor, r);
                for (int b = 1; b <= bedsPerRoom; b++) {
                    beds.add(createDormitoryBed(buildingName, floor, roomNumber, String.valueOf(b), roomType));
                }
            }
        }
        dormitoryRepository.saveAll(beds);
        log.info("건물 추가 완료: {} ({}층, 층당 {}호, 침대 {}개)", buildingName, floors, roomsPerFloor, bedsPerRoom);
    }

    /**
     * cheol: 건물 삭제 (배정 해제 후 삭제)
     */
    @Transactional
    public void deleteBuilding(String buildingName) {
        List<Dormitory> beds = dormitoryRepository.findByBuildingWithStudents(buildingName);
        if (beds.isEmpty()) {
            throw new IllegalArgumentException("존재하지 않는 건물입니다: " + buildingName);
        }
        // 현재 학기 배정 해제
        beds.forEach(d -> d.getDormitoryAssignments().forEach(da ->
                dormitoryAssignmentRepository.delete(da)));
        dormitoryRepository.deleteAll(beds);
        log.info("건물 삭제 완료: {}", buildingName);
    }

    /**
     * 전체 건물 목록 및 통계 조회
     */
    public List<Map<String, Object>> getAllBuildings() {
        List<Object[]> rows = dormitoryRepository.findBuildingSummaries();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("building", row[0]);
            map.put("totalBeds", ((Number) row[1]).longValue());
            map.put("occupiedBeds", row[2] != null ? ((Number) row[2]).longValue() : 0L);
            map.put("maxFloor", ((Number) row[3]).intValue());
            result.add(map);
        }
        return result;
    }

    /**
     * 특정 건물의 모든 방 조회
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

    public List<DormitoryDTO> getEmptyBeds() {
        return dormitoryRepository.findEmptyBeds().stream()
                .map(DormitoryDTO::from)
                .collect(Collectors.toList());
    }

    public List<DormitoryDTO> getEmptyBedsByBuilding(String building) {
        return dormitoryRepository.findEmptyBedsByBuilding(building).stream()
                .map(DormitoryDTO::from)
                .collect(Collectors.toList());
    }

    /**
     * 학생에게 기숙사 배정 (현재 ACTIVE 학기 기준)
     */
    @Transactional
    public DormitoryDTO assignDormitory(DormitoryAssignDTO assignDTO) {
        StudentInfo student = studentInfoRepository.findById(assignDTO.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

        Dormitory dormitory = dormitoryRepository.findByLocation(
                assignDTO.getBuilding(),
                assignDTO.getFloor(),
                assignDTO.getRoomNumber(),
                assignDTO.getBedNumber()).orElseThrow(() -> new IllegalArgumentException("해당 침대를 찾을 수 없습니다."));

        AcademicTerm activeTerm = getActiveTermForStudent(student);

        // 침대가 현재 학기에 비어있는지 확인
        List<DormitoryAssignment> activeAssignments = dormitoryAssignmentRepository
                .findActiveByDormitoryId(dormitory.getId());
        if (!activeAssignments.isEmpty()) {
            throw new IllegalStateException(
                    String.format("이미 배정된 침대입니다. 현재 사용자: %s",
                            activeAssignments.get(0).getStudentInfo().getUser().getName()));
        }

        // 학생이 이미 현재 학기에 기숙사 배정되어 있는지 확인
        dormitoryAssignmentRepository.findActiveByStudentInfoId(student.getId())
                .ifPresent(existing -> {
                    throw new IllegalStateException(
                            String.format("학생이 이미 %s에 배정되어 있습니다.",
                                    existing.getDormitory().getFullAddress()));
                });

        // 배정
        DormitoryAssignment assignment = DormitoryAssignment.builder()
                .studentInfo(student)
                .academicTerm(activeTerm)
                .dormitory(dormitory)
                .build();
        dormitoryAssignmentRepository.save(assignment);

        log.info("기숙사 배정 완료: {} -> {} ({})",
                student.getUser().getName(), dormitory.getFullAddress(), activeTerm.getDisplayName());

        // DTO 반환을 위해 fresh하게 조회
        dormitory.getDormitoryAssignments().add(assignment);
        return DormitoryDTO.from(dormitory);
    }

    /**
     * 특정 학생의 기숙사 배정 정보 조회 (같은 방 학생 전체 포함)
     */
    public java.util.Optional<DormitoryDTO> getDormitoryByStudentInfoId(Long studentInfoId) {
        return dormitoryAssignmentRepository.findActiveByStudentInfoId(studentInfoId)
                .map(da -> {
                    Dormitory myBed = da.getDormitory();
                    List<Dormitory> roomBeds = dormitoryRepository.findByRoomWithStudents(
                            myBed.getBuilding(), myBed.getFloor(), myBed.getRoomNumber());
                    List<String> allStudentNames = roomBeds.stream()
                            .flatMap(bed -> bed.getDormitoryAssignments().stream())
                            .map(assignment -> assignment.getStudentInfo().getUser().getName())
                            .collect(Collectors.toList());
                    List<DormitoryAssignment> myBedAssignments = dormitoryAssignmentRepository
                            .findActiveByDormitoryId(myBed.getId());
                    return DormitoryDTO.builder()
                            .id(myBed.getId())
                            .building(myBed.getBuilding())
                            .floor(myBed.getFloor())
                            .roomNumber(myBed.getRoomNumber())
                            .bedNumber(myBed.getBedNumber())
                            .roomType(myBed.getRoomType())
                            .roomTypeDescription(myBed.getRoomType().getDescription())
                            .studentNames(allStudentNames)
                            .studentIds(myBedAssignments.stream()
                                    .map(a -> a.getStudentInfo().getId())
                                    .collect(Collectors.toList()))
                            .isEmpty(myBedAssignments.isEmpty())
                            .occupiedCount(myBedAssignments.size())
                            .fullAddress(myBed.getFullAddress())
                            .build();
                });
    }

    /**
     * 기숙사 배정 해제 (현재 ACTIVE 학기)
     */
    @Transactional
    public void unassignDormitory(Long studentId) {
        DormitoryAssignment assignment = dormitoryAssignmentRepository.findActiveByStudentInfoId(studentId)
                .orElseThrow(() -> new IllegalStateException("배정된 기숙사가 없습니다."));

        String dormitoryInfo = assignment.getDormitory().getFullAddress();
        String studentName = assignment.getStudentInfo().getUser().getName();

        dormitoryAssignmentRepository.delete(assignment);

        log.info("기숙사 배정 해제: {} <- {}", studentName, dormitoryInfo);
    }

    /**
     * cheol: 학생 이름으로 해당 학생이 배정된 건물 목록 검색
     */
    public List<String> getBuildingsByStudentName(String name) {
        if (name == null || name.trim().isEmpty()) return List.of();
        return dormitoryRepository.findBuildingsByStudentName(name.trim());
    }

    /**
     * 특정 호실의 모든 침대 및 배정 현황 조회
     */
    public List<DormitoryDTO> getRoomDetails(String building, Integer floor, String roomNumber) {
        return dormitoryRepository.findByRoom(building, floor, roomNumber).stream()
                .map(DormitoryDTO::from)
                .collect(Collectors.toList());
    }

    // 현재 ACTIVE 학기 조회 헬퍼 (학생의 소속 학교 기반 → SchoolContextHolder fallback)
    private AcademicTerm getActiveTermForStudent(StudentInfo student) {
        Long schoolId = (student.getSchool() != null) ? student.getSchool().getId() : null;
        if (schoolId == null) {
            schoolId = SchoolContextHolder.getSchoolId();
        }
        if (schoolId == null) {
            throw new IllegalStateException("학교 정보를 확인할 수 없습니다.");
        }
        return academicTermRepository.findBySchoolIdAndStatus(schoolId, AcademicTermStatus.ACTIVE)
                .orElseThrow(() -> new IllegalStateException("현재 활성 학기가 설정되어 있지 않습니다."));
    }
}
