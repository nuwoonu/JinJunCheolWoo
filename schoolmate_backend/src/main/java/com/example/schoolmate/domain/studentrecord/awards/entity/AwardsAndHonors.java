package com.example.schoolmate.domain.studentrecord.awards.entity;

import java.time.LocalDate;

import com.example.schoolmate.domain.student.entity.StudentInfo;
import com.example.schoolmate.domain.user.entity.constant.AchievementsGrade;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;

@NoArgsConstructor
@AllArgsConstructor
@ToString
@Getter
@SuperBuilder
@Table(name = "awards_and_honors")
@Entity
public class AwardsAndHonors extends SchoolBaseEntity {

    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long id;

    private String name; // 수상명

    private AchievementsGrade achievementsGrade; // 등급 (ordinal 저장)

    private LocalDate day; // 수상연월일

    private String awardingOrganization; // 수상기관

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_info_id")
    private StudentInfo studentInfo;
}
