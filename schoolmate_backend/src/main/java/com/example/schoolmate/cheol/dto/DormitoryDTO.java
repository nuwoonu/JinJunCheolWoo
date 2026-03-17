package com.example.schoolmate.cheol.dto;

import java.util.List;
import java.util.stream.Collectors;

import com.example.schoolmate.cheol.entity.Dormitory;
import com.example.schoolmate.common.entity.user.constant.RoomType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DormitoryDTO {

    private Long id;
    private String building;
    private Integer floor;
    private String roomNumber;
    private String bedNumber;
    private RoomType roomType;
    private String roomTypeDescription;

    // 배정된 학생 정보
    private List<String> studentNames;
    private boolean isEmpty;
    private int occupiedCount;
    private int capacity;

    // 전체 주소
    private String fullAddress;

    // Entity -> DTO
    public static DormitoryDTO from(Dormitory dormitory) {
        return DormitoryDTO.builder()
                .id(dormitory.getId())
                .building(dormitory.getBuilding())
                .floor(dormitory.getFloor())
                .roomNumber(dormitory.getRoomNumber())
                .bedNumber(dormitory.getBedNumber())
                .roomType(dormitory.getRoomType())
                .roomTypeDescription(dormitory.getRoomType().getDescription())
                .studentNames(dormitory.getStudents().stream()
                        .map(student -> student.getUser().getName())
                        .collect(Collectors.toList()))
                .isEmpty(dormitory.isEmpty())
                .occupiedCount(dormitory.getOccupiedCount())
                .fullAddress(dormitory.getFullAddress())
                .build();
    }
}