package com.example.schoolmate.domain.timetable.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.domain.timetable.entity.StudentTimetable;

public interface TimetableRepository extends JpaRepository<StudentTimetable, Long> {

}
