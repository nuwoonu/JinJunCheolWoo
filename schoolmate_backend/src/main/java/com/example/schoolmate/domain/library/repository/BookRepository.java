package com.example.schoolmate.domain.library.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.domain.library.entity.Book;
import com.example.schoolmate.domain.library.entity.constant.BookCategory;

public interface BookRepository extends JpaRepository<Book, Long> {

    /** 단건 조회 (학교 필터 + 미삭제) */
    @Query("SELECT b FROM Book b WHERE b.id = :id AND b.school.id = :schoolId AND b.deleted = false")
    Optional<Book> findActiveById(@Param("id") Long id, @Param("schoolId") Long schoolId);

    /** 학교 ISBN 중복 체크 */
    @Query("SELECT b FROM Book b WHERE b.school.id = :schoolId AND b.isbn = :isbn AND b.deleted = false")
    Optional<Book> findBySchoolAndIsbn(@Param("schoolId") Long schoolId, @Param("isbn") String isbn);

    /** 키워드 + 카테고리 검색 (제목/저자/ISBN) */
    @Query("SELECT b FROM Book b WHERE b.school.id = :schoolId AND b.deleted = false " +
            "AND (:category IS NULL OR b.category = :category) " +
            "AND (:keyword IS NULL OR :keyword = '' " +
            "     OR LOWER(b.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "     OR LOWER(b.author) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "     OR b.isbn LIKE CONCAT('%', :keyword, '%')) " +
            "ORDER BY b.createDate DESC")
    Page<Book> search(
            @Param("schoolId") Long schoolId,
            @Param("keyword") String keyword,
            @Param("category") BookCategory category,
            Pageable pageable);

    /** 인기 도서 (누적 대출 횟수 TopN) */
    @Query("SELECT b FROM Book b WHERE b.school.id = :schoolId AND b.deleted = false ORDER BY b.borrowCount DESC")
    List<Book> findTopPopular(@Param("schoolId") Long schoolId, Pageable pageable);

    /** 최근 등록 도서 (createDate DESC TopN) */
    @Query("SELECT b FROM Book b WHERE b.school.id = :schoolId AND b.deleted = false ORDER BY b.createDate DESC")
    List<Book> findRecent(@Param("schoolId") Long schoolId, Pageable pageable);
}
