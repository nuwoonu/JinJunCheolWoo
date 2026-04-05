package com.example.schoolmate.domain.studentrecord.career.dto;

import com.example.schoolmate.domain.studentrecord.career.entity.CareerAspiration;

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
public class CareerAspirationDTO {

    private Long id;
    private Long studentId;
    private String studentName;
    private int schoolYear;
    private int semester;

    // 특기 또는 흥미
    private String specialtyOrInterest;

    // 진로희망
    private String studentDesiredJob;
    private String parentDesiredJob;

    // 공통
    private String preparationPlan;
    private String notes;

    // Entity -> DTO
    public static CareerAspirationDTO from(CareerAspiration aspiration) {
        return CareerAspirationDTO.builder()
                .id(aspiration.getId())
                .studentId(aspiration.getStudent().getId())
                .studentName(aspiration.getStudent().getUser() != null
                        ? aspiration.getStudent().getUser().getName()
                        : null)
                .schoolYear(aspiration.getSchoolYearInt())
                .semester(aspiration.getSemester())
                .specialtyOrInterest(aspiration.getSpecialtyOrInterest())
                .studentDesiredJob(aspiration.getStudentDesiredJob())
                .parentDesiredJob(aspiration.getParentDesiredJob())
                .preparationPlan(aspiration.getPreparationPlan())
                .notes(aspiration.getNotes())
                .build();
    }
}
