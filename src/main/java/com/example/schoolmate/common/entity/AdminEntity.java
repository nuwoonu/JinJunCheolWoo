package com.example.schoolmate.common.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_admin")
@DiscriminatorValue("ADMIN")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminEntity extends User {
    private String department;
    private String employeeNumber;

    public void changeDepartment(String department) {
        this.department = department;
    }

    public void changeEmployeeNumber(String employeeNumber) {
        this.employeeNumber = employeeNumber;
    }
}
