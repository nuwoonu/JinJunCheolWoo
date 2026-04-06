package com.example.schoolmate.domain.studentrecord.medical.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.domain.studentrecord.medical.entity.MedicalDetails;
import com.example.schoolmate.domain.student.entity.StudentInfo;

public interface MedicalDetailsRepository extends JpaRepository<MedicalDetails, Long> {
    List<MedicalDetails> findByStudentInfo(StudentInfo studentInfo);
    List<MedicalDetails> findByStudentInfoId(Long studentInfoId);
}
