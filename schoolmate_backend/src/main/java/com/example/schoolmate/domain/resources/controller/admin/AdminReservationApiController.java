package com.example.schoolmate.domain.resources.controller.admin;

import java.util.HashMap;
import java.util.Map;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.domain.resources.constant.ReservationStatus;
import com.example.schoolmate.domain.resources.service.ReservationService;

import lombok.RequiredArgsConstructor;

/**
 * 관리자 예약 관리 REST 컨트롤러
 */
@RestController
@RequestMapping(SchoolmateUrls.ADMIN_RESERVATIONS)
@RequiredArgsConstructor
public class AdminReservationApiController {

    private final ReservationService reservationService;

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(value = "status", required = false) ReservationStatus status,
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        Map<String, Object> response = new HashMap<>();
        response.put("reservations", reservationService.getReservationList(status, pageable));
        response.put("statuses", ReservationStatus.values());
        response.put("currentStatus", status);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable Long id) {
        reservationService.approveReservation(id);
        return ResponseEntity.ok("예약이 승인되었습니다.");
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String rejectReason = body.getOrDefault("rejectReason", "");
        reservationService.rejectReservation(id, rejectReason);
        return ResponseEntity.ok("예약이 반려되었습니다.");
    }
}
