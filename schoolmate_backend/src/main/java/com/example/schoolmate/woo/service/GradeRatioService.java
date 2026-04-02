package com.example.schoolmate.woo.service;

import com.example.schoolmate.cheol.entity.Subject;
import com.example.schoolmate.cheol.repository.SubjectRepository;
import com.example.schoolmate.common.entity.Classroom;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.user.constant.Semester;
import com.example.schoolmate.common.repository.classroom.ClassroomRepository;
import com.example.schoolmate.common.repository.info.teacher.TeacherInfoRepository;
import com.example.schoolmate.woo.dto.GradeRatioRequestDTO;
import com.example.schoolmate.woo.dto.GradeRatioResponseDTO;
import com.example.schoolmate.woo.entity.GradeRatio;
import com.example.schoolmate.woo.repository.GradeRatioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// [woo] 성적 비율 설정 서비스
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GradeRatioService {

    private final GradeRatioRepository gradeRatioRepository;
    private final ClassroomRepository classroomRepository;
    private final SubjectRepository subjectRepository;
    private final TeacherInfoRepository teacherInfoRepository;

    // [woo] 비율 설정 (upsert)
    @Transactional
    public GradeRatioResponseDTO setRatio(GradeRatioRequestDTO req, Long teacherInfoId) {
        int total = req.getMidtermRatio() + req.getFinalRatio()
                  + req.getHomeworkRatio() + req.getQuizRatio();
        if (total != 100) {
            throw new IllegalArgumentException("비율 합계는 100이어야 합니다. 현재 합계: " + total);
        }

        Classroom classroom = classroomRepository.findById(req.getClassroomId())
                .orElseThrow(() -> new IllegalArgumentException("학급을 찾을 수 없습니다."));
        Subject subject = subjectRepository.findById(req.getSubjectId())
                .orElseThrow(() -> new IllegalArgumentException("과목을 찾을 수 없습니다."));
        TeacherInfo teacher = teacherInfoRepository.findById(teacherInfoId)
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));

        GradeRatio ratio = gradeRatioRepository
                .findByClassroomCidAndSubjectIdAndSemesterAndSchoolYear(
                        req.getClassroomId(), req.getSubjectId(), req.getSemester(), req.getSchoolYear())
                .orElseGet(() -> GradeRatio.builder()
                        .classroom(classroom)
                        .subject(subject)
                        .semester(req.getSemester())
                        .schoolYear(req.getSchoolYear())
                        .build());

        ratio.setMidtermRatio(req.getMidtermRatio());
        ratio.setFinalRatio(req.getFinalRatio());
        ratio.setHomeworkRatio(req.getHomeworkRatio());
        ratio.setQuizRatio(req.getQuizRatio());
        ratio.setSetTeacher(teacher);

        GradeRatio saved = gradeRatioRepository.save(ratio);
        return toResponseDTO(saved);
    }

    // [woo] 비율 조회
    public GradeRatioResponseDTO getRatio(Long classroomId, Long subjectId,
                                           Semester semester, int schoolYear) {
        return gradeRatioRepository
                .findByClassroomCidAndSubjectIdAndSemesterAndSchoolYear(
                        classroomId, subjectId, semester, schoolYear)
                .map(this::toResponseDTO)
                .orElse(null);
    }

    private GradeRatioResponseDTO toResponseDTO(GradeRatio ratio) {
        return GradeRatioResponseDTO.builder()
                .id(ratio.getId())
                .classroomId(ratio.getClassroom().getCid())
                .classroomName(ratio.getClassroom().getClassName())
                .subjectId(ratio.getSubject().getId())
                .subjectName(ratio.getSubject().getName())
                .subjectCode(ratio.getSubject().getCode())
                .semester(ratio.getSemester())
                .schoolYear(ratio.getSchoolYear())
                .midtermRatio(ratio.getMidtermRatio())
                .finalRatio(ratio.getFinalRatio())
                .homeworkRatio(ratio.getHomeworkRatio())
                .quizRatio(ratio.getQuizRatio())
                .setTeacherName(ratio.getSetTeacher() != null ? ratio.getSetTeacher().getUser().getName() : null)
                .updatedAt(ratio.getUpdateDate())
                .build();
    }
}
