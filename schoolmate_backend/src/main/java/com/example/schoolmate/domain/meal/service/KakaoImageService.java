package com.example.schoolmate.domain.meal.service;

// [woo] 카카오 이미지 검색 API - 음식명으로 thumbnail_url 조회 후 바이트 프록시

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
public class KakaoImageService {

    // [woo] OAuth2 client-id = Kakao REST API 키 재사용
    @Value("${spring.security.oauth2.client.registration.kakao.client-id:}")
    private String restApiKey;

    private final RestTemplate restTemplate;

    public KakaoImageService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(10_000);
        this.restTemplate = new RestTemplate(factory);
    }

    /**
     * 음식명으로 카카오 이미지 검색 → 첫 번째 결과의 thumbnail_url 반환.
     * API 키 미설정 또는 결과 없으면 null 반환.
     */
    @SuppressWarnings("unchecked")
    public String searchFoodImageUrl(String foodName) {
        if (restApiKey == null || restApiKey.isBlank()) {
            log.warn("[woo] 카카오 REST API 키가 설정되지 않았습니다.");
            return null;
        }
        try {
            String encoded = URLEncoder.encode(foodName, StandardCharsets.UTF_8);
            String url = "https://dapi.kakao.com/v2/search/image?query=" + encoded + "&size=1";

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "KakaoAK " + restApiKey);

            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

            if (response.getBody() == null) return null;

            List<Map<String, Object>> documents = (List<Map<String, Object>>) response.getBody().get("documents");
            if (documents == null || documents.isEmpty()) return null;

            Object thumbnailUrl = documents.get(0).get("thumbnail_url");
            if (thumbnailUrl != null && !thumbnailUrl.toString().isBlank()) {
                return thumbnailUrl.toString();
            }
            Object imageUrl = documents.get(0).get("image_url");
            return imageUrl != null ? imageUrl.toString() : null;

        } catch (Exception e) {
            log.warn("[woo] 카카오 이미지 검색 실패: {}", e.getMessage());
            return null;
        }
    }

    /**
     * [woo] 이미지 URL → 바이트 배열 프록시 다운로드.
     * 반환: [0]=byte[], [1]=Content-Type (실패 시 null)
     */
    public Object[] fetchImageBytes(String imageUrl) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0");

            ResponseEntity<byte[]> response = restTemplate.exchange(
                    imageUrl, HttpMethod.GET, new HttpEntity<>(headers), byte[].class);

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
