package com.example.schoolmate.cheol.dto.studentdto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import com.example.schoolmate.cheol.entity.AwardsAndHonors;
import com.example.schoolmate.cheol.entity.BankAccount;
import com.example.schoolmate.cheol.entity.BehaviorRecord;
import com.example.schoolmate.cheol.entity.CareerAspiration;
import com.example.schoolmate.cheol.entity.CocurricularActivities;
import com.example.schoolmate.cheol.entity.MedicalDetails;
import com.example.schoolmate.cheol.entity.VolunteerActivity;
import com.example.schoolmate.common.entity.info.FamilyRelation;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;
import com.example.schoolmate.common.entity.user.constant.AchievementsGrade;
import com.example.schoolmate.common.entity.user.constant.ActivityCategory;
import com.example.schoolmate.common.entity.user.constant.Gender;
import com.example.schoolmate.common.entity.user.constant.Semester;
import com.example.schoolmate.common.entity.user.constant.Year;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentResponseDTO {

    private Long id; // StudentInfo의 id

    private Long studentNumber;

    private int year;

    private Integer classNum;

    // [soojin] 학생 대시보드에서 반 관련 위젯(공지, 게시판, 학급 목표 등)에 classroomId가 필요하여 추가
    private Long classroomId;

    private String fullStudentNumber; // "1-3-05" 형식

    private String studentCode; // 고유 학번

    private LocalDate birthDate;

    private String address;

    private String addressDetail;

    private String phone;

    private Gender gender;

    // 행동 특성 및 종합의견 (학년/학기별)
    @Builder.Default
    private List<BehaviorRecordInfo> behaviorRecords = new ArrayList<>();

    private StudentStatus status;

    private LocalDateTime createdDate;

    private LocalDateTime modifiedDate;

    // medical
    private String BloodGroup;
    private Double Height;
    private Double Weight;

    // [woo] 소속 학교
    private Long schoolId;
    private String schoolName;

    // User 정보 (연관된 경우)
    private Long userUid;
    private String userName;
    private String userEmail;

    // 학부모/보호자 정보 리스트
    @Builder.Default
    private List<ParentGuardianInfo> guardians = new ArrayList<>();

    // 수상 정보 리스트
    @Builder.Default
    private List<AwardInfo> awards = new ArrayList<>();

    // 진로희망 리스트
    @Builder.Default
    private List<CareerAspirationInfo> careerAspirations = new ArrayList<>();

    // 납부 계좌 정보
    private BankAccountInfo bankAccount;

    // 창의적 체험활동 리스트
    @Builder.Default
    private List<CocurricularActivityInfo> cocurricularActivities = new ArrayList<>();

    // 봉사활동 리스트
    @Builder.Default
    private List<VolunteerActivityInfo> volunteerActivities = new ArrayList<>();

    // 행동 특성 및 종합의견 내부 클래스
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BehaviorRecordInfo {
        private Long id;
        private Year year;
        private Semester semester;
        private String specialNotes;

        public static BehaviorRecordInfo from(BehaviorRecord b) {
            return BehaviorRecordInfo.builder()
                    .id(b.getId())
                    .year(b.getYear())
                    .semester(b.getSemester())
                    .specialNotes(b.getSpecialNotes())
                    .build();
        }
    }

    // 학부모/보호자 정보 내부 클래스
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParentGuardianInfo {
        private Long id;
        private String name;
        private String phone;
        private String email;
        private String relationship; // "부", "모" 등
        private String relationshipCode; // "FATHER", "MOTHER" 등
        private boolean representative; // 주 보호자 여부

        public static ParentGuardianInfo from(FamilyRelation relation) {
            return ParentGuardianInfo.builder()
                    .id(relation.getParentInfo().getId())
                    .name(relation.getParentInfo().getParentName())
                    .phone(relation.getParentInfo().getPhone())
                    .email(relation.getParentInfo().getUser() != null
                            ? relation.getParentInfo().getUser().getEmail()
                            : null)
                    .relationship(relation.getRelationship().getDescription())
                    .relationshipCode(relation.getRelationship().name())
                    .representative(relation.isRepresentative())
                    .build();
        }
    }

    // 수상 정보 내부 클래스
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AwardInfo {
        private Long id;
        private String name; // 수상명
        private AchievementsGrade achievementsGrade; // 등급
        private LocalDate day; // 수상연월일
        private String organization; // 수상기관

        public static AwardInfo from(AwardsAndHonors award) {
            return AwardInfo.builder()
                    .id(award.getId())
                    .name(award.getName())
                    .achievementsGrade(award.getAchievementsGrade())
                    .day(award.getDay())
                    .organization(award.getAwardingOrganization())
                    .build();
        }
    }

    // 진로희망 정보 내부 클래스
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CareerAspirationInfo {
        private Long id;
        private Year year;
        private Semester semester;
        private String specialtyOrInterest;
        private String studentDesiredJob;
        private String parentDesiredJob;
        private String preparationPlan;
        private String notes;

        public static CareerAspirationInfo from(CareerAspiration ca) {
            return CareerAspirationInfo.builder()
                    .id(ca.getId())
                    .year(ca.getYear())
                    .semester(ca.getSemester())
                    .specialtyOrInterest(ca.getSpecialtyOrInterest())
                    .studentDesiredJob(ca.getStudentDesiredJob())
                    .parentDesiredJob(ca.getParentDesiredJob())
                    .preparationPlan(ca.getPreparationPlan())
                    .notes(ca.getNotes())
                    .build();
        }
    }

    // 납부 계좌 정보 내부 클래스
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BankAccountInfo {
        private Long id;
        private String bankName;
        private String accountNumber;
        private String accountHolderName;
        private String notes;

        public static BankAccountInfo from(BankAccount ba) {
            return BankAccountInfo.builder()
                    .id(ba.getId())
                    .bankName(ba.getBankName())
                    .accountNumber(ba.getAccountNumber())
                    .accountHolderName(ba.getAccountHolderName())
                    .notes(ba.getNotes())
                    .build();
        }
    }

    // 창의적 체험활동 정보 내부 클래스
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CocurricularActivityInfo {
        private Long id;
        private Year year;
        private ActivityCategory category;
        private String specifics;

        public static CocurricularActivityInfo from(CocurricularActivities c) {
            return CocurricularActivityInfo.builder()
                    .id(c.getId())
                    .year(c.getYear())
                    .category(c.getCategory())
                    .specifics(c.getSpecifics())
                    .build();
        }
    }

    // 봉사활동 정보 내부 클래스
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VolunteerActivityInfo {
        private Long id;
        private Year year;
        private LocalDate startDate;
        private LocalDate endDate;
        private String organizer;
        private String activityContent;
        private Double hours;
        private Double cumulativeHours;

        public static VolunteerActivityInfo from(VolunteerActivity va) {
            return VolunteerActivityInfo.builder()
                    .id(va.getId())
                    .year(va.getYear())
                    .startDate(va.getStartDate())
                    .endDate(va.getEndDate())
                    .organizer(va.getOrganizer())
                    .activityContent(va.getActivityContent())
                    .hours(va.getHours())
                    .cumulativeHours(va.getCumulativeHours())
                    .build();
        }
    }

    // Entity -> DTO 변환 (정적 팩토리 메서드 + Builder)
    public static StudentResponseDTO from(StudentInfo student) {
        var assignment = student.getCurrentAssignment();

        StudentResponseDTOBuilder builder = StudentResponseDTO.builder()
                .id(student.getId())
                .studentNumber(assignment != null ? Long.valueOf(assignment.getAttendanceNum()) : null)
                .fullStudentNumber(student.getFullStudentNumber())
                .studentCode(student.getCode())
                .birthDate(student.getBirthDate())
                .address(student.getAddress())
                .addressDetail(student.getAddressDetail())
                .phone(student.getPhone())
                .gender(student.getGender())
                .status(student.getStatus());

        // 행동 특성 및 종합의견 매핑 (학년/학기 오름차순)
        if (student.getBehaviorRecords() != null && !student.getBehaviorRecords().isEmpty()) {
            List<BehaviorRecordInfo> brList = student.getBehaviorRecords().stream()
                    .sorted(Comparator.comparing(BehaviorRecord::getYear)
                            .thenComparing(BehaviorRecord::getSemester))
                    .map(BehaviorRecordInfo::from)
                    .toList();
            builder.behaviorRecords(brList);
        }

        if (assignment != null && assignment.getClassroom() != null) {
            builder.year(assignment.getClassroom().getGrade())
                    .classNum(assignment.getClassroom().getClassNum())
                    // [soojin] 프론트 대시보드 위젯에서 classroomId를 사용하므로 cid 매핑 추가
                    .classroomId(assignment.getClassroom().getCid());
        }
        // 의료 정보 매핑 (가장 최근 기록)
        if (student.getMedicalDetails() != null && !student.getMedicalDetails().isEmpty()) {
            MedicalDetails medical = student.getMedicalDetails().stream()
                    .max(Comparator.comparing(MedicalDetails::getCreateDate))
                    .orElse(null);
            if (medical != null) {
                builder.BloodGroup(medical.getBloodGroup())
                        .Height(medical.getHeight())
                        .Weight(medical.getWeight());
            }
        }

        // 수상 정보 매핑 (전체 리스트, 최신순 정렬)
        if (student.getAwardsAndHonors() != null && !student.getAwardsAndHonors().isEmpty()) {
            List<AwardInfo> awardList = student.getAwardsAndHonors().stream()
                    .sorted(Comparator.comparing(AwardsAndHonors::getDay).reversed())
                    .map(AwardInfo::from)
                    .toList();
            builder.awards(awardList);
        }
        // [woo] 소속 학교 매핑
        if (student.getSchool() != null) {
            builder.schoolId(student.getSchool().getId())
                    .schoolName(student.getSchool().getName());
        }

        if (student.getUser() != null) {
            builder.userUid(student.getUser().getUid())
                    .userName(student.getUser().getName())
                    .userEmail(student.getUser().getEmail());
        }

        // 학부모/보호자 정보 매핑
        if (student.getFamilyRelations() != null && !student.getFamilyRelations().isEmpty()) {
            List<ParentGuardianInfo> guardianList = student.getFamilyRelations().stream()
                    .filter(r -> r.getParentInfo() != null)
                    .map(ParentGuardianInfo::from)
                    .toList();
            builder.guardians(guardianList);
        }

        // 진로희망 매핑 (학년/학기 오름차순 정렬)
        if (student.getCareerAspirations() != null && !student.getCareerAspirations().isEmpty()) {
            List<CareerAspirationInfo> caList = student.getCareerAspirations().stream()
                    .sorted(Comparator.comparing(CareerAspiration::getYear)
                            .thenComparing(CareerAspiration::getSemester))
                    .map(CareerAspirationInfo::from)
                    .toList();
            builder.careerAspirations(caList);
        }

        // 납부 계좌 매핑
        if (student.getBankAccount() != null) {
            builder.bankAccount(BankAccountInfo.from(student.getBankAccount()));
        }

        // 창의적 체험활동 매핑 (학년 → 카테고리 오름차순 정렬)
        if (student.getCocurricularActivities() != null && !student.getCocurricularActivities().isEmpty()) {
            List<CocurricularActivityInfo> ccList = student.getCocurricularActivities().stream()
                    .sorted(Comparator.comparing(CocurricularActivities::getYear)
                            .thenComparing(CocurricularActivities::getCategory))
                    .map(CocurricularActivityInfo::from)
                    .toList();
            builder.cocurricularActivities(ccList);
        }

        // 봉사활동 매핑 (학년 → 시작일 오름차순 정렬)
        if (student.getVolunteerActivities() != null && !student.getVolunteerActivities().isEmpty()) {
            List<VolunteerActivityInfo> vaList = student.getVolunteerActivities().stream()
                    .sorted(Comparator.comparing(VolunteerActivity::getYear)
                            .thenComparing(VolunteerActivity::getStartDate))
                    .map(VolunteerActivityInfo::from)
                    .toList();
            builder.volunteerActivities(vaList);
        }

        return builder.build();
    }
}
