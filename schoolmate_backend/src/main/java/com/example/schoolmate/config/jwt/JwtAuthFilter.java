package com.example.schoolmate.config.jwt;

import com.example.schoolmate.common.service.CustomUserDetailsService;
import com.example.schoolmate.config.school.SchoolContextHolder;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // 1순위: Authorization 헤더 (AJAX 요청)
        String token = null;
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        // 2순위: 쿠키 (브라우저 페이지 이동)
        if (token == null && request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("accessToken".equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        }

        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        if (!jwtUtil.isValid(token)) {
            log.warn("유효하지 않은 JWT 토큰: {}", request.getRequestURI());
            filterChain.doFilter(request, response);
            return;
        }

        String email = jwtUtil.getEmail(token);

        // JWT에서 schoolId를 꺼내 SchoolContextHolder에 세팅 (일반 유저용)
        // 어드민 경로(/api/admin/**)는 SchoolInterceptor가 X-School-Id 헤더로 덮어씀
        Long schoolId = jwtUtil.getSchoolId(token);
        if (schoolId != null) {
            SchoolContextHolder.setSchoolId(schoolId);
            log.debug("[JWT] schoolId={} 세팅 (email={}, uri={})", schoolId, email, request.getRequestURI());
        } else {
            log.debug("[JWT] schoolId 없음 (email={}, uri={})", email, request.getRequestURI());
        }

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (UsernameNotFoundException e) {
                // JWT에 명시된 사용자가 DB에 없을 때 (예: ddl-auto=create로 DB 초기화 후)
                // 예외를 전파하지 않고 인증 없이 계속 진행 → permitAll 엔드포인트 접근 가능
                log.warn("JWT 사용자 없음 (DB 초기화 또는 탈퇴): {}", email);
            }
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            // 비어드민 경로는 SchoolInterceptor가 없으므로 여기서 직접 정리
            SchoolContextHolder.clear();
        }
    }
}
