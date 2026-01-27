package com.example.schoolmate.common.entity.info;

import com.example.schoolmate.common.entity.info.constant.FamilyRelationship;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 가족 관계 엔티티 (학생-학부모 연결)
 * 
 * 학생(StudentInfo)과 학부모(ParentInfo) 간의 N:M 관계를 해소하는 연결 엔티티입니다.
 * - 관계 유형(부, 모, 조부모 등) 및 대표 보호자 여부 저장
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
public class FamilyRelation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_info_id")
    private StudentInfo studentInfo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_info_id")
    private ParentInfo parentInfo;

    @Enumerated(EnumType.STRING)
    private FamilyRelationship relationship; // Enum 적용 (부, 모 등)

    private boolean isRepresentative; // 주 보호자(대표) 여부
}
