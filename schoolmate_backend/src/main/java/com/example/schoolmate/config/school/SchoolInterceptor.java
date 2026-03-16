package com.example.schoolmate.config.school;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 어드민 API 요청에서 X-School-Id 헤더를 읽어 SchoolContextHolder에 저장하는 인터셉터
 *
 * 프론트엔드 adminApi.ts 인터셉터가 모든 어드민 요청에 X-School-Id 헤더를 첨부합니다.
 * 이 인터셉터가 해당 값을 ThreadLocal에 저장하면, 서비스/레포지토리 레이어에서
 * 별도의 파라미터 변경 없이 학교별 데이터 필터링을 수행할 수 있습니다.
 */
public class SchoolInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String header = request.getHeader("X-School-Id");
        if (header != null && !header.isBlank()) {
            try {
                SchoolContextHolder.setSchoolId(Long.parseLong(header.trim()));
            } catch (NumberFormatException ignored) {
                // 유효하지 않은 헤더는 무시 (schoolId = null)
            }
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
            Object handler, Exception ex) {
        SchoolContextHolder.clear();
    }
}
