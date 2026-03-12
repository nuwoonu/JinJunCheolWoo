package com.example.schoolmate.common.entity.info;

import com.example.schoolmate.domain.school.entity.School;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.Setter;

/**
 * 학교 소속 구성원 정보의 중간 추상 클래스
 *
 * BaseInfo를 상속하며 school_id(학교 소속) 필드를 추가합니다.
 * - 학교에 소속된 구성원(학생, 교사, 교직원)은 이 클래스를 상속
 * - 학교 소속 개념이 없는 학부모(ParentInfo)는 BaseInfo를 직접 상속
 */
@Entity
@Getter
@Setter
public abstract class SchoolMemberInfo extends BaseInfo {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id")
    private School school;
}
