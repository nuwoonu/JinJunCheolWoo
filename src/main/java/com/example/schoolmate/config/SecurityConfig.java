package com.example.schoolmate.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

// config 폴더를 만들고 SecurityConfig.java 생성
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll() // 일단 모든 요청을 허용 (나중에 수정)
                )
                .csrf(csrf -> csrf.disable());
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        // 가장 대중적으로 사용되는 BCrypt 암호화 방식을 빈으로 등록합니다.
        return new BCryptPasswordEncoder();
    }

    @Bean
    @Order(1) // 우선순위 1등
    public SecurityFilterChain adminFilterChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/parkjoon/admin/**") // 이 경로로 시작하는 요청만 담당
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/parkjoon/admin/login", "/css/**", "/js/**").permitAll() // 어드민 로그인창은 허용
                        .anyRequest().hasRole("ADMIN") // 나머지는 무조건 ADMIN 권한 필요
                )
                .formLogin(form -> form
                        .loginPage("/parkjoon/admin/login") // 어드민 전용 로그인 페이지 URL
                        .loginProcessingUrl("/parkjoon/admin/login_proc") // 어드민 로그인 처리 URL
                        .defaultSuccessUrl("/parkjoon/admin/dashboard", true) // 성공 시 대시보드로
                        .permitAll())
                .logout(logout -> logout
                        .logoutUrl("/parkjoon/admin/logout")
                        .logoutSuccessUrl("/parkjoon/admin/login"))
                .exceptionHandling(exception -> exception
                        .accessDeniedPage("/error") // 권한 부족 시 /error로 리다이렉트
                );
        return http.build();
    }
}