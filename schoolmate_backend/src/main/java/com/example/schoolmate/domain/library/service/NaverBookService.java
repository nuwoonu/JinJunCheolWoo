package com.example.schoolmate.domain.library.service;

// [woo] 네이버 책 검색 API 연동 서비스 - ISBN 또는 제목으로 표지 이미지 URL 조회

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
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
public class NaverBookService {

    @Value("${naver.book-api.url}")
    private String apiUrl;

    @Value("${naver.book-api.client-id:}")
    private String clientId;

    @Value("${naver.book-api.client-secret:}")
    private String clientSecret;

    private final RestTemplate restTemplate;

    public NaverBookService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(10_000);
        this.restTemplate = new RestTemplate(factory);
    }

    /**
     * ISBN으로 네이버 책 검색 → 첫 번째 결과의 표지 이미지 URL 반환.
     * API 키 미설정 또는 결과 없으면 null 반환.
     */
    public String searchCoverByIsbn(String isbn) {
        return search(isbn.trim());
    }

    /**
     * 제목으로 네이버 책 검색 → 첫 번째 결과의 표지 이미지 URL 반환.
     */
    public String searchCoverByTitle(String title) {
        return search(title.trim());
    }

    @SuppressWarnings("unchecked")
    private String search(String keyword) {
        if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank()) {
            log.warn("[woo] 네이버 책 API 키가 설정되지 않았습니다.");
            return null;
        }
        try {
            String encoded = URLEncoder.encode(keyword, StandardCharsets.UTF_8);
            String url = apiUrl + "?query=" + encoded + "&display=1";

            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Naver-Client-Id", clientId);
            headers.set("X-Naver-Client-Secret", clientSecret);

            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

            if (response.getBody() == null) return null;

            List<Map<String, Object>> items = (List<Map<String, Object>>) response.getBody().get("items");
            if (items == null || items.isEmpty()) return null;

            Object image = items.get(0).get("image");
            return image != null ? image.toString() : null;

        } catch (Exception e) {
            log.warn("[woo] 네이버 책 API 호출 실패: {}", e.getMessage());
            return null;
        }
    }
}
