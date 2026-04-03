package com.example.schoolmate.cheol.entity;

import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.user.constant.Semester;
import com.example.schoolmate.common.entity.user.constant.Year;

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
import lombok.experimental.SuperBuilder;

// [cheol] 행동 특성 및 종합의견 - 학년/학기별 관리
@Entity
@Getter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Table(name = "behavior_records")
public class BehaviorRecord extends SchoolBaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Year year;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Semester semester;

    @Column(columnDefinition = "TEXT")
    private String specialNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private StudentInfo student;

    public void update(String specialNotes) {
        this.specialNotes = specialNotes;
    }
}
