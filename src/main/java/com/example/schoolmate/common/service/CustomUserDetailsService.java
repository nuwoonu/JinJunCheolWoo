package com.example.schoolmate.common.service;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

        private final UserRepository userRepository;

        @Override
        public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
                // 1. DB에서 이메일로 유저 찾기
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email));

                // 2. 시큐리티 전용 User 객체(UserDetails)로 변환하여 반환
                return org.springframework.security.core.userdetails.User.builder()
                                .username(user.getEmail()) // 시큐리티 내부 식별자
                                .password(user.getPassword()) // DB에 저장된 암호화된 비밀번호
                                .roles(user.getRoles().stream()
                                                .map(Enum::name) // ADMIN, TEACHER 등
                                                .toArray(String[]::new))
                                .build();
        }
}