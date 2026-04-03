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
import com.example.schoolmate.common.repository.info.TeacherStudentRepository;
import com.example.schoolmate.common.repository.info.student.StudentInfoRepository;
import com.example.schoolmate.common.repository.info.teacher.TeacherInfoRepository;
import com.example.schoolmate.config.school.SchoolContextHolder;
import com.example.schoolmate.domain.school.entity.School;
import com.example.schoolmate.domain.school.repository.SchoolRepository;
import com.example.schoolmate.domain.term.entity.SchoolYear;
import com.example.schoolmate.domain.term.entity.SchoolYearStatus;
import com.example.schoolmate.domain.term.repository.SchoolYearRepository;

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
    private final SchoolYearRepository schoolYearRepository;
    private final SchoolRepository schoolRepository;

    // ==================== 배정 관련 ====================

    /**
     * 교사-학생 관계 생성 (단일)
     */
    public Long assignTeacherToStudent(TeacherStudentDTO.AssignRequest request) {
        TeacherInfo teacher = teacherInfoRepository.findById(request.getTeacherInfoId())
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없음: " + request.getTeacherInfoId()));

        StudentInfo student = studentInfoRepository.findById(request.getStudentInfoId())
                .orElseThrow(() -> new IllegalArgumentException("학생 정보를 찾을 수 없음: " + request.getStudentInfoId()));

        TeacherRole role = TeacherRole.valueOf(request.getRoleName());

        if (teacherStudentRepository.existsByTeacherInfoIdAndStudentInfoIdAndSchoolYear_YearAndRole(
                request.getTeacherInfoId(), request.getStudentInfoId(), request.getSchoolYear(), role)) {
            throw new IllegalStateException("이미 동일한 관계가 존재함");
        }

        SchoolYear schoolYear = resolveSchoolYear(request.getSchoolYear(), student.getSchool());

        TeacherStudent ts = TeacherStudent.builder()
                .teacherInfo(teacher)
                .studentInfo(student)
                .schoolYear(schoolYear)
                .role(role)
                .subjectName(request.getSubjectName())
                .build();

        return teacherStudentRepository.save(ts).getId();
    }

    /**
     * 다수 학생 일괄 배정 (담임 배정 등)
     */
    public int bulkAssign(TeacherStudentDTO.BulkAssignRequest request) {
        TeacherInfo teacher = teacherInfoRepository.findById(request.getTeacherInfoId())
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없음"));

        TeacherRole role = TeacherRole.valueOf(request.getRoleName());
        int count = 0;

        for (Long studentInfoId : request.getStudentInfoIds()) {
            if (!teacherStudentRepository.existsByTeacherInfoIdAndStudentInfoIdAndSchoolYear_YearAndRole(
                    request.getTeacherInfoId(), studentInfoId, request.getSchoolYear(), role)) {

                StudentInfo student = studentInfoRepository.findById(studentInfoId)
                        .orElseThrow(() -> new IllegalArgumentException("학생 정보를 찾을 수 없음: " + studentInfoId));

                SchoolYear schoolYear = resolveSchoolYear(request.getSchoolYear(), student.getSchool());

                TeacherStudent ts = TeacherStudent.builder()
                        .teacherInfo(teacher)
                        .studentInfo(student)
                        .schoolYear(schoolYear)
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

        teacherStudentRepository.deleteByTeacherInfoIdAndStudentInfoIdAndSchoolYear_YearAndRole(
                request.getTeacherInfoId(),
                request.getStudentInfoId(),
                request.getSchoolYear(),
                role);
    }

    // ==================== 조회 관련 ====================

    @Transactional(readOnly = true)
    public List<TeacherStudentDTO.AssignedStudentResponse> getAssignedStudents(Long teacherInfoId, int schoolYear) {
        List<TeacherStudent> list = teacherStudentRepository.findWithStudentByTeacherAndYear(teacherInfoId, schoolYear);
        return list.stream().map(TeacherStudentDTO.AssignedStudentResponse::new).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TeacherStudentDTO.AssignedStudentResponse> getAssignedStudentsByRole(
            Long teacherInfoId, int schoolYear, String roleName) {
        TeacherRole role = TeacherRole.valueOf(roleName);
        List<TeacherStudent> list = teacherStudentRepository
                .findByTeacherInfoIdAndSchoolYear_YearAndRole(teacherInfoId, schoolYear, role);
        return list.stream().map(TeacherStudentDTO.AssignedStudentResponse::new).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TeacherStudentDTO.AssignedTeacherResponse> getAssignedTeachers(Long studentInfoId, int schoolYear) {
        List<TeacherStudent> list = teacherStudentRepository.findWithTeacherByStudentAndYear(studentInfoId, schoolYear);
        return list.stream().map(TeacherStudentDTO.AssignedTeacherResponse::new).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TeacherStudentDTO.AssignedTeacherResponse getHomeroomTeacher(Long studentInfoId, int schoolYear) {
        return teacherStudentRepository
                .findByStudentInfoIdAndSchoolYear_YearAndRole(studentInfoId, schoolYear, TeacherRole.HOMEROOM)
                .map(TeacherStudentDTO.AssignedTeacherResponse::new)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public TeacherStudentDTO.ClassTeacherResponse getClassTeachers(int schoolYear, int grade, int classNum) {
        List<TeacherStudent> list = teacherStudentRepository.findByClassInfo(grade, classNum);

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

    // ── 내부 유틸 ────────────────────────────────────────────────────────────

    /** school + year → SchoolYear 엔티티 조회 또는 생성 */
    private SchoolYear resolveSchoolYear(int year, School school) {
        if (school == null) {
            Long schoolId = SchoolContextHolder.getSchoolId();
            if (schoolId != null) {
                school = schoolRepository.findById(schoolId).orElse(null);
            }
        }
        if (school == null) {
            throw new IllegalStateException("학교 정보를 확인할 수 없습니다.");
        }
        final School finalSchool = school;
        return schoolYearRepository.findBySchoolIdAndYear(school.getId(), year)
                .orElseGet(() -> {
                    SchoolYearStatus status = (java.time.LocalDate.now().getYear() == year) ? SchoolYearStatus.CURRENT : SchoolYearStatus.PAST;
                    SchoolYear sy = new SchoolYear(year, status);
                    sy.setSchool(finalSchool);
                    return schoolYearRepository.save(sy);
                });
    }
}
