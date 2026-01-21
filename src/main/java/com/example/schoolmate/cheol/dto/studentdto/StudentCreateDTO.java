package com.example.schoolmate.cheol.dto.studentdto;

import java.time.LocalDate;

import com.example.schoolmate.common.entity.user.constant.Gender;
import com.example.schoolmate.common.entity.user.constant.Status;
import com.example.schoolmate.common.entity.user.constant.Year;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class StudentCreateDTO {

    @NotNull(message = "학번은 필수입니다.")
    private Long studentNumber;

    @NotNull(message = "학년은 필수입니다.")
    @Min(value = 1, message = "학년은 1 이상이어야 합니다.")
    private Year year;

    @NotNull(message = "반은 필수입니다.")
    @Min(value = 1, message = "반은 1 이상이어야 합니다.")
    private int classNum;
    @NotBlank(message = "이름은 필수입니다.")
    private String name;

    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;

    @NotBlank(message = "비밀번호는 필수입니다.")
    private String password;

    private LocalDate birthDate;

    private String address;

    private String phone;

    private Gender gender;

    @Builder.Default
    private Status status = Status.ACTIVE;
}
