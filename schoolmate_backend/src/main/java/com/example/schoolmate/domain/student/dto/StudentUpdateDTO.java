package com.example.schoolmate.domain.student.dto;

import java.time.LocalDate;

import com.example.schoolmate.domain.user.entity.constant.Gender;
import com.example.schoolmate.domain.user.entity.constant.Status;

import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentUpdateDTO {

    private Long id;

    private String name;

    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;

    private String password;

    private Long classroomId;

    private LocalDate birthDate;

    private String address;

    private String phone;

    private Gender gender;

    private Status status;

    private String previousSchoolName; // 이전 학교명

    private LocalDate admissionDate;   // 입학일
}
