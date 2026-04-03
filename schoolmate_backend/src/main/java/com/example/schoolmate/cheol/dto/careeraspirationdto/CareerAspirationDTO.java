package com.example.schoolmate.cheol.dto.careeraspirationdto;

import com.example.schoolmate.cheol.entity.CareerAspiration;
import com.example.schoolmate.common.entity.user.constant.Semester;
import com.example.schoolmate.common.entity.user.constant.Year;

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
    private Year year;
    private Semester semester;

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
                .year(aspiration.getYear())
                .semester(aspiration.getSemester())
                .specialtyOrInterest(aspiration.getSpecialtyOrInterest())
                .studentDesiredJob(aspiration.getStudentDesiredJob())
                .parentDesiredJob(aspiration.getParentDesiredJob())
                .preparationPlan(aspiration.getPreparationPlan())
                .notes(aspiration.getNotes())
                .build();
    }
}
