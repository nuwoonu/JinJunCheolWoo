package com.example.schoolmate.domain.attendance.entity;

import java.time.LocalDate;
import java.time.LocalTime;

import com.example.schoolmate.domain.attendance.entity.constant.AttendanceStatus;
import com.example.schoolmate.domain.teacher.entity.TeacherInfo;
import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;

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

// [woo] 교사 출결 정보 - 관리자 접근
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "teacherInfo")
@Getter
@Setter
@Table(name = "teacher_attendance_tbl")
@Entity
public class TeacherAttendance extends SchoolBaseEntity {

    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long id;

    // [woo] 교사 정보
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_info_id")
    private TeacherInfo teacherInfo;

    // [woo] 출결 날짜
    @Column(nullable = false)
    private LocalDate attendanceDate;

    // [woo] 출결 상태
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttendanceStatus status;

    // [woo] 출근 시간
    private LocalTime checkInTime;

    // [woo] 사유
    private String reason;
}
