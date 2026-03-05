package com.example.schoolmate.cheol.entity;

import java.time.LocalDate;

import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.user.constant.AchievementsGrade;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@NoArgsConstructor
@AllArgsConstructor
@ToString
@Getter
@Table
@Entity
@Builder
public class AwardsAndHonors {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long id;

    private String name; // 수상명

    private AchievementsGrade achievementsGrade; // 등급

    private LocalDate day; // 수상연월일

    private String AwardingOrganization; // 수상기관

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_info_id")
    private StudentInfo studentInfo;
}
