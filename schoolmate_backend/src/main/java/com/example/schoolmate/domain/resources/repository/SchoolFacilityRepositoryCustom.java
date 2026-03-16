package com.example.schoolmate.domain.resources.repository;

import java.util.List;

import com.example.schoolmate.domain.resources.entity.SchoolFacility;

public interface SchoolFacilityRepositoryCustom {

    /** 현재 학교의 전체 시설 목록 (이름 오름차순) */
    List<SchoolFacility> findAllByCurrentSchool();
}
