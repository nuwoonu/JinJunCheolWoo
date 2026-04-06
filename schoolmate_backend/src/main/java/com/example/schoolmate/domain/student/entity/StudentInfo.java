package com.example.schoolmate.domain.student.entity;

import com.example.schoolmate.domain.parent.entity.FamilyRelation;
import com.example.schoolmate.global.entity.SchoolMemberInfo;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import com.example.schoolmate.domain.student.entity.constant.StudentStatus;
import com.example.schoolmate.domain.term.entity.SchoolYearStatus;
import com.example.schoolmate.domain.term.entity.AcademicTermStatus;
import com.example.schoolmate.domain.studentrecord.awards.entity.AwardsAndHonors;
import com.example.schoolmate.domain.finance.entity.BankAccount;
import com.example.schoolmate.domain.studentrecord.career.entity.CareerAspiration;
import com.example.schoolmate.domain.studentrecord.cocurricular.entity.CocurricularActivities;
import com.example.schoolmate.domain.dormitory.entity.DormitoryAssignment;
import com.example.schoolmate.domain.grade.entity.Grade;
import com.example.schoolmate.domain.studentrecord.behavior.entity.BehaviorRecord;
import com.example.schoolmate.domain.studentrecord.bookreport.entity.BookReport;
import com.example.schoolmate.domain.studentrecord.medical.entity.MedicalDetails;
import com.example.schoolmate.domain.studentrecord.volunteer.entity.VolunteerActivity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
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
@ToString(exclude = { "assignments", "familyRelations" })
public class StudentInfo extends SchoolMemberInfo {

    // 동적 프로퍼티: 현재 학년도(CURRENT) 배정 이력을 가져옵니다.
    public StudentAssignment getCurrentAssignment() {
        return assignments.stream()
                .filter(a -> a.getSchoolYear() != null
                        && a.getSchoolYear().getStatus() == SchoolYearStatus.CURRENT)
                .findFirst()
                .orElse(null);
    }

    // 전체 학번 생성 메서드 (표시용)
    public String getFullStudentNumber() {
        StudentAssignment currentAssignment = getCurrentAssignment();
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

    // 학적사항 추가 필드
    @Column(name = "previous_school_name")
    private String previousSchoolName; // 이전 학교명

    @Column(name = "admission_date")
    private java.time.LocalDate admissionDate; // 입학일

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
                .max(Comparator.comparingInt(StudentAssignment::getSchoolYearInt));
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

    // 학기별 기숙사 배정 이력
    @OneToMany(mappedBy = "studentInfo", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DormitoryAssignment> dormitoryAssignments = new ArrayList<>();

    // ── 편의 메서드: basicHabits, specialNotes (현재 학년도 기준) ──

    public String getBasicHabits() {
        StudentAssignment current = getCurrentAssignment();
        return current != null ? current.getBasicHabits() : null;
    }

    public void setBasicHabits(String basicHabits) {
        StudentAssignment current = getCurrentAssignment();
        if (current != null) {
            current.setBasicHabits(basicHabits);
        }
    }

    public String getSpecialNotes() {
        StudentAssignment current = getCurrentAssignment();
        return current != null ? current.getSpecialNotes() : null;
    }

    public void setSpecialNotes(String specialNotes) {
        StudentAssignment current = getCurrentAssignment();
        if (current != null) {
            current.setSpecialNotes(specialNotes);
        }
    }

    // ── 편의 메서드: 기숙사 (현재 학기 기준) ──

    public DormitoryAssignment getCurrentDormitoryAssignment() {
        return dormitoryAssignments.stream()
                .filter(da -> da.getAcademicTerm() != null
                        && da.getAcademicTerm().getStatus() == AcademicTermStatus.ACTIVE)
                .findFirst()
                .orElse(null);
    }
}