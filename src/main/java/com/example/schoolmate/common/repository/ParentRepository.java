package com.example.schoolmate.common.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.common.entity.Parent;

public interface ParentRepository extends JpaRepository<Parent, Long> {

}