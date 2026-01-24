package com.example.schoolmate.soojin.entity;

import com.example.schoolmate.common.entity.BaseEntity;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.soojin.entity.constant.DayOfWeek;

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

@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "teacher")
@Getter
@Table(name = "student_timetable_tbl")
@Entity
public class StudentTimetable extends BaseEntity {

    // # 시간표

    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long id;

    // 연도
    @Column(nullable = false)
    private Integer schoolYear;

    // 학기
    @Column(nullable = false)
    private Integer semester;

    // 학년/반 -> 테이블로
    // @Column(nullable = false)
    // private ;

    // 요일
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DayOfWeek dayOfWeek;

    // 교시(수업 1교시, ...)
    @Column(nullable = false)
    private Integer period;

    // 과목 - 테이블 필요
    // @Column(nullable = false)
    // private ;

    // 수업 담당 교사 - 선택(자습 -> 선생님 X)
    // @ManyToOne(fetch = FetchType.LAZY)
    // @JoinColumn(name = "teacher_info_id")
    // private TeacherInfo teacher;
    // 테스트
}
