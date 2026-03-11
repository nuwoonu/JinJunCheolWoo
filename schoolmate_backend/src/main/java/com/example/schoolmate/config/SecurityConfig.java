package com.example.schoolmate.config;

import com.example.schoolmate.common.service.CustomOAuth2UserService;
import com.example.schoolmate.config.jwt.JwtAuthFilter;
// [woo] 로그 서비스 복구 (backup 코드 참조)
import com.example.schoolmate.domain.log.entity.AccessLog;
import com.example.schoolmate.domain.log.service.LogService;
import com.example.schoolmate.handler.CustomAccessDeniedHandler;
import com.example.schoolmate.handler.OAuth2LoginSuccessHandler;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

        private final CustomOAuth2UserService customOAuth2UserService;
        private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
        private final LogService logService; // [woo] 접속 로그 서비스 주입
        private final JwtAuthFilter jwtAuthFilter;
        @Qualifier("corsConfigurationSource")
        private final CorsConfigurationSource corsConfigurationSource;

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                                .csrf(csrf -> csrf.disable())
                                // [woo] 기본 formLogin 비활성화 → DefaultLoginPageGeneratingFilter 제거
                                // oauth2Login 설정 시 자동 등록되어 커스텀 /login 페이지를 가로채는 문제 방지
                                .formLogin(AbstractHttpConfigurer::disable)
                                .httpBasic(AbstractHttpConfigurer::disable)
                                // JWT → Stateless (세션 사용 안 함)
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                // 인증 없이 접근 가능한 공개 경로
                                                .requestMatchers(
                                                                "/main",
                                                                "/api/auth/login",
                                                                "/api/auth/register",
                                                                "/api/auth/refresh",
                                                                "/api/auth/logout",
                                                                "/api/auth/select-role",
                                                                "/oauth2/**",
                                                                "/login/oauth2/**",
                                                                "/login",
                                                                "/register",
                                                                "/user/register",
                                                                "/auth/register",
                                                                "/select-role",
                                                                "/",
                                                                "/home")
                                                .permitAll()
                                                // 정적 리소스
                                                .requestMatchers(
                                                                "/assets/**", "/images/**", "/img/**",
                                                                "/js/**", "/css/**", "/uploads/**", "/error/**")
                                                .permitAll()
                                                // [woo] NEIS 공개 API - 인증 불필요
                                                .requestMatchers("/api/calendar/**", "/api/meals/**").permitAll()
                                                // 관리자 전용
                                                .requestMatchers("/api/admin/**", "/parkjoon/admin/**").hasRole("ADMIN")
                                                // 교사 관리(추가/수정/삭제) - ADMIN만
                                                .requestMatchers("/api/teacher/add", "/api/teacher/edit",
                                                                "/api/teacher/delete")
                                                .hasRole("ADMIN")
                                                // 교사 영역
                                                .requestMatchers("/api/teacher/**").hasAnyRole("ADMIN", "TEACHER")
                                                // 학생 관리(추가/수정/삭제) - ADMIN, TEACHER
                                                .requestMatchers("/api/student/add", "/api/student/edit",
                                                                "/api/student/delete")
                                                .hasAnyRole("ADMIN", "TEACHER")
                                                // 학생 영역
                                                .requestMatchers("/api/student/**")
                                                .hasAnyRole("ADMIN", "TEACHER", "STUDENT")
                                                // 학부모 전용
                                                .requestMatchers("/api/parent/dashboard", "/api/parent/children/**")
                                                .hasRole("PARENT")
                                                // 나머지 모든 요청은 인증 필요
                                                .anyRequest().authenticated())
                                // [woo] OAuth2 소셜 로그인 (성공 시 JWT 발급)
                                // loginPage("/login") 지정 → DefaultLoginPageGeneratingFilter 비활성화
                                // 미지정 시 oauth2Login이 Spring Security 기본 OAuth2 로그인 페이지를 /login에 등록
                                .oauth2Login(oauth2 -> oauth2
                                                .loginPage("/login")
                                                .userInfoEndpoint(userInfo -> userInfo
                                                                .userService(customOAuth2UserService))
                                                .successHandler((request, response, authentication) -> {
                                                        // [woo] OAuth2 로그인 성공 시 로그 기록 (backup 코드 기능 복구)
                                                        logService.logAccess(authentication.getName(),
                                                                        getClientIp(request),
                                                                        request.getHeader("User-Agent"),
                                                                        AccessLog.AccessType.LOGIN);
                                                        oAuth2LoginSuccessHandler.onAuthenticationSuccess(request,
                                                                        response, authentication);
                                                }))
                                .exceptionHandling(exception -> exception
                                                .accessDeniedHandler(accessDeniedHandler())
                                                // REST API: 인증 실패 시 /login 리다이렉트 대신 401 JSON 반환
                                                .authenticationEntryPoint((request, response, authException) -> {
                                                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                                                        response.setContentType("application/json;charset=UTF-8");
                                                        response.getWriter().write("{\"message\":\"인증이 필요합니다.\"}");
                                                }))
                                // JWT 필터를 UsernamePasswordAuthenticationFilter 앞에 등록
                                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        @Bean
        public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
                return config.getAuthenticationManager();
        }

        @Bean
        public AccessDeniedHandler accessDeniedHandler() {
                return new CustomAccessDeniedHandler();
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        // [woo] 클라이언트 IP 추출 헬퍼 메서드 (backup 코드 복구)
        private String getClientIp(HttpServletRequest request) {
                String ip = request.getHeader("X-Forwarded-For");
                if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
                        ip = request.getHeader("Proxy-Client-IP");
                }
                if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
                        ip = request.getHeader("WL-Proxy-Client-IP");
                }
                if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
                        ip = request.getRemoteAddr();
                }
                return ip;
        }
}