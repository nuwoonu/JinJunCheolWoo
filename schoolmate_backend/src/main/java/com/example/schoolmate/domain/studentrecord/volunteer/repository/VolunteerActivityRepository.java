package com.example.schoolmate.domain.studentrecord.volunteer.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.domain.studentrecord.volunteer.entity.VolunteerActivity;

public interface VolunteerActivityRepository extends JpaRepository<VolunteerActivity, Long> {

    // 학생별 전체 봉사활동 조회
    List<VolunteerActivity> findByStudentInfoId(Long studentInfoId);

    // 학생 + 학기별 봉사활동 조회
    List<VolunteerActivity> findByStudentInfoIdAndAcademicTermId(Long studentInfoId, Long academicTermId);
}
