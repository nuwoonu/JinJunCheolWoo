package com.example.schoolmate.woo.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.common.entity.Classroom;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;
import com.example.schoolmate.common.repository.info.student.StudentInfoRepository;
import com.example.schoolmate.common.repository.info.teacher.TeacherInfoRepository;
import com.example.schoolmate.common.repository.UserSocialAccountRepository;
import com.example.schoolmate.dto.AuthUserDTO;
import com.example.schoolmate.common.service.TeacherService;
import com.example.schoolmate.woo.dto.ClassStudentDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

/**
 * [woo] 교사 담당 학급 REST API - React 페이지 연동용
 * TeacherScheduleRestController와 동일한 패턴으로 인증 사용자 기반 동작
 */
@RestController
@RequestMapping("/api/teacher/myclass")
@PreAuthorize("hasRole('TEACHER')")
@RequiredArgsConstructor
@Log4j2
public class TeacherMyClassRestController {

    private final TeacherService teacherService;
    private final TeacherInfoRepository teacherInfoRepository;
    private final StudentInfoRepository studentInfoRepository;
    private final UserSocialAccountRepository socialAccountRepository;

    /**
     * 담당 학급 및 학생 목록 조회 (React /teacher/myclass, /teacher/myclass/students)
     *
     * GET /api/teacher/myclass?year=2026
     */
    @GetMapping
    public ResponseEntity<?> getMyClass(
            Authentication authentication,
            @RequestParam(required = false) Integer year) {

        Long teacherId = getTeacherId(authentication);
        int targetYear = (year != null) ? year : LocalDate.now().getYear();

        try {
            ClassStudentDTO classInfo = teacherService.getMyClassStudents(teacherId, targetYear);
            log.info("[REST] 담당 학급 조회 - teacherId: {}, year: {}", teacherId, targetYear);
            return ResponseEntity.ok(classInfo);
        } catch (IllegalArgumentException e) {
            log.warn("[REST] 담당 학급 없음 - teacherId: {}", teacherId);
            return ResponseEntity.ok(Map.of("hasClassroom", false, "message", "담당 학급이 없습니다."));
        }
    }

    /**
     * [woo] 같은 학교에서 아직 학급 배정이 없는 학생 목록 조회
     * GET /api/teacher/myclass/pending-students
     */
    @GetMapping("/pending-students")
    public ResponseEntity<?> getPendingStudents(
            @AuthenticationPrincipal AuthUserDTO authUser) {

        Long teacherUid = authUser.getCustomUserDTO().getUid();
        // [woo] CustomUserDTO에서 먼저, 없으면 SchoolContextHolder(JWT)에서 가져옴
        Long schoolId = authUser.getCustomUserDTO().getSchoolId();
        if (schoolId == null) {
            schoolId = com.example.schoolmate.config.school.SchoolContextHolder.getSchoolId();
        }

        if (schoolId == null) {
            log.warn("[woo] 미배정 학생 조회 실패 - schoolId null (teacherUid: {})", teacherUid);
            return ResponseEntity.ok(List.of());
        }

        // [woo] 같은 학교 + 학급 미배정 학생 조회
        // [joon] PENDING과 같은 기존 상태를 RoleRequest 엔티티로 변경하여 해당 함수 수정
        List<StudentInfo> unassignedStudents = studentInfoRepository.findUnassignedBySchoolId(schoolId);

        // [soojin] 승인대기 학생 카드에 학부모 성함, 신청일 추가 표시
        List<Map<String, Object>> result = unassignedStudents.stream()
                .map(s -> {
                    String parentName = s.getFamilyRelations().stream()
                            .filter(fr -> fr.isRepresentative() && fr.getParentInfo() != null)
                            .findFirst()
                            .or(() -> s.getFamilyRelations().stream()
                                    .filter(fr -> fr.getParentInfo() != null)
                                    .findFirst())
                            .map(fr -> fr.getParentInfo().getParentName())
                            .orElse("-");
                    String createdAt = s.getCreateDate() != null ? s.getCreateDate().toString() : "-";

                    java.util.Map<String, Object> map = new java.util.LinkedHashMap<>();
                    map.put("studentInfoId", s.getId());
                    map.put("name", s.getUser() != null ? s.getUser().getName() : "이름없음");
                    map.put("email", s.getUser() != null && s.getUser().getEmail() != null ? s.getUser().getEmail() : "-");
                    map.put("phone", s.getPhone() != null ? s.getPhone() : "-");
                    map.put("status", s.getStatus().getDescription());
                    map.put("parentName", parentName);
                    map.put("createdAt", createdAt);
                    return map;
                })
                .collect(Collectors.toList());

        log.info("[woo] 미배정 학생 조회 - schoolId: {}, count: {}", schoolId, result.size());
        return ResponseEntity.ok(result);
    }

    /**
     * [woo] 승인대기 학생을 본인 학급에 배정
     * POST /api/teacher/myclass/assign-student
     * body: { studentInfoId, attendanceNum }
     */
    @PostMapping("/assign-student")
    public ResponseEntity<?> assignStudentToMyClass(
            @RequestBody Map<String, Object> body,
            Authentication authentication,
            @AuthenticationPrincipal AuthUserDTO authUser) {

        Long studentInfoId = ((Number) body.get("studentInfoId")).longValue();
        Integer attendanceNum = body.get("attendanceNum") != null
                ? ((Number) body.get("attendanceNum")).intValue()
                : null;

        Long teacherUid = authUser.getCustomUserDTO().getUid();
        Long schoolId = authUser.getCustomUserDTO().getSchoolId();
        int currentYear = LocalDate.now().getYear();

        try {
            // [woo] 교사의 담임 반 찾기
            Long teacherId = getTeacherId(authentication);
            var classroomOpt = teacherService.getMyClassroom(teacherId, currentYear);
            if (classroomOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "담당 학급이 없습니다."));
            }
            Classroom classroom = classroomOpt.get();

