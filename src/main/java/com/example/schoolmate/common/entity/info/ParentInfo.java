package com.example.schoolmate.common.entity.info;

import java.util.ArrayList;
import java.util.List;

import com.example.schoolmate.common.entity.info.constant.ParentStatus;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.OneToMany;
import lombok.Getter;
import lombok.Setter;

@Entity
@DiscriminatorValue("PARENT")
@Getter
@Setter
public class ParentInfo extends BaseInfo {
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private ParentStatus status = ParentStatus.ACTIVE;

    private String emergencyContact; // 비상 연락처
    private String relation; // 학생과의 관계 (부, 모, 조부모 등)
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    private List<StudentInfo> children = new ArrayList<>(); // 이 부모가 관리하는 자녀들

    // 편의 메서드: 자녀 추가 시 양방향 관계 설정
    public void addChild(StudentInfo student) {
        this.children.add(student);
        student.setParent(this);
    }
}
