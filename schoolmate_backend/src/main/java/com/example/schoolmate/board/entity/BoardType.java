package com.example.schoolmate.board.entity;

public enum BoardType {
    // 학생/교사용
    SCHOOL_NOTICE,    // 학교 공지 (ADMIN 작성, 전체 열람)
    GRADE_BOARD,      // 학년 게시판 (교사 작성, 해당 학년 열람)
    CLASS_BOARD,      // 학급 게시판 (학생 작성, 해당 반 열람)
    TEACHER_BOARD,    // 교직원 게시판 (교사만)

    // 학부모용
    PARENT_NOTICE,    // 학부모 공지 (교사 작성, 학부모 열람)
    PARENT_BOARD,     // 학부모 게시판 (학부모 작성)

    // 기존 호환용 (deprecated)
    @Deprecated
    BOARD,
    @Deprecated
    NOTICE
}
