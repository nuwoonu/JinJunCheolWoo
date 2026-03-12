package com.example.schoolmate.domain.resources.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.domain.resources.constant.ReservationStatus;
import com.example.schoolmate.domain.resources.dto.ReservationDTO;
import com.example.schoolmate.domain.resources.entity.Reservation;
import com.example.schoolmate.domain.resources.repository.ReservationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ReservationService {
    private final ReservationRepository reservationRepository;

    /**
     * 예약 목록 조회 (상태 필터링 가능)
     */
    @Transactional(readOnly = true)
    public Page<ReservationDTO.Response> getReservationList(ReservationStatus status, Pageable pageable) {
        if (status != null) {
            return reservationRepository.findByStatus(status, pageable).map(ReservationDTO.Response::from);
        }
        return reservationRepository.findAll(pageable).map(ReservationDTO.Response::from);
    }

    /**
     * 예약 승인
     */
    public void approveReservation(Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("예약 정보를 찾을 수 없습니다."));

        // 이미 처리된 예약인지 확인 로직 등을 추가할 수 있음
        reservation.setStatus(ReservationStatus.APPROVED);
    }

    /**
     * 예약 반려
     */
    public void rejectReservation(Long id, String rejectReason) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("예약 정보를 찾을 수 없습니다."));

        reservation.setStatus(ReservationStatus.REJECTED);
        reservation.setRejectReason(rejectReason);
    }
}
