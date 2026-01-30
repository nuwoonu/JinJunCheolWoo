package com.example.schoolmate.parkjoon.controller;

import java.security.Principal;

import com.example.schoolmate.common.dto.NoticeDTO;
import com.example.schoolmate.common.service.NoticeService;
import com.example.schoolmate.config.SchoolmateUrls;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping(SchoolmateUrls.ADMIN_NOTICES)
@RequiredArgsConstructor
public class AdminNoticeBoardController {

    private final NoticeService adminNoticeService;

    @GetMapping
    public String list(@RequestParam(value = "keyword", required = false) String keyword,
            @PageableDefault(size = 10) Pageable pageable,
            Model model) {
        Page<NoticeDTO.Response> notices = adminNoticeService.getNoticeList(keyword, pageable);
        model.addAttribute("notices", notices);
        model.addAttribute("keyword", keyword);
        return SchoolmateUrls.ADMIN_NOTICES + "/main";
    }

    @GetMapping("/create")
    public String createForm(Model model) {
        model.addAttribute("notice", new NoticeDTO.Request());
        return SchoolmateUrls.ADMIN_NOTICES + "/form";
    }

    @PostMapping("/create")
    public String create(NoticeDTO.Request request,
            Principal principal,
            RedirectAttributes ra) {
        adminNoticeService.createNotice(request, principal.getName());
        ra.addFlashAttribute("successMessage", "공지사항이 등록되었습니다.");
        return "redirect:" + SchoolmateUrls.ADMIN_NOTICES;
    }

    @GetMapping("/{id}")
    public String detail(@PathVariable Long id, Model model) {
        adminNoticeService.increaseViewCount(id);
        NoticeDTO.Response notice = adminNoticeService.getNoticeDetail(id);
        model.addAttribute("notice", notice);
        return SchoolmateUrls.ADMIN_NOTICES + "/detail";
    }

    @GetMapping("/{id}/edit")
    public String editForm(@PathVariable Long id, Model model) {
        NoticeDTO.Response notice = adminNoticeService.getNoticeDetail(id);
        model.addAttribute("notice", notice);
        return SchoolmateUrls.ADMIN_NOTICES + "/form";
    }

    @PostMapping("/{id}/edit")
    public String edit(@PathVariable Long id, NoticeDTO.Request request, RedirectAttributes ra) {
        request.setId(id);
        adminNoticeService.updateNotice(request);
        ra.addFlashAttribute("successMessage", "공지사항이 수정되었습니다.");
        return "redirect:" + SchoolmateUrls.ADMIN_NOTICES + "/" + id;
    }

    @PostMapping("/{id}/delete")
    public String delete(@PathVariable Long id, RedirectAttributes ra) {
        adminNoticeService.deleteNotice(id);
        ra.addFlashAttribute("successMessage", "공지사항이 삭제되었습니다.");
        return "redirect:" + SchoolmateUrls.ADMIN_NOTICES;
    }
}