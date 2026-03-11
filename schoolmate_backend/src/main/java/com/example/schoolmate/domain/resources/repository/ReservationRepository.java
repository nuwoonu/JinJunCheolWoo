package com.example.schoolmate.domain.resources.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.schoolmate.domain.resources.constant.ReservationStatus;
import com.example.schoolmate.domain.resources.entity.Reservation;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    // 상태별 예약 조회 (대기, 승인, 반려 등)
    Page<Reservation> findByStatus(ReservationStatus status, Pageable pageable);
}
