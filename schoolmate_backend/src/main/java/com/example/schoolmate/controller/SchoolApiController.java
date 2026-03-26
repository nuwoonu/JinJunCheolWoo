package com.example.schoolmate.controller;

import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.domain.school.dto.SchoolDTO;
import com.example.schoolmate.domain.school.service.SchoolService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(SchoolmateUrls.SCHOOLS)
@RequiredArgsConstructor
public class SchoolApiController {

    private final SchoolService schoolService;

    @GetMapping
    public ResponseEntity<Page<SchoolDTO.Summary>> searchSchools(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String schoolKind,
            @PageableDefault(size = 10, sort = "name") Pageable pageable) {
        return ResponseEntity.ok(schoolService.searchSchools(name, schoolKind, null, pageable));
    }
}
