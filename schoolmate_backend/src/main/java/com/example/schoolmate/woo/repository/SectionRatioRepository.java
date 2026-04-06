package com.example.schoolmate.woo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.woo.entity.SectionRatio;

// [woo] 분반 성적 비율 Repository
public interface SectionRatioRepository extends JpaRepository<SectionRatio, Long> {

    Optional<SectionRatio> findBySection_Id(Long sectionId);
}
