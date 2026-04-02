package com.example.schoolmate.cheol.entity;

import java.util.ArrayList;
import java.util.List;

import com.example.schoolmate.common.entity.BaseEntity;
import com.example.schoolmate.common.entity.user.constant.RoomType;

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

@Entity
@Table(name = "dormitories", uniqueConstraints = @UniqueConstraint(columnNames = { "building", "floor", "room_number",
        "bed_number" }))
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "dormitoryAssignments")
public class Dormitory extends BaseEntity {

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

    // 이 침대의 배정 이력 (양방향 관계)
    @OneToMany(mappedBy = "dormitory")
    @Builder.Default
    private List<DormitoryAssignment> dormitoryAssignments = new ArrayList<>();

    // 침대가 비어있는지 확인 (전체 이력 기준 - 서비스에서 학기 필터링 권장)
    public boolean isEmpty() {
        return dormitoryAssignments == null || dormitoryAssignments.isEmpty();
    }

    // 침대에 배정된 수
    public int getOccupiedCount() {
        return dormitoryAssignments != null ? dormitoryAssignments.size() : 0;
    }

    // 전체 주소 반환
    public String getFullAddress() {
        return String.format("%s %d층 %s호 %s번 침대",
                building, floor, roomNumber, bedNumber);
    }
}
