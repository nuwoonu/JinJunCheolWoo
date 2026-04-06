package com.example.schoolmate.domain.library.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 학생 독서 통계 DTO
 *
 * 프론트엔드 ReadingStats 페이지에서 필요로 하는 통계 값들을 담습니다.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadingStatsDTO {

    /** 올해 반납 완료 권수 */
    private long totalBooksThisYear;

    /** 이번 달 반납 완료 권수 */
    private long currentMonthBooks;

    /** 월별 목표 권수 (기본 5) */
    private int monthlyGoal;

    /** 목표 달성률(%) */
    private int goalProgress;

    /** 평균 평점(내가 남긴 리뷰 기준) */
    private double averageRating;

    /** 현재 대출중 권수 */
    private long activeLoans;

    /** 연체 권수 */
    private long overdueCount;

    /** 월별 독서량 추이 (최근 7개월) */
    private List<MonthlyReading> monthlyReading;

    /** 카테고리별 분포 */
    private List<CategoryDistribution> categoryDistribution;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyReading {
        /** 예: "3월" */
        private String month;
        private long books;
        private int goal;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryDistribution {
        /** 예: "800 문학" */
        private String name;
        private long value;
    }
}
