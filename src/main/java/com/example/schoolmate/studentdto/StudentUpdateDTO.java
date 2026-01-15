package com.example.schoolmate.studentdto;

import java.time.LocalDate;

import com.example.schoolmate.common.entity.constant.Gender;
import com.example.schoolmate.common.entity.constant.Status;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
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

    private String name;

    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;

    private String password;

    @Min(value = 1, message = "학년은 1 이상이어야 합니다.")
    private Integer grade;

    @Min(value = 1, message = "반은 1 이상이어야 합니다.")
    private Integer classNum;

    private LocalDate birthDate;

    private String address;

    private String phone;

    private Gender gender;

    private Status status;
}
