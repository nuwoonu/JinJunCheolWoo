package com.example.schoolmate.board.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.schoolmate.board.dto.BoardResponseDTO;
import com.example.schoolmate.board.entity.BoardType;
import com.example.schoolmate.board.service.BoardService;
import com.example.schoolmate.dto.AuthUserDTO;
import com.example.schoolmate.dto.CustomUserDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * [woo] 게시판 뷰 컨트롤러
 * - 학교 공지, 학년 게시판, 학급 게시판, 교직원 게시판, 학부모 공지/게시판
 */
@Slf4j
@Controller
@RequestMapping("/board")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    // ========== 학교 공지 ==========

    /**
     * 학교 공지 목록
     */
    @GetMapping("/school-notice")
    public String schoolNoticeList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Model model) {

        Pageable pageable = PageRequest.of(page, size);
        Page<BoardResponseDTO> boards = boardService.getSchoolNotices(pageable);

        model.addAttribute("boards", boards);
        model.addAttribute("boardType", BoardType.SCHOOL_NOTICE);
        model.addAttribute("boardTypeName", "학교 공지");
        model.addAttribute("currentPage", page);

        return "woo/teacher/board/school-notice/list";
    }

    /**
     * 학교 공지 상세
     */
    @GetMapping("/school-notice/{id}")
    public String schoolNoticeDetail(@PathVariable Long id, Model model) {
        BoardResponseDTO board = boardService.getBoard(id);
        model.addAttribute("board", board);
        model.addAttribute("boardType", BoardType.SCHOOL_NOTICE);
        return "woo/teacher/board/school-notice/detail";
    }

    /**
     * 학교 공지 작성 폼 (ADMIN만)
     */
    @GetMapping("/school-notice/write")
    @PreAuthorize("hasRole('ADMIN')")
    public String schoolNoticeWriteForm(Model model) {
        model.addAttribute("boardType", BoardType.SCHOOL_NOTICE);
        model.addAttribute("boardTypeName", "학교 공지");
        return "woo/teacher/board/school-notice/write";
    }

    // ========== 학년 게시판 ==========

    /**
     * 학년 게시판 목록
     */
    @GetMapping("/grade/{grade}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public String gradeBoardList(
            @PathVariable int grade,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication,
            Model model) {

        CustomUserDTO userDTO = getCustomUserDTO(authentication);

        // 열람 권한 체크
        if (!boardService.canRead(BoardType.GRADE_BOARD, userDTO, grade, null)) {
            model.addAttribute("error", "해당 학년 게시판 열람 권한이 없습니다.");
            return "error/403";
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<BoardResponseDTO> boards = boardService.getGradeBoard(grade, pageable);

        model.addAttribute("boards", boards);
        model.addAttribute("boardType", BoardType.GRADE_BOARD);
        model.addAttribute("boardTypeName", grade + "학년 게시판");
        model.addAttribute("targetGrade", grade);
        model.addAttribute("currentPage", page);

        return "woo/teacher/board/grade-board/list";
    }

    /**
     * 학년 게시판 상세
     */
    @GetMapping("/grade/{grade}/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public String gradeBoardDetail(
            @PathVariable int grade,
            @PathVariable Long id,
            Authentication authentication,
            Model model) {

        CustomUserDTO userDTO = getCustomUserDTO(authentication);

        if (!boardService.canRead(BoardType.GRADE_BOARD, userDTO, grade, null)) {
            return "error/403";
        }

        BoardResponseDTO board = boardService.getBoard(id);
        model.addAttribute("board", board);
        model.addAttribute("boardType", BoardType.GRADE_BOARD);
        model.addAttribute("targetGrade", grade);

        return "woo/teacher/board/grade-board/detail";
    }

    /**
     * 학년 게시판 작성 폼 (교사만)
     */
    @GetMapping("/grade/{grade}/write")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public String gradeBoardWriteForm(@PathVariable int grade, Model model) {
        model.addAttribute("boardType", BoardType.GRADE_BOARD);
        model.addAttribute("boardTypeName", grade + "학년 게시판");
        model.addAttribute("targetGrade", grade);
        return "woo/teacher/board/grade-board/write";
    }

    // ========== 학급 게시판 ==========

    /**
     * 학급 게시판 목록
     */
    @GetMapping("/class/{grade}/{classNum}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public String classBoardList(
            @PathVariable int grade,
            @PathVariable int classNum,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long classroomId,
            Authentication authentication,
            Model model) {

        // classroomId가 없으면 조회 필요 (추후 구현)
        if (classroomId == null) {
            model.addAttribute("error", "학급 정보를 찾을 수 없습니다.");
            return "error/404";
        }

        CustomUserDTO userDTO = getCustomUserDTO(authentication);

        if (!boardService.canRead(BoardType.CLASS_BOARD, userDTO, grade, classroomId)) {
            model.addAttribute("error", "해당 학급 게시판 열람 권한이 없습니다.");
            return "error/403";
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<BoardResponseDTO> boards = boardService.getClassBoard(classroomId, pageable);

        model.addAttribute("boards", boards);
        model.addAttribute("boardType", BoardType.CLASS_BOARD);
        model.addAttribute("boardTypeName", grade + "학년 " + classNum + "반 게시판");
        model.addAttribute("targetGrade", grade);
        model.addAttribute("targetClassNum", classNum);
        model.addAttribute("targetClassroomId", classroomId);
        model.addAttribute("currentPage", page);

        return "woo/teacher/board/class-board/list";
    }

    /**
     * 학급 게시판 상세
     */
    @GetMapping("/class/{grade}/{classNum}/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public String classBoardDetail(
            @PathVariable int grade,
            @PathVariable int classNum,
            @PathVariable Long id,
            @RequestParam(required = false) Long classroomId,
            Authentication authentication,
            Model model) {

        CustomUserDTO userDTO = getCustomUserDTO(authentication);

        if (!boardService.canRead(BoardType.CLASS_BOARD, userDTO, grade, classroomId)) {
            return "error/403";
        }

        BoardResponseDTO board = boardService.getBoard(id);
        model.addAttribute("board", board);
        model.addAttribute("boardType", BoardType.CLASS_BOARD);
        model.addAttribute("targetGrade", grade);
        model.addAttribute("targetClassNum", classNum);

        return "woo/teacher/board/class-board/detail";
    }

    /**
     * 학급 게시판 작성 폼 (해당 반 학생만)
     */
    @GetMapping("/class/{grade}/{classNum}/write")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public String classBoardWriteForm(
            @PathVariable int grade,
            @PathVariable int classNum,
            @RequestParam(required = false) Long classroomId,
            Model model) {

        model.addAttribute("boardType", BoardType.CLASS_BOARD);
        model.addAttribute("boardTypeName", grade + "학년 " + classNum + "반 게시판");
        model.addAttribute("targetGrade", grade);
        model.addAttribute("targetClassNum", classNum);
        model.addAttribute("targetClassroomId", classroomId);

        return "woo/teacher/board/class-board/write";
    }

    // ========== 교직원 게시판 ==========

    /**
     * 교직원 게시판 목록
     */
    @GetMapping("/teacher")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public String teacherBoardList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Model model) {

        Pageable pageable = PageRequest.of(page, size);
        Page<BoardResponseDTO> boards = boardService.getTeacherBoard(pageable);

        model.addAttribute("boards", boards);
        model.addAttribute("boardType", BoardType.TEACHER_BOARD);
        model.addAttribute("boardTypeName", "교직원 게시판");
        model.addAttribute("currentPage", page);

        return "woo/teacher/board/teacher-board/list";
    }

    /**
     * 교직원 게시판 상세
     */
    @GetMapping("/teacher/{id}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public String teacherBoardDetail(@PathVariable Long id, Model model) {
        BoardResponseDTO board = boardService.getBoard(id);
        model.addAttribute("board", board);
        model.addAttribute("boardType", BoardType.TEACHER_BOARD);
        return "woo/teacher/board/teacher-board/detail";
    }

    /**
     * 교직원 게시판 작성 폼
     */
    @GetMapping("/teacher/write")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public String teacherBoardWriteForm(Model model) {
        model.addAttribute("boardType", BoardType.TEACHER_BOARD);
        model.addAttribute("boardTypeName", "교직원 게시판");
        return "woo/teacher/board/teacher-board/write";
    }

    // ========== 학부모 공지 ==========

    /**
     * 학부모 공지 목록 (전체)
     */
    @GetMapping("/parent-notice")
    @PreAuthorize("hasAnyRole('PARENT', 'TEACHER', 'ADMIN')")
    public String parentNoticeList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Model model) {

        Pageable pageable = PageRequest.of(page, size);
        Page<BoardResponseDTO> boards = boardService.getParentNotices(pageable);

        model.addAttribute("boards", boards);
        model.addAttribute("boardType", BoardType.PARENT_NOTICE);
        model.addAttribute("boardTypeName", "학부모 공지");
        model.addAttribute("currentPage", page);

        return "woo/teacher/board/parent-notice/list";
    }

    /**
     * 학부모 공지 목록 (학년별)
     */
    @GetMapping("/parent-notice/grade/{grade}")
    @PreAuthorize("hasAnyRole('PARENT', 'TEACHER', 'ADMIN')")
    public String parentNoticeByGradeList(
            @PathVariable int grade,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Model model) {

        Pageable pageable = PageRequest.of(page, size);
        Page<BoardResponseDTO> boards = boardService.getParentNoticesByGrade(grade, pageable);

        model.addAttribute("boards", boards);
        model.addAttribute("boardType", BoardType.PARENT_NOTICE);
        model.addAttribute("boardTypeName", grade + "학년 학부모 공지");
        model.addAttribute("targetGrade", grade);
        model.addAttribute("currentPage", page);

        return "woo/teacher/board/parent-notice/list";
    }

    /**
     * 학부모 공지 상세
     */
    @GetMapping("/parent-notice/{id}")
    @PreAuthorize("hasAnyRole('PARENT', 'TEACHER', 'ADMIN')")
    public String parentNoticeDetail(@PathVariable Long id, Model model) {
        BoardResponseDTO board = boardService.getBoard(id);
        model.addAttribute("board", board);
        model.addAttribute("boardType", BoardType.PARENT_NOTICE);
        return "woo/teacher/board/parent-notice/detail";
    }

    /**
     * 학부모 공지 작성 폼 (교사만)
     */
    @GetMapping("/parent-notice/write")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public String parentNoticeWriteForm(
            @RequestParam(required = false) Integer targetGrade,
            @RequestParam(required = false) Long targetClassroomId,
            Model model) {

        model.addAttribute("boardType", BoardType.PARENT_NOTICE);
        model.addAttribute("boardTypeName", "학부모 공지");
        model.addAttribute("targetGrade", targetGrade);
        model.addAttribute("targetClassroomId", targetClassroomId);

        return "woo/teacher/board/parent-notice/write";
    }

    // ========== 학부모 게시판 ==========

    /**
     * 학부모 게시판 목록 (전체)
     */
    @GetMapping("/parent")
    @PreAuthorize("hasAnyRole('PARENT', 'TEACHER', 'ADMIN')")
    public String parentBoardList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Model model) {

        Pageable pageable = PageRequest.of(page, size);
        Page<BoardResponseDTO> boards = boardService.getParentBoard(pageable);

        model.addAttribute("boards", boards);
        model.addAttribute("boardType", BoardType.PARENT_BOARD);
        model.addAttribute("boardTypeName", "학부모 게시판");
        model.addAttribute("currentPage", page);

        return "woo/teacher/board/parent-board/list";
    }

    /**
     * 학부모 게시판 목록 (학년별)
     */
    @GetMapping("/parent/grade/{grade}")
    @PreAuthorize("hasAnyRole('PARENT', 'TEACHER', 'ADMIN')")
    public String parentBoardByGradeList(
            @PathVariable int grade,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Model model) {

        Pageable pageable = PageRequest.of(page, size);
        Page<BoardResponseDTO> boards = boardService.getParentBoardByGrade(grade, pageable);

        model.addAttribute("boards", boards);
        model.addAttribute("boardType", BoardType.PARENT_BOARD);
        model.addAttribute("boardTypeName", grade + "학년 학부모 게시판");
        model.addAttribute("targetGrade", grade);
        model.addAttribute("currentPage", page);

        return "woo/teacher/board/parent-board/list";
    }

    /**
     * 학부모 게시판 상세
     */
    @GetMapping("/parent/{id}")
    @PreAuthorize("hasAnyRole('PARENT', 'TEACHER', 'ADMIN')")
    public String parentBoardDetail(@PathVariable Long id, Model model) {
        BoardResponseDTO board = boardService.getBoard(id);
        model.addAttribute("board", board);
        model.addAttribute("boardType", BoardType.PARENT_BOARD);
        return "woo/teacher/board/parent-board/detail";
    }

    /**
     * 학부모 게시판 작성 폼 (학부모만)
     */
    @GetMapping("/parent/write")
    @PreAuthorize("hasAnyRole('PARENT', 'ADMIN')")
    public String parentBoardWriteForm(
            @RequestParam(required = false) Integer targetGrade,
            @RequestParam(required = false) Long targetClassroomId,
            Model model) {

        model.addAttribute("boardType", BoardType.PARENT_BOARD);
        model.addAttribute("boardTypeName", "학부모 게시판");
        model.addAttribute("targetGrade", targetGrade);
        model.addAttribute("targetClassroomId", targetClassroomId);

        return "woo/teacher/board/parent-board/write";
    }

    // ========== 헬퍼 ==========

    private CustomUserDTO getCustomUserDTO(Authentication authentication) {
        if (authentication == null) {
            throw new IllegalStateException("인증 정보가 없습니다.");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof AuthUserDTO authUserDTO) {
            return authUserDTO.getCustomUserDTO();
        }
        throw new IllegalStateException("지원하지 않는 인증 방식입니다.");
    }
}
