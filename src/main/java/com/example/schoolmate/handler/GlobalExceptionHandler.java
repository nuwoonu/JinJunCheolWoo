package com.example.schoolmate.handler;

import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import lombok.extern.log4j.Log4j2;

@ControllerAdvice
@Log4j2
public class GlobalExceptionHandler {

    @ExceptionHandler(NoResourceFoundException.class)
    public String getError() {
        log.info("404에러");
        return "error/404";
    }

    @ExceptionHandler(Exception.class)
    public String error(Exception e, org.springframework.ui.Model model) {
        log.info("500에러 처리");
        model.addAttribute("e", e);
        return "error/500";
    }
}
