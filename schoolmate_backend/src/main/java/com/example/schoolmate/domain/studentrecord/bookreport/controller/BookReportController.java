package com.example.schoolmate.domain.studentrecord.bookreport.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.domain.studentrecord.bookreport.dto.BookReportRequestDTO;
import com.example.schoolmate.domain.studentrecord.bookreport.dto.BookReportResponseDTO;
import com.example.schoolmate.domain.studentrecord.bookreport.service.BookReportService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/book-reports")
@RequiredArgsConstructor
public class BookReportController {

    private final BookReportService bookReportService;

    // 독서록 작성 (학생 본인)
    // POST /api/book-reports/student/{studentInfoId}
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    @PostMapping("/student/{studentInfoId}")
    public ResponseEntity<BookReportResponseDTO> create(
            @PathVariable Long studentInfoId,
            @Valid @RequestBody BookReportRequestDTO dto) {
        return ResponseEntity.ok(bookReportService.create(studentInfoId, dto));
    }

    // 독서록 수정 (본인만)
    // PUT /api/book-reports/{bookReportId}/student/{studentInfoId}
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    @PutMapping("/{bookReportId}/student/{studentInfoId}")
    public ResponseEntity<BookReportResponseDTO> update(
            @PathVariable Long studentInfoId,
            @PathVariable Long bookReportId,
            @Valid @RequestBody BookReportRequestDTO dto) {
        return ResponseEntity.ok(bookReportService.update(studentInfoId, bookReportId, dto));
    }

    // 독서록 삭제 (본인만)
    // DELETE /api/book-reports/{bookReportId}/student/{studentInfoId}
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    @DeleteMapping("/{bookReportId}/student/{studentInfoId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long studentInfoId,
            @PathVariable Long bookReportId) {
        bookReportService.delete(studentInfoId, bookReportId);
        return ResponseEntity.noContent().build();
    }

    // 학생별 독서록 목록 조회
    // GET /api/book-reports/student/{studentInfoId}
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    @GetMapping("/student/{studentInfoId}")
    public ResponseEntity<List<BookReportResponseDTO>> getByStudent(
            @PathVariable Long studentInfoId) {
        return ResponseEntity.ok(bookReportService.getByStudent(studentInfoId));
    }

    // 학기별 독서록 조회
    // GET /api/book-reports/student/{studentInfoId}/search?academicTermId=1
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    @GetMapping("/student/{studentInfoId}/search")
    public ResponseEntity<List<BookReportResponseDTO>> getByAcademicTerm(
            @PathVariable Long studentInfoId,
            @RequestParam Long academicTermId) {
        return ResponseEntity.ok(bookReportService.getByStudentAndAcademicTerm(studentInfoId, academicTermId));
    }

    // 단건 조회
    // GET /api/book-reports/{bookReportId}
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    @GetMapping("/{bookReportId}")
    public ResponseEntity<BookReportResponseDTO> getOne(@PathVariable Long bookReportId) {
        return ResponseEntity.ok(bookReportService.getOne(bookReportId));
    }
}
