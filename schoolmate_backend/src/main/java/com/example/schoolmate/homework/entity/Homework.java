package com.example.schoolmate.homework.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.example.schoolmate.domain.term.entity.CourseSection;
import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * [woo] 과제 엔티티
 * - CourseSection(분반)을 통해 출제 교사·대상 학급·과목·학기 정보를 모두 참조
 */
@Entity
@Table(name = "homework", indexes = {
        @Index(name = "idx_homework_course_section", columnList = "course_section_id"),
        @Index(name = "idx_homework_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Homework extends SchoolBaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 5000)
    private String content;

    // 수업 분반 - 출제 교사·대상 학급·과목·학기 정보를 CourseSection 하나로 참조
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_section_id", nullable = false)
    private CourseSection courseSection;

    // [woo] 과제 상태
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HomeworkStatus status = HomeworkStatus.OPEN;

    // [woo] 마감일
    @Column(nullable = false)
    private LocalDateTime dueDate;

    // [woo] 최대 점수 (기본 100)
    @Builder.Default
    @Column(nullable = false)
    private Integer maxScore = 100;

    // [woo] 교사 첨부파일 (예시파일, 참고자료 등)
    private String attachmentUrl;

    // [woo] 원본 파일명 (다운로드 시 표시용)
    private String attachmentOriginalName;

    // [woo] soft delete
    @Builder.Default
    @Column(nullable = false)
    private boolean isDeleted = false;

    // [woo] 제출 목록 (양방향 관계)
    @Builder.Default
    @OneToMany(mappedBy = "homework", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<HomeworkSubmission> submissions = new ArrayList<>();

    // ========== 편의 메서드 ==========

    public void delete() {
        this.isDeleted = true;
    }

    public void changeStatus(HomeworkStatus status) {
        this.status = status;
    }

    public boolean isOverdue() {
        return LocalDateTime.now().isAfter(dueDate);
    }
}
