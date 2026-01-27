package com.example.schoolmate.common.entity.info;

import com.example.schoolmate.common.entity.BaseEntity;
import com.example.schoolmate.common.entity.user.User;

import jakarta.persistence.Entity;
import jakarta.persistence.Column;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.Setter;

/**
 * 사용자 상세 정보의 최상위 추상 클래스
 * 
 * User 엔티티와 1:N 관계를 맺으며, 사용자의 역할(Role)별 구체적인 정보를 담습니다.
 * - 상속 전략: TABLE_PER_CLASS (구현 클래스마다 별도의 테이블 생성)
 * - 공통 필드: 고유 식별 코드(code), 연관된 User(uid)
 */
@Entity
@Inheritance(strategy = InheritanceType.TABLE_PER_CLASS)
@Getter
@Setter
public abstract class BaseInfo extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uid") // User의 uid를 참조
    private User user;

    @Column(nullable = false, unique = true)
    private String code;
}
