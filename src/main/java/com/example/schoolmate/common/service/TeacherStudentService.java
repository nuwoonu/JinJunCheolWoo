package com.example.schoolmate.common.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.dto.TeacherStudentDTO;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.assignment.TeacherStudent;
import com.example.schoolmate.common.entity.info.constant.TeacherRole;
import com.example.schoolmate.common.repository.StudentInfoRepository;
import com.example.schoolmate.common.repository.TeacherInfoRepository;
import com.example.schoolmate.common.repository.TeacherStudentRepository;

import lombok.RequiredArgsConstructor;

/**
 * 교사-학생 관계 관리 서비스
 *
 * 담임 배정, 교과담당 배정 등 교사와 학생 간의 관계를 관리함.
 * 학년도별로 관계가 구분되어 매년 새로운 배정이 가능함.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class TeacherStudentService {

    private final TeacherStudentRepository teacherStudentRepository;
    private final TeacherInfoRepository teacherInfoRepository;
    private final StudentInfoRepository studentInfoRepository;

    // ==================== 배정 관련 ====================

    /**
     * 교사-학생 관계 생성 (단일)
     *
     * @param request 배정 요청 정보
     * @return 생성된 관계 ID
     */
    public Long assignTeacherToStudent(TeacherStudentDTO.AssignRequest request) {
        // 1. 교사/학생 정보 조회
        TeacherInfo teacher = teacherInfoRepository.findById(request.getTeacherInfoId())
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없음: " + request.getTeacherInfoId()));

        StudentInfo student = studentInfoRepository.findById(request.getStudentInfoId())
                .orElseThrow(() -> new IllegalArgumentException("학생 정보를 찾을 수 없음: " + request.getStudentInfoId()));

        TeacherRole role = TeacherRole.valueOf(request.getRoleName());

        // 2. 중복 배정 체크
        if (teacherStudentRepository.existsByTeacherInfoIdAndStudentInfoIdAndSchoolYearAndRole(
                request.getTeacherInfoId(), request.getStudentInfoId(), request.getSchoolYear(), role)) {
            throw new IllegalStateException("이미 동일한 관계가 존재함");
        }

        // 3. 관계 생성
        TeacherStudent ts = TeacherStudent.builder()
                .teacherInfo(teacher)
                .studentInfo(student)
                .schoolYear(request.getSchoolYear())
                .role(role)
                .subjectName(request.getSubjectName())
                .build();

        return teacherStudentRepository.save(ts).getId();
    }

    /**
     * 다수 학생 일괄 배정 (담임 배정 등)
     *
     * @param request 일괄 배정 요청
     * @return 배정된 관계 수
     */
    public int bulkAssign(TeacherStudentDTO.BulkAssignRequest request) {
        TeacherInfo teacher = teacherInfoRepository.findById(request.getTeacherInfoId())
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없음"));

        TeacherRole role = TeacherRole.valueOf(request.getRoleName());
        int count = 0;

        for (Long studentInfoId : request.getStudentInfoIds()) {
            // 중복 체크 후 배정
            if (!teacherStudentRepository.existsByTeacherInfoIdAndStudentInfoIdAndSchoolYearAndRole(
                    request.getTeacherInfoId(), studentInfoId, request.getSchoolYear(), role)) {

                StudentInfo student = studentInfoRepository.findById(studentInfoId)
                        .orElseThrow(() -> new IllegalArgumentException("학생 정보를 찾을 수 없음: " + studentInfoId));

                TeacherStudent ts = TeacherStudent.builder()
                        .teacherInfo(teacher)
                        .studentInfo(student)
                        .schoolYear(request.getSchoolYear())
                        .role(role)
                        .build();

                teacherStudentRepository.save(ts);
                count++;
            }
        }

        return count;
    }

    /**
     * 교사-학생 관계 삭제
     */
    public void removeAssignment(TeacherStudentDTO.RemoveRequest request) {
        TeacherRole role = TeacherRole.valueOf(request.getRoleName());

        teacherStudentRepository.deleteByTeacherInfoIdAndStudentInfoIdAndSchoolYearAndRole(
                request.getTeacherInfoId(),
                request.getStudentInfoId(),
                request.getSchoolYear(),
                role);
    }

    // ==================== 조회 관련 ====================

    /**
     * 특정 교사의 담당 학생 목록 조회
     *
     * @param teacherInfoId 교사 Info ID
     * @param schoolYear    학년도
     * @return 담당 학생 목록
     */
    @Transactional(readOnly = true)
    public List<TeacherStudentDTO.AssignedStudentResponse> getAssignedStudents(Long teacherInfoId, int schoolYear) {
        List<TeacherStudent> list = teacherStudentRepository.findWithStudentByTeacherAndYear(teacherInfoId, schoolYear);

        return list.stream()
                .map(TeacherStudentDTO.AssignedStudentResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * 특정 교사의 역할별 담당 학생 목록 조회
     */
    @Transactional(readOnly = true)
    public List<TeacherStudentDTO.AssignedStudentResponse> getAssignedStudentsByRole(
            Long teacherInfoId, int schoolYear, String roleName) {

        TeacherRole role = TeacherRole.valueOf(roleName);
        List<TeacherStudent> list = teacherStudentRepository
                .findByTeacherInfoIdAndSchoolYearAndRole(teacherInfoId, schoolYear, role);

        return list.stream()
                .map(TeacherStudentDTO.AssignedStudentResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * 특정 학생의 담당 교사 목록 조회
     *
     * @param studentInfoId 학생 Info ID
     * @param schoolYear    학년도
     * @return 담당 교사 목록
     */
    @Transactional(readOnly = true)
    public List<TeacherStudentDTO.AssignedTeacherResponse> getAssignedTeachers(Long studentInfoId, int schoolYear) {
        List<TeacherStudent> list = teacherStudentRepository.findWithTeacherByStudentAndYear(studentInfoId, schoolYear);

        return list.stream()
                .map(TeacherStudentDTO.AssignedTeacherResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * 특정 학생의 담임교사 조회
     */
    @Transactional(readOnly = true)
    public TeacherStudentDTO.AssignedTeacherResponse getHomeroomTeacher(Long studentInfoId, int schoolYear) {
        return teacherStudentRepository
                .findByStudentInfoIdAndSchoolYearAndRole(studentInfoId, schoolYear, TeacherRole.HOMEROOM)
                .map(TeacherStudentDTO.AssignedTeacherResponse::new)
                .orElse(null);
    }

    /**
     * 특정 학급의 교사 목록 조회
     */
    @Transactional(readOnly = true)
    public TeacherStudentDTO.ClassTeacherResponse getClassTeachers(int schoolYear, int grade, int classNum) {
        List<TeacherStudent> list = teacherStudentRepository.findByClassInfo(schoolYear, grade, classNum);

        // 중복 교사 제거를 위해 교사 기준으로 그룹화
        List<TeacherStudentDTO.AssignedTeacherResponse> teachers = list.stream()
                .map(TeacherStudentDTO.AssignedTeacherResponse::new)
                .distinct()
                .collect(Collectors.toList());

        return TeacherStudentDTO.ClassTeacherResponse.builder()
                .schoolYear(schoolYear)
                .grade(grade)
                .classNum(classNum)
                .teachers(teachers)
                .build();
    }
}
