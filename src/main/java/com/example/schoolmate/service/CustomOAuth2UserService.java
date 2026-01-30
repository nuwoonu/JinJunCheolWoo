package com.example.schoolmate.service;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * OAuth2 소셜 로그인 사용자 정보 처리 서비스 (01/29[woo])
 * - 카카오, 구글 등 소셜 로그인 시 사용자 정보를 처리
 * - 신규 사용자는 역할(role) 없이 저장 후, 역할 선택 페이지로 이동
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        // OAuth2 제공자 이름 (kakao, google 등)
        String provider = userRequest.getClientRegistration().getRegistrationId();

        // 사용자 정보 추출
        Map<String, Object> attributes = oAuth2User.getAttributes();
        String providerId = extractProviderId(provider, attributes);
        String email = extractEmail(provider, attributes);
        String name = extractName(provider, attributes);

        log.info("OAuth2 로그인 시도 - provider: {}, providerId: {}, email: {}", provider, providerId, email);

        // 기존 사용자 조회 또는 신규 생성
        User user = findOrCreateUser(provider, providerId, email, name);

        // 사용자 권한 설정 (역할이 없으면 기본 GUEST 권한 부여)
        String authority = user.getRoles().isEmpty() ? "ROLE_GUEST" : "ROLE_" + user.getRoles().iterator().next().name();

        return new DefaultOAuth2User(
            Collections.singleton(new SimpleGrantedAuthority(authority)),
            attributes,
            getUserNameAttributeName(provider)
        );
    }

    /**
     * 기존 사용자 조회 또는 신규 사용자 생성
     */
    private User findOrCreateUser(String provider, String providerId, String email, String name) {
        // 1. provider + providerId로 조회
        Optional<User> existingUser = userRepository.findByProviderAndProviderId(provider, providerId);
        if (existingUser.isPresent()) {
            log.info("기존 소셜 로그인 사용자 - uid: {}", existingUser.get().getUid());
            return existingUser.get();
        }

        // 2. 이메일로 조회 (기존 일반 회원이 소셜 로그인 연동하는 경우)
        if (email != null) {
            Optional<User> userByEmail = userRepository.findByEmail(email);
            if (userByEmail.isPresent()) {
                User user = userByEmail.get();
                // 소셜 로그인 정보 업데이트
                user.setProvider(provider);
                user.setProviderId(providerId);
                userRepository.save(user);
                log.info("기존 이메일 사용자에 소셜 로그인 연동 - uid: {}", user.getUid());
                return user;
            }
        }

        // 3. 신규 사용자 생성 (역할 없이 저장 - 나중에 역할 선택 페이지에서 설정)
        User newUser = User.builder()
            .email(email != null ? email : provider + "_" + providerId + "@social.user")
            .name(name != null ? name : "소셜사용자")
            .provider(provider)
            .providerId(providerId)
            .build();

        userRepository.save(newUser);
        log.info("신규 소셜 로그인 사용자 생성 - uid: {}", newUser.getUid());
        return newUser;
    }

    /**
     * 제공자별 사용자 ID 추출
     */
    private String extractProviderId(String provider, Map<String, Object> attributes) {
        if ("kakao".equals(provider)) {
            return String.valueOf(attributes.get("id"));
        } else if ("google".equals(provider)) {
            return (String) attributes.get("sub");
        }
        return null;
    }

    /**
     * 제공자별 이메일 추출
     */
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

    /**
     * 제공자별 이름 추출
     */
    private String extractName(String provider, Map<String, Object> attributes) {
        if ("kakao".equals(provider)) {
            @SuppressWarnings("unchecked")
            Map<String, Object> properties = (Map<String, Object>) attributes.get("properties");
            if (properties != null) {
                return (String) properties.get("nickname");
            }
        } else if ("google".equals(provider)) {
            return (String) attributes.get("name");
        }
        return null;
    }

    /**
     * 제공자별 사용자 식별 속성 이름 반환
     */
    private String getUserNameAttributeName(String provider) {
        if ("kakao".equals(provider)) {
            return "id";
        } else if ("google".equals(provider)) {
            return "sub";
        }
        return "id";
    }
}
