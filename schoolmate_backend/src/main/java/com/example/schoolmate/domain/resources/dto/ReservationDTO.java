package com.example.schoolmate.domain.resources.dto;

import java.time.LocalDateTime;

import com.example.schoolmate.domain.resources.constant.ReservationStatus;
import com.example.schoolmate.domain.resources.entity.Reservation;
import com.example.schoolmate.domain.resources.entity.SchoolAsset;
import com.example.schoolmate.domain.resources.entity.SchoolFacility;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

public class ReservationDTO {

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private String resourceName; // 시설명 또는 기자재명
        private String resourceType; // "시설" 또는 "기자재"
        private String userName; // 예약자
        private LocalDateTime startDateTime;
        private LocalDateTime endDateTime;
        private ReservationStatus status;
        private String statusDesc; // 상태 한글명
        private String reason; // 사용 목적
        private String rejectReason; // 반려 사유

        public static Response from(Reservation entity) {
            String type = "기타";
            if (entity.getResource() instanceof SchoolFacility) {
                type = "시설";
            } else if (entity.getResource() instanceof SchoolAsset) {
                type = "기자재";
            }

            return Response.builder()
                    .id(entity.getId())
                    .resourceName(entity.getResource().getName())
                    .resourceType(type)
                    .userName(entity.getUser() != null ? entity.getUser().getName() : "알 수 없음")
                    .startDateTime(entity.getStartDateTime())
                    .endDateTime(entity.getEndDateTime())
                    .status(entity.getStatus())
                    .statusDesc(entity.getStatus().getDescription())
                    .reason(entity.getReason())
                    .rejectReason(entity.getRejectReason())
                    .build();
        }
    }
}
