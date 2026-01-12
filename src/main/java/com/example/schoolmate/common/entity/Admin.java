package com.example.schoolmate.common.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "user_staff")
@DiscriminatorValue("STAFF")
@Getter
@Setter
public class Admin extends User {
    private String department; // 부서
    private String position; // 직책
}
