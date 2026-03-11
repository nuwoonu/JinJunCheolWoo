package com.example.schoolmate.common.repository.classroom;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.schoolmate.common.entity.log.ClassroomHistory;

public interface ClassroomHistoryRepository extends JpaRepository<ClassroomHistory, Long> {
    List<ClassroomHistory> findByClassroomIdOrderByCreatedAtDesc(Long classroomId);
}