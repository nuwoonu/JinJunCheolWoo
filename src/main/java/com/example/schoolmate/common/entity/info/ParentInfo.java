package com.example.schoolmate.common.entity.info;

import java.util.ArrayList;
import java.util.List;

import com.example.schoolmate.common.entity.info.constant.ParentStatus;

import jakarta.persistence.CascadeType;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@DiscriminatorValue("PARENT")
@Getter
@Setter
@NoArgsConstructor
public class ParentInfo extends BaseInfo {
    // 1. 인적 사항 (계정 유무와 상관없이 기록 가능)
    private String parentName; // 보호자 실명
    private String phoneNumber; // 연락처 (ID 매칭 및 알림 발송용)
    // 2. 관리 상태
    @Enumerated(EnumType.STRING)
    private ParentStatus status = ParentStatus.PENDING; // 기본값은 승인대기

    // 3. 자녀와의 관계 (1:N)
    @OneToMany(mappedBy = "parentInfo", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FamilyRelation> childrenRelations = new ArrayList<>();

    /**
     * 비즈니스 로직: 서비스 이용 가능 여부 확인
     * 계정이 연결되어 있고, 상태가 ACTIVE인 경우만 실제 앱/웹 기능 허용
     */
    public boolean canAccessService() {
        return this.getUser() != null && this.status == ParentStatus.ACTIVE;
    }
}