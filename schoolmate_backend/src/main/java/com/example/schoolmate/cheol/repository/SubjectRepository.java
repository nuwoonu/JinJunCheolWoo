package com.example.schoolmate.cheol.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.cheol.entity.Subject;

public interface SubjectRepository extends JpaRepository<Subject, String> {
    Optional<Subject> findByCode(String code);

    boolean existsByName(String name);
}
