package com.example.schoolmate.domain.school.controller;

import com.example.schoolmate.global.config.SchoolmateUrls;
import com.example.schoolmate.domain.school.dto.SchoolDTO;
import com.example.schoolmate.domain.school.entity.School;
import com.example.schoolmate.domain.school.repository.SchoolRepository;
import com.example.schoolmate.domain.school.service.SchoolService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(SchoolmateUrls.SCHOOLS)
@RequiredArgsConstructor
public class SchoolApiController {

    private final SchoolService schoolService;
    private final SchoolRepository schoolRepository;

    @GetMapping
    public ResponseEntity<Page<SchoolDTO.Summary>> searchSchools(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String schoolKind,
            @PageableDefault(size = 10, sort = "name") Pageable pageable) {
        return ResponseEntity.ok(schoolService.searchSchools(name, schoolKind, null, pageable));
    }

    // [woo] 학교 급식 이미지 페이지 URL 설정 (goeas.kr 등)
    @PatchMapping("/{id}/meal-page-url")
    public ResponseEntity<Void> updateMealPageUrl(
            @PathVariable Long id,
            @RequestParam String url) {
        School school = schoolRepository.findById(id).orElse(null);
        if (school == null) return ResponseEntity.notFound().build();
        school.setMealPageUrl(url);
        schoolRepository.save(school);
        return ResponseEntity.ok().build();
    }
}
