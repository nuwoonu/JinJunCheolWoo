package com.example.schoolmate.cheol.service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.cheol.dto.volunteerActivitydto.VolunteerActivityRequestDTO;
import com.example.schoolmate.cheol.dto.volunteerActivitydto.VolunteerActivityResponseDTO;
import com.example.schoolmate.cheol.entity.VolunteerActivity;
import com.example.schoolmate.cheol.repository.VolunteerActivityRepository;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.repository.info.student.StudentInfoRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

// [cheol] 봉사활동 Service - cumulativeHours는 startDate 순으로 자동 누계 계산
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Log4j2
public class VolunteerActivityService {

    private final VolunteerActivityRepository volunteerActivityRepository;
    private final StudentInfoRepository studentInfoRepository;

    // 학생별 전체 봉사활동 조회
    public List<VolunteerActivityResponseDTO> getByStudentId(Long studentId) {
        return volunteerActivityRepository.findByStudentInfoId(studentId).stream()
                .sorted(Comparator.comparing(VolunteerActivity::getYear)
                        .thenComparing(VolunteerActivity::getStartDate))
                .map(VolunteerActivityResponseDTO::from)
                .collect(Collectors.toList());
    }

    // 학생별 특정 학년 봉사활동 조회
    public List<VolunteerActivityResponseDTO> getByStudentIdAndYear(Long studentId,
            com.example.schoolmate.common.entity.user.constant.Year year) {
        return volunteerActivityRepository.findByStudentInfoIdAndYear(studentId, year).stream()
                .sorted(Comparator.comparing(VolunteerActivity::getStartDate))
                .map(VolunteerActivityResponseDTO::from)
                .collect(Collectors.toList());
    }

    // 봉사활동 등록 (cumulativeHours 자동 계산)
    @Transactional
    public VolunteerActivityResponseDTO save(VolunteerActivityRequestDTO request) {
        StudentInfo student = studentInfoRepository.findById(request.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 학생입니다. ID: " + request.getStudentId()));

        VolunteerActivity newActivity = VolunteerActivity.builder()
                .studentInfo(student)
                .year(request.getYear())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .organizer(request.getOrganizer())
                .activityContent(request.getActivityContent())
                .hours(request.getHours())
                .cumulativeHours(0.0) // 임시값, 아래에서 재계산
                .build();

        volunteerActivityRepository.save(newActivity);

        // 해당 학년 전체 레코드 누계 재계산
        recalculateCumulativeHours(request.getStudentId(), request.getYear());

        log.info("봉사활동 등록 - 학생 ID: {}, 학년: {}, 시간: {}", request.getStudentId(), request.getYear(), request.getHours());
        return VolunteerActivityResponseDTO.from(newActivity);
    }

    // 봉사활동 수정 (cumulativeHours 자동 재계산)
    @Transactional
    public VolunteerActivityResponseDTO update(Long id, VolunteerActivityRequestDTO request) {
        VolunteerActivity activity = volunteerActivityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 봉사활동입니다. ID: " + id));

        activity.update(request.getYear(), request.getStartDate(), request.getEndDate(),
                request.getOrganizer(), request.getActivityContent(), request.getHours());

        // 수정된 학년 기준으로 누계 재계산 (학년이 변경된 경우 이전 학년도 재계산)
        if (!activity.getYear().equals(request.getYear())) {
            recalculateCumulativeHours(activity.getStudentInfo().getId(), activity.getYear());
        }
        recalculateCumulativeHours(activity.getStudentInfo().getId(), request.getYear());

        log.info("봉사활동 수정 - ID: {}, 학년: {}, 시간: {}", id, request.getYear(), request.getHours());
        return VolunteerActivityResponseDTO.from(activity);
    }

    // 봉사활동 삭제 (삭제 후 해당 학년 누계 재계산)
    @Transactional
    public void delete(Long id) {
        VolunteerActivity activity = volunteerActivityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 봉사활동입니다. ID: " + id));

        Long studentId = activity.getStudentInfo().getId();
        com.example.schoolmate.common.entity.user.constant.Year year = activity.getYear();

        volunteerActivityRepository.delete(activity);
        recalculateCumulativeHours(studentId, year);

        log.info("봉사활동 삭제 - ID: {}", id);
    }

    /**
     * 동일 학생 + 학년의 모든 봉사활동을 startDate 오름차순으로 정렬 후
     * cumulativeHours를 순차 누계하여 저장
     */
    private void recalculateCumulativeHours(Long studentId,
            com.example.schoolmate.common.entity.user.constant.Year year) {
        List<VolunteerActivity> activities = volunteerActivityRepository
                .findByStudentInfoIdAndYear(studentId, year).stream()
                .sorted(Comparator.comparing(VolunteerActivity::getStartDate))
                .collect(Collectors.toList());

        double cumulative = 0.0;
        for (VolunteerActivity activity : activities) {
            cumulative += activity.getHours();
            activity.updateCumulativeHours(cumulative);
        }
        volunteerActivityRepository.saveAll(activities);
    }
}
