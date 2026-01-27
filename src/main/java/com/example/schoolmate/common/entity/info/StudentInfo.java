package com.example.schoolmate.common.entity.info;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;
import com.example.schoolmate.common.entity.user.constant.Gender;
import com.example.schoolmate.common.entity.Classroom;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/**
 * 학생 상세 정보 엔티티
 * 
 * 학생 고유의 학적 정보를 관리합니다.
 * - 학번(studentNumber), 생년월일, 주소, 연락처
 * - 학적 상태(재학, 휴학 등) 및 학급 배정 이력(assignments)
 */
@Entity
@DiscriminatorValue("STUDENT")
@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = { "assignments", "familyRelations" })
public class StudentInfo extends BaseInfo {
    @Column(nullable = true)
    private Long studentNumber; // 학번

    private LocalDate birthDate; // 생일

    private String address; // 주소

    private String phone; // 연락처

    @Enumerated(EnumType.STRING)
    private Gender gender;

    @ManyToOne(fetch = FetchType.LAZY)
    private Classroom classroom;

    // 전체 학번 생성 메서드 (표시용)
    public String getFullStudentNumber() {
        if (classroom == null || studentNumber == null) {
            return "-";
        }
        return String.format("%d-%d-%02d", classroom.getYear(), classroom.getClassNum(), studentNumber);
        // 예: "1-3-05" (1학년 3반 5번)
    }

    public void changeAddress(String address) {
        this.address = address;
    }

    public void changePhone(String phone) {
        this.phone = phone;
    }

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