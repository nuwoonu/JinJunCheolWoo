package com.example.schoolmate.woo.entity;

import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;
import com.example.schoolmate.domain.term.entity.CourseSection;

import jakarta.persistence.*;
import lombok.*;

// [woo] 분반별 성적 비율 설정 (중간고사/기말고사/퀴즈/과제 비율)
@Entity
@Table(name = "section_ratios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SectionRatio extends SchoolBaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_section_id", nullable = false, unique = true)
    private CourseSection section;

    // [woo] 각 시험 유형별 비율 (기본값: 중간50 + 기말50)
    @Column(nullable = false)
    @Builder.Default
    private int midtermRatio = 50;

    @Column(nullable = false)
    @Builder.Default
    private int finalRatio = 50;

    @Column(nullable = false)
    @Builder.Default
    private int quizRatio = 0;

    @Column(nullable = false)
    @Builder.Default
    private int homeworkRatio = 0;
}
