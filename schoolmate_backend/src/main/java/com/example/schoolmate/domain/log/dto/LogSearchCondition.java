package com.example.schoolmate.domain.log.dto;

import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

@Getter
@Setter
public class LogSearchCondition {
    private String keyword;
    private String type; // ACCESS: accessType(LOGIN/LOGOUT/LOGIN_FAIL), ADMIN: actionType

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate startDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate endDate;
}
