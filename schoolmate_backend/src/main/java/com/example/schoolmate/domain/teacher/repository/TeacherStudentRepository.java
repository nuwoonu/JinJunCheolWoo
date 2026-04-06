package com.example.schoolmate.domain.teacher.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.domain.teacher.entity.TeacherStudent;
import com.example.schoolmate.domain.teacher.entity.constant.TeacherRole;

/**
 * 교사-학생 관계 Repository
 *
 * 교사-학생 매핑 정보의 CRUD 및 조회를 담당함.
 * 학년도별, 역할별 조회 등 다양한 쿼리 메서드 제공.
 */
public interface TeacherStudentRepository extends JpaRepository<TeacherStudent, Long> {

        /**
         * 특정 교사의 특정 학년도 담당 학생 목록 조회
         */
        List<TeacherStudent> findByTeacherInfoIdAndSchoolYear_Year(Long teacherInfoId, int year);

        /**
         * 특정 교사의 특정 학년도 + 역할별 담당 학생 목록 조회
         */
        List<TeacherStudent> findByTeacherInfoIdAndSchoolYear_YearAndRole(Long teacherInfoId, int year, TeacherRole role);

        /**
         * 특정 학생의 특정 학년도 담당 교사 목록 조회
         */
        List<TeacherStudent> findByStudentInfoIdAndSchoolYear_Year(Long studentInfoId, int year);

        /**
         * 특정 학생의 특정 학년도 담임교사 조회
         */
        Optional<TeacherStudent> findByStudentInfoIdAndSchoolYear_YearAndRole(Long studentInfoId, int year, TeacherRole role);

        /**
         * 특정 교사-학생-학년도-역할 조합 존재 여부 확인
         * (중복 배정 방지용)
         */
        boolean existsByTeacherInfoIdAndStudentInfoIdAndSchoolYear_YearAndRole(
                        Long teacherInfoId, Long studentInfoId, int year, TeacherRole role);

        /**
         * 특정 교사의 담당 학생 목록 조회 (학생 정보와 유저 정보 함께 로딩)
         * N+1 문제 방지를 위해 fetch join 사용
         */
        @Query("SELECT ts FROM TeacherStudent ts " +
                        "JOIN FETCH ts.studentInfo si " +
                        "JOIN FETCH si.user " +
                        "WHERE ts.teacherInfo.id = :teacherInfoId " +
                        "AND ts.schoolYear.year = :year")
        List<TeacherStudent> findWithStudentByTeacherAndYear(
                        @Param("teacherInfoId") Long teacherInfoId,
                        @Param("year") int year);

        /**
         * 특정 학생의 담당 교사 목록 조회 (교사 정보와 유저 정보 함께 로딩)
         */
        @Query("SELECT ts FROM TeacherStudent ts " +
                        "JOIN FETCH ts.teacherInfo ti " +
                        "JOIN FETCH ti.user " +
                        "WHERE ts.studentInfo.id = :studentInfoId " +
                        "AND ts.schoolYear.year = :year")
        List<TeacherStudent> findWithTeacherByStudentAndYear(
                        @Param("studentInfoId") Long studentInfoId,
                        @Param("year") int year);

        /**
         * 특정 학년/반의 모든 교사-학생 관계 조회
         * (반 담임 배정 현황 파악용)
         */
        @Query("SELECT ts FROM TeacherStudent ts " +
                        "JOIN FETCH ts.studentInfo si " +
                        "JOIN si.assignments sa " +
                        "WHERE sa.schoolYear.status = com.example.schoolmate.domain.term.entity.SchoolYearStatus.CURRENT " +
                        "AND sa.classroom.grade = :grade " +
                        "AND sa.classroom.classNum = :classNum")
        List<TeacherStudent> findByClassInfo(
                        @Param("grade") int grade,
                        @Param("classNum") int classNum);

        /**
         * 특정 교사-학생 관계 삭제
         */
        void deleteByTeacherInfoIdAndStudentInfoIdAndSchoolYear_YearAndRole(
                        Long teacherInfoId, Long studentInfoId, int year, TeacherRole role);

        // [woo] 교사가 담당하는 학생들의 distinct 학급 목록 (과목 담당 교사용)
        @Query("SELECT DISTINCT sa.classroom FROM TeacherStudent ts " +
               "JOIN ts.studentInfo si " +
               "JOIN si.assignments sa " +
               "WHERE ts.teacherInfo.id = :teacherInfoId " +
               "AND sa.classroom IS NOT NULL")
        List<com.example.schoolmate.domain.classroom.entity.Classroom> findClassroomsByTeacherInfoId(
                        @Param("teacherInfoId") Long teacherInfoId);
}
