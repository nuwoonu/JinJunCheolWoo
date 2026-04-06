package com.example.schoolmate.domain.dormitory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DormitoryAssignDTO {
    private Long studentId;
    private String building;
    private Integer floor;
    private String roomNumber;
    private String bedNumber;
}