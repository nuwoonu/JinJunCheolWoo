package com.example.schoolmate.consultation.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.consultation.dto.ReservationDTO;
import com.example.schoolmate.consultation.service.ConsultationReservationService;
import com.example.schoolmate.dto.AuthUserDTO;

import lombok.RequiredArgsConstructor;

// [soojin] 상담 예약 REST API
@RestController
@RequestMapping("/api/consultation/reservations")
@RequiredArgsConstructor
public class ConsultationReservationController {

    private final ConsultationReservationService reservationService;
    private final UserRepository userRepository;

    // 날짜 범위로 예약 조회 (캘린더 뷰)
    @GetMapping
    public ResponseEntity<List<ReservationDTO.Response>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(reservationService.getByDateRange(startDate, endDate));
    }

    // 내 예약 목록 (PARENT: 본인 예약, TEACHER: 전체 예약)
    @GetMapping("/my")
    public ResponseEntity<List<ReservationDTO.Response>> getMyReservations(Authentication auth) {
        Long uid = getUid(auth);
        if (uid == null) return ResponseEntity.status(401).build();
        String role = getRole(auth);
        return ResponseEntity.ok(reservationService.getMyReservations(uid, role));
    }

    // 예약 생성
    @PostMapping
    public ResponseEntity<ReservationDTO.Response> create(
            @RequestBody ReservationDTO.CreateRequest req, Authentication auth) {
        Long uid = getUid(auth);
        if (uid == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(reservationService.create(uid, req));
    }

    // 예약 취소
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(@PathVariable Long id, Authentication auth) {
        Long uid = getUid(auth);
        if (uid == null) return ResponseEntity.status(401).build();
        reservationService.cancel(id, uid);
        return ResponseEntity.ok().build();
    }

    // 예약 확정 (교사) - 일정 조정 가능
    @PatchMapping("/{id}/confirm")
    public ResponseEntity<ReservationDTO.Response> confirm(
            @PathVariable Long id,
            @RequestBody(required = false) ReservationDTO.ConfirmRequest req) {
        return ResponseEntity.ok(reservationService.confirm(id, req));
    }

    // [soojin] 예약 완료 처리 (교사)
    @PatchMapping("/{id}/complete")
    public ResponseEntity<ReservationDTO.Response> complete(@PathVariable Long id) {
        return ResponseEntity.ok(reservationService.complete(id));
    }

    // [soojin] 교사 취소 (지난 예약 정리용)
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Void> teacherCancel(@PathVariable Long id) {
        reservationService.teacherCancel(id);
        return ResponseEntity.ok().build();
    }

    // 학부모의 자녀 목록
    @GetMapping("/children")
    public ResponseEntity<List<ReservationDTO.ChildInfo>> getChildren(Authentication auth) {
        Long uid = getUid(auth);
        if (uid == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(reservationService.getChildren(uid));
    }

    private String getRole(Authentication auth) {
        if (auth == null) return "UNKNOWN";
        Object p = auth.getPrincipal();
        if (p instanceof AuthUserDTO a) {
            var role = a.getPrimaryRole();
            return role != null ? role.name() : "UNKNOWN";
        }
        return "UNKNOWN";
    }

    private Long getUid(Authentication auth) {
        if (auth == null) return null;
        Object p = auth.getPrincipal();
        if (p instanceof AuthUserDTO a) return a.getCustomUserDTO().getUid();
        if (p instanceof OAuth2User o) {
            var attrs = o.getAttributes();
            String provider = attrs.containsKey("sub") ? "google"
                    : attrs.containsKey("id") ? "kakao" : null;
            String pid = provider == null ? null
                    : (provider.equals("google") ? String.valueOf(attrs.get("sub"))
                            : String.valueOf(attrs.get("id")));
            if (provider != null && pid != null)
                return userRepository.findByProviderAndProviderId(provider, pid)
                        .map(User::getUid).orElse(null);
        }
        return null;
    }
}
