package com.example.schoolmate.soojin.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.soojin.entity.StudentTimetable;

public interface TimetableRepository extends JpaRepository<StudentTimetable, Long> {

}
