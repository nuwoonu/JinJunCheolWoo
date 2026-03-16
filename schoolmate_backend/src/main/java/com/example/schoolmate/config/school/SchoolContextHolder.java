package com.example.schoolmate.config.school;

/**
 * 요청 범위(Request Scope) 내에서 현재 학교 ID를 보관하는 ThreadLocal 유틸리티
 *
 * X-School-Id 헤더로 전달된 학교 ID를 요청 처리 스레드에 바인딩하여,
 * 서비스/레포지토리 레이어에서 별도의 파라미터 전달 없이 학교 컨텍스트를 참조할 수 있습니다.
 */
public class SchoolContextHolder {

    private static final ThreadLocal<Long> SCHOOL_ID = new ThreadLocal<>();

    public static void setSchoolId(Long schoolId) {
        SCHOOL_ID.set(schoolId);
    }

    public static Long getSchoolId() {
        return SCHOOL_ID.get();
    }

    public static void clear() {
        SCHOOL_ID.remove();
    }
}
