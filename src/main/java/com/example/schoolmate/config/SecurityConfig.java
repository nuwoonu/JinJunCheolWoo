package com.example.schoolmate.config;

import com.example.schoolmate.handler.CustomAccessDeniedHandler;
import com.example.schoolmate.handler.CustomLoginSuccessHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
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
}