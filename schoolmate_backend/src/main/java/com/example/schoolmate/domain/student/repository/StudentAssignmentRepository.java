package com.example.schoolmate.domain.student.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.domain.classroom.entity.Classroom;
import com.example.schoolmate.domain.student.entity.StudentAssignment;
import com.example.schoolmate.domain.term.entity.SchoolYear;

public interface StudentAssignmentRepository extends JpaRepository<StudentAssignment, Long> {
    // [woo] 같은 학급+학년도의 모든 학생 배정 조회 (번호 계산용)
    List<StudentAssignment> findByClassroomAndSchoolYear(Classroom classroom, SchoolYear schoolYear);
}
