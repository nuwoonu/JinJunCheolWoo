package com.example.schoolmate.domain.studentrecord.volunteer.entity;

import java.time.LocalDate;

import com.example.schoolmate.domain.term.entity.AcademicTerm;
import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import com.example.schoolmate.domain.student.entity.StudentInfo;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "volunteer_activities")
@Getter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "studentInfo")
public class VolunteerActivity extends SchoolBaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_term_id", nullable = false)
    private AcademicTerm academicTerm;

    @Column(nullable = false)
    private LocalDate startDate; // 일자 또는 기간 (시작일)

    private LocalDate endDate; // 기간 종료일 (단일 일자면 null)

    @Column(nullable = false, length = 200)
    private String organizer; // 장소 또는 주관기관명

    @Column(nullable = false, length = 500)
    private String activityContent; // 활동내용

    @Column(nullable = false)
    private Double hours; // 시간 (해당 활동의 봉사 시간)

    @Column(nullable = false)
    private Double cumulativeHours; // 누계시간 (학기 기준 누적 봉사 시간)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_info_id")
    private StudentInfo studentInfo;

    public void update(AcademicTerm academicTerm, LocalDate startDate, LocalDate endDate, String organizer,
            String activityContent, Double hours) {
        this.academicTerm = academicTerm;
        this.startDate = startDate;
        this.endDate = endDate;
        this.organizer = organizer;
        this.activityContent = activityContent;
        this.hours = hours;
    }

    // 누계시간은 서비스에서 자동 계산하여 설정
    public void updateCumulativeHours(Double cumulativeHours) {
        this.cumulativeHours = cumulativeHours;
    }

    /** 학년도 정수값 편의 메서드 */
    public int getSchoolYearInt() {
        return academicTerm != null ? academicTerm.getSchoolYearInt() : 0;
    }

    /** 학기 편의 메서드 */
    public int getSemester() {
        return academicTerm != null ? academicTerm.getSemester() : 0;
    }
}
