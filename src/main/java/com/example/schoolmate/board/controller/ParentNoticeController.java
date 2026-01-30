package com.example.schoolmate.board.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.example.schoolmate.board.dto.NoticeDTO;
import com.example.schoolmate.board.dto.PageRequestDTO;
import com.example.schoolmate.board.dto.PageResultDTO;
import com.example.schoolmate.common.service.NoticeService;
import com.example.schoolmate.dto.AuthUserDTO;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Log4j2
@Controller
@RequiredArgsConstructor
@RequestMapping("/parent/notice")
@PreAuthorize("isAuthenticated()")
public class ParentNoticeController {

    private final NoticeService noticeService;

    // 공지 목록
    @GetMapping("/list")
    public String getList(PageRequestDTO pageRequestDTO, Model model) {
        log.info("학부모 공지 목록 요청: {}", pageRequestDTO);

        PageResultDTO<NoticeDTO> result = noticeService.getList(pageRequestDTO);
        model.addAttribute("result", result);
        model.addAttribute("pageRequestDTO", pageRequestDTO);

        return "parent/notice/list";
    }

    // 공지 작성 폼 (TEACHER, ADMIN만)
    @GetMapping("/create")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public String getCreate(NoticeDTO dto, Model model) {
        log.info("공지 작성 폼 요청");
        model.addAttribute("noticeDTO", dto);
        return "parent/notice/create";
    }

    // 공지 등록 (TEACHER, ADMIN만)
    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public String postCreate(@Valid NoticeDTO dto,
            BindingResult result,
            @AuthenticationPrincipal AuthUserDTO authUser,
            RedirectAttributes rttr) {
        log.info("공지 등록 요청: {}", dto);

        if (result.hasErrors()) {
            return "parent/notice/create";
        }

        dto.setWriterId(authUser.getCustomUserDTO().getUid());
        Long nno = noticeService.insert(dto);

        rttr.addFlashAttribute("msg", nno + "번 공지가 등록되었습니다.");
        return "redirect:/parent/notice/list";
    }

    // 공지 조회
    @GetMapping("/read")
    public String getRead(@RequestParam("nno") Long nno, Model model, PageRequestDTO pageRequestDTO) {
        log.info("공지 조회 요청: {}", nno);

        NoticeDTO dto = noticeService.getRow(nno);
        model.addAttribute("dto", dto);
        model.addAttribute("pageRequestDTO", pageRequestDTO);

        return "parent/notice/read";
    }

    // 공지 수정 폼 (TEACHER, ADMIN만)
    @GetMapping("/modify")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public String getModify(@RequestParam("nno") Long nno, Model model, PageRequestDTO pageRequestDTO) {
        log.info("공지 수정 폼 요청: {}", nno);

        NoticeDTO dto = noticeService.getRow(nno);
        model.addAttribute("dto", dto);
        model.addAttribute("pageRequestDTO", pageRequestDTO);

        return "parent/notice/modify";
    }

    // 공지 수정 (TEACHER, ADMIN만)
    @PostMapping("/modify")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public String postModify(NoticeDTO dto,
            PageRequestDTO pageRequestDTO,
            @AuthenticationPrincipal AuthUserDTO authUser,
            RedirectAttributes rttr) {
        log.info("공지 수정 요청: {}", dto);

        noticeService.update(dto);

        rttr.addFlashAttribute("msg", "공지가 수정되었습니다.");
        rttr.addAttribute("nno", dto.getNno());
        rttr.addAttribute("page", pageRequestDTO.getPage());
        rttr.addAttribute("size", pageRequestDTO.getSize());
        return "redirect:/parent/notice/read";
    }

    // 공지 삭제 (TEACHER, ADMIN만)
    @PostMapping("/remove")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public String postRemove(NoticeDTO dto,
            PageRequestDTO pageRequestDTO,
            RedirectAttributes rttr) {
        log.info("공지 삭제 요청: {}", dto.getNno());

        noticeService.delete(dto.getNno());

        rttr.addFlashAttribute("msg", "공지가 삭제되었습니다.");
        rttr.addAttribute("page", pageRequestDTO.getPage());
        rttr.addAttribute("size", pageRequestDTO.getSize());
        return "redirect:/parent/notice/list";
    }
}
