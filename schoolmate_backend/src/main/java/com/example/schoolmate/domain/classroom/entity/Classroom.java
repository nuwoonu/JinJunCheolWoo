package com.example.schoolmate.domain.classroom.entity;

import com.example.schoolmate.domain.classroom.entity.constant.ClassroomStatus;
import com.example.schoolmate.domain.teacher.entity.TeacherInfo;
import com.example.schoolmate.domain.user.entity.User;
import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;
import com.example.schoolmate.domain.term.entity.SchoolYear;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/**
 * 학급(반) 정보 엔티티
 *
 * 특정 학년도의 학급 구성 정보를 관리합니다.
 * - 학년도(SchoolYear FK), 학년, 반 번호, 담임 교사 및 소속 학생들
 */
@Entity
@Table(name = "classroom", uniqueConstraints = {
        @UniqueConstraint(name = "uk_classroom_school_year_grade_classnum", columnNames = { "school_year_id", "grade", "class_num" })
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"teacher", "homeroomTeacher", "viceTeacher"})
public class Classroom extends SchoolBaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cid;

    /** 학년도 FK */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_year_id")
    private SchoolYear schoolYear;

    private int grade; // 학년 (1~6)
    private int classNum; // 반 번호

    // 기존 User 연결 (유지)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uid") // 담임 교사(User)의 uid를 FK로 사용
    private User teacher; // Teacher 대신 User 사용

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private ClassroomStatus status = ClassroomStatus.ACTIVE;

    // ========== 담임 교사 연결 (추가) ==========
    // 한 학급에 담임 한 명, 교사는 여러 해에 걸쳐 담임 가능하므로 ManyToOne
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "homeroom_teacher_id")
    private TeacherInfo homeroomTeacher;

    // 부담임 (선택)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vice_teacher_id")
    private TeacherInfo viceTeacher;

    // ========== 편의 메서드 ==========

    /** 학년도 정수값 (하위 호환용) */
    public int getYear() {
        return schoolYear != null ? schoolYear.getYear() : 0;
    }

    // 학급명 (ex: "2025학년도 3학년 2반")
    public String getClassName() {
        return getYear() + "학년도 " + grade + "학년 " + classNum + "반";
    }
}
