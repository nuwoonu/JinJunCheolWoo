package com.example.schoolmate.soojin.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.soojin.entity.SchoolCalendar;

public interface CalendarRepository extends JpaRepository<SchoolCalendar, Long> {

}
