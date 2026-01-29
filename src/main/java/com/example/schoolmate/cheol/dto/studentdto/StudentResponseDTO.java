package com.example.schoolmate.cheol.dto.studentdto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;
import com.example.schoolmate.common.entity.user.constant.Gender;

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

    private Long id; // StudentInfo의 id

    private Long studentNumber;

    private int year;

    private Integer classNum;

    private String fullStudentNumber; // "1-3-05" 형식

    private String studentCode; // 고유 학번

    private LocalDate birthDate;

    private String address;

    private String phone;

    private Gender gender;

    private StudentStatus status;

    private LocalDateTime createdDate;

    private LocalDateTime modifiedDate;

    // User 정보 (연관된 경우)
    private Long userUid;
    private String userName;
    private String userEmail;

    // Entity -> DTO 변환 생성자
    public StudentResponseDTO(StudentInfo student) {
        this.id = student.getId();
        this.studentNumber = student.getStudentNumber();

        if (student.getClassroom() != null) {
            this.year = student.getClassroom().getYear();
            this.classNum = student.getClassroom().getClassNum();
        }

        this.fullStudentNumber = student.getFullStudentNumber();
        this.studentCode = student.getCode();
        this.birthDate = student.getBirthDate();
        this.address = student.getAddress();
        this.phone = student.getPhone();
        this.gender = student.getGender();
        this.status = student.getStatus();

        if (student.getUser() != null) {
            this.userUid = student.getUser().getUid();
            this.userName = student.getUser().getName();
            this.userEmail = student.getUser().getEmail();
        }
    }
}
