package com.example.schoolmate.common.entity.info;

import com.example.schoolmate.common.entity.info.constant.StaffStatus;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Getter;
import lombok.Setter;

@Entity
@DiscriminatorValue("STAFF")
@Getter
@Setter
public class StaffInfo extends BaseInfo {
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private StaffStatus status = StaffStatus.EMPLOYED;
    private String jobTitle; // 직함 (예: 행정실장, 주무관)
    private String workLocation; // 근무지 (예: 행정실, 숙직실)
}