package com.example.schoolmate.woo.repository;

import com.example.schoolmate.common.entity.user.constant.Semester;
import com.example.schoolmate.woo.entity.FinalGrade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

// [woo] 최종 성적 Repository
public interface FinalGradeRepository extends JpaRepository<FinalGrade, Long> {

    @Query("SELECT fg FROM FinalGrade fg JOIN FETCH fg.subject " +
           "WHERE fg.student.id = :studentId AND fg.semester = :semester AND fg.schoolYear = :schoolYear")
    List<FinalGrade> findByStudentIdAndSemesterAndSchoolYear(
            @Param("studentId") Long studentId,
            @Param("semester") Semester semester,
            @Param("schoolYear") int schoolYear);

    @Query("SELECT fg FROM FinalGrade fg JOIN FETCH fg.subject " +
           "WHERE fg.student.id = :studentId")
    List<FinalGrade> findByStudentId(@Param("studentId") Long studentId);

    @Query("SELECT fg FROM FinalGrade fg JOIN FETCH fg.student s JOIN FETCH s.user " +
           "JOIN FETCH fg.subject " +
           "WHERE fg.classroom.cid = :classroomId AND fg.subject.id = :subjectId " +
           "AND fg.semester = :semester AND fg.schoolYear = :schoolYear")
    List<FinalGrade> findByClassroomAndSubjectAndSemesterAndSchoolYear(
            @Param("classroomId") Long classroomId,
            @Param("subjectId") Long subjectId,
            @Param("semester") Semester semester,
            @Param("schoolYear") int schoolYear);

    Optional<FinalGrade> findByStudentIdAndClassroomCidAndSubjectIdAndSemesterAndSchoolYear(
            Long studentId, Long classroomId, Long subjectId, Semester semester, int schoolYear);
}
