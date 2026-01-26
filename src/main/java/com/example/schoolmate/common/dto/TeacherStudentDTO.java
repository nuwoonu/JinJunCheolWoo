package com.example.schoolmate.common.dto;

import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.assignment.TeacherStudent;
import com.example.schoolmate.common.entity.info.constant.TeacherRole;
import com.example.schoolmate.common.entity.user.User;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * 교사-학생 관계 DTO 모음
 *
 * 교사-학생 배정 생성, 조회, 수정에 필요한 DTO 클래스들을 정의함.
 */
public class TeacherStudentDTO {

    // ==================== 요청용 DTO ====================

    /**
     * 교사-학생 관계 생성 요청
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssignRequest {
        private Long teacherInfoId; // 교사 Info ID
        private Long studentInfoId; // 학생 Info ID
        private int schoolYear; // 학년도
        private String roleName; // TeacherRole enum name (HOMEROOM, SUBJECT 등)
        private String subjectName; // 교과담당인 경우 과목명
    }

    /**
     * 다수 학생 일괄 배정 요청 (담임 배정 등)
     */
    @Getter
    @Setter
    @NoArgsConstructor
    public static class BulkAssignRequest {
        private Long teacherInfoId; // 교사 Info ID
        private List<Long> studentInfoIds; // 학생 Info ID 목록
        private int schoolYear; // 학년도
        private String roleName; // TeacherRole enum name
    }

    /**
     * 교사-학생 관계 삭제 요청
     */
    @Getter
    @Setter
    @NoArgsConstructor
    public static class RemoveRequest {
        private Long teacherInfoId;
        private Long studentInfoId;
        private int schoolYear;
        private String roleName;
    }

    // ==================== 응답용 DTO ====================

    /**
     * 교사가 담당하는 학생 정보 (교사 화면용)
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssignedStudentResponse {
        private Long relationId; // TeacherStudent ID
        private Long studentInfoId; // 학생 Info ID
        private Long studentUid; // 학생 User ID
        private String studentName; // 학생 이름
        private String studentCode; // 고유학번
        private int schoolYear;
        private String roleName; // HOMEROOM, SUBJECT 등
        private String roleDesc; // 담임교사, 교과담당 등
        private String subjectName; // 교과담당인 경우 과목명
        private String classInfo; // 학년-반-번호 (예: "2-3-15")

        public AssignedStudentResponse(TeacherStudent ts) {
            this.relationId = ts.getId();
            this.schoolYear = ts.getSchoolYear();
            this.roleName = ts.getRole().name();
            this.roleDesc = ts.getRole().getDescription();
            this.subjectName = ts.getSubjectName();

            StudentInfo si = ts.getStudentInfo();
            if (si != null) {
                this.studentInfoId = si.getId();
                this.studentCode = si.getCode();

                User user = si.getUser();
                if (user != null) {
                    this.studentUid = user.getUid();
                    this.studentName = user.getName();
                }

                // 해당 학년도의 학급 정보 추출
                var assignment = si.getCurrentAssignment(ts.getSchoolYear());
                if (assignment != null) {
                    this.classInfo = String.format("%d-%d-%d",
                            assignment.getGrade(),
                            assignment.getClassNum(),
                            assignment.getStudentNum());
                }
            }
        }
    }

    /**
     * 학생에게 배정된 교사 정보 (학생 화면용)
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssignedTeacherResponse {
        private Long relationId; // TeacherStudent ID
        private Long teacherInfoId; // 교사 Info ID
        private Long teacherUid; // 교사 User ID
        private String teacherName; // 교사 이름
        private int schoolYear;
        private String roleName; // HOMEROOM, SUBJECT 등
        private String roleDesc; // 담임교사, 교과담당 등
        private String subjectName; // 교과담당인 경우 과목명
        private String department; // 소속 부서

        public AssignedTeacherResponse(TeacherStudent ts) {
            this.relationId = ts.getId();
            this.schoolYear = ts.getSchoolYear();
            this.roleName = ts.getRole().name();
            this.roleDesc = ts.getRole().getDescription();
            this.subjectName = ts.getSubjectName();

            TeacherInfo ti = ts.getTeacherInfo();
            if (ti != null) {
                this.teacherInfoId = ti.getId();
                this.department = ti.getDepartment();

                User user = ti.getUser();
                if (user != null) {
                    this.teacherUid = user.getUid();
                    this.teacherName = user.getName();
                }
            }
        }
    }

    /**
     * 반 담당 교사 목록 (학급 관리 화면용)
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClassTeacherResponse {
        private int schoolYear;
        private int grade;
        private int classNum;
        private List<AssignedTeacherResponse> teachers;
    }

    /**
     * 교사별 담당 학생 요약 (관리자 화면용)
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeacherAssignmentSummary {
        private Long teacherUid;
        private String teacherName;
        private int homeroomCount; // 담임 학생 수
        private int subjectCount; // 교과담당 학생 수
        private int totalCount; // 전체 담당 학생 수

        public static TeacherAssignmentSummary from(User teacher, List<TeacherStudent> assignments) {
            int homeroom = (int) assignments.stream()
                    .filter(ts -> ts.getRole() == TeacherRole.HOMEROOM)
                    .count();
            int subject = (int) assignments.stream()
                    .filter(ts -> ts.getRole() == TeacherRole.SUBJECT)
                    .count();

            return TeacherAssignmentSummary.builder()
                    .teacherUid(teacher.getUid())
                    .teacherName(teacher.getName())
                    .homeroomCount(homeroom)
                    .subjectCount(subject)
                    .totalCount(assignments.size())
                    .build();
        }
    }
}
