package com.example.schoolmate.parkjoon.entity;

import java.util.ArrayList;
import java.util.List;

import com.example.schoolmate.common.entity.BaseEntity;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.user.User;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "classroom", uniqueConstraints = {
    // 같은 연도에 같은 학년 같은 반이 중복되면 안됨
    @UniqueConstraint(columnNames = {"year", "grade", "class_num"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Classroom extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cid;

    private int year;      // 학년도 (2025, 2026...)
    private int grade;     // 학년 (1~6)
    private int classNum;  // 반 번호

    // 기존 User 연결 (유지)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uid")
    private User teacher;

    // ========== 담임 교사 연결 (추가) ==========
    // 한 학급에 담임 한 명, 교사는 여러 해에 걸쳐 담임 가능하므로 ManyToOne
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "homeroom_teacher_id")
    private TeacherInfo homeroomTeacher;

    // 부담임 (선택)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vice_teacher_id")
    private TeacherInfo viceTeacher;

    // ========== 이 반 학생들 ==========
    @OneToMany(mappedBy = "classroom")
    @Builder.Default
    private List<StudentInfo> students = new ArrayList<>();

    // ========== 편의 메서드 ==========

    // 학급명 (ex: "2025학년도 3학년 2반")
    public String getClassName() {
        return year + "학년도 " + grade + "학년 " + classNum + "반";
    }

    // 학생 수
    public int getStudentCount() {
        return students != null ? students.size() : 0;
    }
}