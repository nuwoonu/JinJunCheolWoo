package com.example.schoolmate.common.dto;

import com.example.schoolmate.common.entity.SchoolAsset;
import com.example.schoolmate.common.entity.constant.AssetStatus;
import lombok.*;
import java.time.LocalDate;

public class AssetDTO {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Request {
        private Long id;
        private String name;
        private String code;
        private String category;
        private String location;
        private String status;
        private LocalDate purchaseDate;
        private String description;
    }

    @Getter
    @Builder
    public static class Response {
        private Long id;
        private String name;
        private String code;
        private String category;
        private String location;
        private AssetStatus status;
        private String statusDesc;
        private LocalDate purchaseDate;
        private String description;

        public static Response from(SchoolAsset entity) {
            return Response.builder()
                    .id(entity.getId())
                    .name(entity.getName())
                    .code(entity.getCode())
                    .category(entity.getCategory())
                    .location(entity.getLocation())
                    .status(entity.getStatus())
                    .statusDesc(entity.getStatus().getDescription())
                    .purchaseDate(entity.getPurchaseDate())
                    .description(entity.getDescription())
                    .build();
        }
    }

    @Getter
    @Builder
    @AllArgsConstructor
    public static class Summary {
        private String category; // 분류 (노트북, 카메라 등)
        private long totalCount; // 총 보유 수량
        private long availableCount; // 대여 가능 수량
        private long inUseCount; // 대여 중 수량
        private long brokenCount; // 수리/파손/분실 수량
    }
}
