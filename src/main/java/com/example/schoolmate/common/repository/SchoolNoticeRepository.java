package com.example.schoolmate.common.repository;

import com.example.schoolmate.common.entity.SchoolNotice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SchoolNoticeRepository extends JpaRepository<SchoolNotice, Long> {
    // 중요 공지 우선, 그 다음 최신순 정렬
    Page<SchoolNotice> findAllByOrderByIsImportantDescIdDesc(Pageable pageable);

    // 검색 (제목 + 내용)
    Page<SchoolNotice> findByTitleContainingOrContentContainingOrderByIsImportantDescIdDesc(String title,
            String content,
            Pageable pageable);
}