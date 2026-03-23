package com.example.schoolmate.soojin.entity;

import com.example.schoolmate.domain.term.entity.AcademicTerm;
import com.example.schoolmate.domain.term.entity.CourseSection;
import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;
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
import lombok.Setter;
import lombok.ToString;

/**
 * 학생 시간표 엔티티
 *
 * 특정 학기(AcademicTerm)의 요일·교시별 수업 배치를 기록합니다.
 * CourseSection을 통해 담당 교사·과목 정보를 연결합니다.
 */
@NoArgsConstructor
@AllArgsConstructor
@ToString
@Getter
@Setter
@Table(name = "student_timetable_tbl")
@Entity
public class StudentTimetable extends SchoolBaseEntity {

    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long id;

    /**
     * [joon]
     * 소속 학기 (기존 schoolYear + semester 대체)
     * 이 시간표가 어느 학년도·학기에 속하는지를 나타냅니다.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_term_id", nullable = false)
    private AcademicTerm term;

    /**
     * [joon]
     * 수업 분반 (담당 교사 + 과목 정보 포함)
     * 자습 등 담당 교사가 없는 경우 null 허용
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_section_id")
    private CourseSection courseSection;

    /** 요일 */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DayOfWeek dayOfWeek;

    /** 교시 (1교시, 2교시 ...) */
    @Column(nullable = false)
    private Integer period;
}
