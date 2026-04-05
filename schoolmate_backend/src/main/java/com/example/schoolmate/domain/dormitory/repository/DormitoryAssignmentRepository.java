package com.example.schoolmate.domain.dormitory.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.domain.dormitory.entity.DormitoryAssignment;

public interface DormitoryAssignmentRepository extends JpaRepository<DormitoryAssignment, Long> {

    // 특정 학생의 특정 학기 배정 조회
    Optional<DormitoryAssignment> findByStudentInfoIdAndAcademicTermId(Long studentInfoId, Long academicTermId);

    // 특정 학생의 현재(ACTIVE) 학기 배정 조회
    @Query("SELECT da FROM DormitoryAssignment da " +
           "JOIN FETCH da.dormitory " +
           "JOIN da.academicTerm t " +
           "WHERE da.studentInfo.id = :studentInfoId AND t.status = 'ACTIVE'")
    Optional<DormitoryAssignment> findActiveByStudentInfoId(@Param("studentInfoId") Long studentInfoId);

    // 특정 침대의 현재(ACTIVE) 학기 배정 조회
    @Query("SELECT da FROM DormitoryAssignment da " +
           "JOIN FETCH da.studentInfo si JOIN FETCH si.user " +
           "JOIN da.academicTerm t " +
           "WHERE da.dormitory.id = :dormitoryId AND t.status = 'ACTIVE'")
    List<DormitoryAssignment> findActiveByDormitoryId(@Param("dormitoryId") Long dormitoryId);

    // 특정 학기의 모든 배정 조회
    List<DormitoryAssignment> findByAcademicTermId(Long academicTermId);

    // 특정 학교의 현재(ACTIVE) 학기 전체 배정 조회
    @Query("SELECT da FROM DormitoryAssignment da " +
           "JOIN FETCH da.dormitory d " +
           "JOIN FETCH da.studentInfo si " +
           "JOIN da.academicTerm t " +
           "WHERE d.school.id = :schoolId AND t.status = 'ACTIVE'")
    List<DormitoryAssignment> findAllActiveBySchoolId(@Param("schoolId") Long schoolId);

    // 특정 학생의 배정 삭제
    void deleteByStudentInfoIdAndAcademicTermId(Long studentInfoId, Long academicTermId);
}
