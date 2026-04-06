package com.example.schoolmate.domain.library.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.domain.library.dto.BookReviewDTO;
import com.example.schoolmate.domain.library.entity.Book;
import com.example.schoolmate.domain.library.entity.BookReview;
import com.example.schoolmate.domain.library.repository.BookRepository;
import com.example.schoolmate.domain.library.repository.BookReviewRepository;
import com.example.schoolmate.domain.school.entity.School;
import com.example.schoolmate.domain.school.repository.SchoolRepository;
import com.example.schoolmate.domain.student.entity.StudentInfo;
import com.example.schoolmate.domain.student.repository.StudentInfoRepository;
import com.example.schoolmate.domain.user.dto.AuthUserDTO;
import com.example.schoolmate.domain.user.dto.CustomUserDTO;
import com.example.schoolmate.global.config.school.SchoolContextHolder;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

/**
 * 도서 리뷰 서비스
 *
 * - 1권에 대해 학생당 1개의 리뷰만 생성 가능
 * - 본인이 작성한 리뷰만 수정/삭제 가능
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Log4j2
public class BookReviewService {

    private final BookReviewRepository bookReviewRepository;
    private final BookRepository bookRepository;
    private final StudentInfoRepository studentInfoRepository;
    private final SchoolRepository schoolRepository;

    // ── 헬퍼 ──────────────────────────────────────────────────────────────────

    private Long getRequiredSchoolId() {
        Long schoolId = SchoolContextHolder.getSchoolId();
        if (schoolId == null) {
            throw new IllegalStateException("학교 컨텍스트가 없습니다.");
        }
        return schoolId;
    }

    private School getRequiredSchool() {
        Long schoolId = getRequiredSchoolId();
        return schoolRepository.findById(schoolId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 학교입니다: " + schoolId));
    }

    private StudentInfo resolveStudent(AuthUserDTO authUser) {
        if (authUser == null || authUser.getCustomUserDTO() == null) {
            throw new IllegalStateException("인증 정보가 없습니다.");
        }
        CustomUserDTO user = authUser.getCustomUserDTO();
        if (user.getStudentInfoId() != null) {
            return studentInfoRepository.findById(user.getStudentInfoId())
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 학생입니다."));
        }
        if (user.getUid() != null) {
            return studentInfoRepository.findByUserUidAndPrimaryTrue(user.getUid())
                    .orElseThrow(() -> new IllegalArgumentException("학생 정보가 없습니다."));
        }
        throw new IllegalStateException("학생 식별자를 확인할 수 없습니다.");
    }

    // ── 조회 ──────────────────────────────────────────────────────────────────

    public List<BookReviewDTO.Response> getByBook(Long bookId) {
        Long schoolId = getRequiredSchoolId();
        return bookReviewRepository.findByBook(schoolId, bookId).stream()
                .map(BookReviewDTO.Response::fromEntity)
                .toList();
    }

    // ── 작성/수정/삭제 ────────────────────────────────────────────────────────

    @Transactional
    public BookReviewDTO.Response upsert(Long bookId, BookReviewDTO.UpsertRequest req, AuthUserDTO authUser) {
        School school = getRequiredSchool();
        StudentInfo student = resolveStudent(authUser);

        Book book = bookRepository.findActiveById(bookId, school.getId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 도서입니다: " + bookId));

        BookReview review = bookReviewRepository
                .findByBookAndStudent(school.getId(), bookId, student.getId())
                .orElse(null);

        if (review == null) {
            review = BookReview.builder()
                    .school(school)
                    .book(book)
                    .studentInfo(student)
                    .rating(req.getRating())
                    .content(req.getContent())
                    .build();
            review = bookReviewRepository.save(review);
        } else {
            review.update(req.getRating(), req.getContent());
        }
        return BookReviewDTO.Response.fromEntity(review);
    }

    @Transactional
    public void delete(Long reviewId, AuthUserDTO authUser) {
        StudentInfo student = resolveStudent(authUser);
        BookReview review = bookReviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 리뷰입니다."));
        if (!review.getStudentInfo().getId().equals(student.getId())) {
            throw new SecurityException("본인 리뷰만 삭제할 수 있습니다.");
        }
        bookReviewRepository.delete(review);
    }
}
