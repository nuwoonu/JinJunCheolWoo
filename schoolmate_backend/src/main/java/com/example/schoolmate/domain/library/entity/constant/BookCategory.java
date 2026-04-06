package com.example.schoolmate.domain.library.entity.constant;

import lombok.Getter;

/**
 * 한국십진분류법(KDC) 기반 도서 카테고리
 * 프론트 표기: "000 총류", "100 철학" 등
 */
@Getter
public enum BookCategory {

    CATEGORY_000("000", "총류"),
    CATEGORY_100("100", "철학"),
    CATEGORY_200("200", "종교"),
    CATEGORY_300("300", "사회과학"),
    CATEGORY_400("400", "자연과학"),
    CATEGORY_500("500", "기술과학"),
    CATEGORY_600("600", "예술"),
    CATEGORY_700("700", "언어"),
    CATEGORY_800("800", "문학"),
    CATEGORY_900("900", "역사");

    private final String code;
    private final String label;

    BookCategory(String code, String label) {
        this.code = code;
        this.label = label;
    }

    /** 프론트 표기용: "800 문학" */
    public String getDisplayName() {
        return code + " " + label;
    }
}
