package com.example.schoolmate.cheol.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.cheol.dto.AwardsAndHonorsRequestDTO;
import com.example.schoolmate.cheol.dto.AwardsAndHonorsResponseDTO;
import com.example.schoolmate.cheol.entity.AwardsAndHonors;
import com.example.schoolmate.cheol.repository.AwardsAndHonorsRepository;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.repository.info.student.StudentInfoRepository;

import lombok.RequiredArgsConstructor;

// [cheol] 수상 경력 Service
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AwardsAndHonorsService {

    private final AwardsAndHonorsRepository awardsAndHonorsRepository;
    private final StudentInfoRepository studentInfoRepository;

    // 학생별 전체 수상 경력 조회
    public List<AwardsAndHonorsResponseDTO> getByStudentId(Long studentId) {
        return awardsAndHonorsRepository.findByStudentInfoId(studentId).stream()
                .map(AwardsAndHonorsResponseDTO::from)
                .collect(Collectors.toList());
    }

    // 수상 경력 등록
    @Transactional
    public AwardsAndHonorsResponseDTO save(AwardsAndHonorsRequestDTO request) {
        StudentInfo student = studentInfoRepository.findById(request.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 학생입니다. ID: " + request.getStudentId()));

        AwardsAndHonors award = AwardsAndHonors.builder()
                .studentInfo(student)
                .name(request.getName())
                .achievementsGrade(request.getAchievementsGrade())
                .day(request.getDay())
                .awardingOrganization(request.getAwardingOrganization())
                .build();

        return AwardsAndHonorsResponseDTO.from(awardsAndHonorsRepository.save(award));
    }

    // 수상 경력 삭제
    @Transactional
    public void delete(Long id) {
        AwardsAndHonors award = awardsAndHonorsRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 수상 경력입니다. ID: " + id));
        awardsAndHonorsRepository.delete(award);
    }
}
