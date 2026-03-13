package com.example.schoolmate.admin.controller;

import java.security.Principal;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.common.dto.NoticeDTO;
import com.example.schoolmate.common.service.NoticeService;

import lombok.RequiredArgsConstructor;

// 공지사항 관리 REST API
@RestController
@RequestMapping(SchoolmateUrls.ADMIN_NOTICES)
@RequiredArgsConstructor
public class AdminNoticeApiController {

    private final NoticeService noticeService;

    @GetMapping
    public ResponseEntity<Page<NoticeDTO.Response>> list(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(noticeService.getNoticeList(keyword, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NoticeDTO.Response> detail(@PathVariable Long id) {
        noticeService.increaseViewCount(id);
        return ResponseEntity.ok(noticeService.getNoticeDetail(id));
    }

    @PostMapping
    public ResponseEntity<Void> create(@RequestBody NoticeDTO.Request request, Principal principal) {
        noticeService.createNotice(request, principal.getName());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(@PathVariable Long id, @RequestBody NoticeDTO.Request request) {
        request.setId(id);
        noticeService.updateNotice(request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        noticeService.deleteNotice(id);
        return ResponseEntity.ok().build();
    }
}
