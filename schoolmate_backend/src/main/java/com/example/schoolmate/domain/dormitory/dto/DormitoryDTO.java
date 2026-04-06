package com.example.schoolmate.domain.dormitory.dto;

import java.util.List;
import java.util.stream.Collectors;

import com.example.schoolmate.domain.dormitory.entity.Dormitory;
import com.example.schoolmate.domain.dormitory.entity.DormitoryAssignment;
import com.example.schoolmate.domain.user.entity.constant.RoomType;

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
        private List<Long> studentIds; // cheol: 배정 해제 시 studentInfoId 필요
        private boolean isEmpty;
        private int occupiedCount;
        private int capacity;

        // 전체 주소
        private String fullAddress;

        // Entity -> DTO (현재 학기 배정 기준)
        public static DormitoryDTO from(Dormitory dormitory) {
                List<DormitoryAssignment> assignments = dormitory.getDormitoryAssignments();
                return DormitoryDTO.builder()
                                .id(dormitory.getId())
                                .building(dormitory.getBuilding())
                                .floor(dormitory.getFloor())
                                .roomNumber(dormitory.getRoomNumber())
                                .bedNumber(dormitory.getBedNumber())
                                .roomType(dormitory.getRoomType())
                                .roomTypeDescription(dormitory.getRoomType().getDescription())
                                .studentNames(assignments.stream()
                                                .map(da -> da.getStudentInfo().getUser().getName())
                                                .collect(Collectors.toList()))
                                .studentIds(assignments.stream()
                                                .map(da -> da.getStudentInfo().getId())
                                                .collect(Collectors.toList()))
                                .isEmpty(assignments.isEmpty())
                                .occupiedCount(assignments.size())
                                .fullAddress(dormitory.getFullAddress())
                                .build();
        }
}