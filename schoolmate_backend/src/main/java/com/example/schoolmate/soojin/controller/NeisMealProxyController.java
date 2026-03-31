package com.example.schoolmate.soojin.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
     * GET /api/neis/meal/today[?schoolId=N]
     * 당일 급식(중식 우선) 정보를 반환합니다.
     *
     * - schoolId 파라미터: 학부모처럼 JWT 컨텍스트에 schoolId가 없을 때 자녀 schoolId를 직접 전달
     * - 파라미터 없으면 JWT 컨텍스트(SchoolContextHolder)에서 추출
     *
     * 응답: { menu, calories, mealType, menuItems }
     * 급식 정보 없음: 204 No Content
     */
    @GetMapping("/today")
    public ResponseEntity<Map<String, Object>> getTodayMeal(
            // [soojin] 학부모 대시보드: JWT에 schoolId 없으므로 선택된 자녀의 schoolId를 query param으로 수신
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
}
