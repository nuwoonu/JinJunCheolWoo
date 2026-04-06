package com.example.schoolmate.domain.studentrecord.medical.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.domain.studentrecord.medical.dto.MedicalDetailsRequestDTO;
import com.example.schoolmate.domain.studentrecord.medical.entity.MedicalDetails;
import com.example.schoolmate.domain.studentrecord.medical.repository.MedicalDetailsRepository;
import com.example.schoolmate.domain.student.entity.StudentInfo;
import com.example.schoolmate.domain.student.repository.StudentInfoRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Log4j2
public class MedicalDetailsService {

    private final MedicalDetailsRepository medicalDetailsRepository;
    private final StudentInfoRepository studentInfoRepository;

    /**
     * 학생의 건강 정보를 저장합니다.
     * 기존 기록은 유지되며, 새 기록이 추가됩니다 (최신 기록이 현재 건강 정보로 표시됨).
     */
    @Transactional
    public void saveMedicalDetails(Long studentInfoId, MedicalDetailsRequestDTO dto) {
        log.info("학생 건강 정보 저장 - studentInfoId: {}", studentInfoId);

        StudentInfo student = studentInfoRepository.findById(studentInfoId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 학생입니다. ID: " + studentInfoId));

        MedicalDetails medicalDetails = MedicalDetails.builder()
                .BloodGroup(dto.getBloodGroup())
                .Height(dto.getHeight())
                .Weight(dto.getWeight())
                .studentInfo(student)
                .build();
        medicalDetails.setSchool(student.getSchool());

        medicalDetailsRepository.save(medicalDetails);

        log.info("학생 건강 정보 저장 완료 - studentInfoId: {}", studentInfoId);
    }
}
