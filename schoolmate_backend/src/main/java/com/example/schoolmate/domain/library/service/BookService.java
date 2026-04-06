package com.example.schoolmate.domain.library.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.domain.library.dto.BookDTO;
import com.example.schoolmate.domain.library.entity.Book;
import com.example.schoolmate.domain.library.entity.constant.BookCategory;
import com.example.schoolmate.domain.library.repository.BookLoanRepository;
import com.example.schoolmate.domain.library.repository.BookRepository;
import com.example.schoolmate.domain.library.repository.BookReviewRepository;
import com.example.schoolmate.domain.school.entity.School;
import com.example.schoolmate.domain.school.repository.SchoolRepository;
import com.example.schoolmate.global.config.school.SchoolContextHolder;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

/**
 * 도서 서비스
 *
 * 학교 단위로 도서 카탈로그를 관리합니다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Log4j2
public class BookService {

    private final BookRepository bookRepository;
    private final BookLoanRepository bookLoanRepository;
    private final BookReviewRepository bookReviewRepository;
    private final SchoolRepository schoolRepository;

    // ── 내부 헬퍼 ──────────────────────────────────────────────────────────────

    private Long getRequiredSchoolId() {
        Long schoolId = SchoolContextHolder.getSchoolId();
        if (schoolId == null) {
            throw new IllegalStateException("학교 컨텍스트가 없습니다. X-School-Id 헤더 또는 JWT schoolId를 확인하세요.");
        }
        return schoolId;
    }

    private School getRequiredSchool() {
        Long schoolId = getRequiredSchoolId();
        return schoolRepository.findById(schoolId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 학교입니다: " + schoolId));
    }

    private Book getBookOrThrow(Long bookId) {
        Long schoolId = getRequiredSchoolId();
        return bookRepository.findActiveById(bookId, schoolId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 도서입니다: " + bookId));
    }

    // ── 생성/수정/삭제 ────────────────────────────────────────────────────────

    @Transactional
    public BookDTO.DetailResponse create(BookDTO.CreateRequest req) {
        School school = getRequiredSchool();

        // ISBN 중복 체크 (있을 때만)
        if (req.getIsbn() != null && !req.getIsbn().isBlank()) {
            bookRepository.findBySchoolAndIsbn(school.getId(), req.getIsbn())
                    .ifPresent(b -> {
                        throw new IllegalArgumentException("이미 등록된 ISBN입니다: " + req.getIsbn());
                    });
        }

        Book book = Book.builder()
                .school(school)
                .title(req.getTitle())
                .author(req.getAuthor())
                .publisher(req.getPublisher())
                .publishDate(req.getPublishDate())
                .isbn(req.getIsbn())
                .category(req.getCategory())
                .pages(req.getPages())
                .language(req.getLanguage())
                .description(req.getDescription())
                .summary(req.getSummary())
                .authorBio(req.getAuthorBio())
                .tags(req.getTags())
                .coverImage(req.getCoverImage())
                .totalCopies(req.getTotalCopies() != null ? req.getTotalCopies() : 1)
                .borrowCount(0L)
                .deleted(false)
                .build();

        Book saved = bookRepository.save(book);
        return toDetail(saved);
    }

    @Transactional
    public BookDTO.DetailResponse update(Long bookId, BookDTO.UpdateRequest req) {
        Book book = getBookOrThrow(bookId);
        if (req.getTitle() != null) book.setTitle(req.getTitle());
        if (req.getAuthor() != null) book.setAuthor(req.getAuthor());
        if (req.getPublisher() != null) book.setPublisher(req.getPublisher());
        if (req.getPublishDate() != null) book.setPublishDate(req.getPublishDate());
        if (req.getIsbn() != null) book.setIsbn(req.getIsbn());
        if (req.getCategory() != null) book.setCategory(req.getCategory());
        if (req.getPages() != null) book.setPages(req.getPages());
        if (req.getLanguage() != null) book.setLanguage(req.getLanguage());
        if (req.getDescription() != null) book.setDescription(req.getDescription());
        if (req.getSummary() != null) book.setSummary(req.getSummary());
        if (req.getAuthorBio() != null) book.setAuthorBio(req.getAuthorBio());
        if (req.getTags() != null) book.setTags(req.getTags());
        if (req.getCoverImage() != null) book.setCoverImage(req.getCoverImage());
        if (req.getTotalCopies() != null) book.setTotalCopies(req.getTotalCopies());
        return toDetail(book);
    }

    @Transactional
    public void delete(Long bookId) {
        Book book = getBookOrThrow(bookId);
        book.setDeleted(true);
    }

    // ── 조회 ──────────────────────────────────────────────────────────────────

    public Page<BookDTO.ListResponse> search(String keyword, BookCategory category, int page, int size) {
        Long schoolId = getRequiredSchoolId();
        Pageable pageable = PageRequest.of(page, size);
        Page<Book> books = bookRepository.search(schoolId, keyword, category, pageable);
        return books.map(this::toListResponse);
    }

    public BookDTO.DetailResponse getById(Long bookId) {
        Book book = getBookOrThrow(bookId);
        return toDetail(book);
    }

    public List<BookDTO.ListResponse> getPopular(int limit) {
        Long schoolId = getRequiredSchoolId();
        return bookRepository.findTopPopular(schoolId, PageRequest.of(0, limit))
                .stream()
                .map(this::toListResponse)
                .toList();
    }

    public List<BookDTO.ListResponse> getRecent(int limit) {
        Long schoolId = getRequiredSchoolId();
        return bookRepository.findRecent(schoolId, PageRequest.of(0, limit))
                .stream()
                .map(this::toListResponse)
                .toList();
    }

    // ── 매퍼 ──────────────────────────────────────────────────────────────────

    private BookDTO.ListResponse toListResponse(Book book) {
        Long schoolId = book.getSchool() != null ? book.getSchool().getId() : getRequiredSchoolId();
        long activeLoans = bookLoanRepository.countActiveByBook(book.getId());
        Double avg = bookReviewRepository.findAverageRatingByBook(schoolId, book.getId());
        return BookDTO.ListResponse.fromEntity(book, activeLoans, avg);
    }

    private BookDTO.DetailResponse toDetail(Book book) {
        Long schoolId = book.getSchool() != null ? book.getSchool().getId() : getRequiredSchoolId();
        long activeLoans = bookLoanRepository.countActiveByBook(book.getId());
        Double avg = bookReviewRepository.findAverageRatingByBook(schoolId, book.getId());
        long reviewCount = bookReviewRepository.countBySchool_IdAndBook_Id(schoolId, book.getId());
        return BookDTO.DetailResponse.fromEntity(book, activeLoans, avg, reviewCount);
    }
}
