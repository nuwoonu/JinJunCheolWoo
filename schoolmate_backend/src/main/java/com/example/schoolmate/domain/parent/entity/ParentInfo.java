package com.example.schoolmate.domain.parent.entity;
import com.example.schoolmate.global.entity.BaseInfo;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 학부모 상세 정보 엔티티
 * 
 * 학부모의 인적 사항 및 자녀와의 관계를 관리합니다.
 * - 실명, 연락처, 계정 상태(승인대기, 활성 등)
 */
@Entity
@Table(name = "parent_info", uniqueConstraints = {
    @UniqueConstraint(name = "uk_parent_code", columnNames = { "code" })
})
@DiscriminatorValue("PARENT")
@Getter
@Setter
@NoArgsConstructor
public class ParentInfo extends BaseInfo {
    // 1. 인적 사항 (계정 유무와 상관없이 기록 가능)
    private String parentName; // 보호자 실명

    // 2. 자녀와의 관계 (1:N)
    @OneToMany(mappedBy = "parentInfo", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FamilyRelation> childrenRelations = new ArrayList<>();

}