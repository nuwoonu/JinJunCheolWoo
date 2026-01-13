package com.example.schoolmate.common.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.common.entity.info.TeacherInfo;

public interface TeacherInfoRepository extends JpaRepository<TeacherInfo, Long> {
    List<TeacherInfo> findBySubject(String subject);
}