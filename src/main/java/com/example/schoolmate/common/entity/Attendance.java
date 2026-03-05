package com.example.schoolmate.common.entity;

import java.time.LocalDate;

import com.example.schoolmate.common.entity.constant.AttendanceStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(uniqueConstraints = {
        // 날짜 + 유저ID로 유니크 판정
        @UniqueConstraint(name = "unique_user_date", columnNames = { "user_id", "date" })
})
public class Attendance extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId; // 대상 유저 ID

    @Column(nullable = false)
    private Long checkerId; // 체크한 유저 ID

    @Column(nullable = false)
    private LocalDate date; // 출결 날짜

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttendanceStatus status; // 상태 (출석, 조퇴 등)

    @Column(columnDefinition = "TEXT")
    private String remarks; // 간단 메모
}
