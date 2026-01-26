package com.example.schoolmate.cheol.dto.studentdto;

import java.time.LocalDate;

import com.example.schoolmate.common.entity.user.constant.Gender;
import com.example.schoolmate.common.entity.user.constant.Status;

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
}
