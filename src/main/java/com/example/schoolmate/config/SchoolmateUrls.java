package com.example.schoolmate.config;

/**
 * 시스템 전역 URL 상수 관리
 */
public class SchoolmateUrls {
    public static final String ADMIN_ROOT = "/parkjoon/admin";

    public static final String ADMIN_DASHBOARD = ADMIN_ROOT + "/dashboard";
    public static final String ADMIN_CLASSES = ADMIN_ROOT + "/classes";
    public static final String ADMIN_STUDENTS = ADMIN_ROOT + "/students";
    public static final String ADMIN_TEACHERS = ADMIN_ROOT + "/teachers";
    public static final String ADMIN_PARENTS = ADMIN_ROOT + "/parents";
    public static final String ADMIN_STAFFS = ADMIN_ROOT + "/staffs";
    public static final String ADMIN_FACILITIES = ADMIN_ROOT + "/facilities";
    public static final String ADMIN_ASSETS = ADMIN_FACILITIES + "/assets";
    public static final String ADMIN_NOTICES = ADMIN_ROOT + "/notices";
    public static final String ADMIN_NOTIFICATIONS = ADMIN_ROOT + "/notifications";
    public static final String ADMIN_MASTER = ADMIN_ROOT + "/master";
    public static final String ADMIN_AUDIT = ADMIN_ROOT + "/audit";
    public static final String ADMIN_API_SCHEDULE = ADMIN_ROOT + "/api/schedule";

    // 이미지 업로드 경로 (Web Access URL)
    public static final String UPLOAD_PATH_ASSETS = "/uploads/assets/";
    public static final String UPLOAD_PATH_FACILITIES = "/uploads/facilities/";
}