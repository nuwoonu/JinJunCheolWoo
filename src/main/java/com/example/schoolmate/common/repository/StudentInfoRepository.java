package com.example.schoolmate.common.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.Classroom;

public interface StudentInfoRepository extends JpaRepository<StudentInfo, Long> {
    // 특정 유저(User)의 학생 정보 찾기
    Optional<StudentInfo> findByUser(User user);

    @Query("SELECT s FROM StudentInfo s WHERE s.currentAssignment.attendanceNum = :attendanceNum")
    Optional<StudentInfo> findByAttendanceNum(@Param("attendanceNum") Integer attendanceNum);

    // email은 User 엔티티에 있으므로 연관관계를 통해 조회
    @Query("SELECT s FROM StudentInfo s WHERE s.user.email = :email")
    Optional<StudentInfo> findByUserEmail(@Param("email") String email);

    // TODO: grades 필드 추가 후 활성화
    // @Query("SELECT s FROM StudentInfo s JOIN FETCH s.grades WHERE s.id = :id")
    // Optional<StudentInfo> findByIdWithGrades(@Param("id") Long id);

    // Classroom 기반 조회 메서드 (currentAssignment 기준)
    @Query("SELECT s FROM StudentInfo s WHERE s.currentAssignment.classroom = :classroom")
    List<StudentInfo> findByClassroom(@Param("classroom") Classroom classroom);

    @Query("SELECT s FROM StudentInfo s WHERE s.currentAssignment.classroom.grade = :grade")
    List<StudentInfo> findByClassroomGrade(@Param("grade") int grade);

    @Query("SELECT s FROM StudentInfo s WHERE s.currentAssignment.classroom.classNum = :classNum")
    List<StudentInfo> findByClassroomClassNum(@Param("classNum") int classNum);

    @Query("SELECT s FROM StudentInfo s WHERE s.currentAssignment.classroom.grade = :grade AND s.currentAssignment.classroom.classNum = :classNum")
    List<StudentInfo> findByClassroomGradeAndClassroomClassNum(@Param("grade") int grade,
            @Param("classNum") int classNum);

    // 학급 ID로 학생 찾기
    @Query("SELECT s FROM StudentInfo s WHERE s.currentAssignment.classroom.cid = :classroomId")
    List<StudentInfo> findByClassroomCid(@Param("classroomId") Long classroomId);

    // 학년도, 학년, 반으로 학생 찾기
    @Query("SELECT s FROM StudentInfo s WHERE s.currentAssignment.classroom.year = :year AND s.currentAssignment.classroom.grade = :grade AND s.currentAssignment.classroom.classNum = :classNum")
    List<StudentInfo> findByClassroomYearAndClassroomGradeAndClassroomClassNum(@Param("year") int year,
            @Param("grade") int grade, @Param("classNum") int classNum);

    // [woo] User UID로 학생 정보 조회 - 게시판 권한 체크 시 학생의 학급 정보 확인용
    @Query("SELECT s FROM StudentInfo s WHERE s.user.uid = :uid")
    Optional<StudentInfo> findByUserUid(@Param("uid") Long uid);
}