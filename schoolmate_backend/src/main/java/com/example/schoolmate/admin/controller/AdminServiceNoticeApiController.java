package com.example.schoolmate.admin.controller;

import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.domain.servicenotice.dto.ServiceNoticeDTO;
import com.example.schoolmate.domain.servicenotice.service.ServiceNoticeService;
import com.example.schoolmate.dto.AuthUserDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(SchoolmateUrls.ADMIN_SERVICE_NOTICES)
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminServiceNoticeApiController {

    private final ServiceNoticeService serviceNoticeService;

    @GetMapping
    public ResponseEntity<Page<ServiceNoticeDTO.Summary>> list(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(serviceNoticeService.getList(keyword, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceNoticeDTO.Detail> detail(@PathVariable Long id) {
        return ResponseEntity.ok(serviceNoticeService.getDetail(id));
    }

    @PostMapping
    public ResponseEntity<Void> create(
            @RequestBody ServiceNoticeDTO.Request request,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        serviceNoticeService.create(request, authUser.getCustomUserDTO().getName());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(
            @PathVariable Long id,
            @RequestBody ServiceNoticeDTO.Request request) {
        serviceNoticeService.update(id, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        serviceNoticeService.delete(id);
        return ResponseEntity.ok().build();
    }
}
