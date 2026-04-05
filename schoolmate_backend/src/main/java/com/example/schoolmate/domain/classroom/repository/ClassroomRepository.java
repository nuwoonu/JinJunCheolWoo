package com.example.schoolmate.domain.classroom.repository;
import com.example.schoolmate.domain.teacher.entity.TeacherInfo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.domain.classroom.entity.Classroom;

/**
 * Classroom Repository
 *
 * [담임 조회 관련 - 두 가지 방식 존재]
 *
 * 1. homeroomTeacher (TeacherInfo) - 새로 추가한 필드
 *    → findByHomeroomTeacherIdAndSchoolYear_Year() - TeacherInfo.id로 조회
 *
 * 2. teacher (User) - 기존 필드 ★현재 AdminService에서 사용 중
 *    → findByTeacherUidAndSchoolYear_Year() - User.uid로 조회
 *
 * ※ AdminService에서 담임 배정을 teacher(User)로 하고 있으므로
 *   TeacherService에서도 User.uid 기반으로 조회해야 함
 */
public interface ClassroomRepository extends JpaRepository<Classroom, Long>, ClassroomRepositoryCustom {
    boolean existsBySchoolYear_YearAndGradeAndClassNum(int year, int grade, int classNum);

    boolean existsBySchoolYear_YearAndGradeAndClassNumAndSchool_Id(int year, int grade, int classNum, Long schoolId);

    // [새 방식] homeroomTeacher(TeacherInfo)로 조회
    Optional<Classroom> findByHomeroomTeacherIdAndSchoolYear_Year(Long teacherId, int year);

    // ★ [현재 사용] teacher(User)로 조회
    Optional<Classroom> findByTeacherUidAndSchoolYear_Year(Long teacherUid, int year);

    // 학년도, 학년, 반으로 학급 찾기
    Optional<Classroom> findBySchoolYear_YearAndGradeAndClassNum(int year, int grade, int classNum);

    // 학교별 학년도, 학년, 반으로 학급 찾기 (다중학교 대응)
    Optional<Classroom> findBySchoolIdAndSchoolYear_YearAndGradeAndClassNum(Long schoolId, int year, int grade, int classNum);

    // [새 방식] homeroomTeacher로 이력 조회
    List<Classroom> findByHomeroomTeacherId(Long teacherId);

    // ★ [현재 사용] teacher(User)로 이력 조회
    List<Classroom> findByTeacherUid(Long teacherUid);

    // 학년도로 모든 학급 찾기
    List<Classroom> findBySchoolYear_Year(int year);

    // 학년도와 학년으로 학급 찾기
    List<Classroom> findBySchoolYear_YearAndGrade(int year, int grade);
}
