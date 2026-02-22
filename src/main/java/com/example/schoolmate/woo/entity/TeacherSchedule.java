package com.example.schoolmate.woo.entity;

import java.time.LocalDate;
import java.time.LocalTime;

import com.example.schoolmate.common.entity.BaseEntity;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.soojin.entity.constant.DayOfWeek;
import com.example.schoolmate.woo.entity.constant.RepeatType;

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
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 교사 수업 일정 엔티티
 * - 교사가 직접 설정하는 주간 수업 시간표
 * - 반복 유형: 매주(WEEKLY), 격주(BIWEEKLY), 일회성(ONCE)
 */
@Entity
@Table(name = "teacher_schedule")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherSchedule extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_info_id", nullable = false)
    private TeacherInfo teacher;

    // 요일 (월~금)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DayOfWeek dayOfWeek;

    // 교시 (1교시, 2교시, ...)
    @Column(nullable = false)
    private Integer period;

    // 시작/종료 시간
    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    // 과목명
    @Column(nullable = false, length = 50)
    private String subjectName;

    // 대상 학급 (예: "1학년 2반")
    @Column(length = 50)
    private String className;

    // 장소 (예: "3층 과학실")
    @Column(length = 100)
    private String location;

    // 반복 유형
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RepeatType repeatType = RepeatType.WEEKLY;

    // 일회성(ONCE) 일정의 특정 날짜
    private LocalDate specificDate;

    // 메모
    @Column(length = 200)
    private String memo;
}
