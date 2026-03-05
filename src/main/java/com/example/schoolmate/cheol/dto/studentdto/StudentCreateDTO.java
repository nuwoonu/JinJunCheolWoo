package com.example.schoolmate.cheol.dto.studentdto;

import java.time.LocalDate;

import com.example.schoolmate.common.entity.user.constant.Gender;
import com.example.schoolmate.common.entity.user.constant.Status;

import jakarta.validation.constraints.Email;
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
    private Integer studentNumber;

    // [woo 수정] classroomId → @NotNull 제거 (선택사항으로 변경)
    // classroomId가 없으면 grade+classNum으로 학급 조회 (StudentService.createStudent 참고)
    private Long classroomId;

    // [woo 추가] 교사 폼에서 담임 학급 자동 세팅용 (classroomId 대체)
    private Integer grade;
    private Integer classNum;
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
