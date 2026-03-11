package com.example.schoolmate.domain.log.repository;

import com.example.schoolmate.domain.log.entity.AdminLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AdminLogRepository extends JpaRepository<AdminLog, Long>, JpaSpecificationExecutor<AdminLog> {
    // 최신순 조회 등 필요 시 메서드 추가
}
