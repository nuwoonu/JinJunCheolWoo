package com.example.schoolmate.domain.studentrecord.awards.dto;

import java.time.LocalDate;

import com.example.schoolmate.domain.user.entity.constant.AchievementsGrade;

import lombok.Getter;
import lombok.NoArgsConstructor;

// [cheol] 수상 경력 등록/수정 요청 DTO
@Getter
@NoArgsConstructor
public class AwardsAndHonorsRequestDTO {
    private Long studentId;
    private String name;
    private AchievementsGrade achievementsGrade;
    private LocalDate day;
    private String awardingOrganization;
}
