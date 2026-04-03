package com.example.schoolmate.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 시스템 전역 설정 (단일 행, id=1 고정)
 * - DB에서 런타임 중 값을 변경하여 기능을 즉시 토글할 수 있음
 */
@Entity
@Table(name = "system_settings")
@Getter
@Setter
@NoArgsConstructor
public class SystemSettings {

    @Id
    private Long id = 1L;

    /**
     * 회원가입 이메일 인증 활성화 여부 (기본값: true)
     * false 설정 시 인증 없이 가입 가능 — 개발/테스트 환경용
     */
    @Column(nullable = false)
    private boolean emailVerificationEnabled = true;

    /**
     * 테스트 모드 활성화 여부 (기본값: false)
     * true 설정 시 관리자 메인 페이지에서 테스트 데이터 생성 기능 접근 가능
     */
    @Column(nullable = false)
    private boolean testMode = false;
}
