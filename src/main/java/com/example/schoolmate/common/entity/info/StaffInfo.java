package com.example.schoolmate.common.entity.info;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.Setter;

@Entity
@DiscriminatorValue("STAFF")
@Getter
@Setter
public class StaffInfo extends BaseInfo {
    private String jobTitle; // 직함 (예: 행정실장, 주무관)
    private String workLocation; // 근무지 (예: 행정실, 숙직실)
}