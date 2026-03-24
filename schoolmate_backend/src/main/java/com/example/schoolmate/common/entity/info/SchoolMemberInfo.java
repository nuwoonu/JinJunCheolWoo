package com.example.schoolmate.common.entity.info;

import com.example.schoolmate.domain.school.entity.School;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

/**
 * 학교 소속 구성원 정보의 중간 추상 클래스
 *
 * BaseInfo를 상속하며 school_id(학교 소속) 필드를 추가합니다.
 * - 학교에 소속된 구성원(학생, 교사, 교직원)은 이 클래스를 상속
 * - 학교 소속 개념이 없는 학부모(ParentInfo)는 BaseInfo를 직접 상속
 *
 * primary 플래그: 한 유저가 같은 역할을 여러 학교에 걸쳐 가질 수 있을 때
 * Hub에서 기본으로 진입할 인스턴스를 표시합니다.
 * (user_id, dtype) 조합으로 primary=true 인 레코드는 하나여야 합니다.
 */
@Entity
@Getter
@Setter
public abstract class SchoolMemberInfo extends BaseInfo {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id")
    private School school;

    /** 해당 역할 타입에서 메인(Hub 기본 진입) 인스턴스 여부 */
    @ColumnDefault("false")
    @Column(name = "is_primary", nullable = false)
    private boolean primary = false;
}
