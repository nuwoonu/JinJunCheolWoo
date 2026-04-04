package com.example.schoolmate.domain.classgoal.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.domain.classroom.entity.Classroom;
import com.example.schoolmate.domain.teacher.entity.TeacherInfo;
import com.example.schoolmate.domain.classroom.repository.ClassroomRepository;
import com.example.schoolmate.domain.teacher.repository.TeacherInfoRepository;
import com.example.schoolmate.domain.teacher.service.TeacherService;
import com.example.schoolmate.domain.classgoal.dto.ClassGoalDTO;
import com.example.schoolmate.domain.classgoal.entity.ClassGoal;
import com.example.schoolmate.domain.classgoal.repository.ClassGoalRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

// [soojin] 이달의 학급 목표 서비스
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClassGoalService {

    private final ClassGoalRepository classGoalRepository;
    private final ClassroomRepository classroomRepository;
    private final TeacherInfoRepository teacherInfoRepository;
    private final TeacherService teacherService;

    /**
     * 학급 목표 조회 (학생/교사/학부모 공통)
     * 없으면 Optional.empty() → Controller에서 204 No Content 반환
     */
    public Optional<ClassGoalDTO.Response> getGoal(Long classroomId, int year, int month) {
        return classGoalRepository.findByClassroom_CidAndYearAndMonth(classroomId, year, month)
                .map(this::toResponse);
    }

    /**
     * 학급 목표 저장/수정 (교사 전용)
     * - 해당 월 목표가 없으면 신규 생성
     * - 있으면 goal + actionItems 수정
     */
    @Transactional
    public ClassGoalDTO.Response saveGoal(Long teacherUid, Long classroomId, int year, int month,
            ClassGoalDTO.SaveRequest req) {

        // 교사 정보 조회
        TeacherInfo teacher = teacherInfoRepository.findByUserUid(teacherUid)
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));

        // 학급 존재 여부 확인
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new IllegalArgumentException("학급을 찾을 수 없습니다: " + classroomId));

        // 담임 여부 검증 (AttendanceService와 동일 패턴)
        teacherService.getMyClassroom(teacher.getId(), year)
                .filter(c -> c.getCid().equals(classroomId))
                .orElseThrow(() -> new SecurityException("담당 학급에만 목표를 설정할 수 있습니다."));

        List<String> actionItems = req.getActionItems() != null
                ? new ArrayList<>(req.getActionItems())
                : new ArrayList<>();

        ClassGoal classGoal = classGoalRepository
                .findByClassroom_CidAndYearAndMonth(classroomId, year, month)
                .orElse(null);

        if (classGoal == null) {
            // 신규 생성
            classGoal = ClassGoal.builder()
                    .classroom(classroom)
                    .year(year)
                    .month(month)
                    .goal(req.getGoal())
                    .actionItems(actionItems)
                    .build();
            classGoal.setSchool(classroom.getSchool());
            classGoalRepository.save(classGoal);
            log.info("[soojin] 학급 목표 생성 - classroomId: {}, {}년 {}월", classroomId, year, month);
        } else {
            // 수정
            classGoal.update(req.getGoal(), actionItems);
            log.info("[soojin] 학급 목표 수정 - classroomId: {}, {}년 {}월", classroomId, year, month);
        }

        return toResponse(classGoal);
    }

    // ========== 내부 변환 ==========

    private ClassGoalDTO.Response toResponse(ClassGoal g) {
        return ClassGoalDTO.Response.builder()
                .id(g.getId())
                .classroomId(g.getClassroom().getCid())
                .year(g.getYear())
                .month(g.getMonth())
                .goal(g.getGoal())
                .actionItems(g.getActionItems())
                .build();
    }
}
