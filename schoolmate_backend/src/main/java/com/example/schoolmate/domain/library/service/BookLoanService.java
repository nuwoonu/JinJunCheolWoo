package com.example.schoolmate.domain.library.service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.domain.library.dto.BookLoanDTO;
import com.example.schoolmate.domain.library.dto.ReadingStatsDTO;
import com.example.schoolmate.domain.library.entity.Book;
import com.example.schoolmate.domain.library.entity.BookLoan;
import com.example.schoolmate.domain.library.entity.constant.BookCategory;
import com.example.schoolmate.domain.library.entity.constant.BookLoanStatus;
import com.example.schoolmate.domain.library.repository.BookLoanRepository;
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
 * 도서 대출 서비스
 *
 * 비즈니스 규칙:
 * - 기본 대출 기간: 14일
 * - 연장: 1회에 한해 7일 추가
 * - 동시 대출 한도: 5권
 * - 동일 도서 중복 대출 불가
 * - 잔여 권수 = totalCopies - 현재 활성 대출 수
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Log4j2
public class BookLoanService {

    public static final int DEFAULT_LOAN_DAYS = 14;
    public static final int EXTENSION_DAYS = 7;
    public static final int MAX_EXTENSION_COUNT = 1;
    public static final int MAX_ACTIVE_LOANS = 5;
    public static final int DEFAULT_MONTHLY_GOAL = 5;

    private final BookLoanRepository bookLoanRepository;
    private final BookRepository bookRepository;
    private final BookReviewRepository bookReviewRepository;
    private final StudentInfoRepository studentInfoRepository;
    private final SchoolRepository schoolRepository;

    // ── 내부 헬퍼 ──────────────────────────────────────────────────────────────

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

