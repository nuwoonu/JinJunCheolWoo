package com.example.schoolmate.soojin.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.soojin.entity.StudentAttendance;

public interface AttendanceRepository extends JpaRepository<StudentAttendance, Long> {

}
