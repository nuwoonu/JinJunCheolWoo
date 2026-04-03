package com.example.schoolmate.cheol.entity;

import java.util.ArrayList;
import java.util.List;

import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.user.constant.RoomType;
import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "dormitories", uniqueConstraints = @UniqueConstraint(columnNames = { "school_id", "building", "floor",
        "room_number",
        "bed_number" }))
@Getter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "students")
public class Dormitory extends SchoolBaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 10)
    private String building; // 동 (예: "1동", "2동", "3동")

    @Column(nullable = false)
    private Integer floor; // 층 (1~5)

    @Column(nullable = false, length = 10)
    private String roomNumber; // 호수 (예: "101", "102")

    @Column(nullable = false, length = 5)
    private String bedNumber; // 침대 번호 (예: "A", "B", "1", "2")

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoomType roomType; // 방 타입 (1인실, 2인실, 4인실)

    // 이 침대를 사용하는 학생들 (양방향 관계)
    @OneToMany(mappedBy = "dormitory")
    @Builder.Default
    private List<StudentInfo> students = new ArrayList<>();

    // 침대가 비어있는지 확인
    public boolean isEmpty() {
        return students == null || students.isEmpty();
    }

    // 침대에 배정된 학생 수
    public int getOccupiedCount() {
        return students != null ? students.size() : 0;
    }

    // 전체 주소 반환
    public String getFullAddress() {
        return String.format("%s %d층 %s호 %s번 침대",
                building, floor, roomNumber, bedNumber);
    }
}