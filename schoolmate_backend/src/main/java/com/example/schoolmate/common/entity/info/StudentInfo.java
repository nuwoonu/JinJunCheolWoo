package com.example.schoolmate.common.entity.info;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;
import com.example.schoolmate.cheol.entity.AwardsAndHonors;
import com.example.schoolmate.cheol.entity.BankAccount;
import com.example.schoolmate.cheol.entity.CareerAspiration;
import com.example.schoolmate.cheol.entity.CocurricularActivities;
import com.example.schoolmate.cheol.entity.Dormitory;
import com.example.schoolmate.cheol.entity.Grade;
import com.example.schoolmate.cheol.entity.BehaviorRecord;
import com.example.schoolmate.cheol.entity.BookReport;
import com.example.schoolmate.cheol.entity.MedicalDetails;
import com.example.schoolmate.cheol.entity.VolunteerActivity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.ConstraintMode;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
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
@Table(name = "student_info", uniqueConstraints = {
        @UniqueConstraint(name = "uk_student_code_school", columnNames = { "code", "school_id" })
})
@DiscriminatorValue("STUDENT")
@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = { "assignments", "familyRelations", "currentAssignment" })
public class StudentInfo extends SchoolMemberInfo {
    // FK 제약조건 없음: StudentAssignment.student_info_id ↔
    // student_info.current_assignment_id 순환 참조 방지
    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "current_assignment_id", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private StudentAssignment currentAssignment;

    // 전체 학번 생성 메서드 (표시용)
    public String getFullStudentNumber() {
        if (currentAssignment == null || currentAssignment.getClassroom() == null) {
            return "-";
        }
        return String.format("%d-%d-%02d",
                currentAssignment.getGrade(),
                currentAssignment.getClassNum(),
                currentAssignment.getAttendanceNum());
        // 예: "1-3-05" (1학년 3반 5번)
    }

    @Enumerated(EnumType.STRING)
    private StudentStatus status = StudentStatus.ENROLLED;

    // school 필드는 SchoolMemberInfo에서 상속 (중복 선언 제거)

    // 학년별 이력 정보 리스트 (최신순 정렬 등 활용)
    @OneToMany(mappedBy = "studentInfo", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StudentAssignment> assignments = new ArrayList<>();

    // [수정] 학부모와의 다중 관계를 위한 리스트
    @OneToMany(mappedBy = "studentInfo", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FamilyRelation> familyRelations = new ArrayList<>();

    // 행동 특성 및 종합의견 (학년/학기별)
    @OneToMany(mappedBy = "student")
    private List<BehaviorRecord> behaviorRecords = new ArrayList<>();

    // 창의적 체험 활동 (학년/학기별)
    @OneToMany(mappedBy = "student")
    private List<CocurricularActivities> cocurricularActivities = new ArrayList<>();

    /**
     * 가장 최근 학적 이력 가져오기
     */
    public Optional<StudentAssignment> getLatestAssignment() {
        return assignments.stream()
                .max(Comparator.comparingInt(StudentAssignment::getSchoolYear));
    }

    // 의료기록
    @OneToMany(mappedBy = "studentInfo")
    private List<MedicalDetails> medicalDetails = new ArrayList<>();

    // 진로희망
    @OneToMany(mappedBy = "student")
    private List<CareerAspiration> careerAspirations = new ArrayList<>();

    // 납부 계좌 (학부모가 등록한 계좌)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_account_id", nullable = true)
    private BankAccount bankAccount;

    // 봉사활동
    @OneToMany(mappedBy = "studentInfo")
    private List<VolunteerActivity> volunteerActivities = new ArrayList<>();

    // 독서록
    @OneToMany(mappedBy = "studentInfo")
    private List<BookReport> bookReports = new ArrayList<>();

    // 수상이력
    @OneToMany(mappedBy = "studentInfo")
    private List<AwardsAndHonors> awardsAndHonors = new ArrayList<>();

    // 성적
    @OneToMany(mappedBy = "student")
    private List<Grade> grades = new ArrayList<>();

    // 기숙사
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dormitory_id", nullable = true)
    private Dormitory dormitory; // null 허용 (기숙사 미배정 학생 존재)

    // 기숙사 배정
    public void assignDormitory(Dormitory dormitory) {
        // 기존 기숙사에서 제거
        if (this.dormitory != null) {
            this.dormitory.getStudents().remove(this);
        }
        this.dormitory = dormitory;

        // 새 기숙사에 추가
        if (dormitory != null && !dormitory.getStudents().contains(this)) {
            dormitory.getStudents().add(this);
        }
    }

    // 기숙사 배정 해제
    public void removeDormitory() {
        if (this.dormitory != null) {
            this.dormitory.getStudents().remove(this);
            this.dormitory = null;
        }
    }

    // 기숙사 배정 여부 확인
    public boolean hasDormitory() {
        return this.dormitory != null;
    }
}