package com.example.schoolmate.common.repository.info.student;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.common.entity.Classroom;
import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;
import com.example.schoolmate.domain.term.entity.SchoolYear;

public interface StudentAssignmentRepository extends JpaRepository<StudentAssignment, Long> {
    // [woo] 같은 학급+학년도의 모든 학생 배정 조회 (번호 계산용)
    List<StudentAssignment> findByClassroomAndSchoolYear(Classroom classroom, SchoolYear schoolYear);
}
