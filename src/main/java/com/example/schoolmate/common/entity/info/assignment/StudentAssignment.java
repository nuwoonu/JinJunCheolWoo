package com.example.schoolmate.common.entity.info.assignment;

import java.util.ArrayList;
import java.util.List;

import com.example.schoolmate.common.entity.info.Grade;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.TeacherInfo;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
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
    private Integer grade; // 학년
    private Integer classNum; // 반
    private Integer studentNum; // 번호 (출석번호)

    @Column(nullable = false, unique = true)
    private String code; // 과목 코드

    @Column(nullable = false)
    private String name; // 과목명

    private Integer credits; // 학점

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_uid")
    private TeacherInfo teacher; // 담당 선생님

    // 양방향 연관관계 편의 메서드
    public void setTeacher(TeacherInfo teacher) {
        this.teacher = teacher;
    }

    @OneToMany(mappedBy = "subject", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Grade> grades = new ArrayList<>();

    public StudentAssignment(StudentInfo studentInfo, int schoolYear, Integer grade, Integer classNum,
            Integer studentNum) {
        this.studentInfo = studentInfo;
        this.schoolYear = schoolYear;
        this.grade = grade;
        this.classNum = classNum;
        this.studentNum = studentNum;
    }
}
