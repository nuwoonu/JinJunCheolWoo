package com.example.schoolmate.config;

import com.example.schoolmate.handler.CustomAccessDeniedHandler;
import com.example.schoolmate.handler.CustomLoginSuccessHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;

// config 폴더를 만들고 SecurityConfig.java 생성
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true) // @PreAuthorize 사용을 위해 필요
public class SecurityConfig {

    private final CustomLoginSuccessHandler customLoginSuccessHandler;

    public SecurityConfig(CustomLoginSuccessHandler customLoginSuccessHandler) {
        this.customLoginSuccessHandler = customLoginSuccessHandler;
    }

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/", "/login", "/register", "/user/register").permitAll()
                .requestMatchers("/assets/**", "/img/**", "/js/**", "/css/**").permitAll()
                .requestMatchers("/error/**").permitAll()

                // 관리자 전용 영역
                .requestMatchers("/admin/**").hasRole("ADMIN")

                // 교사 관리 (추가/수정/삭제) - ADMIN만 가능함
                .requestMatchers("/teacher/add", "/teacher/edit", "/teacher/delete").hasRole("ADMIN")
                // 교사 영역 (나머지) - TEACHER 접근 가능함
                .requestMatchers("/teacher/**").hasAnyRole("ADMIN", "TEACHER")

                // 학생 관리 (추가/수정/삭제) - ADMIN, TEACHER 가능함
                .requestMatchers("/student/add", "/student/edit", "/student/delete").hasAnyRole("ADMIN", "TEACHER")
                // 학생 영역 (나머지) - STUDENT도 접근 가능
                .requestMatchers("/student/**").hasAnyRole("ADMIN", "TEACHER", "STUDENT")

                // 학부모 게시판/공지 - 모든 로그인 사용자 접근 가능
                .requestMatchers("/parent/board/**", "/parent/notice/**").authenticated()
                // 학부모 전용 영역 (대시보드, 자녀 현황)
                .requestMatchers("/parent/dashboard", "/parent/children/**").hasRole("PARENT")

                .anyRequest().authenticated() // 나머지 모든 요청은 인증 필요
        )
                .formLogin(form -> form
                        .loginPage("/login").permitAll()
                        .loginProcessingUrl("/login").permitAll()
                        .usernameParameter("email") // email 필드를 username으로 사용
                        .passwordParameter("password") // password 필드명 명시
                        .successHandler(customLoginSuccessHandler))
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/login?logout").permitAll())
                .exceptionHandling(exception -> exception
                        .accessDeniedHandler(accessDeniedHandler())) // 접근 거부 핸들러 설정
                .csrf(csrf -> csrf.disable());
        return http.build();
    }

    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return new CustomAccessDeniedHandler();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // [Joon님 추가] 어드민 전용 필터 체인
    @Bean
    @Order(1) // 우선순위 1등
    public SecurityFilterChain adminFilterChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/parkjoon/admin/**") // 이 경로로 시작하는 요청만 담당
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/parkjoon/admin/login",
                                "/assets/**",
                                "/css/**",
                                "/js/**"
                        ).permitAll() // 어드민 로그인창 및 정적 리소스 허용
                        .anyRequest().hasRole("ADMIN") // 나머지는 무조건 ADMIN 권한 필요
                )
                .formLogin(form -> form
                        .loginPage("/parkjoon/admin/login") // 어드민 전용 로그인 페이지 URL
                        .loginProcessingUrl("/parkjoon/admin/login_proc") // 어드민 로그인 처리 URL
                        .usernameParameter("username") // login.html의 name 속성과 일치
                        .passwordParameter("password")
                        .defaultSuccessUrl("/parkjoon/admin/dashboard", true) // 성공 시 대시보드로
                        .failureUrl("/parkjoon/admin/login?error=true") // 실패 시 에러 파라미터
                        .permitAll())
                .logout(logout -> logout
                        .logoutUrl("/parkjoon/admin/logout")
                        .logoutSuccessUrl("/parkjoon/admin/login?logout=true")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID"))
                .exceptionHandling(exception -> exception
                        .accessDeniedPage("/error/403") // 권한 부족 시 403 페이지로
                )
                .csrf(csrf -> csrf.disable());
        return http.build();
    }
}
