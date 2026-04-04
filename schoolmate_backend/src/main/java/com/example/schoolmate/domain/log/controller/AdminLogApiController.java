package com.example.schoolmate.domain.log.controller;

import com.example.schoolmate.global.config.SchoolmateUrls;
import com.example.schoolmate.domain.log.dto.LogSearchCondition;
import com.example.schoolmate.domain.log.entity.SchoolmateLog;
import com.example.schoolmate.domain.log.service.LogService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(SchoolmateUrls.ADMIN_AUDIT)
@RequiredArgsConstructor
@PreAuthorize("@grants.isSuperAdmin()")
public class AdminLogApiController {

    private final LogService logService;

    // 접속 기록 조회
    @GetMapping("/access")
    public ResponseEntity<Page<SchoolmateLog>> accessLogs(LogSearchCondition condition,
            @PageableDefault(size = 20, sort = "createDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(logService.getAccessLogs(condition, pageable));
    }

    // 변경 이력 조회
    @GetMapping("/changes")
    public ResponseEntity<Page<SchoolmateLog>> changeLogs(LogSearchCondition condition,
            @PageableDefault(size = 20, sort = "createDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(logService.getAdminLogs(condition, pageable));
    }

    @GetMapping("/access/csv")
    public void downloadAccessLogsCsv(LogSearchCondition condition, HttpServletResponse response) throws IOException {
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"access_logs_" + LocalDate.now() + ".csv\"");

        List<SchoolmateLog> logs = logService.getAllAccessLogs(condition);

        try (PrintWriter writer = response.getWriter()) {
            writer.write("\uFEFF"); // BOM 추가
            writer.println("일시,사용자,유형,IP 주소,브라우저 정보");
            for (SchoolmateLog log : logs) {
                writer.printf("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                        log.getCreateDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                        log.getActorName(),
                        log.getAccessType(),
                        log.getIpAddress(),
                        log.getUserAgent() != null ? log.getUserAgent().replace("\"", "\"\"") : "");
            }
        }
    }

    @GetMapping("/changes/csv")
    public void downloadChangeLogsCsv(LogSearchCondition condition, HttpServletResponse response) throws IOException {
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"change_logs_" + LocalDate.now() + ".csv\"");

        List<SchoolmateLog> logs = logService.getAllAdminLogs(condition);

        try (PrintWriter writer = response.getWriter()) {
            writer.write("\uFEFF"); // BOM 추가
            writer.println("일시,작업자,작업 유형,대상,상세 내용");
            for (SchoolmateLog log : logs) {
                writer.printf("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                        log.getCreateDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                        log.getActorName(),
                        log.getActionType(),
                        log.getTarget(),
                        log.getDescription() != null ? log.getDescription().replace("\"", "\"\"") : "");
            }
        }
    }
}
