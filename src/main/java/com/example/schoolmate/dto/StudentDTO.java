package com.example.schoolmate.dto;

import com.example.schoolmate.common.entity.constant.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@Builder
public class StudentDTO {
    private Long uid;

    @Email(message = "이메일 형식을 확인해 주세요")
    @NotBlank(message = "이메일은 필수입력요소입니다")
    private String email;

    @NotBlank(message = "비밀번호는 필수입력요소입니다")
    private String password;

    @NotBlank(message = "이름은 필수입력요소입니다")
    private String name;

    @NotBlank(message = "학번은 필수입력요소입니다")
    private String studentNumber; // 학번

    @NotNull(message = "학년은 필수입력요소입니다")
    private Integer grade; // 학년

    @NotNull(message = "반은 필수입력요소입니다")
    private Integer classNum; // 반

    // @Builder.Default: Lombok의 @Builder 사용 시 필드 기본값을 유지하기 위해 필요
    @Builder.Default
    private UserRole role = UserRole.STUDENT;
}
