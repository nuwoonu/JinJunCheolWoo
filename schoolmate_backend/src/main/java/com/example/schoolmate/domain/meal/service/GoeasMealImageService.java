package com.example.schoolmate.domain.meal.service;

// [woo] 학교 급식 이미지 페이지(goeas.kr 등)에서 오늘 메뉴와 매칭되는 이미지를 긁어오는 서비스
// NEIS API 첫 번째 메뉴명 → 페이지 img alt 매칭 → 이미지 바이트 프록시 반환

import java.net.URI;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class GoeasMealImageService {

    private static final Pattern IMG_PATTERN = Pattern.compile(
            "<img[^>]+class=\"img\"[^>]*src=\"([^\"]+)\"[^>]*alt=\"([^\"]+)\"",
            Pattern.DOTALL
    );
    // src 와 alt 순서가 반대인 경우도 처리
    private static final Pattern IMG_PATTERN_ALT_FIRST = Pattern.compile(
            "<img[^>]+class=\"img\"[^>]*alt=\"([^\"]+)\"[^>]*src=\"([^\"]+)\"",
            Pattern.DOTALL
    );

    private final RestTemplate restTemplate;

    public GoeasMealImageService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(10_000);
        this.restTemplate = new RestTemplate(factory);
    }

    /**
     * 급식 이미지 페이지에서 firstMenuName과 매칭되는 이미지 URL 반환.
     * 매칭 없으면 null 반환.
     */
    public String findMealImageUrl(String mealPageUrl, String firstMenuName) {
        if (mealPageUrl == null || mealPageUrl.isBlank() || firstMenuName == null || firstMenuName.isBlank()) {
            return null;
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0");

            ResponseEntity<String> response = restTemplate.exchange(
                    URI.create(mealPageUrl), HttpMethod.GET, new HttpEntity<>(headers), String.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) return null;

            String html = response.getBody();
            // [woo] base URL 추출 (프로토콜 + 도메인)
            URI base = URI.create(mealPageUrl);
            String baseUrl = base.getScheme() + "://" + base.getHost();

            // [woo] 비교용: 첫 메뉴명에서 알레르기 코드 제거 후 소문자 trim
            String menuKey = stripAllergy(firstMenuName).toLowerCase().trim();

            // src 먼저인 패턴 시도
            String found = matchImg(html, IMG_PATTERN, 1, 2, menuKey, baseUrl);
            if (found != null) return found;
            // alt 먼저인 패턴 시도
            found = matchImg(html, IMG_PATTERN_ALT_FIRST, 2, 1, menuKey, baseUrl);
            return found;

        } catch (Exception e) {
            log.warn("[woo] goeas 급식 이미지 페이지 접근 실패: {}", e.getMessage());
            return null;
        }
    }

    private String matchImg(String html, Pattern pattern, int srcGroup, int altGroup,
                            String menuKey, String baseUrl) {
        Matcher m = pattern.matcher(html);
        while (m.find()) {
            String alt = m.group(altGroup);
            String altKey = stripAllergy(alt.split("\n")[0]).toLowerCase().trim();
            if (altKey.contains(menuKey) || menuKey.contains(altKey)) {
                String src = m.group(srcGroup);
                return src.startsWith("http") ? src : baseUrl + src;
            }
        }
        return null;
    }

    /** 알레르기 코드 제거: "(1.2.3)", "(염도 0.78)" 등 */
    private String stripAllergy(String name) {
        return name.replaceAll("\\([^)]*\\)", "").replaceAll("\\[[^\\]]*\\]", "").trim();
    }

    /**
     * 이미지 URL → 바이트 배열 프록시.
     * 반환: [0]=byte[], [1]=Content-Type (실패 시 null)
     */
    public Object[] fetchImageBytes(String imageUrl) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0");

            ResponseEntity<byte[]> response = restTemplate.exchange(
                    URI.create(imageUrl), HttpMethod.GET, new HttpEntity<>(headers), byte[].class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) return null;

            String contentType = response.getHeaders().getFirst("Content-Type");
            if (contentType == null) contentType = "image/jpeg";

            return new Object[]{ response.getBody(), contentType };
        } catch (Exception e) {
            log.warn("[woo] goeas 이미지 다운로드 실패: {}", e.getMessage());
            return null;
        }
    }
}
