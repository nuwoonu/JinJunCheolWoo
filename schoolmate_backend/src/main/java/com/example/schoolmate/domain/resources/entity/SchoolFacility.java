package com.example.schoolmate.domain.resources.entity;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import com.example.schoolmate.domain.resources.constant.FacilityStatus;
import com.example.schoolmate.domain.resources.constant.FacilityType;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@DiscriminatorValue("FACILITY")
public class SchoolFacility extends BaseResource {
    @Enumerated(EnumType.STRING)
    private FacilityType type; // 시설 유형 (교실, 강당, 체육관 등)

    @Enumerated(EnumType.STRING)
    private FacilityStatus status; // 시설 상태 (사용가능, 공사중 등)

    private Integer capacity;

    private String amenities; // 부대 시설 (예: 빔프로젝터, 화이트보드, 에어컨)
}