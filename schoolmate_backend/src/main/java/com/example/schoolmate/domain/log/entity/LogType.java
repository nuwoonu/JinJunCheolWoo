package com.example.schoolmate.domain.log.entity;

public enum LogType {
    ADMIN,      // 관리자 작업 이력 (CREATE, UPDATE, DELETE, SYNC 등)
    ACCESS,     // 사용자 접속 이력 (LOGIN, LOGOUT, LOGIN_FAIL)
    CLASSROOM   // 학급 변경 이력 (CREATE, UPDATE, ASSIGN, REMOVE 등)
}
