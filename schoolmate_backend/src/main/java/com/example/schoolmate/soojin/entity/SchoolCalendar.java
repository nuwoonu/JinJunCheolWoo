package com.example.schoolmate.soojin.entity;

import java.time.LocalDate;

import com.example.schoolmate.common.entity.BaseEntity;
import com.example.schoolmate.soojin.entity.constant.EventType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
@Getter
@Table(name = "school_calendar_tbl")
@Entity
public class SchoolCalendar extends BaseEntity {

    // # 학사 일정

    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long id;

    // 일정 타이틀
    @Column(nullable = false)
    private String title;

    // 시작일
    @Column(nullable = false)
    private LocalDate startDate;

    // 종료일 (당일 행사는 종료일 null 가능)
    private LocalDate endDate;

    // 일정 유형
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private EventType eventType;

    // 대상 학년 (null - 전체)
    private Integer targetGrade;

    // 일정 상세 설명 (null 가능)
    @Column(length = 1000)
    private String description;

    // 일정 수정용
    public void changeTitle(String title) {
        this.title = title;
    }

    public void changeStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public void changeEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public void changeEventType(EventType eventType) {
        this.eventType = eventType;
    }

    public void changeTargetGrade(Integer targetGrade) {
        this.targetGrade = targetGrade;
    }

    public void changeDescription(String description) {
        this.description = description;
    }

    public void update(String title, LocalDate startDate, LocalDate endDate, EventType eventType, Integer targetGrade,
            String description) {
        this.title = title;
        this.startDate = startDate;
        this.endDate = endDate;
        this.eventType = eventType;
        this.targetGrade = targetGrade;
        this.description = description;
    }

}
