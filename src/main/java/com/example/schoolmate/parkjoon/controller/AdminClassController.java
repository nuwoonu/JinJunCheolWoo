package com.example.schoolmate.parkjoon.controller;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.example.schoolmate.common.dto.ClassDTO;
import com.example.schoolmate.common.entity.info.constant.ClassroomStatus;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.service.SystemSettingService;
import com.example.schoolmate.parkjoon.service.AdminClassService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

/**
 * 관리자 학급 관리 컨트롤러
 * 
 * 학급(Classroom)의 생성, 조회, 수정, 삭제 및 학생 배정 기능을 담당합니다.
 * - 학년도/학년/반 기준 학급 목록 조회
 * - 담임 교사 배정 및 학생 구성 관리, CSV 일괄 등록 지원
 */
@Controller
@RequestMapping("/parkjoon/admin/classes")
@RequiredArgsConstructor
@Log4j2
public class AdminClassController {

    private final AdminClassService adminClassService;
    private final UserRepository userRepository;
    private final SystemSettingService systemSettingService;

    @GetMapping
    public String list(@ModelAttribute ClassDTO.SearchCondition condition,
            @PageableDefault(size = 20, sort = "cid", direction = Sort.Direction.DESC) Pageable pageable,
            Model model) {
        if (condition.getYear() == null) {
            condition.setYear(systemSettingService.getCurrentSchoolYear());
        }

        Page<ClassDTO.DetailResponse> classes = adminClassService.getClassList(condition, pageable);
        model.addAttribute("classes", classes);
        model.addAttribute("condition", condition);
        return "parkjoon/admin/classes/main";
    }

    @GetMapping("/create")
    public String createForm(Model model) {
        log.info("========== [AdminClassController] GET /create 진입 ==========");
        try {
            model.addAttribute("currentYear", systemSettingService.getCurrentSchoolYear());

            log.info("교사 목록 조회 요청 시작");
            List<ClassDTO.TeacherSelectResponse> teachers = adminClassService.getTeacherListForDropdown();
            log.info("교사 목록 조회 완료. 조회된 교사 수: {}", teachers != null ? teachers.size() : "null");

            model.addAttribute("teachers", teachers);
            return "parkjoon/admin/classes/create";
        } catch (Exception e) {
            log.error("[AdminClassController] GET /create 처리 중 치명적 에러 발생", e);
            throw e; // 에러 페이지로 전파
        }
    }

    @PostMapping("/create")
    public String create(ClassDTO.CreateRequest request, RedirectAttributes ra) {
        log.info("========== [AdminClassController] POST /create 진입 ==========");
        log.info("요청 데이터 - Year: {}, Grade: {}, ClassNum: {}, TeacherUid: {}, ManualStudents: {}, RandomCount: {}",
                request.getYear(), request.getGrade(), request.getClassNum(), request.getTeacherUid(),
                request.getStudentUids(), request.getRandomCount());
        try {
            Long cid = adminClassService.createClass(request);
            log.info("학급 생성 성공. CID: {}", cid);
            return "redirect:/parkjoon/admin/classes/" + cid;
        } catch (Exception e) {
            log.error("[AdminClassController] 학급 생성 중 에러 발생", e);
            ra.addFlashAttribute("errorMessage", "학급 생성 실패: " + e.getMessage());
            return "redirect:/parkjoon/admin/classes/create";
        }
    }

    @GetMapping("/{cid}")
    public String detail(@PathVariable Long cid, Model model) {
        ClassDTO.DetailResponse classroom = adminClassService.getClassDetail(cid);
        model.addAttribute("classroom", classroom);

        List<ClassDTO.TeacherSelectResponse> teachers = adminClassService.getTeacherListForDropdown();
        model.addAttribute("teachers", teachers);
        model.addAttribute("statuses", ClassroomStatus.values());

        return "parkjoon/admin/classes/detail";
    }

    @PostMapping("/update")
    public String update(ClassDTO.UpdateRequest request, RedirectAttributes ra) {
        adminClassService.updateClass(request);
        ra.addFlashAttribute("successMessage", "학급 정보가 수정되었습니다.");
        return "redirect:/parkjoon/admin/classes/" + request.getCid();
    }

    @PostMapping("/{cid}/add-students")
    @ResponseBody
    public ResponseEntity<String> addStudents(@PathVariable Long cid,
            @RequestParam("studentUids") java.util.List<Long> studentUids) {
        adminClassService.addStudents(cid, studentUids);
        return ResponseEntity.ok("학생이 배정되었습니다.");
    }

    @PostMapping("/{cid}/remove-student")
    @ResponseBody
    public ResponseEntity<String> removeStudent(@PathVariable Long cid, @RequestParam("studentUid") Long studentUid) {
        adminClassService.removeStudent(cid, studentUid);
        return ResponseEntity.ok("배정이 해제되었습니다.");
    }

    @PostMapping("/{cid}/remove-students")
    @ResponseBody
    public ResponseEntity<String> removeStudents(@PathVariable Long cid,
            @RequestParam("studentUids") List<Long> studentUids) {
        adminClassService.removeStudents(cid, studentUids);
        return ResponseEntity.ok("선택한 학생들의 배정이 해제되었습니다.");
    }

    @PostMapping("/bulk-status")
    @ResponseBody
    public ResponseEntity<String> bulkStatus(@RequestParam("cids") List<Long> cids,
            @RequestParam("status") String status) {
        try {
            adminClassService.bulkUpdateClassStatus(cids, status);
            return ResponseEntity.ok("상태가 변경되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("오류: " + e.getMessage());
        }
    }

    @PostMapping("/import-csv")
    @ResponseBody
    public ResponseEntity<String> importCsv(@RequestParam("file") MultipartFile file) {
        try {
            String result = adminClassService.importClassesFromCsv(file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("오류: " + e.getMessage());
        }
    }

    @GetMapping("/{cid}/roster-csv")
    public ResponseEntity<byte[]> downloadRoster(@PathVariable Long cid) {
        String csv = adminClassService.generateRosterCsv(cid);
        byte[] bytes = csv.getBytes(StandardCharsets.UTF_8); // 한글 깨짐 방지 위해 BOM 추가 고려 가능
        String fileName = "class_" + cid + "_roster.csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .header(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8")
                .body(bytes);
    }

    @PostMapping("/delete")
    public String delete(@RequestParam("cid") Long cid, RedirectAttributes ra) {
        try {
            adminClassService.deleteClass(cid);
            ra.addFlashAttribute("successMessage", "학급이 영구 삭제되었습니다.");
            return "redirect:/parkjoon/admin/classes";
        } catch (Exception e) {
            ra.addFlashAttribute("errorMessage", "삭제 실패: " + e.getMessage());
            return "redirect:/parkjoon/admin/classes/" + cid;
        }
    }
}