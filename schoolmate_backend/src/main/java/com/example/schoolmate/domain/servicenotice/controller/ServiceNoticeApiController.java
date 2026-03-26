package com.example.schoolmate.domain.servicenotice.controller;

import com.example.schoolmate.config.SchoolmateUrls;
import com.example.schoolmate.domain.servicenotice.dto.ServiceNoticeDTO;
import com.example.schoolmate.domain.servicenotice.service.ServiceNoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(SchoolmateUrls.SERVICE_NOTICES)
@RequiredArgsConstructor
public class ServiceNoticeApiController {

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
}
