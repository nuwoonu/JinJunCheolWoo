package com.example.schoolmate.domain.resources.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

import com.example.schoolmate.domain.resources.constant.AssetStatus;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@DiscriminatorValue("ASSET")
public class SchoolAsset extends BaseResource {
    @Column(unique = true)
    private String assetCode;

    private String serialNumber; // 제조사 시리얼 번호 (S/N) - A/S용

    @ManyToOne(fetch = FetchType.LAZY)
    private AssetModel model; // 규격 정보 참조

    private LocalDate purchaseDate;

    @Enumerated(EnumType.STRING)
    private AssetStatus status;
}