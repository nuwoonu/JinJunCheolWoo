package com.example.schoolmate.domain.term.entity;

import com.example.schoolmate.domain.grade.entity.Subject;
import com.example.schoolmate.domain.classroom.entity.Classroom;
import com.example.schoolmate.domain.teacher.entity.TeacherInfo;
import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 수업 분반(강좌) 엔티티
 *
 * 특정 학기(AcademicTerm)에 어떤 교사가 어떤 과목을 어떤 학급에게 가르치는지를 나타냅니다.
 *
 * 역할:
 * - 선생님이 맡은 과목별 과제(Homework) 생성의 기준 단위
 * - 과제 생성 시 해당 Classroom에 속한 학생(StudentAssignment)을 자동으로 찾는 데 사용
 * - 학기별 교사의 강의 이력 기록
 *
 * 예시: "A 선생이 2025년 1학기에 2학년 3반에게 수학을 가르친다"
 */
@Entity
@Table(
    name = "course_section",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"academic_term_id", "subject_code", "classroom_id"})
    }
)
@Getter
@Setter
@NoArgsConstructor
public class CourseSection extends SchoolBaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 소속 학기
     * 이 강좌가 어느 학년도·학기에 개설되었는지를 나타냅니다.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_term_id", nullable = false)
    private AcademicTerm term;

    /** 담당 교사 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_info_id", nullable = false)
    private TeacherInfo teacher;

    /** 과목 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_code", nullable = false)
    private Subject subject;

    /** 수업 대상 학급 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    @Builder
    public CourseSection(AcademicTerm term, TeacherInfo teacher,
                         Subject subject, Classroom classroom) {
        this.term = term;
        this.teacher = teacher;
        this.subject = subject;
        this.classroom = classroom;
    }

    /** 강좌 표시명 (예: "2025학년도 1학기 - 수학 (2학년 3반)") */
    public String getDisplayName() {
        return term.getDisplayName() + " - " + subject.getName()
                + " (" + classroom.getClassName() + ")";
    }
}
