package com.example.schoolmate.cheol.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.cheol.dto.dormitorydto.DormitoryAssignDTO;
import com.example.schoolmate.cheol.dto.dormitorydto.DormitoryDTO;
import com.example.schoolmate.cheol.service.DormitoryService;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/dormitories")
@RequiredArgsConstructor
public class DormitoryController {

    private final DormitoryService dormitoryService;

    /**
     * 기숙사 초기 데이터 생성
     * POST /api/dormitories/initialize
     */
    @PreAuthorize("@grants.canManageDormitory()")
    @PostMapping("/initialize")
    public ResponseEntity<String> initializeDormitories() {
        dormitoryService.initializeDormitories();
        return ResponseEntity.ok("기숙사 초기 데이터 생성 완료");
    }

    /**
     * cheol: 전체 건물 목록 및 통계 조회
     * GET /api/dormitories/buildings
     */
    @GetMapping("/buildings")
    public ResponseEntity<List<Map<String, Object>>> getAllBuildings() {
        return ResponseEntity.ok(dormitoryService.getAllBuildings());
    }

    /**
     * 특정 건물의 모든 방 조회
     * GET /api/dormitories/buildings/{building}
     */
    @GetMapping("/buildings/{building}")
    public ResponseEntity<Map<Integer, Map<String, List<DormitoryDTO>>>> getBuildingRooms(
            @PathVariable String building) {
        return ResponseEntity.ok(dormitoryService.getBuildingRooms(building));
    }

    /**
     * 빈 침대 목록 조회
     * GET /api/dormitories/empty
     */
    @GetMapping("/empty")
    public ResponseEntity<List<DormitoryDTO>> getEmptyBeds(
            @RequestParam(required = false) String building) {
        if (building != null) {
            return ResponseEntity.ok(dormitoryService.getEmptyBedsByBuilding(building));
        }
        return ResponseEntity.ok(dormitoryService.getEmptyBeds());
    }

    /**
     * 특정 호실의 침대 및 배정 현황 조회
     * GET /api/dormitories/rooms?building=1동&floor=5&roomNumber=101
     */
    @GetMapping("/rooms")
    public ResponseEntity<List<DormitoryDTO>> getRoomDetails(
            @RequestParam String building,
            @RequestParam Integer floor,
            @RequestParam String roomNumber) {
        return ResponseEntity.ok(dormitoryService.getRoomDetails(building, floor, roomNumber));
    }

    /**
     * 학생에게 기숙사 배정
     * POST /api/dormitories/assign
     */
    @PreAuthorize("@grants.canManageDormitory()")
    @PostMapping("/assign")
    public ResponseEntity<DormitoryDTO> assignDormitory(
            @RequestBody DormitoryAssignDTO assignDTO) {
        return ResponseEntity.ok(dormitoryService.assignDormitory(assignDTO));
    }

    /**
     * 학생의 기숙사 배정 정보 조회
     * GET /api/dormitories/students/{studentInfoId}
     */
    @GetMapping("/students/{studentInfoId}")
    public ResponseEntity<DormitoryDTO> getDormitoryByStudent(@PathVariable Long studentInfoId) {
        return dormitoryService.getDormitoryByStudentInfoId(studentInfoId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /**
     * 기숙사 배정 해제
     * DELETE /api/dormitories/students/{studentId}
     */
    @PreAuthorize("@grants.canManageDormitory()")
    @DeleteMapping("/students/{studentId}")
    public ResponseEntity<Void> unassignDormitory(@PathVariable Long studentId) {
        dormitoryService.unassignDormitory(studentId);
        return ResponseEntity.ok().build();
    }

    /**
     * cheol: 학생 이름으로 건물 검색
     * GET /api/dormitories/search?name=xxx
     */
    @GetMapping("/search")
    public ResponseEntity<List<String>> searchBuildingsByStudent(@RequestParam String name) {
        return ResponseEntity.ok(dormitoryService.getBuildingsByStudentName(name));
    }

    /**
     * cheol: 건물 추가
     * POST /api/dormitories/buildings
     * body: { buildingName, floors, roomsPerFloor, bedsPerRoom }
     */
    @PreAuthorize("@grants.canManageDormitory()")
    @PostMapping("/buildings")
    public ResponseEntity<String> addBuilding(@RequestBody Map<String, Object> body) {
        String buildingName = (String) body.get("buildingName");
        int floors = ((Number) body.get("floors")).intValue();
        int roomsPerFloor = ((Number) body.get("roomsPerFloor")).intValue();
        int bedsPerRoom = ((Number) body.get("bedsPerRoom")).intValue();
        dormitoryService.addBuilding(buildingName, floors, roomsPerFloor, bedsPerRoom);
        return ResponseEntity.ok("건물 추가 완료: " + buildingName);
    }

    /**
     * cheol: 건물 삭제
     * DELETE /api/dormitories/buildings/{buildingName}
     */
    @PreAuthorize("@grants.canManageDormitory()")
    @DeleteMapping("/buildings/{buildingName}")
    public ResponseEntity<String> deleteBuilding(@PathVariable String buildingName) {
        dormitoryService.deleteBuilding(buildingName);
        return ResponseEntity.ok("건물 삭제 완료: " + buildingName);
    }
}