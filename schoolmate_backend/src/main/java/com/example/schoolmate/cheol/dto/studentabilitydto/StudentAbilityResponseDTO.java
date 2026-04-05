package com.example.schoolmate.cheol.dto.studentabilitydto;

import com.example.schoolmate.cheol.entity.StudentAbility;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StudentAbilityResponseDTO {

    private Long id;
    private Long studentId;
    private String studentName;
    private String subjectName;
    private String subjectCode;
    private Long academicTermId;
    private String termDisplayName;
    private int schoolYear;
    private int semester;
    private String content;

    public static StudentAbilityResponseDTO from(StudentAbility sa) {
        return StudentAbilityResponseDTO.builder()
                .id(sa.getId())
                .studentId(sa.getStudentInfo().getId())
                .studentName(sa.getStudentInfo().getUser() != null ? sa.getStudentInfo().getUser().getName() : null)
                .subjectName(sa.getSubject().getName())
                .subjectCode(sa.getSubject().getCode())
                .academicTermId(sa.getAcademicTerm().getId())
                .termDisplayName(sa.getAcademicTerm().getDisplayName())
                .schoolYear(sa.getAcademicTerm().getSchoolYear())
                .semester(sa.getAcademicTerm().getSemester())
                .content(sa.getContent())
                .build();
    }
}
