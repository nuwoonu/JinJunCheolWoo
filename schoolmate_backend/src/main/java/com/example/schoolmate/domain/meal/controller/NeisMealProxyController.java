package com.example.schoolmate.domain.meal.controller;

import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.global.config.school.SchoolContextHolder;
import com.example.schoolmate.domain.school.entity.School;
import com.example.schoolmate.domain.school.repository.SchoolRepository;
import com.example.schoolmate.domain.meal.service.NeisMealService;
import com.example.schoolmate.domain.meal.service.GoeasMealImageService;

import lombok.RequiredArgsConstructor;

/**
 * NEIS 급식 프록시 컨트롤러
 *
 * 브라우저가 NEIS API를 직접 호출할 수 없으므로(CORS) 서버가 중계합니다.
 * DB에 데이터를 저장하지 않으며, 캐싱은 클라이언트에서 처리합니다.
 */
@RestController
@RequestMapping("/api/neis/meal")
@RequiredArgsConstructor
public class NeisMealProxyController {

    private final SchoolRepository schoolRepository;
    private final NeisMealService neisMealService;
    // [woo] goeas.kr 급식 이미지 페이지 스크래퍼
    private final GoeasMealImageService goeasMealImageService;

    /**
     * GET /api/neis/meal/today[?schoolId=N]
     * 당일 급식(중식 우선) 정보를 반환합니다.
     */
    @GetMapping("/today")
    public ResponseEntity<Map<String, Object>> getTodayMeal(
            @RequestParam(required = false) Long schoolId) {
        if (schoolId == null) {
            schoolId = SchoolContextHolder.getSchoolId();
        }
        if (schoolId == null) {
            return ResponseEntity.noContent().build();
        }

        School school = schoolRepository.findById(schoolId).orElse(null);
        if (school == null
                || school.getOfficeCode() == null
                || school.getSchoolCode() == null) {
            return ResponseEntity.noContent().build();
        }

        Map<String, Object> meal = neisMealService.fetchTodayMeal(
                school.getOfficeCode(), school.getSchoolCode());

        return meal != null
                ? ResponseEntity.ok(meal)
                : ResponseEntity.noContent().build();
    }

    // [woo] 급식 이미지 반환: schoolId 있으면 goeas.kr 페이지에서 매칭, 없으면 Naver 이미지 검색 폴백
    @GetMapping("/food-image")
    public ResponseEntity<byte[]> getFoodImage(
            @RequestParam String query,
            @RequestParam(required = false) Long schoolId) {
        if (query == null || query.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        // [woo] 첫 단어 추출 (예: "현미밥(쌀)" → "현미밥")
        String keyword = query.split("[\\s(\\[]+")[0];

        Object[] result = null;

        // [woo] schoolId 있고 mealPageUrl 설정된 학교면 goeas.kr에서 이미지 매칭
        // 등록된 이미지 없으면 204 반환 → 프론트가 엑스박스 표시
        if (schoolId != null) {
            School school = schoolRepository.findById(schoolId).orElse(null);
            if (school != null && school.getMealPageUrl() != null && !school.getMealPageUrl().isBlank()) {
                String imageUrl = goeasMealImageService.findMealImageUrl(school.getMealPageUrl(), query);
                if (imageUrl != null) {
                    result = goeasMealImageService.fetchImageBytes(imageUrl);
                }
            }
        }

        if (result == null) {
            return ResponseEntity.noContent().build();
        }

        byte[] bytes = (byte[]) result[0];
        String contentType = (String) result[1];
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(contentType));
        headers.setCacheControl("public, max-age=86400");
        return ResponseEntity.ok().headers(headers).body(bytes);
    }
}
