package com.example.schoolmate.cheol.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/career-aspirations")
@RequiredArgsConstructor
public class CareerAspirationController {

    private final CareerAspirationService careerAspirationService;

    /**
     * 담임교사가 학생 진로희망(특기·흥미, 학생 희망직업) 작성/수정
     * POST /api/career-aspirations/student
     */
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    @PostMapping("/student")
    public ResponseEntity<CareerAspirationDTO> saveStudentCareer(
            @Valid @RequestBody StudentCareerDTO dto) {
        return ResponseEntity.ok(careerAspirationService.saveStudentCareer(dto));
    }

    /**
     * 담임교사가 학부모 희망직업 작성/수정
     * POST /api/career-aspirations/parent
     */
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    @PostMapping("/parent")
    public ResponseEntity<CareerAspirationDTO> saveParentCareer(
            @Valid @RequestBody ParentCareerDTO dto) {
        return ResponseEntity.ok(careerAspirationService.saveParentCareer(dto));
    }

    /**
     * 학생별 전체 진로희망 조회
     * GET /api/career-aspirations/students/{studentId}
     */
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER') or #studentId == authentication.principal.customUserDTO.studentInfoId")
    @GetMapping("/students/{studentId}")
    public ResponseEntity<List<CareerAspirationDTO>> getAllByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(careerAspirationService.getAllByStudentId(studentId));
    }

    /**
     * 특정 학기 진로희망 조회 (화면 렌더링용)
     * GET
     * /api/career-aspirations/students/{studentId}/term/{academicTermId}
     */
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER') or #studentId == authentication.principal.customUserDTO.studentInfoId")
    @GetMapping("/students/{studentId}/term/{academicTermId}")
    public ResponseEntity<CareerAspirationDTO> getCareerAspiration(
            @PathVariable Long studentId,
            @PathVariable Long academicTermId) {
        CareerAspirationDTO dto = careerAspirationService.getCareerAspiration(studentId, academicTermId);

        if (dto == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(dto);
    }
}