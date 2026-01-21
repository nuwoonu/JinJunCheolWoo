package com.example.schoolmate.dto;

import com.example.schoolmate.common.entity.user.constant.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

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

    // 다중 역할 지원
    @Builder.Default
    private Set<UserRole> roles = new HashSet<>();

    // Student 전용 필드
    private String studentNumber; // 학번
    private String studentIdentityNum;
    private Integer grade; // 학년
    private Integer classNum; // 반
    private Integer studentNum;
    private Integer schoolYear;

    // Teacher 전용 필드
    private String subject; // 담당 과목
    private String employeeNumber; // 사번

    // Admin 전용 필드
    private String department; // 부서
    private String position;

    private String phoneNumber;

    public boolean hasRole(UserRole role) {
        return roles != null && roles.contains(role);
    }

    public UserRole getPrimarRole() {
        if (role != null)
            return role;

        // roles에서 우선순위로 반환: ADMIN > TEACHER > PARENT > STUDENT
        if (roles == null || roles.isEmpty())
            return null;
        if (roles.contains(UserRole.ADMIN))
            return UserRole.ADMIN;
        if (roles.contains(UserRole.TEACHER))
            return UserRole.TEACHER;
        if (roles.contains(UserRole.PARENT))
            return UserRole.PARENT;
        if (roles.contains(UserRole.STUDENT))
            return UserRole.STUDENT;
        return roles.iterator().next();
    }

    // studentNumber와 studentIdentityNum 호환
    public String getStudentIdentityNum() {
        return studentIdentityNum != null ? studentIdentityNum : studentNumber;
    }
}
