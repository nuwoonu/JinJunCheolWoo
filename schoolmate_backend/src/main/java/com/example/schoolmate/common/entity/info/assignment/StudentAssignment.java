package com.example.schoolmate.common.entity.info.assignment;

import com.example.schoolmate.common.entity.Classroom;
import com.example.schoolmate.common.entity.info.StudentInfo;
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

@Entity
@Getter
@Setter
@NoArgsConstructor
public class StudentAssignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_info_id")
    private StudentInfo studentInfo;

    private int schoolYear; // 학년도 (예: 2025, 2026)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id")
    private Classroom classroom; // 소속 학급

    private Integer attendanceNum; // 번호 (출석번호)

    @Builder
    public StudentAssignment(StudentInfo studentInfo, int schoolYear, Classroom classroom, Integer attendanceNum) {
        this.studentInfo = studentInfo;
        this.schoolYear = schoolYear;
        this.classroom = classroom;
        this.attendanceNum = attendanceNum;
    }

    public Integer getGrade() {
        return classroom != null ? classroom.getGrade() : null;
    }

    public Integer getClassNum() {
        return classroom != null ? classroom.getClassNum() : null;
    }
}
