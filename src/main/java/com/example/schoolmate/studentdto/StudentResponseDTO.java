package com.example.schoolmate.studentdto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.example.schoolmate.common.entity.constant.Gender;
import com.example.schoolmate.common.entity.constant.Status;
import com.example.schoolmate.common.entity.constant.UserRole;

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
public class StudentResponseDTO {

    private Long uid;

    private String email;

    private String name;

    private UserRole role;

    private Long studentNumber;

    private Integer grade;

    private Integer classNum;

    private String fullStudentNumber; // "1-3-05" 형식

    private LocalDate birthDate;

    private String address;

    private String phone;

    private Gender gender;

    private Status status;

    private LocalDateTime createdDate;

    private LocalDateTime modifiedDate;
}
