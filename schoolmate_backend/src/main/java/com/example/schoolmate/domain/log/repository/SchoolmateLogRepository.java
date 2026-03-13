package com.example.schoolmate.domain.log.repository;

import com.example.schoolmate.domain.log.entity.LogType;
import com.example.schoolmate.domain.log.entity.SchoolmateLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface SchoolmateLogRepository extends JpaRepository<SchoolmateLog, Long>, JpaSpecificationExecutor<SchoolmateLog> {
    List<SchoolmateLog> findByClassroomIdAndLogTypeOrderByCreateDateDesc(Long classroomId, LogType logType);
}
