package com.example.schoolmate.cheol.entity;

import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;
import com.example.schoolmate.domain.term.entity.AcademicTerm;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 학기별 기숙사 배정 엔티티
 *
 * 학생의 기숙사 배정을 학기(AcademicTerm) 단위로 관리합니다.
 * - 학기마다 기숙사 재배정이 이루어지므로 AcademicTerm을 FK로 참조
 * - 한 학생은 한 학기에 하나의 침대만 배정 가능 (unique constraint)
 */
@Entity
@Table(name = "dormitory_assignment", uniqueConstraints = {
        @UniqueConstraint(name = "uk_student_term", columnNames = {"student_info_id", "academic_term_id"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DormitoryAssignment extends SchoolBaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_info_id", nullable = false)
    private StudentInfo studentInfo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_term_id", nullable = false)
    private AcademicTerm academicTerm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dormitory_id", nullable = false)
    private Dormitory dormitory;
}
