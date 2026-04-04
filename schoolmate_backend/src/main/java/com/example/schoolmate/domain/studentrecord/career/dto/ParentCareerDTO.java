package com.example.schoolmate.domain.studentrecord.career.dto;

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
public class ParentCareerDTO {
    // 학부모 작성 / 수정용
    @NotNull(message = "학생 ID는 필수입니다.")
    private Long studentId;

    @NotNull(message = "학기 정보는 필수입니다.")
    private Long academicTermId;

    private String parentDesiredJob; // 학부모가 희망하는 자녀의 직업
}
