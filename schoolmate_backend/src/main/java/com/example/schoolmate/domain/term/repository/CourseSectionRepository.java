package com.example.schoolmate.domain.term.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.common.entity.Classroom;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.domain.term.entity.AcademicTerm;
import com.example.schoolmate.domain.term.entity.CourseSection;

public interface CourseSectionRepository extends JpaRepository<CourseSection, Long> {

    /** 특정 학기에 교사가 담당하는 강좌 목록 */
    List<CourseSection> findByTermAndTeacher(AcademicTerm term, TeacherInfo teacher);

    /** 특정 학기에 특정 학급이 수강하는 강좌 목록 */
    List<CourseSection> findByTermAndClassroom(AcademicTerm term, Classroom classroom);

    /** 교사의 전체 강좌 이력 (최신 학기순) */
    @Query("""
        SELECT cs FROM CourseSection cs
        JOIN FETCH cs.term t
        JOIN FETCH cs.subject s
        JOIN FETCH cs.classroom c
        WHERE cs.teacher = :teacher
        ORDER BY t.schoolYear DESC, t.semester DESC
        """)
    List<CourseSection> findAllByTeacherWithDetails(@Param("teacher") TeacherInfo teacher);

    /** 특정 학급의 전체 강좌 이력 */
    @Query("""
        SELECT cs FROM CourseSection cs
        JOIN FETCH cs.term t
        JOIN FETCH cs.subject s
        JOIN FETCH cs.teacher tc
        WHERE cs.classroom = :classroom
        ORDER BY t.schoolYear DESC, t.semester DESC
        """)
    List<CourseSection> findAllByClassroomWithDetails(@Param("classroom") Classroom classroom);

    /** 특정 학기의 학교 전체 강좌 목록 */
    List<CourseSection> findByTerm(AcademicTerm term);
}
