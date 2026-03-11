package com.example.schoolmate.domain.resources.dto;

import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.domain.resources.constant.FacilityStatus;
import com.example.schoolmate.domain.resources.constant.FacilityType;
import com.example.schoolmate.domain.resources.entity.SchoolFacility;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

public class FacilityDTO {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Request {
        private Long id;
        private String name;
        private String location; // buildingName & locationDesc
        private FacilityType type; // FacilityType (Enum input)
        private FacilityStatus status; // FacilityStatus (Enum input)
        private Integer capacity;
        private String amenities;
        private String description;
        private boolean available;
        private MultipartFile imageFile;
    }

    @Getter
    @Builder
    public static class Response {
        private Long id;
        private String name;
        private FacilityType type;
        private String typeDesc;
        private FacilityStatus status;
        private String statusDesc;
        private String location;
        private Integer capacity;
        private String amenities;
        private String description;
        private boolean available;
        private String imageUrl;

        public static Response from(SchoolFacility entity) {
            String fullUrl = null;
            if (entity.getImageFilename() != null) {
                fullUrl = SchoolmateUrls.UPLOAD_PATH_FACILITIES + entity.getImageFilename();
            }

            FacilityStatus status = entity.getStatus() != null ? entity.getStatus() : FacilityStatus.AVAILABLE;

            return Response.builder()
                    .id(entity.getId())
                    .name(entity.getName())
                    .type(entity.getType())
                    .typeDesc(entity.getType() != null ? entity.getType().getDescription() : "")
                    .status(status)
                    .statusDesc(status.getDescription())
                    .location(entity.getLocationDesc()) // BaseResource.locationDesc 사용
                    .capacity(entity.getCapacity())
                    .amenities(entity.getAmenities())
                    .description(entity.getDescription()) // BaseResource.description 사용
                    .available(status == FacilityStatus.AVAILABLE) // 상태를 기반으로 예약 가능 여부 판단
                    .imageUrl(fullUrl)
                    .build();
        }
    }
}