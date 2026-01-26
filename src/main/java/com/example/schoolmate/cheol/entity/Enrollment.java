package com.example.schoolmate.cheol.entity;

import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.user.constant.Semester;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@ToString(exclude = { "studentInfo", "teacherInfo", "subject" })
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private Semester semester;

    @ManyToOne(fetch = FetchType.LAZY)
    private StudentInfo studentInfo;

    @ManyToOne(fetch = FetchType.LAZY)
    private TeacherInfo teacherInfo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_code")
    private Subject subject;

}
