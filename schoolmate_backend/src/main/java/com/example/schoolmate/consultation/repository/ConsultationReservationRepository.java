package com.example.schoolmate.consultation.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.consultation.entity.ConsultationReservation;

// [soojin] 상담 예약 Repository
public interface ConsultationReservationRepository extends JpaRepository<ConsultationReservation, Long> {

    // 날짜 범위로 예약 조회 (캘린더 뷰) - 교사: 담당 반만
    @Query("SELECT r FROM ConsultationReservation r " +
           "JOIN r.studentInfo si " +
           "JOIN si.currentAssignment ca " +
           "JOIN ca.classroom c " +
           "WHERE c.teacher.uid = :teacherUid AND r.date BETWEEN :startDate AND :endDate")
    List<ConsultationReservation> findByTeacherUidAndDateBetween(
            @Param("teacherUid") Long teacherUid,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // 날짜 범위로 전체 예약 조회 (관리자용)
    List<ConsultationReservation> findByDateBetween(LocalDate startDate, LocalDate endDate);

    // 작성자(학부모) uid로 본인 예약 조회
    List<ConsultationReservation> findByWriter_UidOrderByDateDescStartTimeDesc(Long uid);

    // [미사용] 특정 자녀(studentInfo PK) 상담 조회 - 서비스에서 studentUserUid 기반 메서드로 대체됨
    // List<ConsultationReservation> findByStudentInfo_IdOrderByDateDescStartTimeDesc(Long studentInfoId);

    // 특정 자녀(student user uid) 상담 조회
    List<ConsultationReservation> findByStudentInfo_User_UidOrderByDateDescStartTimeDesc(Long studentUserUid);

    // 학급(classroom) 기준 날짜 범위 예약 조회 (학부모용 캘린더)
    @Query("SELECT r FROM ConsultationReservation r " +
           "JOIN r.studentInfo si " +
           "JOIN si.currentAssignment ca " +
           "JOIN ca.classroom c " +
           "WHERE c.cid = :classroomId AND r.date BETWEEN :startDate AND :endDate")
    List<ConsultationReservation> findByClassroomIdAndDateBetween(
            @Param("classroomId") Long classroomId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // 담임 교사 uid 기준 담당 반 상담 조회
    @Query("SELECT r FROM ConsultationReservation r " +
           "JOIN r.studentInfo si " +
           "JOIN si.currentAssignment ca " +
           "JOIN ca.classroom c " +
           "WHERE c.teacher.uid = :teacherUid " +
           "ORDER BY r.date DESC, r.startTime DESC")
    List<ConsultationReservation> findByTeacherUidOrderByDateDescStartTimeDesc(@Param("teacherUid") Long teacherUid);

    // 전체 예약 조회 (관리자용)
    List<ConsultationReservation> findAllByOrderByDateDescStartTimeDesc();
}
