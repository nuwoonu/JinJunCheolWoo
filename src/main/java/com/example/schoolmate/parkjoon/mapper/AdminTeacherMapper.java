package com.example.schoolmate.parkjoon.mapper;

import org.springframework.stereotype.Component;

import com.example.schoolmate.common.dto.TeacherDTO;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.constant.TeacherStatus;
import com.example.schoolmate.common.entity.user.User;

@Component
public class AdminTeacherMapper {

    public TeacherDTO.DetailResponse toDetailResponse(User user) {
        TeacherInfo info = user.getInfo(TeacherInfo.class);

        // TeacherInfo가 없을 경우를 대비한 기본값 설정
        TeacherStatus currentStatus = (info != null) ? info.getStatus() : TeacherStatus.EMPLOYED;

        return TeacherDTO.DetailResponse.builder()
                .uid(user.getUid())
                .name(user.getName())
                .email(user.getEmail())
                .code(info != null ? info.getCode() : "-")
                .subject(info != null ? info.getSubject() : "-")
                // Enum 정보 매핑
                .status(currentStatus)
                .statusName(currentStatus.name())
                .statusDesc(currentStatus.getDescription())
                .department(info != null ? info.getDepartment() : "-")
                .position(info != null ? info.getPosition() : "-")
                .build();
    }
}
