package com.example.schoolmate.domain.servicenotice.repository;

import com.example.schoolmate.domain.servicenotice.entity.ServiceNotice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ServiceNoticeRepository extends JpaRepository<ServiceNotice, Long> {

    @Query("SELECT n FROM ServiceNotice n WHERE n.isDeleted = false " +
           "AND (:keyword IS NULL OR n.title LIKE %:keyword%) " +
           "ORDER BY n.isPinned DESC, n.createDate DESC")
    Page<ServiceNotice> findAllActive(@Param("keyword") String keyword, Pageable pageable);
}
