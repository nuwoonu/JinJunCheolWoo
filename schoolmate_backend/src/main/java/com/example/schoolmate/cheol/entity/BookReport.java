package com.example.schoolmate.cheol.entity;

import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.user.constant.Semester;
import com.example.schoolmate.common.entity.user.constant.Year;
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
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "book_reports")
@Getter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "studentInfo")
public class BookReport extends SchoolBaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Year year; // 학년 (FIRST, SECOND, THIRD)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Semester semester; // 학기 (FIRST, FALL)

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content; // 독서 감상문 내용

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_info_id", nullable = false)
    private StudentInfo studentInfo;

    public void update(Year year, Semester semester, String content) {
        this.year = year;
        this.semester = semester;
        this.content = content;
    }
}
