package com.example.schoolmate.common.dto;

import com.example.schoolmate.common.entity.info.SchoolMemberInfo;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.StaffInfo;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 전입 처리 DTO
 *
 * 관리자가 학생/교사/교직원을 다른 학교로 전입시킬 때 사용합니다.
 */
public class TransferDTO {

    /** 전입 대상 검색 결과 항목 */
    @Getter
    @Setter
    @NoArgsConstructor
    public static class MemberSummary {
        private Long infoId;       // SchoolMemberInfo ID
        private Long uid;          // User ID
        private String name;
        private String email;
        private String code;       // 학번 / 사번
        private String role;       // STUDENT | TEACHER | STAFF
        private String status;     // 현재 상태 (ENROLLED, EMPLOYED 등)
        private String schoolName;
        private Long schoolId;

        public static MemberSummary from(StudentInfo info) {
            MemberSummary dto = new MemberSummary();
            dto.infoId = info.getId();
            dto.uid = info.getUser().getUid();
            dto.name = info.getUser().getName();
            dto.email = info.getUser().getEmail();
            dto.code = info.getCode();
            dto.role = "STUDENT";
            dto.status = info.getStatus() != null ? info.getStatus().name() : null;
            dto.schoolName = info.getSchool() != null ? info.getSchool().getName() : null;
            dto.schoolId = info.getSchool() != null ? info.getSchool().getId() : null;
            return dto;
        }

        public static MemberSummary from(TeacherInfo info) {
            MemberSummary dto = new MemberSummary();
            dto.infoId = info.getId();
            dto.uid = info.getUser().getUid();
            dto.name = info.getUser().getName();
            dto.email = info.getUser().getEmail();
            dto.code = info.getCode();
            dto.role = "TEACHER";
            dto.status = info.getStatus() != null ? info.getStatus().name() : null;
            dto.schoolName = info.getSchool() != null ? info.getSchool().getName() : null;
            dto.schoolId = info.getSchool() != null ? info.getSchool().getId() : null;
            return dto;
        }

        public static MemberSummary from(StaffInfo info) {
            MemberSummary dto = new MemberSummary();
            dto.infoId = info.getId();
            dto.uid = info.getUser().getUid();
            dto.name = info.getUser().getName();
            dto.email = info.getUser().getEmail();
            dto.code = info.getCode();
            dto.role = "STAFF";
            dto.status = info.getStatus() != null ? info.getStatus().name() : null;
            dto.schoolName = info.getSchool() != null ? info.getSchool().getName() : null;
            dto.schoolId = info.getSchool() != null ? info.getSchool().getId() : null;
            return dto;
        }
    }

    /** 전입 실행 요청 */
    @Getter
    @Setter
    @NoArgsConstructor
    public static class TransferRequest {
        /** 전출 대상의 SchoolMemberInfo ID */
        private Long sourceInfoId;
        /** 역할 유형: STUDENT | TEACHER | STAFF */
        private String role;
        /** 전입할 학교 ID */
        private Long targetSchoolId;
    }

    /** 전입 처리 결과 응답 */
    @Getter
    @Setter
    @NoArgsConstructor
    public static class TransferResult {
        private String name;
        private String fromSchoolName;
        private String toSchoolName;
        private String role;
        private Long newInfoId;
    }
}
