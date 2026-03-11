package com.example.schoolmate.config.jwt;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByEmail(String email);

    Optional<RefreshToken> findByToken(String token);

    @Transactional
    void deleteByEmail(String email);
}
