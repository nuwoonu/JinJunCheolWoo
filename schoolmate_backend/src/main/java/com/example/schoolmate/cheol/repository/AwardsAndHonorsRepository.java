package com.example.schoolmate.cheol.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.cheol.entity.AwardsAndHonors;

public interface AwardsAndHonorsRepository extends JpaRepository<AwardsAndHonors, Long> {

    List<AwardsAndHonors> findByStudentInfoId(Long studentInfoId);
}
