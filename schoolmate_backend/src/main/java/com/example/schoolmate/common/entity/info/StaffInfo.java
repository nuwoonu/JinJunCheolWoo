package com.example.schoolmate.common.entity.info;

import java.time.LocalDate;

import com.example.schoolmate.common.entity.info.constant.EmploymentType;
import com.example.schoolmate.common.entity.info.constant.StaffStatus;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Getter;
import lombok.Setter;

/**
 * 교직원(행정직 등) 상세 정보 엔티티
 * 
 * 교사가 아닌 일반 직원의 인사 정보를 관리합니다.
 * - 부서, 직함, 근무지, 고용 형태 및 계약 만료일
 */
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
    private String department; // 소속 부서 (예: 행정실, 시설관리팀)
    private String extensionNumber; // 내선 번호

    @Enumerated(EnumType.STRING)
    private EmploymentType employmentType = EmploymentType.PERMANENT; // 고용 형태
    private LocalDate contractEndDate; // 계약 만료일 (정규직은 null 가능)

    public void update(String department, String jobTitle, String workLocation, String extensionNumber,
            StaffStatus status, EmploymentType employmentType, LocalDate contractEndDate) {
        this.department = department;
        this.jobTitle = jobTitle;
        this.workLocation = workLocation;
        this.extensionNumber = extensionNumber;
        this.status = status;
        this.employmentType = employmentType;
        this.contractEndDate = contractEndDate;
    }
}