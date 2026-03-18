package com.example.schoolmate.domain.resources.controller.admin;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.domain.resources.constant.FacilityStatus;
import com.example.schoolmate.domain.resources.constant.FacilityType;
import com.example.schoolmate.domain.resources.dto.FacilityDTO;
import com.example.schoolmate.domain.resources.service.FacilityService;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;

/**
 * 관리자 시설 관리 REST 컨트롤러
 */
@RestController
@RequestMapping(SchoolmateUrls.ADMIN_FACILITIES)
@RequiredArgsConstructor
@PreAuthorize("@grants.canManageFacilities()")
public class AdminFacilityApiController {

    private final FacilityService adminFacilityService;

    @GetMapping("/rooms")
    public ResponseEntity<?> rooms() {
        Map<String, Object> response = new HashMap<>();
        response.put("facilities", adminFacilityService.getAllFacilities());
        response.put("facilityTypes", FacilityType.values());
        response.put("facilityStatuses", FacilityStatus.values());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/rooms")
    public ResponseEntity<?> createRoom(@RequestBody FacilityDTO.Request request) {
        adminFacilityService.createFacility(request);
        return ResponseEntity.ok("시설이 등록되었습니다.");
    }

    @PutMapping("/rooms")
    public ResponseEntity<?> updateRoom(@RequestBody FacilityDTO.Request request) {
        adminFacilityService.updateFacility(request);
        return ResponseEntity.ok("시설 정보가 수정되었습니다.");
    }

    @DeleteMapping("/rooms/{id}")
    public ResponseEntity<?> deleteRoom(@PathVariable Long id) {
        adminFacilityService.deleteFacility(id);
        return ResponseEntity.ok("시설이 삭제되었습니다.");
    }
}