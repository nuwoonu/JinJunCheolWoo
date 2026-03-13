package com.example.schoolmate.domain.log.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.domain.log.entity.ClassroomHistoryLog;

public interface ClassroomHistoryRepository extends JpaRepository<ClassroomHistoryLog, Long> {
    List<ClassroomHistoryLog> findByClassroomIdOrderByCreateDateDesc(Long classroomId);
}