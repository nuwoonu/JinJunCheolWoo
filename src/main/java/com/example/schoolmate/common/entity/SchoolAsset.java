package com.example.schoolmate.common.entity;

import com.example.schoolmate.common.entity.constant.AssetStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SchoolAsset extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name; // 기자재명 (예: 삼성 노트북)

    @Column(unique = true)
    private String code; // 관리 번호 (예: NB-2024-001)

    private String category; // 분류 (노트북, 태블릿, 카메라 등)

    private String location; // 보관 장소

    @Enumerated(EnumType.STRING)
    private AssetStatus status; // 상태

    private LocalDate purchaseDate; // 구입일

    private String description; // 설명

    private String imageFilename; // 이미지 파일명 (경로 제외)
}
