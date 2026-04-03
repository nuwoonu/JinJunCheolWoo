package com.example.schoolmate.cheol.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.cheol.dto.dormitorydto.DormitoryAssignDTO;
import com.example.schoolmate.cheol.dto.dormitorydto.DormitoryDTO;
import com.example.schoolmate.cheol.entity.Dormitory;
import com.example.schoolmate.cheol.entity.DormitoryAssignment;
import com.example.schoolmate.cheol.repository.DormitoryAssignmentRepository;
import com.example.schoolmate.cheol.repository.DormitoryRepository;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.user.constant.RoomType;
import com.example.schoolmate.common.repository.info.student.StudentInfoRepository;
import com.example.schoolmate.config.school.SchoolContextHolder;
import com.example.schoolmate.domain.school.entity.School;
import com.example.schoolmate.domain.school.repository.SchoolRepository;
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
    private final SchoolRepository schoolRepository;
    private final AcademicTermRepository academicTermRepository;

    // ── 내부 헬퍼 ──────────────────────────────────────────────────────────────

    private School getRequiredSchool() {
        Long schoolId = SchoolContextHolder.getSchoolId();
        if (schoolId == null) {
            throw new IllegalStateException("학교 컨텍스트가 없습니다. X-School-Id 헤더 또는 JWT schoolId를 확인하세요.");
        }
        return schoolRepository.findById(schoolId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 학교입니다: " + schoolId));
    }

    private Long getRequiredSchoolId() {
        Long schoolId = SchoolContextHolder.getSchoolId();
        if (schoolId == null) {
            throw new IllegalStateException("학교 컨텍스트가 없습니다.");
        }
        return schoolId;
    }

    private Dormitory createDormitoryBed(School school, String building, int floor,
            String roomNumber, String bedNumber, RoomType roomType) {
        return Dormitory.builder()
                .school(school)
                .building(building)
                .floor(floor)
                .roomNumber(roomNumber)
                .bedNumber(bedNumber)
                .roomType(roomType)
                .build();
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

    // ── 초기화 ──────────────────────────────────────────────────────────────────

    /**
     * 기숙사 초기 데이터 생성 (학교별)
     * - 3개 동, 각 5층, 층당 4호실
     * POST /api/dormitories/initialize 엔드포인트에서 호출
     */
    @Transactional
    public void initializeDormitories() {
        School school = getRequiredSchool();
        List<Dormitory> dormitories = new ArrayList<>();

        String[] buildings = { "1동", "2동", "3동" };
        int[] floors = { 1, 2, 3, 4, 5 };

        for (String building : buildings) {
            for (int floor : floors) {
                String r01 = String.format("%d01", floor);
                String r02 = String.format("%d02", floor);
                String r03 = String.format("%d03", floor);
                String r04 = String.format("%d04", floor);

                dormitories.add(createDormitoryBed(school, building, floor, r01, "A", RoomType.DOUBLE));
                dormitories.add(createDormitoryBed(school, building, floor, r01, "B", RoomType.DOUBLE));

                dormitories.add(createDormitoryBed(school, building, floor, r02, "1", RoomType.QUADRUPLE));
                dormitories.add(createDormitoryBed(school, building, floor, r02, "2", RoomType.QUADRUPLE));
                dormitories.add(createDormitoryBed(school, building, floor, r02, "3", RoomType.QUADRUPLE));
                dormitories.add(createDormitoryBed(school, building, floor, r02, "4", RoomType.QUADRUPLE));

                dormitories.add(createDormitoryBed(school, building, floor, r03, "1", RoomType.SINGLE));

                dormitories.add(createDormitoryBed(school, building, floor, r04, "A", RoomType.DOUBLE));
                dormitories.add(createDormitoryBed(school, building, floor, r04, "B", RoomType.DOUBLE));
            }
        }

        dormitoryRepository.saveAll(dormitories);
        log.info("기숙사 초기 데이터 생성 완료: schoolId={}, {} 개 침대", school.getId(), dormitories.size());
    }

    // ── 건물 관리 ───────────────────────────────────────────────────────────────

    /**
     * 건물 추가 (층별 호실 수를 배열로 지정, 학교별 분리)
     */
    @Transactional
    public void addBuilding(String buildingName, int floors, List<Integer> roomsPerFloor, int bedsPerRoom) {
        School school = getRequiredSchool();
        Long schoolId = school.getId();

        if (dormitoryRepository.findBuildingSummaries().stream()
                .anyMatch(row -> buildingName.equals(row[0]))) {
            throw new IllegalArgumentException("이미 존재하는 건물명입니다: " + buildingName);
        }

        RoomType roomType = bedsPerRoom == 1 ? RoomType.SINGLE
                : bedsPerRoom <= 2 ? RoomType.DOUBLE : RoomType.QUADRUPLE;
        List<Dormitory> beds = new ArrayList<>();

        for (int floor = 1; floor <= floors; floor++) {
            int rooms = roomsPerFloor.get(floor - 1);
            for (int r = 1; r <= rooms; r++) {
                String roomNumber = String.format("%d%02d", floor, r);
                for (int b = 1; b <= bedsPerRoom; b++) {
                    beds.add(createDormitoryBed(school, buildingName, floor, roomNumber, String.valueOf(b), roomType));
                }
            }
        }

        dormitoryRepository.saveAll(beds);
        log.info("건물 추가 완료: schoolId={}, {} ({}층, 침대 {}개)", schoolId, buildingName, floors, beds.size());
    }

    /**
     * 건물 수정 — 이름 변경 + 층별 호실 구조 조정 (학교별 분리)
     */
    @Transactional
    public void updateBuilding(String buildingName, String newBuildingName, int floors,
            List<Integer> roomsPerFloor, int bedsPerRoom) {
        Long schoolId = getRequiredSchoolId();

        List<Dormitory> allBeds = dormitoryRepository.findByBuildingWithStudents(buildingName);
        if (allBeds.isEmpty()) {
            throw new IllegalArgumentException("존재하지 않는 건물입니다: " + buildingName);
        }

        if (!buildingName.equals(newBuildingName)) {
            boolean nameExists = dormitoryRepository.findBuildingSummaries().stream()
                    .anyMatch(row -> newBuildingName.equals(row[0]));
            if (nameExists) {
                throw new IllegalArgumentException("이미 존재하는 건물명입니다: " + newBuildingName);
            }
            dormitoryRepository.updateBuildingName(buildingName, newBuildingName, schoolId);
            buildingName = newBuildingName;
        }

        RoomType roomType = bedsPerRoom == 1 ? RoomType.SINGLE
                : bedsPerRoom <= 2 ? RoomType.DOUBLE : RoomType.QUADRUPLE;

        int currentMaxFloor = allBeds.stream().mapToInt(Dormitory::getFloor).max().orElse(0);

        // 초과 층 제거
        for (int floor = floors + 1; floor <= currentMaxFloor; floor++) {
            List<Dormitory> floorBeds = dormitoryRepository
                    .findBySchool_IdAndBuildingAndFloorOrderByRoomNumberAscBedNumberAsc(schoolId, buildingName, floor);
            if (floorBeds.stream().anyMatch(d -> !d.isEmpty())) {
                throw new IllegalStateException(floor + "층에 배정된 학생이 있어 삭제할 수 없습니다.");
            }
            dormitoryRepository.deleteAll(floorBeds);
        }

        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 학교입니다: " + schoolId));

        for (int floor = 1; floor <= floors; floor++) {
            int targetRooms = roomsPerFloor.get(floor - 1);
            List<Dormitory> floorBeds = dormitoryRepository
                    .findBySchool_IdAndBuildingAndFloorOrderByRoomNumberAscBedNumberAsc(schoolId, buildingName, floor);
            List<String> currentRoomNums = floorBeds.stream()
                    .map(Dormitory::getRoomNumber).distinct().sorted().collect(Collectors.toList());
            int currentRooms = currentRoomNums.size();

            if (targetRooms > currentRooms) {
                List<Dormitory> newBeds = new ArrayList<>();
                for (int r = currentRooms + 1; r <= targetRooms; r++) {
                    String roomNumber = String.format("%d%02d", floor, r);
                    for (int b = 1; b <= bedsPerRoom; b++) {
                        newBeds.add(createDormitoryBed(school, buildingName, floor, roomNumber, String.valueOf(b),
                                roomType));
                    }
                }
                dormitoryRepository.saveAll(newBeds);
            } else if (targetRooms < currentRooms) {
                for (int r = currentRooms - 1; r >= targetRooms; r--) {
                    String roomNumber = currentRoomNums.get(r);
                    List<Dormitory> roomBeds = floorBeds.stream()
                            .filter(d -> d.getRoomNumber().equals(roomNumber)).collect(Collectors.toList());
                    if (roomBeds.stream().anyMatch(d -> !d.isEmpty())) {
                        throw new IllegalStateException(floor + "층 " + roomNumber + "호에 배정된 학생이 있어 삭제할 수 없습니다.");
                    }
                    dormitoryRepository.deleteAll(roomBeds);
                }
            }
        }
        log.info("건물 수정 완료: schoolId={}, {} → {} ({}층)", schoolId, buildingName, newBuildingName, floors);
    }

    /**
     * 건물 삭제 (현재 학기 배정 해제 후 삭제)
     */
    @Transactional
    public void deleteBuilding(String buildingName) {
        Long schoolId = getRequiredSchoolId();
        List<Dormitory> beds = dormitoryRepository.findByBuildingWithStudents(buildingName);
        if (beds.isEmpty()) {
            throw new IllegalArgumentException("존재하지 않는 건물입니다: " + buildingName);
        }
        beds.forEach(d -> d.getDormitoryAssignments().forEach(da -> dormitoryAssignmentRepository.delete(da)));
        dormitoryRepository.deleteAll(beds);
        log.info("건물 삭제 완료: schoolId={}, {}", schoolId, buildingName);
    }

    /**
     * 특정 호실의 침대 수 조정
     */
    @Transactional
    public void updateRoomBeds(String buildingName, int floor, String roomNumber, int bedsPerRoom) {
        Long schoolId = getRequiredSchoolId();
        List<Dormitory> currentBeds = dormitoryRepository.findByRoom(schoolId, buildingName, floor, roomNumber);
        if (currentBeds.isEmpty()) {
            throw new IllegalArgumentException(
                    "존재하지 않는 호실입니다: " + buildingName + " " + floor + "층 " + roomNumber + "호");
        }
        int currentCount = currentBeds.size();
        if (bedsPerRoom == currentCount)
            return;

        RoomType roomType = bedsPerRoom == 1 ? RoomType.SINGLE
                : bedsPerRoom <= 2 ? RoomType.DOUBLE : RoomType.QUADRUPLE;

        if (bedsPerRoom > currentCount) {
            School school = schoolRepository.findById(schoolId)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 학교입니다: " + schoolId));
            List<Dormitory> newBeds = new ArrayList<>();
            for (int b = currentCount + 1; b <= bedsPerRoom; b++) {
                newBeds.add(createDormitoryBed(school, buildingName, floor, roomNumber, String.valueOf(b), roomType));
            }
            dormitoryRepository.saveAll(newBeds);
        } else {
            List<Dormitory> toRemove = currentBeds.subList(bedsPerRoom, currentCount);
            if (toRemove.stream().anyMatch(d -> !d.isEmpty())) {
                throw new IllegalStateException("삭제하려는 침대에 배정된 학생이 있습니다. 먼저 배정을 해제하세요.");
            }
            dormitoryRepository.deleteAll(toRemove);
        }
        log.info("호실 침대 수 수정 완료: schoolId={}, {} {}층 {}호 → {}개", schoolId, buildingName, floor, roomNumber,
                bedsPerRoom);
    }

    // ── 조회 ────────────────────────────────────────────────────────────────────

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
     * 특정 건물의 모든 방 조회 (층별·호수별 그룹화)
     */
    public Map<Integer, Map<String, List<DormitoryDTO>>> getBuildingRooms(String building) {
        List<Dormitory> dormitories = dormitoryRepository.findByBuildingWithStudents(building);
        return dormitories.stream()
                .collect(Collectors.groupingBy(
                        Dormitory::getFloor,
                        Collectors.groupingBy(
                                Dormitory::getRoomNumber,
                                Collectors.mapping(DormitoryDTO::from, Collectors.toList()))));
    }

    /**
     * 빈 침대 목록 조회
     */
    public List<DormitoryDTO> getEmptyBeds() {
        return dormitoryRepository.findEmptyBeds().stream()
                .map(DormitoryDTO::from).collect(Collectors.toList());
    }

    /**
     * 특정 건물의 빈 침대 조회
     */
    public List<DormitoryDTO> getEmptyBedsByBuilding(String building) {
        return dormitoryRepository.findEmptyBedsByBuilding(building).stream()
                .map(DormitoryDTO::from).collect(Collectors.toList());
    }

    /**
     * 학생에게 기숙사 배정 (현재 ACTIVE 학기 기준)
     */
    @Transactional
    public DormitoryDTO assignDormitory(DormitoryAssignDTO assignDTO) {
        Long schoolId = getRequiredSchoolId();

        StudentInfo student = studentInfoRepository.findById(assignDTO.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

        Dormitory dormitory = dormitoryRepository.findByLocation(
                schoolId,
                assignDTO.getBuilding(),
                assignDTO.getFloor(),
                assignDTO.getRoomNumber(),
                assignDTO.getBedNumber())
                .orElseThrow(() -> new IllegalArgumentException("해당 침대를 찾을 수 없습니다."));

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

        DormitoryAssignment assignment = DormitoryAssignment.builder()
                .studentInfo(student)
                .academicTerm(activeTerm)
                .dormitory(dormitory)
                .build();
        dormitoryAssignmentRepository.save(assignment);

        log.info("기숙사 배정 완료: {} -> {} ({})",
                student.getUser().getName(), dormitory.getFullAddress(), activeTerm.getDisplayName());

        dormitory.getDormitoryAssignments().add(assignment);
        return DormitoryDTO.from(dormitory);
    }

    /**
     * 특정 학생의 기숙사 배정 정보 조회
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
     * 학생 이름으로 배정된 건물 목록 검색
     */
    public List<String> getBuildingsByStudentName(String name) {
        if (name == null || name.trim().isEmpty())
            return List.of();
        return dormitoryRepository.findBuildingsByStudentName(name.trim());
    }

    /**
     * 특정 호실의 모든 침대 및 배정 현황 조회
     */
    public List<DormitoryDTO> getRoomDetails(String building, Integer floor, String roomNumber) {
        Long schoolId = getRequiredSchoolId();
        return dormitoryRepository.findByRoom(schoolId, building, floor, roomNumber).stream()
                .map(DormitoryDTO::from).collect(Collectors.toList());
    }
}
