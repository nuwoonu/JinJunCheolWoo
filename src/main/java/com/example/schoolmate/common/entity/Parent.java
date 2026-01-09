package com.example.schoolmate.common.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "user_parent")
@DiscriminatorValue("PARENT")
@Getter
@Setter
public class Parent extends User {
    private String phoneNumber; // 연락처
    private String emergencyContact; // 비상 연락처
}