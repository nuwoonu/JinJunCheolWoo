package com.example.schoolmate.common.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// TODO: [woo] Joon님 구조에서는 User가 abstract가 아님, StaffInfo 사용 필요
// @Entity  // 임시 비활성화
@Table(name = "user_admin")
@DiscriminatorValue("ADMIN")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminEntity {  // extends User 제거
    private String department;
    private String employeeNumber;

    public void changeDepartment(String department) {
        this.department = department;
    }

    public void changeEmployeeNumber(String employeeNumber) {
        this.employeeNumber = employeeNumber;
    }
}
