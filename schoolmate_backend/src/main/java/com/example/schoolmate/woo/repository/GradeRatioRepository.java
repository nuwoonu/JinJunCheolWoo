package com.example.schoolmate.woo.repository;

import com.example.schoolmate.common.entity.user.constant.Semester;
import com.example.schoolmate.woo.entity.GradeRatio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

// [woo] 성적 비율 설정 Repository
public interface GradeRatioRepository extends JpaRepository<GradeRatio, Long> {

    Optional<GradeRatio> findByClassroomCidAndSubjectIdAndSemesterAndSchoolYear(
            Long classroomId, Long subjectId, Semester semester, int schoolYear);

    List<GradeRatio> findByClassroomCid(Long classroomId);
}
