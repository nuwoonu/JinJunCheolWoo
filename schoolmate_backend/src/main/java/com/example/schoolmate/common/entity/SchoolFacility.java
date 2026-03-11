package com.example.schoolmate.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SchoolFacility extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name; // 시설명 (예: 강당, 시청각실)

    private String location; // 위치 (예: 본관 1층)
    private Integer capacity; // 수용 인원
    private String description; // 설명
    private boolean isAvailable; // 사용 가능 여부
    private String imageFilename; // 이미지 파일명 (경로 제외)
}