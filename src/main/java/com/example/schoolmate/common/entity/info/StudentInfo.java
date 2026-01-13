package com.example.schoolmate.common.entity.info;

import com.example.schoolmate.common.entity.info.constant.StudentStatus;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.Setter;

@Entity
@DiscriminatorValue("STUDENT")
@Getter
@Setter
public class StudentInfo extends BaseInfo {
    private int grade; // 학년
    private int classNum; // 반
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private StudentStatus status = StudentStatus.ENROLLED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_uid")
    private ParentInfo parent;
}