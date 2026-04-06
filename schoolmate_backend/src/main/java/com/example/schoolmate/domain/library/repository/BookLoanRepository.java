package com.example.schoolmate.domain.library.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.domain.library.entity.BookLoan;
import com.example.schoolmate.domain.library.entity.constant.BookLoanStatus;

public interface BookLoanRepository extends JpaRepository<BookLoan, Long> {

    /** 단건 조회 (학교 필터) */
    @Query("SELECT bl FROM BookLoan bl JOIN FETCH bl.book b JOIN FETCH bl.studentInfo si " +
            "WHERE bl.id = :id AND bl.school.id = :schoolId")
    Optional<BookLoan> findByIdWithDetails(@Param("id") Long id, @Param("schoolId") Long schoolId);

    /** 학생이 현재 대출중인 도서 (BORROWED 또는 OVERDUE) */
    @Query("SELECT bl FROM BookLoan bl JOIN FETCH bl.book b " +
            "WHERE bl.school.id = :schoolId AND bl.studentInfo.id = :studentInfoId " +
            "AND bl.status IN ('BORROWED', 'OVERDUE') " +
            "ORDER BY bl.dueDate ASC")
    List<BookLoan> findActiveByStudent(
            @Param("schoolId") Long schoolId,
            @Param("studentInfoId") Long studentInfoId);

    /** 학생의 연체 도서 */
    @Query("SELECT bl FROM BookLoan bl JOIN FETCH bl.book b " +
            "WHERE bl.school.id = :schoolId AND bl.studentInfo.id = :studentInfoId " +
            "AND bl.status = 'OVERDUE' " +
            "ORDER BY bl.dueDate ASC")
    List<BookLoan> findOverdueByStudent(
            @Param("schoolId") Long schoolId,
            @Param("studentInfoId") Long studentInfoId);

    /** 특정 도서의 현재 대출 중인 건수 */
    @Query("SELECT COUNT(bl) FROM BookLoan bl " +
            "WHERE bl.book.id = :bookId AND bl.status IN ('BORROWED', 'OVERDUE')")
    long countActiveByBook(@Param("bookId") Long bookId);

    /** 학생의 활성 대출 건수 (동시 대출 한도 체크) */
    @Query("SELECT COUNT(bl) FROM BookLoan bl " +
            "WHERE bl.school.id = :schoolId AND bl.studentInfo.id = :studentInfoId " +
            "AND bl.status IN ('BORROWED', 'OVERDUE')")
    long countActiveByStudent(
            @Param("schoolId") Long schoolId,
            @Param("studentInfoId") Long studentInfoId);

    /** 학생 + 도서의 활성 대출 존재 여부 (중복 대출 방지) */
    @Query("SELECT bl FROM BookLoan bl " +
            "WHERE bl.school.id = :schoolId AND bl.studentInfo.id = :studentInfoId " +
            "AND bl.book.id = :bookId AND bl.status IN ('BORROWED', 'OVERDUE')")
    Optional<BookLoan> findActiveByStudentAndBook(
            @Param("schoolId") Long schoolId,
            @Param("studentInfoId") Long studentInfoId,
            @Param("bookId") Long bookId);

    /** 학생의 전체 대출 이력 */
    @Query("SELECT bl FROM BookLoan bl JOIN FETCH bl.book b " +
            "WHERE bl.school.id = :schoolId AND bl.studentInfo.id = :studentInfoId " +
            "ORDER BY bl.borrowDate DESC")
    List<BookLoan> findAllByStudent(
            @Param("schoolId") Long schoolId,
            @Param("studentInfoId") Long studentInfoId);

    /** 학생의 특정 상태 대출 건수 (통계) */
    long countBySchool_IdAndStudentInfo_IdAndStatus(Long schoolId, Long studentInfoId, BookLoanStatus status);

    /** 학생의 기간별 반납 완료 건수 (통계) */
    @Query("SELECT COUNT(bl) FROM BookLoan bl " +
            "WHERE bl.school.id = :schoolId AND bl.studentInfo.id = :studentInfoId " +
            "AND bl.status = 'RETURNED' AND bl.returnDate BETWEEN :from AND :to")
    long countReturnedBetween(
            @Param("schoolId") Long schoolId,
            @Param("studentInfoId") Long studentInfoId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    /** 학생의 기간별 대출 건수 (통계) */
    @Query("SELECT COUNT(bl) FROM BookLoan bl " +
            "WHERE bl.school.id = :schoolId AND bl.studentInfo.id = :studentInfoId " +
            "AND bl.borrowDate BETWEEN :from AND :to")
    long countBorrowedBetween(
            @Param("schoolId") Long schoolId,
            @Param("studentInfoId") Long studentInfoId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    /** 학생의 카테고리별 대출 통계 */
    @Query("SELECT bl.book.category, COUNT(bl) FROM BookLoan bl " +
            "WHERE bl.school.id = :schoolId AND bl.studentInfo.id = :studentInfoId " +
            "GROUP BY bl.book.category")
    List<Object[]> countByCategoryForStudent(
            @Param("schoolId") Long schoolId,
            @Param("studentInfoId") Long studentInfoId);

    /** 전체 기한 초과된 BORROWED 상태 건 (스케줄러/보정용) */
    @Query("SELECT bl FROM BookLoan bl " +
            "WHERE bl.school.id = :schoolId AND bl.status = 'BORROWED' AND bl.dueDate < :today")
    List<BookLoan> findBorrowedPastDue(
            @Param("schoolId") Long schoolId,
            @Param("today") LocalDate today);
}
