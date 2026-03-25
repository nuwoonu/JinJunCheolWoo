package com.example.schoolmate.domain.resources.dto;

import lombok.*;
import java.time.LocalDate;
import org.springframework.web.multipart.MultipartFile;

import com.example.schoolmate.domain.resources.constant.AssetStatus;
import com.example.schoolmate.common.service.FileManager;
import com.example.schoolmate.domain.resources.entity.AssetModel;
import com.example.schoolmate.domain.resources.entity.SchoolAsset;

public class AssetDTO {
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {
        private Long id;

        // AssetModel 관련 (신규 등록 시 사용)
        private Long modelId;
        private String name; // 모델명 (BaseResource.name)
        private String category;
        private String manufacturer;
        private String description; // 모델 설명

        // SchoolAsset 관련
        private String assetCode; // 관리 번호
        private String serialNumber; // 시리얼 번호
        private String location; // 보관 장소 (BaseResource.locationDesc)
        private String status; // AssetStatus name
        private LocalDate purchaseDate;

        private MultipartFile imageFile;
    }

    @Getter
    @Builder
    public static class Response {
        private Long id;
        private Long modelId; // 수정 시 필요
        private String assetCode;
        private String serialNumber;
        private String name; // BaseResource.name (모델명과 동일하게 설정)
        private String manufacturer;
        private String category; // AssetModel에서 가져옴
        private String location; // BaseResource.locationDesc
        private AssetStatus status;
        private LocalDate purchaseDate;
        private String imageUrl;

        public static Response from(SchoolAsset entity) {
            AssetModel model = entity.getModel();
            return Response.builder()
                    .id(entity.getId())
                    .modelId(model != null ? model.getId() : null)
                    .assetCode(entity.getAssetCode())
                    .serialNumber(entity.getSerialNumber())
                    .name(entity.getName()) // BaseResource.name 사용
                    .manufacturer(model != null ? model.getManufacturer() : "")
                    .category(model != null ? model.getCategory() : "")
                    .location(entity.getLocationDesc())
                    .status(entity.getStatus())
                    .purchaseDate(entity.getPurchaseDate())
                    .imageUrl(
                            model != null && model.getImageFilename() != null
                                    ? FileManager.UploadType.ASSET.toUrl(model.getImageFilename())
                                    : null)
                    .build();
        }
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Summary {
        private String category;
        private long totalCount;
        private long availableCount;
        private long inUseCount;
        private long brokenCount;
    }
}
