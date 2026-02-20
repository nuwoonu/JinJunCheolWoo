package com.example.schoolmate.common.dto;

import com.example.schoolmate.common.entity.SchoolFacility;
import com.example.schoolmate.config.SchoolmateUrls;
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
        private String location;
        private Integer capacity;
        private String description;
        private boolean available;
        private MultipartFile imageFile;
    }

    @Getter
    @Builder
    public static class Response {
        private Long id;
        private String name;
        private String location;
        private Integer capacity;
        private String description;
        private boolean available;
        private String imageUrl;

        public static Response from(SchoolFacility entity) {
            String fullUrl = null;
            if (entity.getImageFilename() != null) {
                fullUrl = SchoolmateUrls.UPLOAD_PATH_FACILITIES + entity.getImageFilename();
            }

            return Response.builder()
                    .id(entity.getId())
                    .name(entity.getName())
                    .location(entity.getLocation())
                    .capacity(entity.getCapacity())
                    .description(entity.getDescription())
                    .available(entity.isAvailable())
                    .imageUrl(fullUrl)
                    .build();
        }
    }
}