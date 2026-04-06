package com.example.schoolmate.domain.library.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.domain.library.entity.BookReview;

public interface BookReviewRepository extends JpaRepository<BookReview, Long> {

    /** 도서의 리뷰 목록 (최신순) */
    @Query("SELECT r FROM BookReview r JOIN FETCH r.studentInfo si JOIN FETCH si.user " +
            "WHERE r.school.id = :schoolId AND r.book.id = :bookId ORDER BY r.createDate DESC")
    List<BookReview> findByBook(@Param("schoolId") Long schoolId, @Param("bookId") Long bookId);

    /** 학생이 이미 쓴 리뷰 조회 (1책 1리뷰 보장용) */
    @Query("SELECT r FROM BookReview r WHERE r.school.id = :schoolId " +
            "AND r.book.id = :bookId AND r.studentInfo.id = :studentInfoId")
    Optional<BookReview> findByBookAndStudent(
            @Param("schoolId") Long schoolId,
            @Param("bookId") Long bookId,
            @Param("studentInfoId") Long studentInfoId);

    /** 도서 평균 평점 */
    @Query("SELECT AVG(r.rating) FROM BookReview r WHERE r.school.id = :schoolId AND r.book.id = :bookId")
    Double findAverageRatingByBook(@Param("schoolId") Long schoolId, @Param("bookId") Long bookId);

    /** 도서 리뷰 개수 */
    long countBySchool_IdAndBook_Id(Long schoolId, Long bookId);

    /** 학생의 모든 리뷰 평균 */
    @Query("SELECT AVG(r.rating) FROM BookReview r WHERE r.school.id = :schoolId AND r.studentInfo.id = :studentInfoId")
    Double findAverageRatingByStudent(@Param("schoolId") Long schoolId, @Param("studentInfoId") Long studentInfoId);
}
