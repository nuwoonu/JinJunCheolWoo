package com.example.schoolmate.cheol.dto;

import java.time.LocalDate;

import com.example.schoolmate.cheol.entity.AwardsAndHonors;
import com.example.schoolmate.common.entity.user.constant.AchievementsGrade;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// [cheol] 수상 경력 응답 DTO
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AwardsAndHonorsResponseDTO {
    private Long id;
    private Long studentId;
    private String name;
    private AchievementsGrade achievementsGrade;
    private String achievementsGradeLabel;
    private LocalDate day;
    private String organization; // 프론트 Award 인터페이스 필드명과 통일

    public static AwardsAndHonorsResponseDTO from(AwardsAndHonors a) {
        return AwardsAndHonorsResponseDTO.builder()
                .id(a.getId())
                .studentId(a.getStudentInfo() != null ? a.getStudentInfo().getId() : null)
                .name(a.getName())
                .achievementsGrade(a.getAchievementsGrade())
                .achievementsGradeLabel(a.getAchievementsGrade() != null ? a.getAchievementsGrade().getAchievementsGrade() : null)
                .day(a.getDay())
                .organization(a.getAwardingOrganization())
                .build();
    }
}
