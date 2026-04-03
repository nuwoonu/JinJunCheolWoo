package com.example.schoolmate.cheol.dto.bookreportdto;

import com.example.schoolmate.common.entity.user.constant.Semester;
import com.example.schoolmate.common.entity.user.constant.Year;

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
public class BookReportRequestDTO {

    @NotNull(message = "학년은 필수입니다.")
    private Year year;

    @NotNull(message = "학기는 필수입니다.")
    private Semester semester;

    @NotBlank(message = "감상문 내용은 필수입니다.")
    private String content;
}
