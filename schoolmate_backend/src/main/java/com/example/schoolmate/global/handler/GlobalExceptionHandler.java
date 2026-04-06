package com.example.schoolmate.global.handler;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /** 404 - 정적 리소스 없음 */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(HttpServletRequest request) {
        log.info("[404] {} {}", request.getMethod(), request.getRequestURI());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Not Found", "path", request.getRequestURI()));
    }

    /** 400 - 비즈니스 규칙 위반 (잘못된 인자, 중복 등) */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(IllegalArgumentException e,
                                                                HttpServletRequest request) {
        log.warn("[400] {} {} - {}", request.getMethod(), request.getRequestURI(), e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Bad Request", "message", e.getMessage()));
    }

    /** 409 - 상태 충돌 (이미 활성화된 역할, 중복 신청 등) */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleConflict(IllegalStateException e,
                                                              HttpServletRequest request) {
        log.warn("[409] {} {} - {}", request.getMethod(), request.getRequestURI(), e.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "Conflict", "message", e.getMessage()));
    }

    /** 403 - 권한 없음 (Spring Security AccessDeniedException) */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException e,
                                                                   HttpServletRequest request) {
        log.warn("[403] {} {} - {}", request.getMethod(), request.getRequestURI(), e.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "Forbidden", "message", "접근 권한이 없습니다."));
    }

    /** 500 - 예상치 못한 서버 오류 */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleServerError(Exception e,
                                                                  HttpServletRequest request) {
        log.error("[500] {} {} - {}", request.getMethod(), request.getRequestURI(), e.getMessage(), e);
        String msg = e.getMessage() != null ? e.getMessage() : "예상치 못한 오류가 발생했습니다.";
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Internal Server Error", "message", msg));
    }
}
