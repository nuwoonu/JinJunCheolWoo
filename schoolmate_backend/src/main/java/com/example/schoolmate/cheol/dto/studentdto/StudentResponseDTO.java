package com.example.schoolmate.cheol.dto.studentdto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import com.example.schoolmate.cheol.entity.AwardsAndHonors;
import com.example.schoolmate.cheol.entity.MedicalDetails;
import com.example.schoolmate.common.entity.info.FamilyRelation;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;
import com.example.schoolmate.common.entity.user.constant.AchievementsGrade;
import com.example.schoolmate.common.entity.user.constant.Gender;

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

    private String fullStudentNumber; // "1-3-05" 형식

    private String studentCode; // 고유 학번

    private LocalDate birthDate;

    private String address;

    private String addressDetail;

    private String phone;

    private Gender gender;

    // 기초 생활 기록
    private String basicHabits;

    // 특이사항
    private String specialNotes;

    private StudentStatus status;

    private LocalDateTime createdDate;

    private LocalDateTime modifiedDate;

    // medical
    private String BloodGroup;
    private Double Height;
    private Double Weight;

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
                    .phone(relation.getParentInfo().getPhoneNumber())
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
                .basicHabits(student.getBasicHabits())
                .specialNotes(student.getSpecialNotes())
                .status(student.getStatus());

        if (assignment != null && assignment.getClassroom() != null) {
            builder.year(assignment.getClassroom().getGrade())
                    .classNum(assignment.getClassroom().getClassNum());
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

        return builder.build();
    }
}
