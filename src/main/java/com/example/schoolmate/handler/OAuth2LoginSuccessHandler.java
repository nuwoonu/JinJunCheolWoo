package com.example.schoolmate.handler;

import java.io.IOException;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

/**
 * OAuth2 소셜 로그인 성공 핸들러 (01/29[woo])
 * - 역할이 없는 신규 사용자 → 역할 선택 페이지로 이동
 * - 역할이 있는 기존 사용자 → 해당 역할의 대시보드로 이동
 */
@Component
@Slf4j
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        log.info("OAuth2 로그인 성공 - 사용자: {}", authentication.getName());

        // 역할이 없는 신규 사용자 (GUEST 권한)
        if (authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_GUEST"))) {
            log.info("신규 소셜 로그인 사용자 - 역할 선택 페이지로 이동");
            response.sendRedirect("/select-role");
            return;
        }

        // 기존 사용자는 역할에 따라 대시보드로 이동
        if (authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"))) {
            response.sendRedirect("/parkjoon/admin/dashboard");
        } else if (authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_TEACHER"))) {
            response.sendRedirect("/teacher/dashboard");
        } else if (authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_STUDENT"))) {
            response.sendRedirect("/student/dashboard");
        } else if (authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_PARENT"))) {
            response.sendRedirect("/parent/dashboard");
        } else {
            // 기본: 역할 선택 페이지
            response.sendRedirect("/select-role");
        }
    }
}
