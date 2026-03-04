package com.example.schoolmate.config;

/**
 * 시스템 전역 URL 상수 관리
 */
public class SchoolmateUrls {
    // 공통 기준이 되는 디렉토리 경로 (수정 시 여기만 바꾸면 됨)
    private static final String ADMIN_BASE = "parkjoon/admin";

    /**
     * 1. URL (웹 주소) 상수
     * - 용도: @RequestMapping, redirect:, th:href
     * - 특징: 반드시 맨 앞에 '/'가 붙음
     */
    public static final class Url {
        public static final String ADMIN_ROOT = "/" + ADMIN_BASE;
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
    }

    /**
     * 2. View (HTML 템플릿) 경로 상수
     * - 용도: Controller의 return 문자열
     * - 특징: 맨 앞에 '/'가 절대 없음
     */
    public static final class View {
        public static final String ADMIN_DASHBOARD = ADMIN_BASE + "/main";
        public static final String ADMIN_AUTH_LOGIN = ADMIN_BASE + "/auth/login";
        public static final String ADMIN_AUDIT_ACCESS = ADMIN_BASE + "/audit/access";
        public static final String ADMIN_AUDIT_CHANGES = ADMIN_BASE + "/audit/changes";
        public static final String ADMIN_FACILITIES_ROOMS = ADMIN_BASE + "/facilities/rooms";
        public static final String ADMIN_ASSETS = ADMIN_BASE + "/facilities/assets";
        public static final String ADMIN_NOTICES_MAIN = ADMIN_BASE + "/notices/main";
        public static final String ADMIN_NOTICES_FORM = ADMIN_BASE + "/notices/form";
        public static final String ADMIN_NOTICES_DETAIL = ADMIN_BASE + "/notices/detail";
        public static final String ADMIN_MASTER_SCHEDULE = ADMIN_BASE + "/master/schedule";
        public static final String ADMIN_MASTER_SUBJECTS = ADMIN_BASE + "/master/subjects";
        public static final String ADMIN_MASTER_SETTINGS = ADMIN_BASE + "/master/settings";
        public static final String ADMIN_CLASSES_MAIN = ADMIN_BASE + "/classes/main";
        public static final String ADMIN_CLASSES_DETAIL = ADMIN_BASE + "/classes/detail";
        public static final String ADMIN_PARENTS_MAIN = ADMIN_BASE + "/parents/main";
        public static final String ADMIN_PARENTS_CREATE = ADMIN_BASE + "/parents/create";
        public static final String ADMIN_PARENTS_DETAIL = ADMIN_BASE + "/parents/detail";
        public static final String ADMIN_TEACHERS_MAIN = ADMIN_BASE + "/teachers/main";
        public static final String ADMIN_TEACHERS_CREATE = ADMIN_BASE + "/teachers/create";
        public static final String ADMIN_TEACHERS_DETAIL = ADMIN_BASE + "/teachers/detail";
        public static final String ADMIN_STAFFS_MAIN = ADMIN_BASE + "/staffs/main";
        public static final String ADMIN_STAFFS_CREATE = ADMIN_BASE + "/staffs/create";
        public static final String ADMIN_STAFFS_DETAIL = ADMIN_BASE + "/staffs/detail";
        public static final String ADMIN_STUDENTS_MAIN = ADMIN_BASE + "/students/main";
        public static final String ADMIN_STUDENTS_CREATE = ADMIN_BASE + "/students/create";
        public static final String ADMIN_STUDENTS_DETAIL = ADMIN_BASE + "/students/detail";
    }

    // 이미지 업로드 경로 (Web Access URL)
    public static final String UPLOAD_PATH_ASSETS = "/uploads/assets/";
    public static final String UPLOAD_PATH_FACILITIES = "/uploads/facilities/";
}