    private Book getActiveBook(Long bookId) {
        Long schoolId = getRequiredSchoolId();
        return bookRepository.findActiveById(bookId, schoolId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 도서입니다: " + bookId));
    }

    // ── 대출/반납/연장 ────────────────────────────────────────────────────────

    @Transactional
    public BookLoanDTO.Response borrow(Long bookId, AuthUserDTO authUser) {
        School school = getRequiredSchool();
        StudentInfo student = resolveStudent(authUser);
        Book book = getActiveBook(bookId);

        // 중복 대출 방지
        bookLoanRepository.findActiveByStudentAndBook(school.getId(), student.getId(), book.getId())
                .ifPresent(b -> {
                    throw new IllegalStateException("이미 대출 중인 도서입니다.");
                });

        // 동시 대출 한도
        long activeCount = bookLoanRepository.countActiveByStudent(school.getId(), student.getId());
        if (activeCount >= MAX_ACTIVE_LOANS) {
            throw new IllegalStateException("최대 " + MAX_ACTIVE_LOANS + "권까지 동시 대출 가능합니다.");
        }

        // 재고 확인
        long activeLoansForBook = bookLoanRepository.countActiveByBook(book.getId());
        int total = book.getTotalCopies() == null ? 0 : book.getTotalCopies();
        if (activeLoansForBook >= total) {
            throw new IllegalStateException("대출 가능한 재고가 없습니다.");
        }

        LocalDate today = LocalDate.now();
        BookLoan loan = BookLoan.builder()
                .school(school)
                .book(book)
                .studentInfo(student)
                .borrowDate(today)
                .dueDate(today.plusDays(DEFAULT_LOAN_DAYS))
                .extensionCount(0)
                .status(BookLoanStatus.BORROWED)
                .build();

        BookLoan saved = bookLoanRepository.save(loan);
        book.increaseBorrowCount();
        log.info("[library] 대출 생성: loanId={}, bookId={}, studentId={}",
                saved.getId(), book.getId(), student.getId());
        return BookLoanDTO.Response.fromEntity(saved, today);
    }

    @Transactional
    public BookLoanDTO.Response returnLoan(Long loanId, AuthUserDTO authUser) {
        Long schoolId = getRequiredSchoolId();
        StudentInfo student = resolveStudent(authUser);
        BookLoan loan = bookLoanRepository.findByIdWithDetails(loanId, schoolId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 대출 건입니다."));

        if (!loan.getStudentInfo().getId().equals(student.getId())) {
            throw new SecurityException("본인의 대출 건만 반납할 수 있습니다.");
        }
        if (loan.getStatus() == BookLoanStatus.RETURNED) {
            throw new IllegalStateException("이미 반납 완료된 대출입니다.");
        }

        loan.markReturned(LocalDate.now());
        log.info("[library] 반납 완료: loanId={}", loanId);
        return BookLoanDTO.Response.fromEntity(loan, LocalDate.now());
    }

    @Transactional
    public BookLoanDTO.Response extend(Long loanId, AuthUserDTO authUser) {
        Long schoolId = getRequiredSchoolId();
        StudentInfo student = resolveStudent(authUser);
        BookLoan loan = bookLoanRepository.findByIdWithDetails(loanId, schoolId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 대출 건입니다."));

        if (!loan.getStudentInfo().getId().equals(student.getId())) {
            throw new SecurityException("본인의 대출 건만 연장할 수 있습니다.");
        }
        if (loan.getStatus() == BookLoanStatus.RETURNED) {
            throw new IllegalStateException("이미 반납된 대출은 연장할 수 없습니다.");
        }
        if (loan.getStatus() == BookLoanStatus.OVERDUE) {
            throw new IllegalStateException("연체 상태에서는 연장할 수 없습니다.");
        }
        if (loan.getExtensionCount() != null && loan.getExtensionCount() >= MAX_EXTENSION_COUNT) {
            throw new IllegalStateException("연장은 1회만 가능합니다.");
        }

        loan.extend(EXTENSION_DAYS);
        log.info("[library] 대출 연장: loanId={}, newDueDate={}", loanId, loan.getDueDate());
        return BookLoanDTO.Response.fromEntity(loan, LocalDate.now());
    }

    // ── 조회 ──────────────────────────────────────────────────────────────────

    /**
     * 학생의 현재 대출 목록 (BORROWED + OVERDUE).
     * 조회 시점에 연체 판정을 반영합니다.
     */
    @Transactional
    public List<BookLoanDTO.Response> getMyBorrowed(AuthUserDTO authUser) {
        Long schoolId = getRequiredSchoolId();
        StudentInfo student = resolveStudent(authUser);
        LocalDate today = LocalDate.now();

        List<BookLoan> loans = bookLoanRepository.findActiveByStudent(schoolId, student.getId());
        for (BookLoan loan : loans) {
            if (loan.getStatus() == BookLoanStatus.BORROWED && loan.isOverdueOn(today)) {
                loan.setStatus(BookLoanStatus.OVERDUE);
            }
        }
        return loans.stream().map(l -> BookLoanDTO.Response.fromEntity(l, today)).toList();
    }

    /** 학생의 연체 도서 */
    @Transactional
    public List<BookLoanDTO.Response> getMyOverdue(AuthUserDTO authUser) {
        Long schoolId = getRequiredSchoolId();
        StudentInfo student = resolveStudent(authUser);
        LocalDate today = LocalDate.now();

        // 먼저 BORROWED 중 기한 경과 건을 OVERDUE로 갱신
        List<BookLoan> pastDue = bookLoanRepository.findBorrowedPastDue(schoolId, today);
        for (BookLoan loan : pastDue) {
            if (loan.getStudentInfo().getId().equals(student.getId())) {
                loan.setStatus(BookLoanStatus.OVERDUE);
            }
        }

        List<BookLoan> loans = bookLoanRepository.findOverdueByStudent(schoolId, student.getId());
        return loans.stream().map(l -> BookLoanDTO.Response.fromEntity(l, today)).toList();
    }

    /** 학생의 전체 대출 이력 */
    public List<BookLoanDTO.Response> getMyHistory(AuthUserDTO authUser) {
        Long schoolId = getRequiredSchoolId();
        StudentInfo student = resolveStudent(authUser);
        LocalDate today = LocalDate.now();
        return bookLoanRepository.findAllByStudent(schoolId, student.getId()).stream()
                .map(l -> BookLoanDTO.Response.fromEntity(l, today))
                .toList();
    }

    // ── 독서 통계 ──────────────────────────────────────────────────────────────

    public ReadingStatsDTO getMyStats(AuthUserDTO authUser) {
        Long schoolId = getRequiredSchoolId();
        StudentInfo student = resolveStudent(authUser);
        LocalDate today = LocalDate.now();

        // 올해 반납 완료 수
        LocalDate yearStart = LocalDate.of(today.getYear(), 1, 1);
        LocalDate yearEnd = LocalDate.of(today.getYear(), 12, 31);
        long totalThisYear = bookLoanRepository.countReturnedBetween(
                schoolId, student.getId(), yearStart, yearEnd);

        // 이번 달 반납 완료 수
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate monthEnd = today.withDayOfMonth(today.lengthOfMonth());
        long currentMonth = bookLoanRepository.countReturnedBetween(
                schoolId, student.getId(), monthStart, monthEnd);

        int goalProgress = DEFAULT_MONTHLY_GOAL == 0
                ? 0
                : (int) Math.min(100L, Math.round((currentMonth * 100.0) / DEFAULT_MONTHLY_GOAL));

        Double avg = bookReviewRepository.findAverageRatingByStudent(schoolId, student.getId());

        long activeLoans = bookLoanRepository.countActiveByStudent(schoolId, student.getId());
        long overdueCount = bookLoanRepository.countBySchool_IdAndStudentInfo_IdAndStatus(
                schoolId, student.getId(), BookLoanStatus.OVERDUE);

        // 월별 추이 (최근 7개월)
        List<ReadingStatsDTO.MonthlyReading> monthly = new ArrayList<>();
        YearMonth start = YearMonth.from(today).minusMonths(6);
        for (int i = 0; i < 7; i++) {
            YearMonth ym = start.plusMonths(i);
            LocalDate from = ym.atDay(1);
            LocalDate to = ym.atEndOfMonth();
            long books = bookLoanRepository.countReturnedBetween(
                    schoolId, student.getId(), from, to);
            String monthLabel = ym.getMonth().getDisplayName(TextStyle.SHORT, Locale.KOREAN);
            monthly.add(ReadingStatsDTO.MonthlyReading.builder()
                    .month(monthLabel)
                    .books(books)
                    .goal(DEFAULT_MONTHLY_GOAL)
                    .build());
        }

        // 카테고리별 분포
        List<Object[]> rows = bookLoanRepository.countByCategoryForStudent(schoolId, student.getId());
        Map<BookCategory, Long> byCategory = new EnumMap<>(BookCategory.class);
        for (Object[] row : rows) {
            BookCategory cat = (BookCategory) row[0];
            Long count = ((Number) row[1]).longValue();
            byCategory.put(cat, count);
        }
        List<ReadingStatsDTO.CategoryDistribution> categoryDist = new ArrayList<>();
        for (Map.Entry<BookCategory, Long> e : byCategory.entrySet()) {
            categoryDist.add(ReadingStatsDTO.CategoryDistribution.builder()
                    .name(e.getKey().getDisplayName())
                    .value(e.getValue())
                    .build());
        }

        return ReadingStatsDTO.builder()
                .totalBooksThisYear(totalThisYear)
                .currentMonthBooks(currentMonth)
                .monthlyGoal(DEFAULT_MONTHLY_GOAL)
                .goalProgress(goalProgress)
                .averageRating(avg != null ? avg : 0.0)
                .activeLoans(activeLoans)
                .overdueCount(overdueCount)
                .monthlyReading(monthly)
                .categoryDistribution(categoryDist)
                .build();
    }
}
