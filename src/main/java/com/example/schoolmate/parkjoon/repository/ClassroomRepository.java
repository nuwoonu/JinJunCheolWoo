package com.example.schoolmate.parkjoon.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.parkjoon.entity.Classroom;

public interface ClassroomRepository extends JpaRepository<Classroom, Long> {

}
