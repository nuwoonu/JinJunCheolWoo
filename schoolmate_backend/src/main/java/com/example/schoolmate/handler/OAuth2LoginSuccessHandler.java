package com.example.schoolmate.handler;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.config.jwt.AuthService;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * OAuth2 소셜 로그인 성공 핸들러
 * - JWT 발급 후 React 프론트엔드로 리다이렉트
 * - GUEST(신규): /oauth2/callback?role=GUEST&...
 * - 기존 사용자:  /oauth2/callback?role={ROLE}&accessToken=...&refreshToken=...
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;
    private final UserRepository userRepository;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oAuth2User = oauthToken.getPrincipal();
        String provider = oauthToken.getAuthorizedClientRegistrationId();

        String email = extractEmail(provider, oAuth2User.getAttributes());
        log.info("OAuth2 로그인 성공 - provider: {}, email: {}", provider, email);

        if (email == null) {
            log.warn("OAuth2 사용자 이메일 추출 실패 - provider: {}", provider);
            response.sendRedirect(frontendUrl + "/login?error=email_missing");
            return;
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            log.warn("OAuth2 사용자 DB 조회 실패 - email: {}", email);
            response.sendRedirect(frontendUrl + "/login?error=user_not_found");
            return;
        }

        // 신규 사용자(역할 없음) → GUEST 토큰 발급 후 역할 선택 페이지
        if (user.getRoles().isEmpty()) {
            Map<String, String> tokens = authService.issueTokensForOAuth2(user.getUid(), email, "GUEST");
            String redirectUrl = frontendUrl + "/oauth2/callback"
                    + "?accessToken=" + encode(tokens.get("accessToken"))
                    + "&refreshToken=" + encode(tokens.get("refreshToken"))
                    + "&role=GUEST";
            response.sendRedirect(redirectUrl);
            return;
        }

        // 기존 사용자 → 역할별 JWT 발급
        String role = user.getRoles().iterator().next().name();
        Map<String, String> tokens = authService.issueTokensForOAuth2(user.getUid(), email, role);

        String redirectUrl = frontendUrl + "/oauth2/callback"
                + "?accessToken=" + encode(tokens.get("accessToken"))
                + "&refreshToken=" + encode(tokens.get("refreshToken"))
                + "&role=" + encode(role);
        response.sendRedirect(redirectUrl);
    }

    private String extractEmail(String provider, Map<String, Object> attributes) {
        if ("kakao".equals(provider)) {
            @SuppressWarnings("unchecked")
            Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
            if (kakaoAccount != null) {
                return (String) kakaoAccount.get("email");
            }
        } else if ("google".equals(provider)) {
            return (String) attributes.get("email");
        }
        return null;
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
