package com.example.schoolmate.domain.user.dto;

import com.example.schoolmate.domain.user.entity.constant.UserRole;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Spring Security의 UserDetails를 구현한 DTO
 * SecurityContext에 저장되어 인증된 사용자 정보를 담는다
 */
@Setter
@Getter
@ToString
public class AuthUserDTO extends User {

    private CustomUserDTO customUserDTO;

    public AuthUserDTO(String username, String password, Collection<? extends GrantedAuthority> authorities) {
        super(username, password, authorities);
    }

    public AuthUserDTO(CustomUserDTO customUserDTO) {
        super(
                customUserDTO.getEmail(),
                customUserDTO.getPassword(),
                // 다중 역할 지원: roles가 있으면 사용, 없으면 단일 role 사용
                customUserDTO.getRoles() != null && !customUserDTO.getRoles().isEmpty()
                        ? customUserDTO.getRoles().stream()
                                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.name()))
                                .collect(Collectors.toList())
                        : customUserDTO.getRole() != null
                                ? List.of(new SimpleGrantedAuthority("ROLE_" + customUserDTO.getRole().name()))
                                : List.of(new SimpleGrantedAuthority("ROLE_GUEST"))
        );
        this.customUserDTO = customUserDTO;
    }

    // 헬퍼 메서드
    public boolean hasRole(UserRole role) {
        return customUserDTO.hasRole(role);
    }

    public UserRole getPrimaryRole() {
        return customUserDTO.getPrimarRole();
    }
}
