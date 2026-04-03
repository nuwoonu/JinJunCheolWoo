package com.example.schoolmate.cheol.dto.bookreportdto;

import java.time.LocalDateTime;

import com.example.schoolmate.cheol.entity.BookReport;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookReportResponseDTO {

    private Long id;
    private Long studentInfoId;
    private int schoolYear;
    private int semester;
    private String content;
    private LocalDateTime createDate;
    private LocalDateTime updateDate;

    public static BookReportResponseDTO from(BookReport bookReport) {
        return BookReportResponseDTO.builder()
                .id(bookReport.getId())
                .studentInfoId(bookReport.getStudentInfo().getId())
                .schoolYear(bookReport.getSchoolYearInt())
                .semester(bookReport.getSemester())
                .content(bookReport.getContent())
                .createDate(bookReport.getCreateDate())
                .updateDate(bookReport.getUpdateDate())
                .build();
    }
}
