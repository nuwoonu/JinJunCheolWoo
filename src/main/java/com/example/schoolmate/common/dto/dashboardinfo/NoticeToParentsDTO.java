package com.example.schoolmate.common.dto.dashboardinfo;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoticeToParentsDTO {

    // 가정통신문

    private Long no;

    private String title;

    private String content;

    // 대상 학년 (null이면 전체)
    private Integer targetGrade;

    private String targetGradeText; // "전체", "1학년" 등 >>?

    private String writerName; // User writer ?

    private String attachmentUrl;

    private Boolean hasAttachment; // >> ??

    private LocalDate createdDate;
}
