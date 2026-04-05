package com.example.schoolmate.domain.school.entity;

import com.example.schoolmate.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class School extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name; // 학교명

    @Column(unique = true, nullable = false)
    private String schoolCode; // 표준 학교 코드 (SD_SCHUL_CODE)

    private String address; // 도로명 주소 (ORG_RDNMA)
    private String phoneNumber; // 전화번호 (ORG_TELNO)
    private String homepage; // 홈페이지 (HMPG_ADRES)

    private String officeOfEducation; // 관할 교육청 명 (ATPT_OFCDC_SC_NM)
    private String officeCode;        // 관할 교육청 코드 (ATPT_OFCDC_SC_CODE) - NEIS API 파라미터용
    private String schoolKind; // 학교 종류 (SCHUL_KND_SC_NM - 초/중/고)
    private String foundationType; // 설립 구분 (FOND_SC_NM - 공립/사립)
    private String coeduType; // 남녀공학 구분 (COEDU_SC_NM)
}