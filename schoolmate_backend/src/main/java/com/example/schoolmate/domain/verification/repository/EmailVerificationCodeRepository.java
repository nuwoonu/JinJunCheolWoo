package com.example.schoolmate.domain.verification.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.domain.verification.entity.EmailVerificationCode;

public interface EmailVerificationCodeRepository extends JpaRepository<EmailVerificationCode, Long> {
}
