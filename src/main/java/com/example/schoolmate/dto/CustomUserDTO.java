package com.example.schoolmate.dto;

import com.example.schoolmate.common.entity.constant.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@Builder
public class CustomUserDTO {
    private Long uid;

    @Email(message = "이메일 형식을 확인해 주세요")
    @NotBlank(message = "이메일은 필수입력요소입니다")
    private String email;

    @NotBlank(message = "비밀번호는 필수입력요소입니다")
    private String password;

    @NotBlank(message = "이름은 필수입력요소입니다")
    private String name;

    // DTO에는 @Enumerated 불필요 (Entity에서만 사용)
    private UserRole role;

    // Student 전용 필드
    private String studentNumber; // 학번
    private Integer grade; // 학년
    private Integer classNum; // 반

    // Teacher 전용 필드
    private String subject; // 담당 과목
    private String employeeNumber; // 사번

    // Admin 전용 필드
    private String department; // 부서
}
