package com.example.schoolmate.domain.school.controller;

import java.security.Principal;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.domain.school.service.NeisService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping(SchoolmateUrls.ADMIN_SCHOOLS)
@RequiredArgsConstructor
public class AdminSchoolApiController {

    private final NeisService neisService;

    @GetMapping("/sync/status")
    public ResponseEntity<Map<String, Boolean>> getSyncStatus() {
        return ResponseEntity.ok(Map.of("syncing", neisService.isSyncRunning()));
    }

    @PostMapping("/sync")
    public ResponseEntity<Void> syncSchools(Principal principal) {
        if (neisService.isSyncRunning()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        String adminName = (principal != null) ? principal.getName() : "Unknown Admin";
        neisService.syncSchoolData(adminName);
        return ResponseEntity.ok().build();
    }
}
