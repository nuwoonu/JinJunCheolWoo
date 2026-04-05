package com.example.schoolmate.domain.teacher.controller;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.security.core.annotation.AuthenticationPrincipal;

import com.example.schoolmate.domain.parent.dto.ParentDTO;
import com.example.schoolmate.domain.teacher.dto.TeacherDTO;
import com.example.schoolmate.domain.classroom.entity.Classroom;
import com.example.schoolmate.domain.parent.entity.FamilyRelation;
import com.example.schoolmate.domain.parent.entity.ParentInfo;
import com.example.schoolmate.domain.student.entity.StudentInfo;
import com.example.schoolmate.domain.teacher.entity.TeacherInfo;
import com.example.schoolmate.domain.parent.repository.FamilyRelationRepository;
import com.example.schoolmate.domain.student.repository.StudentInfoRepository;
import com.example.schoolmate.domain.teacher.repository.TeacherInfoRepository;
import com.example.schoolmate.domain.parent.service.ParentService;
import com.example.schoolmate.domain.teacher.service.TeacherService;
import com.example.schoolmate.global.config.school.SchoolContextHolder;
import com.example.schoolmate.domain.user.dto.AuthUserDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

/**
 * [woo] 교사/학부모 목록 REST API - React 페이지 연동용
 * GET  /api/teacher/list   → 선생님 목록
 * GET  /api/teacher/parents → 학부모 목록
 * POST /api/teacher/parents/quick-register → 학부모 간편 등록
 */
@RestController
@RequestMapping("/api/teacher")
@PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
@RequiredArgsConstructor
@Log4j2
public class TeacherListRestController {

    private final TeacherService teacherService;
    private final ParentService parentService;
    private final TeacherInfoRepository teacherInfoRepository;
    private final StudentInfoRepository studentInfoRepository;
    private final FamilyRelationRepository familyRelationRepository;

    /**
     * 선생님 목록 조회 (React /teacher/list)
     *
     * GET /api/teacher/list?page=0&size=10&keyword=&status=
     */
    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> getTeacherList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal AuthUserDTO authUser) {

        // [woo] 교사 요청 시 SchoolContextHolder에 학교 ID 세팅
        Long schoolId = authUser.getCustomUserDTO().getSchoolId();
        if (schoolId != null) {
            SchoolContextHolder.setSchoolId(schoolId);
        }

        TeacherDTO.TeacherSearchCondition condition = new TeacherDTO.TeacherSearchCondition();
        condition.setKeyword(keyword);
        condition.setStatus(status);

        Page<TeacherDTO.DetailResponse> result = teacherService.getTeacherList(
                condition, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "uid")));

        log.info("[woo] 선생님 목록 조회 - schoolId: {}, page: {}, total: {}", schoolId, page, result.getTotalElements());

        return ResponseEntity.ok(Map.of(
                "content", result.getContent(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "currentPage", result.getNumber()
        ));
    }

    /**
     * [woo] 학부모 목록 조회 - 담임 반 학생의 학부모만 표시
     *
     * GET /api/teacher/parents?page=0&size=15&keyword=
     */
    @GetMapping("/parents")
    public ResponseEntity<?> getParentList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(required = false) String keyword,
            @AuthenticationPrincipal AuthUserDTO authUser) {

        Long teacherUid = authUser.getCustomUserDTO().getUid();
        int currentYear = LocalDate.now().getYear();

        // [woo] 교사의 담임 반 찾기
        TeacherInfo teacher = teacherInfoRepository.findByUserUid(teacherUid).orElse(null);
        if (teacher == null) {
            return ResponseEntity.ok(Map.of("content", List.of(), "totalElements", 0, "totalPages", 0, "currentPage", 0));
        }

        var classroomOpt = teacherService.getMyClassroom(teacher.getId(), currentYear);
        if (classroomOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("content", List.of(), "totalElements", 0, "totalPages", 0, "currentPage", 0));
        }

        Classroom classroom = classroomOpt.get();

        // [woo] 담임 반 학생 ID 목록
        List<StudentInfo> myStudents = studentInfoRepository.findByClassroomCid(classroom.getCid());
        Set<Long> studentIds = myStudents.stream().map(StudentInfo::getId).collect(Collectors.toSet());

        if (studentIds.isEmpty()) {
            return ResponseEntity.ok(Map.of("content", List.of(), "totalElements", 0, "totalPages", 0, "currentPage", 0));
        }

        // [woo] 담임 반 학생들의 학부모 관계 조회
        List<FamilyRelation> relations = familyRelationRepository.findByStudentInfoIdIn(studentIds);

        // [woo] 중복 제거 (같은 학부모가 여러 자녀와 연결된 경우)
        Map<Long, ParentInfo> parentMap = new LinkedHashMap<>();
        for (FamilyRelation rel : relations) {
            parentMap.putIfAbsent(rel.getParentInfo().getId(), rel.getParentInfo());
        }

        // [woo] keyword 필터링
        List<ParentDTO.Summary> allParents = parentMap.values().stream()
                .filter(p -> {
                    if (keyword == null || keyword.isEmpty()) return true;
                    String kw = keyword.toLowerCase();
                    if (p.getParentName() != null && p.getParentName().toLowerCase().contains(kw)) return true;
                    if (p.getUser() != null && p.getUser().getEmail() != null && p.getUser().getEmail().toLowerCase().contains(kw)) return true;
                    if (p.getPhone() != null && p.getPhone().contains(kw)) return true;
                    return false;
                })
                .map(ParentDTO.Summary::new)
                .collect(Collectors.toList());

        // [woo] 수동 페이지네이션
        int totalElements = allParents.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int fromIndex = Math.min(page * size, totalElements);
        int toIndex = Math.min(fromIndex + size, totalElements);
        List<ParentDTO.Summary> pageContent = allParents.subList(fromIndex, toIndex);

        log.info("[woo] 학부모 목록 조회 (담임반) - classroom: {}학년 {}반, total: {}",
                classroom.getGrade(), classroom.getClassNum(), totalElements);

        return ResponseEntity.ok(Map.of(
                "content", pageContent,
                "totalElements", totalElements,
                "totalPages", totalPages,
                "currentPage", page
        ));
    }

    /**
     * [woo] 학부모 간편 등록 (교사용)
     * 이름 + 전화번호 + 관계만으로 학부모 계정 생성 + 자녀 연결
     * 로그인: 전화번호 / 비밀번호: 전화번호 뒷 4자리
     *
     * POST /api/teacher/parents/quick-register
     */
    @PostMapping("/parents/quick-register")
    public ResponseEntity<?> quickRegisterParent(
            @RequestBody ParentDTO.QuickRegisterRequest request,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            log.info("[woo] 학부모 간편 등록 요청 - teacher: {}, student: {}, parent: {}",
                    authUser.getCustomUserDTO().getName(),
                    request.getStudentInfoId(),
                    request.getParentName());

            ParentDTO.QuickRegisterResponse result = parentService.quickRegisterParent(request);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            log.warn("[woo] 학부모 간편 등록 실패 - {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
