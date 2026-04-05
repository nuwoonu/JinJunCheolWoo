package com.example.schoolmate.cheol.dto.studentabilitydto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class StudentAbilityRequestDTO {

    @NotNull(message = "학생 ID는 필수입니다.")
    private Long studentId;

    @NotBlank(message = "과목 코드는 필수입니다.")
    private String subjectCode;

    @NotBlank(message = "내용은 필수입니다.")
    private String content;
}
