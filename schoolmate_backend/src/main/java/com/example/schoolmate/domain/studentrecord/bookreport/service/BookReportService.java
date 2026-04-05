package com.example.schoolmate.domain.studentrecord.bookreport.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.domain.studentrecord.bookreport.dto.BookReportRequestDTO;
import com.example.schoolmate.domain.studentrecord.bookreport.dto.BookReportResponseDTO;
import com.example.schoolmate.domain.studentrecord.bookreport.entity.BookReport;
import com.example.schoolmate.domain.studentrecord.bookreport.repository.BookReportRepository;
import com.example.schoolmate.domain.term.entity.AcademicTerm;
import com.example.schoolmate.domain.term.repository.AcademicTermRepository;
import com.example.schoolmate.domain.student.entity.StudentInfo;
import com.example.schoolmate.domain.student.repository.StudentInfoRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Log4j2
public class BookReportService {

    private final BookReportRepository bookReportRepository;
    private final StudentInfoRepository studentInfoRepository;
    private final AcademicTermRepository academicTermRepository;

    // 독서록 작성
    @Transactional
    public BookReportResponseDTO create(Long studentInfoId, BookReportRequestDTO dto) {
        log.info("독서록 작성 - studentInfoId: {}", studentInfoId);

        StudentInfo student = studentInfoRepository.findById(studentInfoId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 학생입니다. ID: " + studentInfoId));

        AcademicTerm term = academicTermRepository.findById(dto.getAcademicTermId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 학기입니다. ID: " + dto.getAcademicTermId()));

        BookReport bookReport = BookReport.builder()
                .academicTerm(term)
                .content(dto.getContent())
                .studentInfo(student)
                .build();
        bookReport.setSchool(student.getSchool());

        BookReport saved = bookReportRepository.save(bookReport);
        log.info("독서록 작성 완료 - id: {}", saved.getId());
        return BookReportResponseDTO.from(saved);
    }

    // 독서록 수정 (본인만 가능)
    @Transactional
    public BookReportResponseDTO update(Long studentInfoId, Long bookReportId, BookReportRequestDTO dto) {
        log.info("독서록 수정 - studentInfoId: {}, bookReportId: {}", studentInfoId, bookReportId);

        BookReport bookReport = bookReportRepository.findById(bookReportId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 독서록입니다. ID: " + bookReportId));

        if (!bookReport.getStudentInfo().getId().equals(studentInfoId)) {
            throw new IllegalArgumentException("본인의 독서록만 수정할 수 있습니다.");
        }

        AcademicTerm term = academicTermRepository.findById(dto.getAcademicTermId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 학기입니다. ID: " + dto.getAcademicTermId()));

        bookReport.update(term, dto.getContent());
        log.info("독서록 수정 완료 - id: {}", bookReportId);
        return BookReportResponseDTO.from(bookReport);
    }

    // 독서록 삭제 (본인만 가능)
    @Transactional
    public void delete(Long studentInfoId, Long bookReportId) {
        log.info("독서록 삭제 - studentInfoId: {}, bookReportId: {}", studentInfoId, bookReportId);

        BookReport bookReport = bookReportRepository.findById(bookReportId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 독서록입니다. ID: " + bookReportId));

        if (!bookReport.getStudentInfo().getId().equals(studentInfoId)) {
            throw new IllegalArgumentException("본인의 독서록만 삭제할 수 있습니다.");
        }

        bookReportRepository.delete(bookReport);
        log.info("독서록 삭제 완료 - id: {}", bookReportId);
    }

    // 학생별 독서록 전체 조회
    public List<BookReportResponseDTO> getByStudent(Long studentInfoId) {
        log.info("독서록 목록 조회 - studentInfoId: {}", studentInfoId);
        return bookReportRepository.findByStudentInfoIdOrderByCreateDateDesc(studentInfoId)
                .stream().map(BookReportResponseDTO::from).toList();
    }

    // 학기별 독서록 조회
    public List<BookReportResponseDTO> getByStudentAndAcademicTerm(Long studentInfoId, Long academicTermId) {
        log.info("독서록 목록 조회 - studentInfoId: {}, academicTermId: {}", studentInfoId, academicTermId);
        return bookReportRepository.findByStudentInfoIdAndAcademicTermId(studentInfoId, academicTermId)
                .stream().map(BookReportResponseDTO::from).toList();
    }

    // 단건 조회
    public BookReportResponseDTO getOne(Long bookReportId) {
        BookReport bookReport = bookReportRepository.findById(bookReportId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 독서록입니다. ID: " + bookReportId));
        return BookReportResponseDTO.from(bookReport);
    }
}
