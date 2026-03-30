package com.example.schoolmate.config;

import com.example.schoolmate.common.service.CustomOAuth2UserService;
import com.example.schoolmate.config.jwt.JwtAuthFilter;
import com.example.schoolmate.common.util.LogHelper;
import com.example.schoolmate.handler.CustomAccessDeniedHandler;
import com.example.schoolmate.handler.OAuth2LoginSuccessHandler;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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

@Slf4j
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

        private final CustomOAuth2UserService customOAuth2UserService;
        private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
        private final JwtAuthFilter jwtAuthFilter;
        @Qualifier("corsConfigurationSource")
        private final CorsConfigurationSource corsConfigurationSource;

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                                .csrf(csrf -> csrf.disable())
                                // [woo] iframe 허용 (첨부파일 PDF 미리보기용)
                                .headers(headers -> headers
                                        .frameOptions(frame -> frame.sameOrigin()))
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
                                                                "/api/schools",
                                                                "/api/schools/**",
                                                                "/api/service-notices",
                                                                "/api/service-notices/**",
                                                                // [woo] /me는 컨트롤러가 직접 인증 여부 판단 (미인증 시
                                                                // authenticated:false 반환)
                                                                "/api/auth/me",
                                                                "/oauth2/**",
                                                                "/login/oauth2/**",
                                                                "/login",
                                                                "/register",
                                                                "/register/school-select",
                                                                "/user/register",
                                                                "/auth/register",
                                                                "/select-role",
                                                                "/select-info",
                                                                "/",
                                                                "/home")
                                                .permitAll()
                                                // 정적 리소스
                                                .requestMatchers(
                                                                "/assets/**", "/images/**", "/img/**",
                                                                "/js/**", "/css/**",
                                                                "/upload/**", "/uploads/**", "/error/**")
                                                .permitAll()
                                                // [woo] NEIS 공개 API - 인증 불필요
                                                .requestMatchers("/api/calendar/**", "/api/meals/**",
                                                                "/api/board/file/**").permitAll()
                                                // SUPER_ADMIN 전용: 학교 관리·권한 위임·시스템 설정·감사 로그
                                                // URL 레벨에서는 내장 hasRole 사용 (SpEL bean 참조 없이 안전하게 처리)
                                                // 컨트롤러 레벨에서 @PreAuthorize("@grants.isSuperAdmin()")로 이중 방어
                                                .requestMatchers(
                                                                "/api/admin/schools/**",
                                                                "/api/admin/grants/**",
                                                                "/api/admin/settings/**",
                                                                "/api/admin/subjects/**",
                                                                "/api/admin/audit/**")
                                                .hasRole("ADMIN")
                                                // 일반 어드민 영역: 인증된 사용자만 허용 (기능별 세분화는 각 컨트롤러 @PreAuthorize에서 처리)
                                                .requestMatchers("/api/admin/**")
                                                .authenticated()
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
                                                // [woo] 과제 API - 교사/학생/학부모 역할별 접근 (세부 권한은 Service에서 처리)
                                                .requestMatchers("/api/homework/teacher/**")
                                                .hasAnyRole("TEACHER", "ADMIN")
                                                .requestMatchers("/api/homework/student/**")
                                                .hasAnyRole("STUDENT", "ADMIN")
                                                .requestMatchers("/api/homework/parent/**")
                                                .hasAnyRole("PARENT", "ADMIN")
                                                .requestMatchers("/api/homework/**")
                                                .hasAnyRole("TEACHER", "STUDENT", "PARENT", "ADMIN")
                                                // [woo] 퀴즈 API - 역할별 접근
                                                .requestMatchers("/api/quiz/teacher/**")
                                                .hasAnyRole("TEACHER", "ADMIN")
                                                .requestMatchers("/api/quiz/student/**")
                                                .hasAnyRole("STUDENT", "ADMIN")
                                                // [woo] 학부모: 자녀 퀴즈 조회 허용
                                                .requestMatchers("/api/quiz/parent/**")
                                                .hasAnyRole("PARENT", "ADMIN")
                                                .requestMatchers("/api/quiz/**")
                                                .hasAnyRole("TEACHER", "STUDENT", "ADMIN")
                                                // [woo] 출결 API - 역할별 접근
                                                // [soojin] 학생도 자기 반 출석 현황 조회 가능 (GET /attendance/student?date= 한정)
                                                .requestMatchers(HttpMethod.GET, "/api/attendance/student")
                                                .hasAnyRole("TEACHER", "ADMIN", "STUDENT")
                                                .requestMatchers("/api/attendance/student/**")
                                                .hasAnyRole("TEACHER", "ADMIN")
                                                // [woo] 교사 출근관리 - 관리자 전용
                                                .requestMatchers("/api/attendance/teacher/**")
                                                .hasRole("ADMIN")
                                                .requestMatchers("/api/attendance/parent/**")
                                                .hasAnyRole("PARENT", "ADMIN")
                                                // [woo] 학급 앨범 — 업로드는 교사/관리자, 조회는 모든 인증 사용자
                                                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/class/photos")
                                                .hasAnyRole("TEACHER", "ADMIN")
                                                .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/class/photos/**")
                                                .hasAnyRole("TEACHER", "ADMIN")
                                                // [woo] 학급 앨범 캡션 수정
                                                .requestMatchers(org.springframework.http.HttpMethod.PATCH, "/api/class/photos/**")
                                                .hasAnyRole("TEACHER", "ADMIN")
                                                .requestMatchers("/api/class/photos/**")
                                                .authenticated()
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
                                                        LogHelper.access(authentication.getName(),
                                                                        getClientIp(request),
                                                                        request.getHeader("User-Agent"),
                                                                        "LOGIN");
                                                        oAuth2LoginSuccessHandler.onAuthenticationSuccess(request,
                                                                        response, authentication);
                                                }))
                                .exceptionHandling(exception -> exception
                                                .accessDeniedHandler(accessDeniedHandler())
                                                // API 요청은 /login redirect 대신 401 JSON 반환 (CORS 우회 방지)
                                                .authenticationEntryPoint((request, response, authException) -> {
                                                        log.warn("[401] {} {} - {}", request.getMethod(),
                                                                        request.getRequestURI(),
                                                                        authException.getMessage());
                                                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                                                        response.setContentType("application/json;charset=UTF-8");
                                                        response.getWriter().write("{\"authenticated\":false}");
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