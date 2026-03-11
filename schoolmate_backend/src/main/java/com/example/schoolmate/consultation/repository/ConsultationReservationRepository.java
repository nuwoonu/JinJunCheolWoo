package com.example.schoolmate.consultation.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.consultation.entity.ConsultationReservation;

// [soojin] 상담 예약 Repository
public interface ConsultationReservationRepository extends JpaRepository<ConsultationReservation, Long> {

    // 날짜 범위로 예약 조회 (캘린더 뷰)
    List<ConsultationReservation> findByDateBetween(LocalDate startDate, LocalDate endDate);

    // 작성자(학부모) uid로 본인 예약 조회
    List<ConsultationReservation> findByWriter_UidOrderByDateDescStartTimeDesc(Long uid);

    // 전체 예약 조회 (교사/관리자용)
    List<ConsultationReservation> findAllByOrderByDateDescStartTimeDesc();
}
