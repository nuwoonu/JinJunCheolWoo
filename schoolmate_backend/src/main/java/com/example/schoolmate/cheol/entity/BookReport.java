package com.example.schoolmate.cheol.entity;

import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;
import com.example.schoolmate.domain.term.entity.AcademicTerm;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "book_reports")
@Getter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "studentInfo")
public class BookReport extends SchoolBaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_term_id")
    private AcademicTerm academicTerm;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content; // 독서 감상문 내용

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_info_id", nullable = false)
    private StudentInfo studentInfo;

    public void update(AcademicTerm academicTerm, String content) {
        this.academicTerm = academicTerm;
        this.content = content;
    }

    /** 학년도 정수값 편의 메서드 */
    public int getSchoolYearInt() {
        return academicTerm != null ? academicTerm.getSchoolYearInt() : 0;
    }

    /** 학기 편의 메서드 */
    public int getSemester() {
        return academicTerm != null ? academicTerm.getSemester() : 0;
    }
}
