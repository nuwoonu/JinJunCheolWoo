package com.example.schoolmate.soojin.service;

import java.net.URI;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.example.schoolmate.config.SchoolmateUrls;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

/**
 * NEIS 급식 식단 API 프록시 서비스
 *
 * 당일 급식 정보를 NEIS API에서 가져와 파싱합니다.
 * DB에 저장하지 않으며, 캐싱은 클라이언트(브라우저 메모리)에서 담당합니다.
 */
@Slf4j
@Service
public class NeisMealService {

    @Value("${neis.api.key}")
    private String neisApiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public NeisMealService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(10_000);
        this.restTemplate = new RestTemplate(factory);
    }

    /**
     * 특정 학교의 당일 급식 정보 조회
     *
     * @param officeCode NEIS 교육청 코드 (ATPT_OFCDC_SC_CODE, 예: T10)
     * @param schoolCode NEIS 학교 표준코드 (SD_SCHUL_CODE, 예: 9290083)
     * @return { menu, calories, mealType } 또는 null (급식 정보 없음)
     */
    public Map<String, Object> fetchTodayMeal(String officeCode, String schoolCode) {
        String today = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE); // YYYYMMDD

        URI uri = UriComponentsBuilder.fromUriString(SchoolmateUrls.Api.NEIS_MEAL_INFO)
                .queryParam("KEY", neisApiKey)
                .queryParam("Type", "json")
                .queryParam("pSize", 10)
                .queryParam("ATPT_OFCDC_SC_CODE", officeCode)
                .queryParam("SD_SCHUL_CODE", schoolCode)
                .queryParam("MLSV_YMD", today)
                .build()
                .toUri();

        try {
            String body = restTemplate.getForObject(uri, String.class);
            return parseMealResponse(body);
        } catch (Exception e) {
            log.warn("NEIS 급식 API 호출 실패 [school={}]: {}", schoolCode, e.getMessage());
            return null;
        }
    }

    // ── 내부 파싱 ──────────────────────────────────────────────────────────────

    private Map<String, Object> parseMealResponse(String body) throws Exception {
        JsonNode root = objectMapper.readTree(body);
        JsonNode dietInfo = root.get("mealServiceDietInfo");
        if (dietInfo == null || !dietInfo.isArray()) return null;

        // row 배열 추출
        JsonNode rowNode = null;
        for (JsonNode node : dietInfo) {
            if (node.has("row")) {
                rowNode = node.get("row");
                break;
            }
        }
        if (rowNode == null || rowNode.isEmpty()) return null;

        // 중식(MMEAL_SC_CODE=2) 우선, 없으면 첫 번째 항목 사용
        JsonNode target = null;
        for (JsonNode row : rowNode) {
            if ("2".equals(row.path("MMEAL_SC_CODE").asText())) {
                target = row;
                break;
            }
        }
        if (target == null) target = rowNode.get(0);

        String ddishNm  = target.path("DDISH_NM").asText("");
        String calInfo  = target.path("CAL_INFO").asText("");
        String mealType = target.path("MMEAL_SC_NM").asText("");

        String menu = parseMenu(ddishNm);
        String calories = parseCalories(calInfo);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("menu", menu);
        result.put("calories", calories);
        result.put("mealType", mealType);
        return result;
    }

    /**
     * DDISH_NM 파싱
     * - {@code <br/>} 기준으로 분리
     * - 알레르기 번호 제거: {@code 5.6.13.} 패턴
     * - 원산지/조리법 괄호 제거: {@code (영)}, {@code (친환경/영)} 등
     */
    private String parseMenu(String ddishNm) {
        return Arrays.stream(ddishNm.split("<br/>"))
                .map(s -> s.replaceAll("[0-9]+(\\.[0-9]+)*\\.", "")  // 알레르기 번호
                           .replaceAll("\\([^)]*\\)", "")            // 괄호 내용
                           .trim())
                .filter(s -> !s.isEmpty())
                .collect(Collectors.joining("\n"));
    }

    /**
     * CAL_INFO 파싱: "644.9 Kcal" → "645"
     */
    private String parseCalories(String calInfo) {
        String numStr = calInfo.replaceAll("[^0-9.]", "").trim();
        if (numStr.isEmpty()) return "";
        try {
            return String.valueOf(Math.round(Double.parseDouble(numStr)));
        } catch (NumberFormatException e) {
            return numStr;
        }
    }
}
