package com.example.schoolmate.domain.verification.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.domain.verification.entity.RegistrationEmailCode;

public interface RegistrationEmailCodeRepository extends JpaRepository<RegistrationEmailCode, String> {
}
