package com.example.schoolmate.domain.log.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.domain.log.entity.ClassroomHistory;

public interface ClassroomHistoryRepository extends JpaRepository<ClassroomHistory, Long> {
    List<ClassroomHistory> findByClassroomIdOrderByCreatedAtDesc(Long classroomId);
}