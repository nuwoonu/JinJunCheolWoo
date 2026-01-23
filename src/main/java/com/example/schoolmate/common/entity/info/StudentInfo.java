package com.example.schoolmate.common.entity.info;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.OneToMany;
import lombok.Getter;
import lombok.Setter;

@Entity
@DiscriminatorValue("STUDENT")
@Getter
@Setter
public class StudentInfo extends BaseInfo {
    @Enumerated(EnumType.STRING)
    private StudentStatus status = StudentStatus.ENROLLED;

    // 학년별 이력 정보 리스트 (최신순 정렬 등 활용)
    @OneToMany(mappedBy = "studentInfo", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StudentAssignment> assignments = new ArrayList<>();

    // [수정] 학부모와의 다중 관계를 위한 리스트
    @OneToMany(mappedBy = "studentInfo", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FamilyRelation> familyRelations = new ArrayList<>();

    // 기초 생활 기록
    @Column(columnDefinition = "TEXT")
    private String basicHabits;

    // 특이사항
    @Column(columnDefinition = "TEXT")
    private String specialNotes;

    /**
     * 현재 학년도 소속 정보 가져오기 헬퍼 메서드
     */
    public StudentAssignment getCurrentAssignment(int currentYear) {
        return assignments.stream()
                .filter(a -> a.getSchoolYear() == currentYear)
                .findFirst()
                .orElse(null);
    }

    /**
     * 가장 최근 학적 이력 가져오기
     */
    public Optional<StudentAssignment> getLatestAssignment() {
        return assignments.stream()
                .max(Comparator.comparingInt(StudentAssignment::getSchoolYear));
    }
}