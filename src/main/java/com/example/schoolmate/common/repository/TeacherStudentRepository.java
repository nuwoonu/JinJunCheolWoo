package com.example.schoolmate.common.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.common.entity.info.assignment.TeacherStudent;
import com.example.schoolmate.common.entity.info.constant.TeacherRole;

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
        List<TeacherStudent> findByTeacherInfoIdAndSchoolYear(Long teacherInfoId, int schoolYear);

        /**
         * 특정 교사의 특정 학년도 + 역할별 담당 학생 목록 조회
         */
        List<TeacherStudent> findByTeacherInfoIdAndSchoolYearAndRole(Long teacherInfoId, int schoolYear,
                        TeacherRole role);

        /**
         * 특정 학생의 특정 학년도 담당 교사 목록 조회
         */
        List<TeacherStudent> findByStudentInfoIdAndSchoolYear(Long studentInfoId, int schoolYear);

        /**
         * 특정 학생의 특정 학년도 담임교사 조회
         */
        Optional<TeacherStudent> findByStudentInfoIdAndSchoolYearAndRole(Long studentInfoId, int schoolYear,
                        TeacherRole role);

        /**
         * 특정 교사-학생-학년도-역할 조합 존재 여부 확인
         * (중복 배정 방지용)
         */
        boolean existsByTeacherInfoIdAndStudentInfoIdAndSchoolYearAndRole(
                        Long teacherInfoId, Long studentInfoId, int schoolYear, TeacherRole role);

        /**
         * 특정 교사의 담당 학생 목록 조회 (학생 정보와 유저 정보 함께 로딩)
         * N+1 문제 방지를 위해 fetch join 사용
         */
        @Query("SELECT ts FROM TeacherStudent ts " +
                        "JOIN FETCH ts.studentInfo si " +
                        "JOIN FETCH si.user " +
                        "WHERE ts.teacherInfo.id = :teacherInfoId " +
                        "AND ts.schoolYear = :schoolYear")
        List<TeacherStudent> findWithStudentByTeacherAndYear(
                        @Param("teacherInfoId") Long teacherInfoId,
                        @Param("schoolYear") int schoolYear);

        /**
         * 특정 학생의 담당 교사 목록 조회 (교사 정보와 유저 정보 함께 로딩)
         */
        @Query("SELECT ts FROM TeacherStudent ts " +
                        "JOIN FETCH ts.teacherInfo ti " +
                        "JOIN FETCH ti.user " +
                        "WHERE ts.studentInfo.id = :studentInfoId " +
                        "AND ts.schoolYear = :schoolYear")
        List<TeacherStudent> findWithTeacherByStudentAndYear(
                        @Param("studentInfoId") Long studentInfoId,
                        @Param("schoolYear") int schoolYear);

        /**
         * 특정 학년/반의 모든 교사-학생 관계 조회
         * (반 담임 배정 현황 파악용)
         */
        @Query("SELECT ts FROM TeacherStudent ts " +
                        "JOIN FETCH ts.studentInfo si " +
                        "JOIN si.assignments sa " +
                        "WHERE sa.schoolYear = :schoolYear " +
                        "AND sa.classroom.grade = :grade " +
                        "AND sa.classroom.classNum = :classNum")
        List<TeacherStudent> findByClassInfo(
                        @Param("schoolYear") int schoolYear,
                        @Param("grade") int grade,
                        @Param("classNum") int classNum);

        /**
         * 특정 교사-학생 관계 삭제
         */
        void deleteByTeacherInfoIdAndStudentInfoIdAndSchoolYearAndRole(
                        Long teacherInfoId, Long studentInfoId, int schoolYear, TeacherRole role);
}
