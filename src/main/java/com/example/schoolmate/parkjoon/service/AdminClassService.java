package com.example.schoolmate.parkjoon.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.dto.ClassDTO;
import com.example.schoolmate.common.dto.TeacherDTO;
import com.example.schoolmate.common.entity.Classroom;
import com.example.schoolmate.common.entity.info.constant.ClassroomStatus;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.parkjoon.repository.ClassroomRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@RequiredArgsConstructor
@Transactional
@Log4j2
public class AdminClassService {

    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<ClassDTO.DetailResponse> getClassList(ClassDTO.SearchCondition cond, Pageable pageable) {
        return classroomRepository.search(cond, pageable)
                .map(c -> {
                    long count = userRepository.countByClassroom(c.getYear(), c.getGrade(), c.getClassNum());
                    return ClassDTO.DetailResponse.from(c, (int) count);
                });
    }

    @Transactional(readOnly = true)
    public ClassDTO.DetailResponse getClassDetail(Long cid) {
        Classroom classroom = classroomRepository.findById(cid)
                .orElseThrow(() -> new IllegalArgumentException("학급 정보를 찾을 수 없습니다."));

        // 해당 학급(학년도, 학년, 반)에 배정된 학생 조회
        // StudentAssignmentRepository 등을 통해 조회하거나 UserRepositoryCustom 사용
        // 여기서는 로직 설명을 위해 의사 코드로 작성 (실제 구현 시 Repository 메서드 필요)
        List<User> students = userRepository.findStudentsByAssignment(
                classroom.getYear(), classroom.getGrade(), classroom.getClassNum());

        ClassDTO.DetailResponse response = ClassDTO.DetailResponse.from(classroom, students.size());

        List<ClassDTO.StudentSummary> studentSummaries = students.stream().map(u -> {
            StudentInfo info = u.getInfo(StudentInfo.class);
            StudentAssignment assign = info.getAssignments().stream()
                    .filter(a -> a.getSchoolYear() == classroom.getYear())
                    .findFirst().orElse(null);

            return new ClassDTO.StudentSummary(
                    u.getUid(),
                    u.getName(),
                    info.getCode(),
                    assign != null ? assign.getStudentNum() : null,
                    "-", // 성별 정보 없음
                    info.getStatus().getDescription());
        }).collect(Collectors.toList());

        response.setStudents(studentSummaries);
        return response;
    }

    @Transactional(readOnly = true)
    public List<ClassDTO.TeacherSelectResponse> getTeacherListForDropdown() {
        log.info("[AdminClassService] getTeacherListForDropdown 호출됨");
        TeacherDTO.TeacherSearchCondition cond = new TeacherDTO.TeacherSearchCondition();
        cond.setStatus("EMPLOYED");

        try {
            List<ClassDTO.TeacherSelectResponse> list = userRepository.searchTeachers(cond, Pageable.unpaged())
                    .stream().map(ClassDTO.TeacherSelectResponse::from)
                    .collect(Collectors.toList());
            log.info("[AdminClassService] 교사 목록 변환 완료. 리스트 크기: {}", list.size());
            return list;
        } catch (Exception e) {
            log.error("[AdminClassService] 교사 목록 조회/변환 중 에러 발생", e);
            throw e;
        }
    }

    public Long createClass(ClassDTO.CreateRequest request) {
        log.info("[AdminClassService] createClass 호출됨");
        // 중복 확인
        boolean exists = classroomRepository.existsByYearAndGradeAndClassNum(
                request.getYear(), request.getGrade(), request.getClassNum());
        if (exists) {
            throw new IllegalArgumentException("이미 존재하는 학급입니다.");
        }

        Classroom classroom = new Classroom();
        classroom.setYear(request.getYear());
        classroom.setGrade(request.getGrade());
        classroom.setClassNum(request.getClassNum());

        if (request.getTeacherUid() != null) {
            User teacher = userRepository.findById(request.getTeacherUid())
                    .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다."));
            classroom.setTeacher(teacher);
        }

        Long cid = classroomRepository.save(classroom).getCid();

        // 1. 수동 선택 학생 배정
        if (request.getStudentUids() != null && !request.getStudentUids().isEmpty()) {
            addStudents(cid, request.getStudentUids());
        }

        // 2. 랜덤 학생 배정
        if (request.getRandomCount() != null && request.getRandomCount() > 0) {
            List<User> randomStudents = userRepository.findUnassignedStudents(request.getYear(),
                    request.getRandomCount());
            addStudents(cid, randomStudents.stream().map(User::getUid).toList());
        }

        return cid;
    }

    public void updateClass(ClassDTO.UpdateRequest request) {
        Classroom classroom = classroomRepository.findById(request.getCid())
                .orElseThrow(() -> new IllegalArgumentException("학급 정보를 찾을 수 없습니다."));

        if (request.getTeacherUid() != null) {
            User teacher = userRepository.findById(request.getTeacherUid())
                    .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다."));
            classroom.setTeacher(teacher);
        } else {
            classroom.setTeacher(null);
        }
    }

    public void addStudents(Long cid, List<Long> studentUids) {
        Classroom classroom = classroomRepository.findById(cid)
                .orElseThrow(() -> new IllegalArgumentException("학급 정보를 찾을 수 없습니다."));

        List<User> users = userRepository.findAllById(studentUids);

        // 현재 학급의 가장 마지막 번호 조회 (자동 번호 부여용)
        // int maxNum = ...;
        int nextNum = 1; // 임시

        for (User user : users) {
            StudentInfo info = user.getInfo(StudentInfo.class);

            // 이미 해당 학년도에 배정된 정보가 있는지 확인
            boolean assigned = info.getAssignments().stream()
                    .anyMatch(a -> a.getSchoolYear() == classroom.getYear());

            if (assigned) {
                // 이미 배정된 경우: 전반(Transfer) 처리 또는 예외 발생
                // 여기서는 기존 배정을 업데이트하는 방식으로 구현
                StudentAssignment assignment = info.getAssignments().stream()
                        .filter(a -> a.getSchoolYear() == classroom.getYear())
                        .findFirst().get();
                assignment.setGrade(classroom.getGrade());
                assignment.setClassNum(classroom.getClassNum());
                // 번호는 유지하거나 재할당
            } else {
                // 신규 배정
                StudentAssignment assignment = new StudentAssignment();
                assignment.setStudentInfo(info);
                assignment.setSchoolYear(classroom.getYear());
                assignment.setGrade(classroom.getGrade());
                assignment.setClassNum(classroom.getClassNum());
                assignment.setStudentNum(nextNum++); // 임시 번호
                info.getAssignments().add(assignment);
            }
        }
    }

    public void removeStudent(Long cid, Long studentUid) {
        Classroom classroom = classroomRepository.findById(cid)
                .orElseThrow(() -> new IllegalArgumentException("학급 정보를 찾을 수 없습니다."));

        User user = userRepository.findById(studentUid)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

        StudentInfo info = user.getInfo(StudentInfo.class);

        // 해당 학년도의 배정 정보 삭제
        info.getAssignments().removeIf(a -> a.getSchoolYear() == classroom.getYear() &&
                a.getGrade() == classroom.getGrade() &&
                a.getClassNum() == classroom.getClassNum());
    }

    public void bulkUpdateClassStatus(List<Long> cids, String statusName) {
        ClassroomStatus status = ClassroomStatus.valueOf(statusName);
        List<Classroom> classrooms = classroomRepository.findAllById(cids);
        for (Classroom classroom : classrooms) {
            classroom.setStatus(status);
        }
    }
}