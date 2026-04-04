package com.example.schoolmate.domain.student.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.schoolmate.domain.student.dto.StudentDTO;
import com.example.schoolmate.domain.classroom.entity.Classroom;
import com.example.schoolmate.domain.student.entity.StudentInfo;
import com.example.schoolmate.domain.student.entity.constant.StudentStatus;
import com.example.schoolmate.domain.user.entity.User;

public interface StudentInfoRepositoryCustom {
    Page<User> search(StudentDTO.StudentSearchCondition cond, Pageable pageable);

    Optional<User> findDetailByCode(String code);

    boolean existsByCode(String code);

    List<User> findStudentsByAssignment(int year, int grade, int classNum);

    List<User> findUnassignedStudents(int year, int limit);

    long countByClassroom(int year, int grade, int classNum);

    long countByStatus(StudentStatus status);

    int findMaxAttendanceNum(int year, int grade, int classNum);

    // 기존 @Query 메서드들 → QueryDSL로 이전
    Optional<StudentInfo> findByAttendanceNum(Integer attendanceNum);

    Optional<StudentInfo> findByUserEmail(String email);

    List<StudentInfo> findByClassroom(Classroom classroom);

    List<StudentInfo> findByClassroomGrade(int grade);

    List<StudentInfo> findByClassroomClassNum(int classNum);

    List<StudentInfo> findByClassroomGradeAndClassroomClassNum(int grade, int classNum);

    List<StudentInfo> findByClassroomCid(Long classroomId);

    List<StudentInfo> findByClassroomYearAndClassroomGradeAndClassroomClassNum(int year, int grade, int classNum);

    Optional<StudentInfo> findByUserUid(Long uid);

    /** 특정 학교에서 아직 학급 배정이 없는 학생 목록 (구 findPendingBySchoolId 대체) */
    List<StudentInfo> findUnassignedBySchoolId(Long schoolId);
}
