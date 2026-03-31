package com.example.schoolmate.cheol.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.cheol.dto.careeraspirationdto.CareerAspirationDTO;
import com.example.schoolmate.cheol.dto.careeraspirationdto.ParentCareerDTO;
import com.example.schoolmate.cheol.dto.careeraspirationdto.StudentCareerDTO;
import com.example.schoolmate.cheol.service.CareerAspirationService;
import com.example.schoolmate.common.entity.user.constant.Semester;
import com.example.schoolmate.common.entity.user.constant.Year;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/career-aspirations")
@RequiredArgsConstructor
public class CareerAspirationController {

    private final CareerAspirationService careerAspirationService;

    /**
     * 학생이 진로희망 작성/수정
     * POST /api/career-aspirations/student
     */
    @PostMapping("/student")
    public ResponseEntity<CareerAspirationDTO> saveStudentCareer(
            @Valid @RequestBody StudentCareerDTO dto) {
        return ResponseEntity.ok(careerAspirationService.saveStudentCareer(dto));
    }

    /**
     * 학부모가 진로희망 작성/수정
     * POST /api/career-aspirations/parent
     */
    @PostMapping("/parent")
    public ResponseEntity<CareerAspirationDTO> saveParentCareer(
            @Valid @RequestBody ParentCareerDTO dto) {
        return ResponseEntity.ok(careerAspirationService.saveParentCareer(dto));
    }

    /**
     * 특정 학년/학기 진로희망 조회 (화면 렌더링용)
     * GET
     * /api/career-aspirations/students/{studentId}/year/{year}/semester/{semester}
     */
    @GetMapping("/students/{studentId}/year/{year}/semester/{semester}")
    public ResponseEntity<CareerAspirationDTO> getCareerAspiration(
            @PathVariable Long studentId,
            @PathVariable Year year,
            @PathVariable Semester semester) {
        CareerAspirationDTO dto = careerAspirationService.getCareerAspiration(studentId, year, semester);

        if (dto == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(dto);
    }
}