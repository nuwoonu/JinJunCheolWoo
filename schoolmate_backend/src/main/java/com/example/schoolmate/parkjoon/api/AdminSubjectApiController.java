package com.example.schoolmate.parkjoon.api;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.schoolmate.cheol.dto.SubjectDTO;
import com.example.schoolmate.common.service.SubjectService;

import lombok.RequiredArgsConstructor;

// 교과목 관리 REST API
@RestController
@RequestMapping("/parkjoon/admin/api/subjects")
@RequiredArgsConstructor
public class AdminSubjectApiController {

    private final SubjectService subjectService;

    @GetMapping
    public ResponseEntity<List<?>> list() {
        return ResponseEntity.ok(subjectService.getAllSubjects());
    }

    @PostMapping
    public ResponseEntity<Void> create(@RequestBody SubjectDTO.Request request) {
        subjectService.createSubject(request);
        return ResponseEntity.ok().build();
    }

    @PutMapping
    public ResponseEntity<Void> update(@RequestBody SubjectDTO.Request request) {
        subjectService.updateSubject(request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{code}")
    public ResponseEntity<Void> delete(@PathVariable String code) {
        subjectService.deleteSubject(code);
        return ResponseEntity.ok().build();
    }
}
