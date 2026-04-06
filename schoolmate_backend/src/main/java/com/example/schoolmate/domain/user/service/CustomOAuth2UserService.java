package com.example.schoolmate.domain.user.service;

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
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.domain.user.entity.User;
import com.example.schoolmate.domain.user.entity.UserSocialAccount;
import com.example.schoolmate.domain.user.repository.UserRepository;
import com.example.schoolmate.domain.user.repository.UserSocialAccountRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * OAuth2 소셜 로그인 사용자 정보 처리 서비스
 * - 카카오, 구글 등 소셜 로그인 시 사용자 정보를 처리
 * - 소셜 계정은 UserSocialAccount 테이블에서 관리 (다중 소셜 연동 지원)
 * - 신규 사용자는 역할 없이 저장 후 역할 선택 페이지로 이동
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final UserSocialAccountRepository socialAccountRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String provider = userRequest.getClientRegistration().getRegistrationId();
        Map<String, Object> attributes = oAuth2User.getAttributes();
        String providerId = extractProviderId(provider, attributes);
        String email = extractEmail(provider, attributes);
        String name = extractName(provider, attributes);

        log.info("OAuth2 로그인 시도 - provider: {}, providerId: {}, email: {}", provider, providerId, email);

        User user = findOrCreateUser(provider, providerId, email, name);

        String authority = user.getRoles().isEmpty() ? "ROLE_GUEST" : "ROLE_" + user.getRoles().iterator().next().name();

        return new DefaultOAuth2User(
            Collections.singleton(new SimpleGrantedAuthority(authority)),
            attributes,
            getUserNameAttributeName(provider)
        );
    }

    /**
     * 기존 사용자 조회 또는 신규 사용자 생성
     * 1. (provider, providerId)로 기존 소셜 연동 계정 조회
     * 2. 이메일로 기존 계정 조회 → 자동 연동 (이메일 인증 완료된 계정만 존재)
     * 3. 신규 유저 생성 + 소셜 계정 연동
     */
    private User findOrCreateUser(String provider, String providerId, String email, String name) {
        // 1. 기존 소셜 연동 계정 조회
        Optional<UserSocialAccount> existingSocial = socialAccountRepository.findByProviderAndProviderId(provider, providerId);
        if (existingSocial.isPresent()) {
            User user = existingSocial.get().getUser();
            log.info("기존 소셜 로그인 사용자 - uid: {}", user.getUid());
            return user;
        }

        // 2. 동일 이메일 계정 조회 → 소셜 계정 연동
        if (email != null) {
            Optional<User> userByEmail = userRepository.findByEmail(email);
            if (userByEmail.isPresent()) {
                User user = userByEmail.get();
                UserSocialAccount social = UserSocialAccount.of(user, provider, providerId, email);
                socialAccountRepository.save(social);
                log.info("기존 이메일 사용자에 소셜 로그인 연동 - uid: {}, provider: {}", user.getUid(), provider);
                return user;
            }
        }

        // 3. 신규 사용자 생성
        User newUser = User.builder()
            .email(email != null ? email : provider + "_" + providerId + "@social.user")
            .name(name != null ? name : "소셜사용자")
            .build();
        userRepository.save(newUser);

        UserSocialAccount social = UserSocialAccount.of(newUser, provider, providerId, email);
        socialAccountRepository.save(social);

        log.info("신규 소셜 로그인 사용자 생성 - uid: {}, provider: {}", newUser.getUid(), provider);
        return newUser;
    }

    private String extractProviderId(String provider, Map<String, Object> attributes) {
        if ("kakao".equals(provider)) {
            return String.valueOf(attributes.get("id"));
        } else if ("google".equals(provider)) {
            return (String) attributes.get("sub");
        }
        return null;
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

    private String getUserNameAttributeName(String provider) {
        if ("kakao".equals(provider)) {
            return "id";
        } else if ("google".equals(provider)) {
            return "sub";
        }
        return "id";
    }
}
