package com.example.schoolmate.common.entity.user.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 학교별 위임 관리자 권한
 *
 * ADMIN이 특정 학교의 교직원(주로 TEACHER/STAFF)에게 부여하는 관리 권한.
 * SchoolAdminGrant 엔티티에 저장되며, API 요청 시 DB에서 실시간 조회하여 체크함.
 */
@Getter
@RequiredArgsConstructor
public enum GrantedRole {
    SUPER_ADMIN("최고 관리자"), // 스쿨메이트 전체 관리
    SCHOOL_ADMIN("학교 관리자"), // 특정 학교 전체 관리
    PARENT_MANAGER("학부모 관리"), // 학부모 가입 승인·거절·계정 생성
    STUDENT_MANAGER("학생 관리"), // 학생 계정 생성·수정
    CLASS_MANAGER("학급 관리"), // 학급 편성·수정
    TEACHER_MANAGER("교사 관리"), // 교사 계정 관리
    STAFF_MANAGER("교직원 관리"), // 교직원 계정 관리
    NOTICE_MANAGER("공지 관리"), // 학교 공지 작성·수정·삭제
    SCHEDULE_MANAGER("일정 관리"), // 학사 일정 관리
    FACILITY_MANAGER("시설 관리"), // 시설·강의실 관리
    ASSET_MANAGER("기자재 관리"), // 기자재 관리
    LIBRARIAN("도서 관리"), // 도서관 관리
    NURSE("보건 관리"), // 보건실 관리
    NUTRITIONIST("급식 관리"); // 급식 관리

    private final String description;
}
