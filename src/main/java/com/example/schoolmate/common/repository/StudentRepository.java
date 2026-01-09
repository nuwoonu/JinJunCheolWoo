package com.example.schoolmate.common.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.common.entity.Student;

public interface StudentRepository extends JpaRepository<Student, Long> {
    
}