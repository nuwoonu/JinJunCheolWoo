package com.example.schoolmate.cheol.dto;

import com.example.schoolmate.cheol.entity.Subject;
import com.example.schoolmate.common.entity.user.constant.TestType;
import com.opencsv.bean.CsvBindByName;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@ToString
@Builder
public class SubjectDTO {

    private String subjectCode;
    private String subjectName;
    private TestType examType;
    private Double score;
    private Integer semester;
    private Integer year;

    /**
     * 관리자 과목 등록/수정 요청
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Request {
        private String originCode; // 수정 시 기존 코드 식별용
        private String code;
        private String name;
    }

    /**
     * CSV 일괄 등록용 행 매핑
     * 컬럼: 코드, 과목명
     */
    @Getter
    @Setter
    @NoArgsConstructor
    public static class CsvRow {
        @CsvBindByName(column = "코드")
        private String code;

        @CsvBindByName(column = "과목명")
        private String name;
    }

    /**
     * 관리자 과목 목록 응답
     */
    @Getter
    @Builder
    public static class Response {
        private String code;
        private String name;

        public static Response from(Subject subject) {
            return Response.builder()
                    .code(subject.getCode())
                    .name(subject.getName())
                    .build();
        }
    }
}
