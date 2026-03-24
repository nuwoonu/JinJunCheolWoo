package com.example.schoolmate.common.repository.info;

import java.util.List;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.example.schoolmate.common.entity.info.FamilyRelation;

public interface FamilyRelationRepository extends JpaRepository<FamilyRelation, Long> {
    List<FamilyRelation> findByStudentInfo_Code(String code);

    List<FamilyRelation> findByStudentInfo_User_Uid(Long uid);

    // 학부모 uid로 자녀 관계 조회
    List<FamilyRelation> findByParentInfo_User_Uid(Long uid);

    // [woo] 특정 학급의 학부모 관계 조회 (가정통신문 읽음 현황용)
    @Query("SELECT fr FROM FamilyRelation fr " +
           "JOIN FETCH fr.parentInfo pi JOIN FETCH pi.user " +
           "JOIN FETCH fr.studentInfo si JOIN FETCH si.user " +
           "JOIN si.currentAssignment ca " +
           "JOIN ca.classroom cl " +
           "WHERE cl.cid = :classroomId")
    List<FamilyRelation> findByStudentClassroom(@Param("classroomId") Long classroomId);

    // [woo] 학교 전체 학부모 관계 조회
    @Query("SELECT fr FROM FamilyRelation fr " +
           "JOIN FETCH fr.parentInfo pi JOIN FETCH pi.user " +
           "JOIN FETCH fr.studentInfo si JOIN FETCH si.user " +
           "WHERE si.school.id = :schoolId")
    List<FamilyRelation> findBySchoolId(@Param("schoolId") Long schoolId);

    // [woo] 특정 학생들의 학부모 관계 조회 (담임 반 학부모 목록용)
    @Query("SELECT fr FROM FamilyRelation fr " +
            "JOIN FETCH fr.parentInfo pi " +
            "LEFT JOIN FETCH pi.user " +
            "LEFT JOIN FETCH pi.childrenRelations cr " +
            "LEFT JOIN FETCH cr.studentInfo si " +
            "LEFT JOIN FETCH si.user " +
            "WHERE fr.studentInfo.id IN :studentInfoIds " +
            "ORDER BY pi.id DESC")
    List<FamilyRelation> findByStudentInfoIdIn(@Param("studentInfoIds") Set<Long> studentInfoIds);
}