package com.example.schoolmate.domain.term.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.domain.classroom.entity.Classroom;
import com.example.schoolmate.domain.teacher.entity.TeacherInfo;
import com.example.schoolmate.domain.classroom.repository.ClassroomRepository;
import com.example.schoolmate.domain.student.repository.StudentAssignmentRepository;
import com.example.schoolmate.domain.teacher.repository.TeacherInfoRepository;
import com.example.schoolmate.global.config.school.SchoolContextHolder;
import com.example.schoolmate.domain.term.entity.AcademicTerm;
import com.example.schoolmate.domain.term.entity.AcademicTermStatus;
import com.example.schoolmate.domain.term.entity.CourseSection;
import com.example.schoolmate.domain.term.repository.AcademicTermRepository;
import com.example.schoolmate.domain.term.repository.CourseSectionRepository;

import lombok.RequiredArgsConstructor;

/**
 * 수업 분반(CourseSection) 서비스
 *
 * - 교사의 현재 학기 담당 강좌 목록 조회 (과제 출제 시 선택 용도)
 * - 강좌 개설/수정/삭제 (관리자 용도)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourseSectionService {

    private final CourseSectionRepository courseSectionRepository;
    private final TeacherInfoRepository teacherInfoRepository;
    private final ClassroomRepository classroomRepository;
    private final AcademicTermRepository academicTermRepository;
    private final StudentAssignmentRepository studentAssignmentRepository;

    /**
     * 교사의 현재 학기 담당 강좌 목록
     * 과제 출제 화면에서 "어느 수업에 과제를 낼지" 선택 목록으로 사용합니다.
     */
    public List<CourseSection> getMyCurrentSections(Long teacherUid) {
        TeacherInfo teacher = teacherInfoRepository.findByUserUid(teacherUid)
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));
        AcademicTerm currentTerm = requireActiveTerm();
        return courseSectionRepository.findByTermAndTeacher(currentTerm, teacher);
    }

    /**
     * 특정 강좌에 속한 학생 수 조회
     * CourseSection의 Classroom을 기준으로 현재 학년도 학생 수를 반환합니다.
     */
    public int getStudentCount(CourseSection section) {
        Classroom classroom = section.getClassroom();
        return studentAssignmentRepository
                .findByClassroomAndSchoolYear(classroom, classroom.getSchoolYear())
                .size();
    }

    /**
     * 강좌 단건 조회
     */
    public CourseSection getSection(Long sectionId) {
        return courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new IllegalArgumentException("수업 분반을 찾을 수 없습니다. id=" + sectionId));
    }

    /**
     * 교사(user uid)의 현재 학기 담당 강좌 목록 — 관리자용
     */
    public List<CourseSection> getSectionsForTeacherUser(Long userUid) {
        TeacherInfo teacher = teacherInfoRepository.findByUserUid(userUid)
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));
        AcademicTerm currentTerm = requireActiveTerm();
        return courseSectionRepository.findByTermAndTeacher(currentTerm, teacher);
    }

    /**
     * 교사(user uid)의 분반 일괄 생성 — 관리자용
     * 교사의 담당 과목으로 선택한 학급들에 강좌를 한 번에 개설합니다.
     */
    @Transactional
    public List<CourseSection> createSectionsForTeacher(Long userUid, List<Long> classroomIds) {
        TeacherInfo teacher = teacherInfoRepository.findByUserUid(userUid)
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));
        if (teacher.getSubject() == null) {
            throw new IllegalArgumentException("담당 과목이 설정되지 않았습니다. 먼저 교사 정보에서 담당 과목을 지정해주세요.");
        }
        AcademicTerm currentTerm = requireActiveTerm();
        return classroomIds.stream()
                .map(cid -> classroomRepository.findById(cid)
                        .orElseThrow(() -> new IllegalArgumentException("학급을 찾을 수 없습니다: " + cid)))
                .map(classroom -> courseSectionRepository.save(
                        CourseSection.builder()
                                .term(currentTerm)
                                .teacher(teacher)
                                .subject(teacher.getSubject())
                                .classroom(classroom)
                                .build()))
                .collect(Collectors.toList());
    }

    /**
     * 강좌 단건 개설 (관리자/교무 담당자용)
     */
    @Transactional
    public CourseSection createSection(CourseSection section) {
        return courseSectionRepository.save(section);
    }

    /**
     * 강좌 삭제 (관리자용)
     */
    @Transactional
    public void deleteSection(Long sectionId) {
        courseSectionRepository.deleteById(sectionId);
    }

    /**
     * 현재 학교의 ACTIVE 학기를 반드시 반환합니다.
     * 활성 학기가 없으면 예외를 던져 transient 엔티티가 FK로 사용되는 것을 방지합니다.
     */
    private AcademicTerm requireActiveTerm() {
        Long schoolId = SchoolContextHolder.getSchoolId();
        if (schoolId == null) {
            throw new IllegalStateException("학교 컨텍스트가 없습니다.");
        }
        return academicTermRepository
                .findBySchoolIdAndStatus(schoolId, AcademicTermStatus.ACTIVE)
                .orElseThrow(() -> new IllegalStateException(
                        "현재 활성화된 학기가 없습니다. 먼저 학기를 개설해주세요."));
    }
}
