package com.example.schoolmate.cheol.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.cheol.entity.VolunteerActivity;
import com.example.schoolmate.common.entity.user.constant.Year;

public interface VolunteerActivityRepository extends JpaRepository<VolunteerActivity, Long> {

    // 학생별 전체 봉사활동 조회
    List<VolunteerActivity> findByStudentInfoId(Long studentInfoId);

    // 학생 + 학년별 봉사활동 조회
    List<VolunteerActivity> findByStudentInfoIdAndYear(Long studentInfoId, Year year);
}
