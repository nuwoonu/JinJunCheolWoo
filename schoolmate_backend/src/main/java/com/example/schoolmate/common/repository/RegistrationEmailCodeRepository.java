package com.example.schoolmate.common.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.common.entity.verification.RegistrationEmailCode;

public interface RegistrationEmailCodeRepository extends JpaRepository<RegistrationEmailCode, String> {
}
