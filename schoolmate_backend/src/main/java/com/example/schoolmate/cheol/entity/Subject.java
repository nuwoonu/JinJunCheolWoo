package com.example.schoolmate.cheol.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;

@Getter
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Subject extends SchoolBaseEntity {
    @Id
    @Column(nullable = false, unique = true)
    private String code; // 과목 코드 (예: MATH01, MATH02)

    @Column(nullable = false)
    private String name; // 과목명 (예: 1학년 수학, 2학년 수학)
}
