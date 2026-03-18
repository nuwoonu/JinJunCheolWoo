package com.example.schoolmate.config;

/**
 * 시스템 전역 URL 상수 관리
 */
public class SchoolmateUrls {
    // 기본 API 루트
    public static final String API_ROOT = "/api";
    public static final String API_ADMIN = API_ROOT + "/admin";

    // 리소스 관리 (Resource Management)
    public static final String ADMIN_RESOURCES = API_ADMIN + "/resources";
    public static final String ADMIN_ASSETS = ADMIN_RESOURCES + "/assets";
    public static final String ADMIN_FACILITIES = ADMIN_RESOURCES + "/facilities";
    public static final String ADMIN_RESERVATIONS = ADMIN_RESOURCES + "/reservations";

    // 감사 로그 (Audit)
    public static final String ADMIN_AUDIT = API_ADMIN + "/audit";

    // 학교 관리 (School Management)
    public static final String ADMIN_SCHOOLS = API_ADMIN + "/schools";

    // 관리자 API 경로
    public static final String ADMIN_DASHBOARD = API_ADMIN + "/dashboard";
    public static final String ADMIN_CLASSES = API_ADMIN + "/classes";
    public static final String ADMIN_STUDENTS = API_ADMIN + "/students";
    public static final String ADMIN_PARENTS = API_ADMIN + "/parents";
    public static final String ADMIN_TEACHERS = API_ADMIN + "/teachers";
    public static final String ADMIN_STAFFS = API_ADMIN + "/staffs";
    public static final String ADMIN_SUBJECTS = API_ADMIN + "/subjects";
    public static final String ADMIN_SCHEDULE = API_ADMIN + "/schedule";
    public static final String ADMIN_SETTINGS = API_ADMIN + "/settings";
    public static final String ADMIN_NOTICES = API_ADMIN + "/notices";
    public static final String ADMIN_ROLE_REQUESTS = API_ADMIN + "/role-requests";

    // 외부 API 주소
    public static class Api {
        // 나이스 학교 기본 정보 API
        public static final String NEIS_SCHOOL_INFO = "https://open.neis.go.kr/hub/schoolInfo";
    }

    // 이미지 업로드 경로 (Web Access URL)
    public static final String UPLOAD_PATH_ASSETS = "/uploads/assets/";
    public static final String UPLOAD_PATH_FACILITIES = "/uploads/facilities/";
}