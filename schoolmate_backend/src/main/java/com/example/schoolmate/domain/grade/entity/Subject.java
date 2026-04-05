package com.example.schoolmate.domain.grade.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;

@Getter
@SuperBuilder
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "subject", uniqueConstraints = {
        @UniqueConstraint(name = "uk_subject_code_school", columnNames = {"code", "school_id"})
})
public class Subject extends SchoolBaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String code; // 과목 코드 (예: MATH01, MATH02)

    @Column(nullable = false)
    private String name; // 과목명 (예: 1학년 수학, 2학년 수학)
}
