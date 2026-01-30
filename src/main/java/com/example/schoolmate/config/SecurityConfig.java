package com.example.schoolmate.config;

import com.example.schoolmate.handler.CustomAccessDeniedHandler;
import com.example.schoolmate.handler.CustomLoginSuccessHandler;
import com.example.schoolmate.handler.OAuth2LoginSuccessHandler;
import com.example.schoolmate.service.CustomOAuth2UserService;

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
        // OAuth2 소셜 로그인 관련 의존성 추가 (01/29[woo])
        private final CustomOAuth2UserService customOAuth2UserService;
        private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

        public SecurityConfig(CustomLoginSuccessHandler customLoginSuccessHandler,
                        CustomOAuth2UserService customOAuth2UserService,
                        OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler) {
                this.customLoginSuccessHandler = customLoginSuccessHandler;
                this.customOAuth2UserService = customOAuth2UserService;
                this.oAuth2LoginSuccessHandler = oAuth2LoginSuccessHandler;
        }

        @Bean
        SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http.authorizeHttpRequests(authorize -> authorize
                                // 로고 클릭시 각 롤에 맞게 메인페이지 보내기 위해 /home 권한설정.
                                // OAuth2 로그인 관련 URL 추가 (01/29[woo])
                                .requestMatchers("/", "/main", "/home", "/login", "/register", "/user/register",
                                                "/select-role", "/oauth2/**", "/login/oauth2/**")
                                .permitAll()

                                // images 불러사용 하기 위해 추가 [woo]
                                .requestMatchers("/assets/**", "/images/**", "/img/**", "/js/**", "/css/**").permitAll()
                                .requestMatchers("/error/**").permitAll()

                                // 관리자 전용 영역
                                .requestMatchers("/admin/**").hasRole("ADMIN")

                                // 교사 관리 (추가/수정/삭제) - ADMIN만 가능함
                                .requestMatchers("/teacher/add", "/teacher/edit", "/teacher/delete").hasRole("ADMIN")
                                // 교사 영역 (나머지) - TEACHER 접근 가능함
                                .requestMatchers("/teacher/**").hasAnyRole("ADMIN", "TEACHER")

                                // 학생 관리 (추가/수정/삭제) - ADMIN, TEACHER 가능함
                                .requestMatchers("/student/add", "/student/edit", "/student/delete")
                                .hasAnyRole("ADMIN", "TEACHER")
                                // 학생 영역 (나머지) - STUDENT도 접근 가능
                                .requestMatchers("/student/**").hasAnyRole("ADMIN", "TEACHER", "STUDENT")

                                // 학부모 게시판/공지 - 모든 로그인 사용자 접근 가능
                                .requestMatchers("/parent/board/**", "/parent/notice/**").authenticated()
                                // 학부모 전용 영역 (대시보드, 자녀 현황)
                                .requestMatchers("/parent/dashboard", "/parent/children/**").hasRole("PARENT")

                                // soojin 폴더 내 기능 구현 중
                                .requestMatchers("/soojin/**").hasAnyRole("ADMIN", "TEACHER", "STUDENT", "PARENT")

                                .anyRequest().authenticated() // 나머지 모든 요청은 인증 필요
                )
                                .formLogin(form -> form
                                                .loginPage("/login").permitAll()
                                                .loginProcessingUrl("/login").permitAll()
                                                .usernameParameter("email") // email 필드를 username으로 사용
                                                .passwordParameter("password") // password 필드명 명시
                                                .successHandler(customLoginSuccessHandler))
                                // OAuth2 소셜 로그인 설정 추가 (01/29[woo])
                                .oauth2Login(oauth2 -> oauth2
                                                .loginPage("/login")
                                                .userInfoEndpoint(userInfo -> userInfo
                                                                .userService(customOAuth2UserService)) // customOAuthUser.Service.loadUser()
                                                                                                       // : 사용자 정보 응답을
                                                                                                       // 받은걸로 우리 DB에
                                                                                                       // 저장/조회 한다.
                                                .successHandler(oAuth2LoginSuccessHandler))
                                .logout(logout -> logout
                                                .logoutUrl("/logout")
                                                .logoutSuccessUrl("/login?logout").permitAll())
                                .exceptionHandling(exception -> exception
                                                .accessDeniedHandler(accessDeniedHandler())) // 접근 거부 핸들러 설정
                                .csrf(csrf -> csrf.disable());
                return http.build();
        }

        @Bean
        AccessDeniedHandler accessDeniedHandler() {
                return new CustomAccessDeniedHandler();
        }

        @Bean
        PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        // [Joon님 추가] 어드민 전용 필터 체인
        @Bean
        @Order(1) // 우선순위 1등
        SecurityFilterChain adminFilterChain(HttpSecurity http) throws Exception {
                http
                                .securityMatcher("/parkjoon/admin/**") // 이 경로로 시작하는 요청만 담당
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(
                                                                "/parkjoon/admin/login",
                                                                "/assets/**",
                                                                "/css/**",
                                                                "/js/**")
                                                .permitAll() // 어드민 로그인창 및 정적 리소스 허용
                                                // .requestMatchers("/parkjoon/admin/notifications/send").permitAll()
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
                                                .deleteCookies("JSESSIONID"));
                // .csrf(csrf -> csrf.disable()); // CSRF 활성화 (기본값)

                return http.build();
        }
}