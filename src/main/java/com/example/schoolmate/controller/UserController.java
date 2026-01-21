package com.example.schoolmate.controller;

import com.example.schoolmate.dto.AuthUserDTO;
import com.example.schoolmate.dto.CustomUserDTO;
import com.example.schoolmate.dto.PasswordDTO;
import com.example.schoolmate.service.UserService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/user")
@RequiredArgsConstructor
@Log4j2
public class UserController {

    private final UserService userService;

    /**
     * 회원가입 폼 표시
     */
    @GetMapping("/register")
    public String getRegister(CustomUserDTO customUserDTO) {
        log.info("회원가입 폼 요청");
        return "/user/register";
    }

    /**
     * 회원가입 처리
     */
    @PostMapping("/register")
    public String postRegister(@Valid CustomUserDTO customUserDTO, BindingResult result, RedirectAttributes rttr) {
        log.info("회원가입 시도: {}", customUserDTO);

        // 유효성 검사 실패
        if (result.hasErrors()) {
            log.warn("회원가입 유효성 검사 실패: {}", result.getAllErrors());
            return "/user/register";
        }

        try {
            userService.join(customUserDTO);
            rttr.addFlashAttribute("msg", "회원가입이 완료되었습니다. 로그인해주세요.");
            return "redirect:/login";
        } catch (Exception e) {
            log.error("회원가입 실패: {}", e.getMessage());
            rttr.addFlashAttribute("error", e.getMessage());
            return "redirect:/user/register";
        }
    }

    /**
     * 프로필 페이지
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/profile")
    public String getProfile(Model model) {
        log.info("프로필 페이지 요청");

        // 현재 로그인한 사용자 정보 가져오기
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        AuthUserDTO authUser = (AuthUserDTO) authentication.getPrincipal();

        CustomUserDTO userDTO = userService.getUserDTOByEmail(authUser.getUsername());
        model.addAttribute("user", userDTO);

        return "/user/profile";
    }

    /**
     * 정보 수정 폼
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/edit")
    public String getEdit(Model model) {
        log.info("정보 수정 폼 요청");

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        AuthUserDTO authUser = (AuthUserDTO) authentication.getPrincipal();

        CustomUserDTO userDTO = userService.getUserDTOByEmail(authUser.getUsername());
        model.addAttribute("user", userDTO);

        return "/user/edit";
    }

    /**
     * 이름 변경
     */
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/edit/name")
    public String postName(CustomUserDTO dto, RedirectAttributes rttr, HttpSession session) {
        log.info("이름 변경 요청: {}", dto);

        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            AuthUserDTO authUser = (AuthUserDTO) authentication.getPrincipal();

            dto.setEmail(authUser.getUsername());
            userService.changeName(dto);

            // SecurityContext 업데이트
            CustomUserDTO updatedUser = userService.getUserDTOByEmail(authUser.getUsername());
            authUser.setCustomUserDTO(updatedUser);
            SecurityContextHolder.getContext().setAuthentication(authentication);

            rttr.addFlashAttribute("msg", "이름이 변경되었습니다.");
            return "redirect:/user/profile";
        } catch (Exception e) {
            log.error("이름 변경 실패: {}", e.getMessage());
            rttr.addFlashAttribute("error", e.getMessage());
            return "redirect:/user/edit";
        }
    }

    /**
     * 비밀번호 변경
     */
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/edit/password")
    public String postPassword(PasswordDTO dto, HttpSession session, RedirectAttributes rttr) {
        log.info("비밀번호 변경 요청");

        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            AuthUserDTO authUser = (AuthUserDTO) authentication.getPrincipal();

            dto.setEmail(authUser.getUsername());
            userService.changePassword(dto);

            // 비밀번호 변경 후 세션 무효화 (재로그인 필요)
            session.invalidate();
            rttr.addFlashAttribute("msg", "비밀번호가 변경되었습니다. 다시 로그인해주세요.");
            return "redirect:/login";
        } catch (Exception e) {
            log.error("비밀번호 변경 실패: {}", e.getMessage());
            rttr.addFlashAttribute("error", e.getMessage());
            return "redirect:/user/edit";
        }
    }

    /**
     * 회원 탈퇴 확인 페이지
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/leave")
    public String getLeave() {
        log.info("회원 탈퇴 확인 페이지 요청");
        return "user/leave";
    }

    /**
     * 회원 탈퇴 처리
     */
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/leave")
    public String postLeave(CustomUserDTO dto, HttpSession session, RedirectAttributes rttr) {
        log.info("회원 탈퇴 요청");

        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            AuthUserDTO authUser = (AuthUserDTO) authentication.getPrincipal();

            dto.setEmail(authUser.getUsername());
            userService.leave(dto);

            // 탈퇴 후 세션 무효화
            session.invalidate();
            rttr.addFlashAttribute("msg", "회원 탈퇴가 완료되었습니다.");
            return "redirect:/login";
        } catch (Exception e) {
            log.error("회원 탈퇴 실패: {}", e.getMessage());
            rttr.addFlashAttribute("error", e.getMessage());
            return "redirect:/user/edit";
        }
    }

    /**
     * 인증 정보 확인 (디버깅용)
     */
    @GetMapping("/auth")
    @ResponseBody
    public String getAuthInfo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null) {
            return "No authentication found";
        }

        Object principal = authentication.getPrincipal();

        if (principal instanceof AuthUserDTO) {
            AuthUserDTO authUser = (AuthUserDTO) authentication.getPrincipal();
            CustomUserDTO user = authUser.getCustomUserDTO();

            return String.format(
                "Email: %s, Name: %s, Role: %s, Authorities: %s",
                user.getEmail(),
                user.getName(),
                user.getRole(),
                authentication.getAuthorities()
            );
        }

        return "Principal: " + principal.toString();
    }
}
