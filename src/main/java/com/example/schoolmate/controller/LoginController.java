package com.example.schoolmate.controller;

import java.util.Collections;
import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.repository.UserRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Controller
@RequiredArgsConstructor
@Slf4j
public class LoginController {

    // 역할 선택 기능을 위한 UserRepository 주입 (01/29[woo])
    private final UserRepository userRepository;

    @GetMapping("/login")
    public String getLogin() {
        return "login";
    }

    @GetMapping("/register")
    public String getRegister() {
        return "register";
    }

    /**
     * 소셜 로그인 후 역할 선택 페이지 (01/29[woo])
     */
    @GetMapping("/select-role")
    public String getSelectRole(@AuthenticationPrincipal OAuth2User oAuth2User, Model model) {
        if (oAuth2User == null) {
            return "redirect:/login";
        }
        return "select-role";
    }

    /**
     * 소셜 로그인 후 역할 선택 처리 (01/29[woo])
     */
    @PostMapping("/select-role")
    public String postSelectRole(@AuthenticationPrincipal OAuth2User oAuth2User,
            @RequestParam("role") String role,
            Model model,
            HttpServletRequest request,
            HttpServletResponse response) {

        if (oAuth2User == null) {
            return "redirect:/login";
        }

        try {
            // OAuth2User에서 provider와 providerId 추출
            Map<String, Object> attributes = oAuth2User.getAttributes();
            String providerId = extractProviderId(attributes);

            // 사용자 조회 (providerId로)
            User user = userRepository.findByProviderAndProviderId(getProvider(attributes), providerId)
                    .orElse(null);

            if (user == null) {
                model.addAttribute("error", "사용자 정보를 찾을 수 없습니다.");
                return "select-role";
            }

            // 역할 설정
            UserRole userRole = UserRole.valueOf(role);
            user.addRole(userRole);
            userRepository.save(user);

            log.info("소셜 로그인 사용자 역할 설정 완료 - uid: {}, role: {}", user.getUid(), role);

            // SecurityContext 업데이트 - 새 권한으로 인증 정보 갱신 (01/29[woo])
            // 역할 선택 후 세션의 권한을 GUEST에서 선택한 역할로 변경해야 대시보드 접근 가능
            String newAuthority = "ROLE_" + userRole.name();
            OAuth2User updatedOAuth2User = new DefaultOAuth2User(
                    Collections.singleton(new SimpleGrantedAuthority(newAuthority)),
                    oAuth2User.getAttributes(),
                    getProvider(attributes).equals("kakao") ? "id" : "sub");

            OAuth2AuthenticationToken newAuth = new OAuth2AuthenticationToken(
                    updatedOAuth2User,
                    Collections.singleton(new SimpleGrantedAuthority(newAuthority)),
                    getProvider(attributes));
            SecurityContextHolder.getContext().setAuthentication(newAuth);

            // 각각의 역할에 따라 대시보드로 리다이렉트
            return switch (userRole) {
                case TEACHER -> "redirect:/teacher/dashboard";
                case STUDENT -> "redirect:/student/dashboard";
                case PARENT -> "redirect:/parent/dashboard";
                case ADMIN -> "redirect:/parkjoon/admin/dashboard";
                default -> "redirect:/login";
            };

        } catch (Exception e) {
            log.error("역할 선택 처리 중 오류 발생", e);
            model.addAttribute("error", "역할 선택 중 오류가 발생했습니다.");
            return "select-role";
        }
    }

    /**
     * OAuth2 attributes에서 providerId 추출 (01/29[woo])
     */
    private String extractProviderId(Map<String, Object> attributes) {
        // 카카오
        if (attributes.containsKey("id")) {
            return String.valueOf(attributes.get("id"));
        }
        // 구글
        if (attributes.containsKey("sub")) {
            return (String) attributes.get("sub");
        }
        return null;
    }

    /**
     * OAuth2 attributes에서 provider 추출 (01/29[woo])
     */
    private String getProvider(Map<String, Object> attributes) {
        if (attributes.containsKey("kakao_account")) {
            return "kakao";
        }
        if (attributes.containsKey("sub")) {
            return "google";
        }
        return "unknown";
    }
}
