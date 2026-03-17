package com.example.schoolmate.soojin.entity;

import java.time.LocalDate;
import java.time.LocalTime;

import com.example.schoolmate.common.entity.constant.AttendanceStatus;
import com.example.schoolmate.common.entity.info.StudentInfo;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
import lombok.Setter;
import lombok.ToString;

import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;

@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "studentInfo")
@Getter
@Setter
@Table(name = "student_attendance_tbl")
@Entity
public class StudentAttendance extends SchoolBaseEntity {

    // [woo] 학생 출결 정보 - 선생님(담임), 관리자 접근

    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long id;

    // [woo] 학생 정보
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_info_id")
    private StudentInfo studentInfo;

    // [woo] 출결 날짜
    @Column(nullable = false)
    private LocalDate attendanceDate;

    // [woo] 출결 상태
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttendanceStatus status;

    // [woo] 출석 시간
    private LocalTime checkInTime;

    // [woo] 지각, 조퇴, 결석 시 사유
    private String reason;

}
