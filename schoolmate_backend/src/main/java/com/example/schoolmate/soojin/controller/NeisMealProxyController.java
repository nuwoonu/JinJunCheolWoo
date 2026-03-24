package com.example.schoolmate.soojin.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.config.school.SchoolContextHolder;
import com.example.schoolmate.domain.school.entity.School;
import com.example.schoolmate.domain.school.repository.SchoolRepository;
import com.example.schoolmate.soojin.service.NeisMealService;

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

    /**
     * GET /api/neis/meal/today
     * 현재 학교 컨텍스트 기준으로 당일 급식(중식 우선) 정보를 반환합니다.
     *
     * 응답: { menu: string, calories: string, mealType: string }
     * 급식 정보 없음: 204 No Content
     */
    @GetMapping("/today")
    public ResponseEntity<Map<String, Object>> getTodayMeal() {
        Long schoolId = SchoolContextHolder.getSchoolId();
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
}
