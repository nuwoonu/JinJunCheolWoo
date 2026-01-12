package com.example.schoolmate.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@ToString
@Builder
@Setter
public class StudentDTO {
    private Long studentId;

    private int grade;

    private int grades;

}
