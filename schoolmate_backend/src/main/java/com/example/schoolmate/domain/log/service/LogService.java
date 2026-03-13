package com.example.schoolmate.domain.log.service;

import com.example.schoolmate.domain.log.dto.LogSearchCondition;
import com.example.schoolmate.domain.log.entity.LogType;
import com.example.schoolmate.domain.log.entity.SchoolmateLog;
import com.example.schoolmate.domain.log.repository.SchoolmateLogRepository;
import com.example.schoolmate.domain.log.spec.LogSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class LogService {

    private final SchoolmateLogRepository logRepository;

    // --- 관리자 작업 이력 ---

    public void logAction(String adminName, String actionType, String target, String description) {
        logRepository.save(SchoolmateLog.builder()
                .logType(LogType.ADMIN)
                .actorName(adminName)
                .actionType(actionType)
                .target(target)
                .description(description)
                .build());
    }

    @Transactional(readOnly = true)
    public Page<SchoolmateLog> getAdminLogs(LogSearchCondition condition, Pageable pageable) {
        return logRepository.findAll(LogSpecification.search(LogType.ADMIN, condition), pageable);
    }

    @Transactional(readOnly = true)
    public List<SchoolmateLog> getAllAdminLogs(LogSearchCondition condition) {
        return logRepository.findAll(LogSpecification.search(LogType.ADMIN, condition),
                Sort.by(Sort.Direction.DESC, "createDate"));
    }

    @Transactional(readOnly = true)
    public List<String> getAdminLogActionTypes() {
        return logRepository.findAll(LogSpecification.search(LogType.ADMIN, new LogSearchCondition())).stream()
                .map(SchoolmateLog::getActionType)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    // --- 접속 이력 ---

    public void logAccess(String username, String ip, String userAgent, String accessType) {
        logRepository.save(SchoolmateLog.builder()
                .logType(LogType.ACCESS)
                .actorName(username)
                .ipAddress(ip)
                .userAgent(userAgent)
                .accessType(accessType)
                .build());
    }

    @Transactional(readOnly = true)
    public Page<SchoolmateLog> getAccessLogs(LogSearchCondition condition, Pageable pageable) {
        return logRepository.findAll(LogSpecification.search(LogType.ACCESS, condition), pageable);
    }

    @Transactional(readOnly = true)
    public List<SchoolmateLog> getAllAccessLogs(LogSearchCondition condition) {
        return logRepository.findAll(LogSpecification.search(LogType.ACCESS, condition),
                Sort.by(Sort.Direction.DESC, "createDate"));
    }

    // --- 학급 변경 이력 ---

    public void logClassroomChange(Long classroomId, String actorName, String actionType, String description) {
        logRepository.save(SchoolmateLog.builder()
                .logType(LogType.CLASSROOM)
                .classroomId(classroomId)
                .actorName(actorName)
                .actionType(actionType)
                .description(description)
                .build());
    }

    @Transactional(readOnly = true)
    public List<SchoolmateLog> getClassroomHistory(Long classroomId) {
        return logRepository.findByClassroomIdAndLogTypeOrderByCreateDateDesc(classroomId, LogType.CLASSROOM);
    }
}
