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

import com.example.schoolmate.cheol.dto.DormitoryAssignDTO;
import com.example.schoolmate.cheol.dto.DormitoryDTO;
import com.example.schoolmate.cheol.service.DormitoryService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/dormitories")
@RequiredArgsConstructor
public class DormitoryController {

    private final DormitoryService dormitoryService;

    /**
     * 기숙사 초기 데이터 생성
     * POST /api/dormitories/initialize
     */
    @PostMapping("/initialize")
    public ResponseEntity<String> initializeDormitories() {
        dormitoryService.initializeDormitories();
        return ResponseEntity.ok("기숙사 초기 데이터 생성 완료");
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
    @DeleteMapping("/students/{studentId}")
    public ResponseEntity<Void> unassignDormitory(@PathVariable Long studentId) {
        dormitoryService.unassignDormitory(studentId);
        return ResponseEntity.ok().build();
    }
}