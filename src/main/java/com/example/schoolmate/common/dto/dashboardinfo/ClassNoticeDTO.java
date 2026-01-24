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
public class ClassNoticeDTO {

  // 학급 알림장, 학급공지

  private Long no;

  private String title;

  private String content;

  private Integer grade;

  private Integer classNum;

  private String writerName; // User writerTeacher ?

  private String attachmentUrl;

  private LocalDate createdDate;
}
