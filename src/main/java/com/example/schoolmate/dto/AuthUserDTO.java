package com.example.schoolmate.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;
import java.util.List;

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
                List.of(new SimpleGrantedAuthority("ROLE_" + customUserDTO.getRole().name()))
        );
        this.customUserDTO = customUserDTO;
    }
}
