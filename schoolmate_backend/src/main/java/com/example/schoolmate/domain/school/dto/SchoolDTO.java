package com.example.schoolmate.domain.school.dto;

import com.example.schoolmate.domain.school.entity.School;
import lombok.Builder;
import lombok.Getter;

public class SchoolDTO {

    @Getter
    @Builder
    public static class Summary {
        private Long id;
        private String name;
        private String schoolCode;
        private String schoolKind;
        private String officeOfEducation;
        private String address;
        private String phoneNumber;
        private String homepage;

        public static Summary from(School school) {
            return Summary.builder()
                    .id(school.getId())
                    .name(school.getName())
                    .schoolCode(school.getSchoolCode())
                    .schoolKind(school.getSchoolKind())
                    .officeOfEducation(school.getOfficeOfEducation())
                    .address(school.getAddress())
                    .phoneNumber(school.getPhoneNumber())
                    .homepage(school.getHomepage())
                    .build();
        }
    }

    @Getter
    @Builder
    public static class Detail {
        private Long id;
        private String name;
        private String schoolCode;
        private String schoolKind;
        private String officeOfEducation;
        private String address;
        private String phoneNumber;
        private String homepage;
        private String foundationType;
        private String coeduType;

        public static Detail from(School school) {
            return Detail.builder()
                    .id(school.getId())
                    .name(school.getName())
                    .schoolCode(school.getSchoolCode())
                    .schoolKind(school.getSchoolKind())
                    .officeOfEducation(school.getOfficeOfEducation())
                    .address(school.getAddress())
                    .phoneNumber(school.getPhoneNumber())
                    .homepage(school.getHomepage())
                    .foundationType(school.getFoundationType())
                    .coeduType(school.getCoeduType())
                    .build();
        }
    }
}
