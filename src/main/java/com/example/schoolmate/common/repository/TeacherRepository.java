package com.example.schoolmate.common.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.common.entity.Teacher;

public interface TeacherRepository extends JpaRepository<Teacher, Long> {

}