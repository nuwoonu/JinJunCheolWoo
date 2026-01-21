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

import com.example.schoolmate.board.dto.PageRequestDTO;
import com.example.schoolmate.board.dto.PageResultDTO;
import com.example.schoolmate.board.dto.ParentBoardDTO;
import com.example.schoolmate.board.service.ParentBoardService;
import com.example.schoolmate.dto.AuthUserDTO;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Log4j2
@Controller
@RequiredArgsConstructor
@RequestMapping("/parent/board")
@PreAuthorize("hasAnyRole('PARENT', 'TEACHER', 'ADMIN')")
public class ParentBoardController {

    private final ParentBoardService parentBoardService;

    // 게시글 목록
    @GetMapping("/list")
    public String getList(PageRequestDTO pageRequestDTO, Model model) {
        log.info("학부모 게시판 목록 요청: {}", pageRequestDTO);

        PageResultDTO<ParentBoardDTO> result = parentBoardService.getList(pageRequestDTO);
        model.addAttribute("result", result);
        model.addAttribute("pageRequestDTO", pageRequestDTO);

        return "parent/board/list";
    }

    // 게시글 작성 폼
    @GetMapping("/create")
    public String getCreate(ParentBoardDTO dto, Model model) {
        log.info("게시글 작성 폼 요청");
        model.addAttribute("parentBoardDTO", dto);
        return "parent/board/create";
    }

    // 게시글 등록
    @PostMapping("/create")
    public String postCreate(@Valid ParentBoardDTO dto,
                            BindingResult result,
                            @AuthenticationPrincipal AuthUserDTO authUser,
                            RedirectAttributes rttr) {
        log.info("게시글 등록 요청: {}", dto);

        if (result.hasErrors()) {
            return "parent/board/create";
        }

        dto.setWriterId(authUser.getCustomUserDTO().getUid());
        Long bno = parentBoardService.insert(dto);

        rttr.addFlashAttribute("msg", bno + "번 게시글이 등록되었습니다.");
        return "redirect:/parent/board/list";
    }

    // 게시글 조회
    @GetMapping("/read")
    public String getRead(@RequestParam("bno") Long bno, Model model, PageRequestDTO pageRequestDTO) {
        log.info("게시글 조회 요청: {}", bno);

        ParentBoardDTO dto = parentBoardService.getRow(bno);
        model.addAttribute("dto", dto);
        model.addAttribute("pageRequestDTO", pageRequestDTO);

        return "parent/board/read";
    }

    // 게시글 수정 폼
    @GetMapping("/modify")
    public String getModify(@RequestParam("bno") Long bno, Model model, PageRequestDTO pageRequestDTO) {
        log.info("게시글 수정 폼 요청: {}", bno);

        ParentBoardDTO dto = parentBoardService.getRow(bno);
        model.addAttribute("dto", dto);
        model.addAttribute("pageRequestDTO", pageRequestDTO);

        return "parent/board/modify";
    }

    // 게시글 수정
    @PostMapping("/modify")
    public String postModify(ParentBoardDTO dto,
                            PageRequestDTO pageRequestDTO,
                            @AuthenticationPrincipal AuthUserDTO authUser,
                            RedirectAttributes rttr) {
        log.info("게시글 수정 요청: {}", dto);

        // 작성자 본인 확인
        ParentBoardDTO original = parentBoardService.getRow(dto.getBno());
        if (!original.getWriterId().equals(authUser.getCustomUserDTO().getUid())) {
            rttr.addFlashAttribute("msg", "본인이 작성한 게시글만 수정할 수 있습니다.");
            return "redirect:/parent/board/read?bno=" + dto.getBno();
        }

        parentBoardService.update(dto);

        rttr.addFlashAttribute("msg", "게시글이 수정되었습니다.");
        rttr.addAttribute("bno", dto.getBno());
        rttr.addAttribute("page", pageRequestDTO.getPage());
        rttr.addAttribute("size", pageRequestDTO.getSize());
        return "redirect:/parent/board/read";
    }

    // 게시글 삭제
    @PostMapping("/remove")
    public String postRemove(ParentBoardDTO dto,
                            PageRequestDTO pageRequestDTO,
                            @AuthenticationPrincipal AuthUserDTO authUser,
                            RedirectAttributes rttr) {
        log.info("게시글 삭제 요청: {}", dto.getBno());

        // 작성자 본인 확인
        ParentBoardDTO original = parentBoardService.getRow(dto.getBno());
        if (!original.getWriterId().equals(authUser.getCustomUserDTO().getUid())) {
            rttr.addFlashAttribute("msg", "본인이 작성한 게시글만 삭제할 수 있습니다.");
            return "redirect:/parent/board/read?bno=" + dto.getBno();
        }

        parentBoardService.delete(dto.getBno());

        rttr.addFlashAttribute("msg", "게시글이 삭제되었습니다.");
        rttr.addAttribute("page", pageRequestDTO.getPage());
        rttr.addAttribute("size", pageRequestDTO.getSize());
        return "redirect:/parent/board/list";
    }
}
