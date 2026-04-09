package com.example.schoolmate.domain.dailysummary.entity;

// [woo] 교사가 학생에 대해 하루 한 번 태그로 남기는 일일 메모
// 강제 아님 - 선택사항. 태그 없으면 자동 수집 데이터(출결/과제/퀴즈)만으로 요약 생성

import java.time.LocalDate;

import com.example.schoolmate.domain.student.entity.StudentInfo;
import com.example.schoolmate.global.entity.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "daily_note",
        uniqueConstraints = @UniqueConstraint(columnNames = {"student_info_id", "note_date"}),
        indexes = @Index(name = "idx_daily_note_student_date", columnList = "student_info_id, note_date"))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyNote extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_info_id", nullable = false)
    private StudentInfo student;

    @Column(nullable = false)
    private LocalDate noteDate;

    // [woo] 선택된 태그 목록 (쉼표 구분 저장: "집중함,발표 적극적,친구관계 좋음")
    @Column(length = 500)
    private String tags;

    // [woo] 추가 메모 (선택, 태그로 표현 안 되는 내용)
    @Column(length = 500)
    private String memo;
}