            // [woo] 학생 정보 확인
            StudentInfo student = studentInfoRepository.findById(studentInfoId)
                    .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

            // [woo] 같은 학교인지 확인
            if (student.getSchool() == null || !student.getSchool().getId().equals(schoolId)) {
                return ResponseEntity.badRequest().body(Map.of("error", "같은 학교의 학생만 배정할 수 있습니다."));
            }

            // [woo] 이미 학급 배정이 완료된 학생인지 확인
            if (student.getCurrentAssignment() != null) {
                return ResponseEntity.badRequest().body(Map.of("error", "이미 학급이 배정된 학생입니다."));
            }

            // [woo] 반번호 자동 부여 (미입력 시 현재 학생 수 + 1)
            if (attendanceNum == null) {
                List<StudentInfo> existingStudents = studentInfoRepository.findByClassroomCid(classroom.getCid());
                attendanceNum = existingStudents.size() + 1;
            }

            // [woo] StudentAssignment 생성 + 학생 상태 변경
            StudentAssignment assignment = StudentAssignment.builder()
                    .studentInfo(student)
                    .schoolYear(currentYear)
                    .classroom(classroom)
                    .attendanceNum(attendanceNum)
                    .build();
            assignment.setSchool(student.getSchool());

            student.getAssignments().add(assignment);
            studentInfoRepository.save(student);

            log.info("[woo] 학생 학급 배정 완료 - student: {}, classroom: {}학년 {}반, 번호: {}",
                    student.getUser().getName(), classroom.getGrade(), classroom.getClassNum(), attendanceNum);

            return ResponseEntity.ok(Map.of(
                    "message", student.getUser().getName() + " 학생이 " +
                            classroom.getGrade() + "학년 " + classroom.getClassNum() + "반 " +
                            attendanceNum + "번으로 배정되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * [woo] 학생 반번호 수정
     * PUT /api/teacher/myclass/student-number
     * body: { studentId, studentNumber }
     */
    @PutMapping("/student-number")
    public ResponseEntity<?> updateStudentNumber(
            @RequestBody Map<String, Object> body,
            Authentication authentication) {

        Long studentId = ((Number) body.get("studentId")).longValue();
        Integer newNumber = ((Number) body.get("studentNumber")).intValue();

        try {
            Long teacherId = getTeacherId(authentication);
            int currentYear = LocalDate.now().getYear();

            // [woo] 교사의 담임 반 확인
            var classroomOpt = teacherService.getMyClassroom(teacherId, currentYear);
            if (classroomOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "담당 학급이 없습니다."));
            }
            Classroom classroom = classroomOpt.get();

            // [woo] 학생이 본인 학급 소속인지 확인
            StudentInfo student = studentInfoRepository.findById(studentId)
                    .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

            if (student.getCurrentAssignment() == null
                    || student.getCurrentAssignment().getClassroom() == null
                    || !student.getCurrentAssignment().getClassroom().getCid().equals(classroom.getCid())) {
                return ResponseEntity.badRequest().body(Map.of("error", "본인 학급의 학생만 수정할 수 있습니다."));
            }

            // [woo] 같은 학급 내 반번호 중복 체크
            List<StudentInfo> classmates = studentInfoRepository.findByClassroomCid(classroom.getCid());
            boolean duplicated = classmates.stream()
                    .filter(s -> !s.getId().equals(studentId))
                    .anyMatch(s -> s.getCurrentAssignment() != null
                            && newNumber.equals(s.getCurrentAssignment().getAttendanceNum()));
            if (duplicated) {
                return ResponseEntity.badRequest().body(Map.of("error", newNumber + "번은 이미 사용 중입니다."));
            }

            // [woo] 반번호 변경
            student.getCurrentAssignment().setAttendanceNum(newNumber);
            studentInfoRepository.save(student);

            log.info("[woo] 학생 반번호 변경 - student: {}, 새 번호: {}", student.getUser().getName(), newNumber);
            return ResponseEntity
                    .ok(Map.of("message", student.getUser().getName() + " 학생의 반번호가 " + newNumber + "번으로 변경되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── 공통 헬퍼 ──────────────────────────────────────────────────────────

    private Long getTeacherId(Authentication authentication) {
        Long uid = getUid(authentication);
        TeacherInfo teacherInfo = teacherInfoRepository.findByUserUid(uid)
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));
        return teacherInfo.getId();
    }

    private Long getUid(Authentication authentication) {
        Object principal = authentication.getPrincipal();

        if (principal instanceof AuthUserDTO authUserDTO) {
            return authUserDTO.getCustomUserDTO().getUid();
        }

        if (principal instanceof OAuth2User oAuth2User) {
            Map<String, Object> attrs = oAuth2User.getAttributes();
            String provider = attrs.containsKey("kakao_account") ? "kakao"
                    : attrs.containsKey("sub") ? "google" : null;
            String providerId = attrs.containsKey("id") ? String.valueOf(attrs.get("id"))
                    : attrs.containsKey("sub") ? (String) attrs.get("sub") : null;

            if (provider != null && providerId != null) {
                return socialAccountRepository.findByProviderAndProviderId(provider, providerId)
                        .map(sa -> sa.getUser().getUid())
                        .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            }
        }

        throw new IllegalArgumentException("인증 정보를 확인할 수 없습니다.");
    }
}
