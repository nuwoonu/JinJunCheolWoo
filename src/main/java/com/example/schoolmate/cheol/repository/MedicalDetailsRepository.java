package com.example.schoolmate.cheol.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.cheol.entity.MedicalDetails;
import com.example.schoolmate.common.entity.info.StudentInfo;

public interface MedicalDetailsRepository extends JpaRepository<MedicalDetails, Long> {
    List<MedicalDetails> findByStudentInfo(StudentInfo studentInfo);
    List<MedicalDetails> findByStudentInfoId(Long studentInfoId);
}
