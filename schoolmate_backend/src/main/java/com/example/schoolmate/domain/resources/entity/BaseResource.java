package com.example.schoolmate.domain.resources.entity;

import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorColumn;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import lombok.Getter;
import lombok.Setter;

@Entity
@Inheritance(strategy = InheritanceType.JOINED) // 공통 정보와 상세 정보를 테이블로 분리
@DiscriminatorColumn(name = "resource_type") // 구분을 위한 컬럼 (FACILITY, ASSET)
@Getter
@Setter
public abstract class BaseResource extends SchoolBaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name; // 시설명 또는 모델명

    private String locationDesc; // 위치 설명
    private String description; // 설명 (시설 설명 또는 기자재 특이사항)
    private String imageFilename;
}