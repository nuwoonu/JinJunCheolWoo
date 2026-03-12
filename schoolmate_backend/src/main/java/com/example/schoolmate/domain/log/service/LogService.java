package com.example.schoolmate.domain.log.service;

import com.example.schoolmate.domain.log.dto.LogSearchCondition;
import com.example.schoolmate.domain.log.entity.AccessLog;
import com.example.schoolmate.domain.log.entity.AdminLog;
import com.example.schoolmate.domain.log.repository.AccessLogRepository;
import com.example.schoolmate.domain.log.repository.AdminLogRepository;
import com.example.schoolmate.domain.log.spec.LogSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class LogService {

    private final AdminLogRepository adminLogRepository;
    private final AccessLogRepository accessLogRepository;

    // --- Admin Log (작업 이력) ---
    public void logAction(String adminName, String actionType, String target, String description) {
        AdminLog log = AdminLog.builder()
                .adminName(adminName)
                .actionType(actionType)
                .target(target)
                .description(description)
                .build();
        adminLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public Page<AdminLog> getAdminLogs(LogSearchCondition condition, Pageable pageable) {
        Specification<AdminLog> spec = LogSpecification.searchAdminLogs(condition);
        return adminLogRepository.findAll(spec, pageable);
    }

    @Transactional(readOnly = true)
    public List<AdminLog> getAllAdminLogs(LogSearchCondition condition) {
        Specification<AdminLog> spec = LogSpecification.searchAdminLogs(condition);
        return adminLogRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    @Transactional(readOnly = true)
    public List<String> getAdminLogActionTypes() {
        return adminLogRepository.findAll().stream()
                .map(AdminLog::getActionType)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    // --- Access Log (접속 이력) ---
    public void logAccess(String username, String ip, String userAgent, AccessLog.AccessType type) {
        AccessLog log = AccessLog.builder()
                .username(username)
                .ipAddress(ip)
                .userAgent(userAgent)
                .type(type)
                .build();
        accessLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public Page<AccessLog> getAccessLogs(LogSearchCondition condition, Pageable pageable) {
        Specification<AccessLog> spec = LogSpecification.searchAccessLogs(condition);
        return accessLogRepository.findAll(spec, pageable);
    }

    @Transactional(readOnly = true)
    public List<AccessLog> getAllAccessLogs(LogSearchCondition condition) {
        Specification<AccessLog> spec = LogSpecification.searchAccessLogs(condition);
        return accessLogRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"));
    }
}
