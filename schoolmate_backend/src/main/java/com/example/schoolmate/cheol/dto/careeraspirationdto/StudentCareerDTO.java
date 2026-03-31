package com.example.schoolmate.cheol.dto.careeraspirationdto;

import com.example.schoolmate.common.entity.user.constant.Semester;
import com.example.schoolmate.common.entity.user.constant.Year;

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
public class StudentCareerDTO {
    // 학생 작성 / 수정용
    @NotNull(message = "학생 ID는 필수입니다.")
    private Long studentId;

    @NotNull(message = "학년은 필수입니다.")
    private Year year;

    @NotNull(message = "학기는 필수입니다.")
    private Semester semester;

    private String specialtyOrInterest; // 특기 또는 흥미
    private String studentDesiredJob;   // 희망 직업
}
