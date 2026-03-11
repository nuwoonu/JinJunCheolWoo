package com.example.schoolmate.parkjoon.api;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.schoolmate.common.dto.FacilityDTO;
import com.example.schoolmate.common.service.FacilityService;

import lombok.RequiredArgsConstructor;

// 시설 관리 REST API
@RestController
@RequestMapping("/parkjoon/admin/api/facilities")
@RequiredArgsConstructor
public class AdminFacilityApiController {

    private final FacilityService facilityService;

    @GetMapping
    public ResponseEntity<List<?>> list() {
        return ResponseEntity.ok(facilityService.getAllFacilities());
    }

    @PostMapping
    public ResponseEntity<Void> create(@RequestBody FacilityDTO.Request request) {
        facilityService.createFacility(request);
        return ResponseEntity.ok().build();
    }

    @PutMapping
    public ResponseEntity<Void> update(@RequestBody FacilityDTO.Request request) {
        facilityService.updateFacility(request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        facilityService.deleteFacility(id);
        return ResponseEntity.ok().build();
    }
}
