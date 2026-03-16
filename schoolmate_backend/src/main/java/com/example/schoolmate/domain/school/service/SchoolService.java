package com.example.schoolmate.domain.school.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.domain.school.dto.SchoolDTO;
import com.example.schoolmate.domain.school.entity.School;
import com.example.schoolmate.domain.school.repository.SchoolRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SchoolService {

    private final SchoolRepository schoolRepository;

    /**
     * 학교 목록 검색 (이름/종류/교육청 기준, 빈 값은 조건 제외)
     */
    public Page<SchoolDTO.Summary> searchSchools(String name, String schoolKind, String officeOfEducation, Pageable pageable) {
        String nameParam = (name != null && !name.isBlank()) ? name : null;
        String kindParam = (schoolKind != null && !schoolKind.isBlank()) ? schoolKind : null;
        String officeParam = (officeOfEducation != null && !officeOfEducation.isBlank()) ? officeOfEducation : null;
        return schoolRepository.searchSchools(nameParam, kindParam, officeParam, pageable)
                .map(SchoolDTO.Summary::from);
    }

    /**
     * 학교 상세 조회
     */
    public SchoolDTO.Detail getSchool(Long id) {
        School school = schoolRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("학교를 찾을 수 없습니다: " + id));
        return SchoolDTO.Detail.from(school);
    }
}
