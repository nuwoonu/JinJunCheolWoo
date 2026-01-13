package com.example.schoolmate.parkjoon.mapper;

import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.parkjoon.dto.AdminClassDTO;
import com.example.schoolmate.parkjoon.entity.Classroom;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class AdminClassMapper {

    public AdminClassDTO.ClassInfoResponse toClassInfoResponse(Classroom classroom) {
        User teacher = classroom.getTeacher();

        return AdminClassDTO.ClassInfoResponse.builder()
                .cid(classroom.getCid())
                .gradeAndClass(classroom.getGrade() + "학년 " + classroom.getClassNum() + "반")
                .teacherName(teacher != null ? teacher.getName() : "미배정")
                .subject(getSubjectFromUser(teacher))
                .build();
    }

    public AdminClassDTO.TeacherSelectResponse toTeacherSelectResponse(User user) {
        return AdminClassDTO.TeacherSelectResponse.builder()
                .uid(user.getUid())
                .displayName(user.getName() + " (" + getSubjectFromUser(user) + ")")
                .build();
    }

    private String getSubjectFromUser(User user) {
        if (user == null)
            return "-";

        return Optional.ofNullable(user.getInfo(TeacherInfo.class))
                .map(TeacherInfo::getSubject)
                .filter(s -> !s.isBlank())
                .orElse("과목미정");
    }
}