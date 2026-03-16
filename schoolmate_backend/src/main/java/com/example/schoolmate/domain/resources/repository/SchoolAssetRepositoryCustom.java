package com.example.schoolmate.domain.resources.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.schoolmate.domain.resources.entity.SchoolAsset;

public interface SchoolAssetRepositoryCustom {

    /** 키워드로 자산명 또는 관리번호 검색 (학교 필터 자동 적용) */
    Page<SchoolAsset> search(String keyword, Pageable pageable);

    /** 현재 학교의 전체 자산 목록 (요약 통계용) */
    List<SchoolAsset> findAllByCurrentSchool();
}
