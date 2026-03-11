package com.example.schoolmate.domain.resources.dto;

import lombok.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.schoolmate.domain.resources.entity.AssetModel;

public class AssetModelDTO {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Request {
        private Long id;
        private String name;
        private String manufacturer;
        private String category;
        private String description;
        private MultipartFile imageFile;
    }

    @Getter
    @Builder
    public static class Response {
        private Long id;
        private String name;
        private String manufacturer;
        private String category;
        private String description;
        private String imageUrl;

        public static Response from(AssetModel entity) {
            return Response.builder()
                    .id(entity.getId())
                    .name(entity.getName())
                    .manufacturer(entity.getManufacturer())
                    .category(entity.getCategory())
                    .description(entity.getDescription())
                    .imageUrl(entity.getImageFilename() != null ? "/uploads/assets/" + entity.getImageFilename() : null)
                    .build();
        }
    }
}