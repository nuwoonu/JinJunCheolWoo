package com.example.schoolmate.domain.studentrecord.awards.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.domain.studentrecord.awards.entity.AwardsAndHonors;

public interface AwardsAndHonorsRepository extends JpaRepository<AwardsAndHonors, Long> {

    List<AwardsAndHonors> findByStudentInfoId(Long studentInfoId);
}
