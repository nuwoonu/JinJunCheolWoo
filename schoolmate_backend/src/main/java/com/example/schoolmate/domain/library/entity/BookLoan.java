package com.example.schoolmate.domain.library.entity;

import java.time.LocalDate;

import com.example.schoolmate.domain.library.entity.constant.BookLoanStatus;
import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;
import com.example.schoolmate.domain.student.entity.StudentInfo;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

/**
 * 도서 대출 엔티티
 *
 * 학생이 특정 도서를 대출한 이력을 관리합니다.
 * - 기본 대출 기간: 14일
 * - 연장: 1회 7일 (extensionCount로 관리)
 */
@Entity
@Table(name = "book_loans")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = { "book", "studentInfo" })
public class BookLoan extends SchoolBaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_info_id", nullable = false)
    private StudentInfo studentInfo;

    /** 대출일 */
    @Column(name = "borrow_date", nullable = false)
    private LocalDate borrowDate;

    /** 반납 예정일 */
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    /** 실제 반납일 (반납 전까지 null) */
    @Column(name = "return_date")
    private LocalDate returnDate;

    /** 연장 횟수 (기본 0, 최대 1) */
    @Column(name = "extension_count", nullable = false)
    @Builder.Default
    private Integer extensionCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BookLoanStatus status = BookLoanStatus.BORROWED;

    /** 반납 처리 */
    public void markReturned(LocalDate returnedOn) {
        this.returnDate = returnedOn;
        this.status = BookLoanStatus.RETURNED;
    }

    /** 대출 기간 연장 (일 수 추가) */
    public void extend(int additionalDays) {
        this.dueDate = this.dueDate.plusDays(additionalDays);
        this.extensionCount = (this.extensionCount == null ? 0 : this.extensionCount) + 1;
    }

    /** 연체 여부 판정 (오늘 기준) */
    public boolean isOverdueOn(LocalDate today) {
        if (this.status == BookLoanStatus.RETURNED) {
            return false;
        }
        return this.dueDate != null && today.isAfter(this.dueDate);
    }

    /** 남은 기간(일). 연체면 음수 */
    public long remainingDays(LocalDate today) {
        if (this.dueDate == null) {
            return 0L;
        }
        return today.until(this.dueDate, java.time.temporal.ChronoUnit.DAYS);
    }
}
