package com.example.schoolmate.handler;

import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.log4j.Log4j2;

@ControllerAdvice
@Log4j2
public class GlobalExceptionHandler {

    @ExceptionHandler(NoResourceFoundException.class)
    public String getError(HttpServletRequest request) {
        log.info("404에러: {}", request.getRequestURI());
        return "error/404";
    }

    @ExceptionHandler(Exception.class)
    public String error(Exception e, org.springframework.ui.Model model) {
        log.error("500에러 처리: {}", e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName(), e);
        model.addAttribute("errorMessage", e.getMessage() != null ? e.getMessage() : "예상치 못한 오류가 발생했습니다.");
        model.addAttribute("e", e);
        return "error/500";
    }
}
