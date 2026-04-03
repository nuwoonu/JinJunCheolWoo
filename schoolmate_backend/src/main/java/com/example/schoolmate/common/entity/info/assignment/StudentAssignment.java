package com.example.schoolmate.common.entity.info.assignment;

import com.example.schoolmate.common.entity.Classroom;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.domain.term.entity.SchoolYear;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class StudentAssignment extends SchoolBaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_info_id")
    private StudentInfo studentInfo;

    /** 학년도 FK */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_year_id")
    private SchoolYear schoolYear;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id")
    private Classroom classroom; // 소속 학급

    private Integer attendanceNum; // 번호 (출석번호)

    // 학년도별 기초 생활 기록
    @jakarta.persistence.Column(columnDefinition = "TEXT")
    private String basicHabits;

    // 학년도별 특이사항
    @jakarta.persistence.Column(columnDefinition = "TEXT")
    private String specialNotes;

    @Builder
    public StudentAssignment(StudentInfo studentInfo, SchoolYear schoolYear, Classroom classroom, Integer attendanceNum) {
        this.studentInfo = studentInfo;
        this.schoolYear = schoolYear;
        this.classroom = classroom;
        this.attendanceNum = attendanceNum;
    }

    /** 학년도 정수값 편의 메서드 */
    public int getSchoolYearInt() {
        return schoolYear != null ? schoolYear.getYear() : 0;
    }

    public Integer getGrade() {
        return classroom != null ? classroom.getGrade() : null;
    }

    public Integer getClassNum() {
        return classroom != null ? classroom.getClassNum() : null;
    }
}
