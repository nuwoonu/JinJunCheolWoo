package com.example.schoolmate.common.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.common.entity.Classroom;

/**
 * Classroom Repository
 *
 * [담임 조회 관련 - 두 가지 방식 존재]
 *
 * 1. homeroomTeacher (TeacherInfo) - 새로 추가한 필드
 *    → findByHomeroomTeacherIdAndYear() - TeacherInfo.id로 조회
 *
 * 2. teacher (User) - 기존 필드 ★현재 AdminService에서 사용 중
 *    → findByTeacherUidAndYear() - User.uid로 조회
 *
 * ※ AdminService에서 담임 배정을 teacher(User)로 하고 있으므로
 *   TeacherService에서도 User.uid 기반으로 조회해야 함
 */
public interface ClassroomRepository extends JpaRepository<Classroom, Long>, ClassroomRepositoryCustom {
    boolean existsByYearAndGradeAndClassNum(int year, int grade, int classNum);

    // [새 방식] homeroomTeacher(TeacherInfo)로 조회 - 나중에 마이그레이션하면 사용
    Optional<Classroom> findByHomeroomTeacherIdAndYear(Long teacherId, int year);

    // ★ [현재 사용] teacher(User)로 조회 - AdminService에서 이 필드로 담임 배정함
    Optional<Classroom> findByTeacherUidAndYear(Long teacherUid, int year);

    // 학년도, 학년, 반으로 학급 찾기
    Optional<Classroom> findByYearAndGradeAndClassNum(int year, int grade, int classNum);

    // [새 방식] homeroomTeacher로 이력 조회
    List<Classroom> findByHomeroomTeacherId(Long teacherId);

    // ★ [현재 사용] teacher(User)로 이력 조회
    List<Classroom> findByTeacherUid(Long teacherUid);

    // 학년도로 모든 학급 찾기
    List<Classroom> findByYear(int year);

    // 학년도와 학년으로 학급 찾기
    List<Classroom> findByYearAndGrade(int year, int grade);

    // 학급 학생들과 함께 조회 (Fetch Join)
    @Query("SELECT c FROM Classroom c LEFT JOIN FETCH c.students WHERE c.cid = :cid")
    Optional<Classroom> findByIdWithStudents(@Param("cid") Long cid);
}
