package com.example.schoolmate.domain.meal.service;

// [woo] 네이버 이미지 검색 API 연동 서비스
// searchFoodImage(): 음식명 → 첫 번째 이미지 URL
// fetchImageBytes(): URL → 이미지 바이트 (hotlink 우회 프록시)

import java.net.URI;
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
public class NaverImageService {

    @Value("${naver.image-api.url:https://openapi.naver.com/v1/search/image.json}")
    private String apiUrl;

    @Value("${naver.book-api.client-id:}")
    private String clientId;

    @Value("${naver.book-api.client-secret:}")
    private String clientSecret;

    private final RestTemplate restTemplate;

    public NaverImageService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(10_000);
        this.restTemplate = new RestTemplate(factory);
    }

    /**
     * 음식명으로 네이버 이미지 검색 → 첫 번째 결과 URL 반환 (thumbnail 우선, 없으면 link).
     * API 키 미설정 또는 결과 없으면 null 반환.
     */
    @SuppressWarnings("unchecked")
    public String searchFoodImage(String foodName) {
        if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank()) {
            log.warn("[woo] 네이버 API 키가 설정되지 않았습니다.");
            return null;
        }
        try {
            String encoded = URLEncoder.encode(foodName, StandardCharsets.UTF_8);
            String url = apiUrl + "?query=" + encoded + "&display=1&filter=large";

            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Naver-Client-Id", clientId);
            headers.set("X-Naver-Client-Secret", clientSecret);

            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

            if (response.getBody() == null) return null;

            List<Map<String, Object>> items = (List<Map<String, Object>>) response.getBody().get("items");
            if (items == null || items.isEmpty()) return null;

            // thumbnail 우선, 없으면 link 폴백
            Object thumbnail = items.get(0).get("thumbnail");
            if (thumbnail != null && !thumbnail.toString().isBlank()) return thumbnail.toString();
            Object link = items.get(0).get("link");
            return link != null ? link.toString() : null;

        } catch (Exception e) {
            log.warn("[woo] 네이버 이미지 API 호출 실패: {}", e.getMessage());
            return null;
        }
    }

    /**
     * [woo] 이미지 URL에서 바이트 배열로 직접 다운로드 (hotlink 우회 프록시용).
     * 반환: [0]=바이트배열, [1]=Content-Type 문자열 (실패 시 null)
     */
    public Object[] fetchImageBytes(String imageUrl) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0");
            // [woo] pstatic.net(Naver 프록시)이면 Naver Referer, 그 외 원본 사이트는 불필요
            if (imageUrl.contains("pstatic.net")) {
                headers.set("Referer", "https://search.naver.com/");
            }

            // [woo] String 대신 URI.create() 사용 → percent-encoding 이중 인코딩 방지
            ResponseEntity<byte[]> response = restTemplate.exchange(
                    URI.create(imageUrl), HttpMethod.GET, new HttpEntity<>(headers), byte[].class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) return null;

            String contentType = response.getHeaders().getFirst("Content-Type");
            if (contentType == null) contentType = "image/jpeg";

            return new Object[]{ response.getBody(), contentType };
        } catch (Exception e) {
            log.warn("[woo] 이미지 프록시 다운로드 실패: {}", e.getMessage());
            return null;
        }
    }
}
