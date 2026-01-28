package com.example.schoolmate.common.dto;

import com.example.schoolmate.common.entity.SchoolFacility;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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

        public static Response from(SchoolFacility entity) {
            return Response.builder()
                    .id(entity.getId())
                    .name(entity.getName())
                    .location(entity.getLocation())
                    .capacity(entity.getCapacity())
                    .description(entity.getDescription())
                    .available(entity.isAvailable())
                    .build();
        }
    }
}