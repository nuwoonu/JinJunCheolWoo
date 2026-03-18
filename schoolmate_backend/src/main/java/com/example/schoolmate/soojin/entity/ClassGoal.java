package com.example.schoolmate.soojin.entity;

import java.util.ArrayList;
import java.util.List;

import com.example.schoolmate.common.entity.Classroom;
import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// [soojin] 이달의 학급 목표 엔티티
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Entity
@Table(name = "class_goal_tbl", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"classroom_id", "year", "month"})
})
public class ClassGoal extends SchoolBaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 해당 학급
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    @Column(nullable = false)
    private int year;

    @Column(nullable = false)
    private int month;

    // 이달의 목표 텍스트
    @Column(nullable = false, length = 500)
    private String goal;

    // 실천 사항 목록 (별도 테이블 저장)
    @Builder.Default
    @ElementCollection
    @CollectionTable(
            name = "class_goal_action_items",
            joinColumns = @JoinColumn(name = "class_goal_id")
    )
    @OrderColumn(name = "item_order")
    @Column(name = "action_item", length = 200)
    private List<String> actionItems = new ArrayList<>();

    // 목표 수정 (Service에서 @Transactional 내 호출)
    public void update(String goal, List<String> actionItems) {
        this.goal = goal;
        this.actionItems.clear();
        this.actionItems.addAll(actionItems);
    }
}
