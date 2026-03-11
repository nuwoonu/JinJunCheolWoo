package com.example.schoolmate.woo.dto.teacherdto;

import java.time.LocalDateTime;

import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.constant.TeacherStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// 교사 정보 응답용 DTO
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherResponseDTO {

    private Long id;

    private String name;

    private String email;

    // 담당 과목
    private String subject;

    // 소속 부서
    private String department;

    // 직책
    private String position;

    // 재직 상태
    private TeacherStatus status;

    // 담당 학급 정보 (있으면)
    private String homeroomClass;

    // 담당 학생 수
    private int studentCount;

    private LocalDateTime createdDate;

    private LocalDateTime modifiedDate;

    // Entity -> DTO 변환
    public TeacherResponseDTO(TeacherInfo teacher) {
        this.id = teacher.getId();
        this.subject = teacher.getSubject();
        this.department = teacher.getDepartment();
        this.position = teacher.getPosition();
        this.status = teacher.getStatus();

        // User 정보가 있으면 가져옴
        if (teacher.getUser() != null) {
            this.name = teacher.getUser().getName();
            this.email = teacher.getUser().getEmail();
        }

        // 담당 학생 수
        this.studentCount = teacher.getTeacherStudents() != null
            ? teacher.getTeacherStudents().size()
            : 0;
    }
}
