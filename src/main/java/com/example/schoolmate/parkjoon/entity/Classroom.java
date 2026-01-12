package com.example.schoolmate.parkjoon.entity;

import com.example.schoolmate.common.entity.BaseEntity;
import com.example.schoolmate.common.entity.Teacher;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@Builder // 클래스 레벨 빌더
@NoArgsConstructor // JPA 필수: 기본 생성자
@AllArgsConstructor // Builder를 위해 필요: 전체 생성자
public class Classroom extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cid;

    private int year;
    private int grade;
    private int classNum;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uid")
    private Teacher teacher;
}